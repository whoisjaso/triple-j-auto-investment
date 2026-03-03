import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronLeft, X, Check, Car, User, Calendar, Shield,
  FileText, CreditCard, Camera, Loader2, Search, Plus, AlertTriangle,
} from 'lucide-react';
import { Vehicle, RentalBooking, RentalCustomer, RentalInsurance } from '../../types';
import {
  getAvailableVehicles,
  searchCustomers,
  createCustomer,
  createBooking,
} from '../../services/rentalService';
import { getCustomerLastInsurance, validateInsuranceCoverage } from '../../services/insuranceService';
import { getAvailableDealerPlates, assignPlateToBooking } from '../../services/plateService';
import type { Plate } from '../../types';

// ================================================================
// TYPES & CONSTANTS
// ================================================================
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onBookingCreated: (booking: RentalBooking) => void;
  vehicles: Vehicle[];
  preSelectedDate?: string;
}

const STEP_LABELS = ['Vehicle', 'Customer', 'Dates', 'Insurance', 'Agreement', 'Plate', 'Condition', 'Confirm'];
const STEP_ICONS = [Car, User, Calendar, Shield, FileText, CreditCard, Camera, Check];

// ================================================================
// WIZARD COMPONENT
// ================================================================
const RentalBookingWizard = ({ isOpen, onClose, onBookingCreated, vehicles, preSelectedDate }: Props) => {
  const [step, setStep] = useState(1);

  // Step 1: Vehicle
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicleSearch, setVehicleSearch] = useState('');

  // Step 2: Customer
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState<RentalCustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<RentalCustomer | null>(null);
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [newCustomerMode, setNewCustomerMode] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', driversLicense: '' });

  // Step 3: Dates
  const [startDate, setStartDate] = useState(preSelectedDate || '');
  const [endDate, setEndDate] = useState('');
  const [dailyRate, setDailyRate] = useState(0);
  const [weeklyRate, setWeeklyRate] = useState(0);

  // Step 4: Insurance
  const [insuranceCompany, setInsuranceCompany] = useState('');
  const [insurancePolicy, setInsurancePolicy] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [loadingInsurance, setLoadingInsurance] = useState(false);

  // Step 5: Agreement
  const [agreementSigned, setAgreementSigned] = useState(false);
  const [authorizedDrivers, setAuthorizedDrivers] = useState('');
  const [outOfState, setOutOfState] = useState(false);

  // Step 6: Plate
  const [availablePlates, setAvailablePlates] = useState<Plate[]>([]);
  const [selectedPlate, setSelectedPlate] = useState<Plate | null>(null);
  const [loadingPlates, setLoadingPlates] = useState(false);

  // Step 7: Condition
  const [mileageOut, setMileageOut] = useState(0);
  const [conditionNotes, setConditionNotes] = useState('');

  // Step 8: Confirm
  const [creating, setCreating] = useState(false);

  // ================================================================
  // COMPUTED
  // ================================================================
  const rentalVehicles = useMemo(() => {
    const filtered = vehicles.filter(v =>
      v.status === 'Available' &&
      (v.listingType === 'rental_only' || v.listingType === 'both')
    );
    if (!vehicleSearch) return filtered;
    const q = vehicleSearch.toLowerCase();
    return filtered.filter(v =>
      `${v.year} ${v.make} ${v.model}`.toLowerCase().includes(q)
    );
  }, [vehicles, vehicleSearch]);

  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const days = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(days, 1);
  }, [startDate, endDate]);

  const totalCost = useMemo(() => {
    if (totalDays >= 7 && weeklyRate > 0) {
      const weeks = Math.floor(totalDays / 7);
      const extraDays = totalDays % 7;
      return weeks * weeklyRate + extraDays * dailyRate;
    }
    return totalDays * dailyRate;
  }, [totalDays, dailyRate, weeklyRate]);

  // ================================================================
  // HANDLERS
  // ================================================================
  const handleSelectVehicle = (v: Vehicle) => {
    setSelectedVehicle(v);
    setDailyRate(v.dailyRate || 0);
    setWeeklyRate(v.weeklyRate || 0);
  };

  const handleSearchCustomer = async () => {
    if (!customerQuery.trim()) return;
    setSearchingCustomer(true);
    const results = await searchCustomers(customerQuery);
    setCustomerResults(results);
    setSearchingCustomer(false);
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) return;
    const customer = await createCustomer({
      fullName: newCustomer.name,
      phone: newCustomer.phone,
      email: newCustomer.email || undefined,
      driversLicenseNumber: newCustomer.driversLicense || undefined,
    } as Partial<RentalCustomer>);
    if (customer) {
      setSelectedCustomer(customer);
      setNewCustomerMode(false);
    }
  };

  const handleLoadInsurance = async () => {
    if (!selectedCustomer) return;
    setLoadingInsurance(true);
    const last = await getCustomerLastInsurance(selectedCustomer.id);
    if (last) {
      setInsuranceCompany(last.company || '');
      setInsurancePolicy(last.policyNumber || '');
      setInsuranceExpiry(last.expiry || '');
    }
    setLoadingInsurance(false);
  };

  const handleLoadPlates = async () => {
    setLoadingPlates(true);
    const plates = await getAvailableDealerPlates();
    setAvailablePlates(plates);
    setLoadingPlates(false);
  };

  const handleConfirm = async () => {
    if (!selectedVehicle || !selectedCustomer) return;
    setCreating(true);

    const booking = await createBooking({
      vehicleId: selectedVehicle.id,
      customerId: selectedCustomer.id,
      startDate,
      endDate,
      dailyRate,
      weeklyRate: weeklyRate || undefined,
      totalCost,
      status: 'active',
      agreementSigned,
      authorizedDrivers: authorizedDrivers.split(',').map(s => s.trim()).filter(Boolean),
      outOfStatePermitted: outOfState,
      mileageOut,
      notes: conditionNotes || undefined,
    } as Partial<RentalBooking>);

    if (booking && selectedPlate) {
      await assignPlateToBooking(
        selectedPlate.id,
        booking.id,
        selectedVehicle.id,
        selectedCustomer.fullName,
        selectedCustomer.phone,
        endDate
      );
    }

    if (booking) {
      onBookingCreated(booking);
    }
    setCreating(false);
  };

  // Auto-load on step entry
  useEffect(() => {
    if (step === 4 && selectedCustomer && !insuranceCompany) handleLoadInsurance();
    if (step === 6 && availablePlates.length === 0) handleLoadPlates();
  }, [step]);

  if (!isOpen) return null;

  const canProceed = () => {
    switch (step) {
      case 1: return !!selectedVehicle;
      case 2: return !!selectedCustomer;
      case 3: return !!startDate && !!endDate && totalDays > 0;
      case 4: return !!insuranceCompany && !!insurancePolicy;
      case 5: return agreementSigned;
      case 6: return true; // Plate is optional
      case 7: return mileageOut > 0;
      default: return true;
    }
  };

  // ================================================================
  // RENDER
  // ================================================================
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border border-white/[0.08] mx-4"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0a0a0a] border-b border-white/[0.06] p-4 flex items-center justify-between">
          <div>
            <h2 className="text-white text-lg font-bold tracking-tight">New Rental Booking</h2>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest">
              Step {step} of 8 — {STEP_LABELS[step - 1]}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Progress */}
        <div className="flex gap-1 px-4 py-2">
          {STEP_LABELS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 transition-all ${i + 1 <= step ? 'bg-tj-gold' : 'bg-white/[0.06]'}`} />
          ))}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 min-h-[300px]">
          {/* STEP 1: Vehicle Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-gray-500" />
                <input
                  type="text"
                  value={vehicleSearch}
                  onChange={e => setVehicleSearch(e.target.value)}
                  placeholder="Search vehicles..."
                  className="w-full bg-black border border-white/[0.08] text-white text-sm pl-9 pr-3 py-2.5 focus:border-tj-gold/50 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-[350px] overflow-y-auto">
                {rentalVehicles.map(v => (
                  <button
                    key={v.id}
                    onClick={() => handleSelectVehicle(v)}
                    className={`flex items-center gap-4 p-3 border text-left transition-all ${
                      selectedVehicle?.id === v.id
                        ? 'border-tj-gold bg-tj-gold/5'
                        : 'border-white/[0.06] hover:border-white/20'
                    }`}
                  >
                    {v.imageUrl && <img src={v.imageUrl} alt="" className="w-16 h-12 object-cover border border-white/[0.06]" />}
                    <div className="flex-1">
                      <p className="text-white text-sm font-bold">{v.year} {v.make} {v.model}</p>
                      <p className="text-gray-500 text-xs">{v.vin}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-tj-gold text-sm font-mono">${v.dailyRate || 0}/day</p>
                      {v.weeklyRate && <p className="text-gray-500 text-[10px]">${v.weeklyRate}/week</p>}
                    </div>
                  </button>
                ))}
                {rentalVehicles.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-8">No rental vehicles available</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Customer */}
          {step === 2 && (
            <div className="space-y-4">
              {!newCustomerMode ? (
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customerQuery}
                      onChange={e => setCustomerQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearchCustomer()}
                      placeholder="Search by name or phone..."
                      className="flex-1 bg-black border border-white/[0.08] text-white text-sm px-3 py-2.5 focus:border-tj-gold/50 focus:outline-none"
                    />
                    <button
                      onClick={handleSearchCustomer}
                      disabled={searchingCustomer}
                      className="px-4 bg-tj-gold text-black text-xs font-bold uppercase tracking-widest disabled:opacity-50"
                    >
                      {searchingCustomer ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    {customerResults.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCustomer(c)}
                        className={`w-full flex items-center justify-between p-3 border text-left transition-all ${
                          selectedCustomer?.id === c.id ? 'border-tj-gold bg-tj-gold/5' : 'border-white/[0.06] hover:border-white/20'
                        }`}
                      >
                        <div>
                          <p className="text-white text-sm">{c.fullName}</p>
                          <p className="text-gray-500 text-xs">{c.phone}</p>
                        </div>
                        {selectedCustomer?.id === c.id && <Check size={16} className="text-tj-gold" />}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setNewCustomerMode(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-white/20 text-gray-400 hover:text-white hover:border-white/40 text-xs uppercase tracking-widest transition-all"
                  >
                    <Plus size={14} /> New Customer
                  </button>
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest">New Customer</p>
                  {(['name', 'phone', 'email', 'driversLicense'] as const).map(field => (
                    <input
                      key={field}
                      type={field === 'email' ? 'email' : 'text'}
                      value={newCustomer[field]}
                      onChange={e => setNewCustomer(prev => ({ ...prev, [field]: e.target.value }))}
                      placeholder={field === 'driversLicense' ? 'Driver\'s License #' : field.charAt(0).toUpperCase() + field.slice(1)}
                      className="w-full bg-black border border-white/[0.08] text-white text-sm px-3 py-2.5 focus:border-tj-gold/50 focus:outline-none"
                    />
                  ))}
                  <div className="flex gap-2">
                    <button onClick={() => setNewCustomerMode(false)} className="flex-1 py-2 text-gray-400 text-xs uppercase tracking-widest">Cancel</button>
                    <button onClick={handleCreateCustomer} className="flex-1 py-2 bg-tj-gold text-black text-xs font-bold uppercase tracking-widest">Create</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Dates */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 block">Start Date</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-black border border-white/[0.08] text-white text-sm px-3 py-2.5 focus:border-tj-gold/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 block">End Date</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate}
                    className="w-full bg-black border border-white/[0.08] text-white text-sm px-3 py-2.5 focus:border-tj-gold/50 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 block">Daily Rate</label>
                  <input type="number" value={dailyRate || ''} onChange={e => setDailyRate(Number(e.target.value))}
                    className="w-full bg-black border border-white/[0.08] text-white text-sm px-3 py-2 focus:border-tj-gold/50 focus:outline-none font-mono" />
                </div>
                <div>
                  <label className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 block">Weekly Rate</label>
                  <input type="number" value={weeklyRate || ''} onChange={e => setWeeklyRate(Number(e.target.value))}
                    className="w-full bg-black border border-white/[0.08] text-white text-sm px-3 py-2 focus:border-tj-gold/50 focus:outline-none font-mono" />
                </div>
                <div className="bg-black border border-tj-gold/20 p-3">
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest">Total ({totalDays} days)</p>
                  <p className="text-tj-gold text-lg font-mono">${totalCost.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Insurance */}
          {step === 4 && (
            <div className="space-y-4">
              {loadingInsurance ? (
                <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-tj-gold" /></div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 block">Insurance Company</label>
                      <input type="text" value={insuranceCompany} onChange={e => setInsuranceCompany(e.target.value)}
                        className="w-full bg-black border border-white/[0.08] text-white text-sm px-3 py-2.5 focus:border-tj-gold/50 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 block">Policy Number</label>
                      <input type="text" value={insurancePolicy} onChange={e => setInsurancePolicy(e.target.value)}
                        className="w-full bg-black border border-white/[0.08] text-white text-sm px-3 py-2.5 focus:border-tj-gold/50 focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 block">Expiry Date</label>
                    <input type="date" value={insuranceExpiry} onChange={e => setInsuranceExpiry(e.target.value)}
                      className="w-full bg-black border border-white/[0.08] text-white text-sm px-3 py-2.5 focus:border-tj-gold/50 focus:outline-none" />
                  </div>
                  {insuranceExpiry && new Date(insuranceExpiry) < new Date(endDate) && (
                    <div className="flex items-center gap-2 text-yellow-400 text-xs bg-yellow-500/10 p-3 border border-yellow-500/20">
                      <AlertTriangle size={14} />
                      Insurance expires before rental end date
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* STEP 5: Agreement */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="bg-black border border-white/[0.06] p-4 text-gray-400 text-xs leading-relaxed max-h-[200px] overflow-y-auto">
                <p className="text-white text-sm font-bold mb-2">Rental Agreement Summary</p>
                <p>Vehicle: {selectedVehicle?.year} {selectedVehicle?.make} {selectedVehicle?.model}</p>
                <p>Customer: {selectedCustomer?.fullName}</p>
                <p>Period: {startDate} to {endDate} ({totalDays} days)</p>
                <p>Total: ${totalCost.toLocaleString()}</p>
                <p className="mt-3">By signing, the customer agrees to the terms and conditions of Triple J Auto Investment rental agreement, including daily rate charges, late fees, damage liability, and insurance requirements.</p>
              </div>
              <div>
                <label className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 block">Authorized Drivers (comma-separated)</label>
                <input type="text" value={authorizedDrivers} onChange={e => setAuthorizedDrivers(e.target.value)}
                  placeholder={selectedCustomer?.fullName || ''}
                  className="w-full bg-black border border-white/[0.08] text-white text-sm px-3 py-2.5 focus:border-tj-gold/50 focus:outline-none" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <button onClick={() => setOutOfState(!outOfState)}
                  className={`w-5 h-5 border flex items-center justify-center transition-all ${outOfState ? 'bg-tj-gold/20 border-tj-gold text-tj-gold' : 'border-white/20 text-transparent'}`}>
                  <Check size={12} />
                </button>
                <span className="text-gray-400 text-sm">Out-of-state travel permitted</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <button onClick={() => setAgreementSigned(!agreementSigned)}
                  className={`w-5 h-5 border flex items-center justify-center transition-all ${agreementSigned ? 'bg-green-500/20 border-green-500 text-green-400' : 'border-white/20 text-transparent'}`}>
                  <Check size={12} />
                </button>
                <span className="text-gray-300 text-sm font-bold">Agreement Signed</span>
              </label>
            </div>
          )}

          {/* STEP 6: Plate Assignment */}
          {step === 6 && (
            <div className="space-y-4">
              {loadingPlates ? (
                <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-tj-gold" /></div>
              ) : (
                <>
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest">Select a dealer plate (optional)</p>
                  <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                    {availablePlates.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPlate(selectedPlate?.id === p.id ? null : p)}
                        className={`p-3 border text-left transition-all ${
                          selectedPlate?.id === p.id ? 'border-tj-gold bg-tj-gold/5' : 'border-white/[0.06] hover:border-white/20'
                        }`}
                      >
                        <p className="text-white text-sm font-mono">{p.plateNumber}</p>
                        <p className="text-gray-500 text-[10px]">{p.plateType}</p>
                      </button>
                    ))}
                  </div>
                  {availablePlates.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-6">No plates available</p>
                  )}
                </>
              )}
            </div>
          )}

          {/* STEP 7: Condition Report */}
          {step === 7 && (
            <div className="space-y-4">
              <div>
                <label className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 block">Mileage Out</label>
                <input type="number" value={mileageOut || ''} onChange={e => setMileageOut(Number(e.target.value))}
                  placeholder="Current odometer reading"
                  className="w-full bg-black border border-white/[0.08] text-white text-sm px-3 py-2.5 focus:border-tj-gold/50 focus:outline-none font-mono" />
              </div>
              <div>
                <label className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 block">Condition Notes</label>
                <textarea value={conditionNotes} onChange={e => setConditionNotes(e.target.value)}
                  rows={4} placeholder="Note any existing scratches, dents, or issues..."
                  className="w-full bg-black border border-white/[0.08] text-white text-sm px-3 py-2 focus:border-tj-gold/50 focus:outline-none resize-none" />
              </div>
              <p className="text-gray-600 text-[10px] uppercase tracking-widest">Tip: Take photos of the vehicle before handoff</p>
            </div>
          )}

          {/* STEP 8: Confirm */}
          {step === 8 && (
            <div className="space-y-4">
              <div className="bg-black border border-white/[0.06] divide-y divide-white/[0.06]">
                {[
                  { label: 'Vehicle', value: `${selectedVehicle?.year} ${selectedVehicle?.make} ${selectedVehicle?.model}` },
                  { label: 'Customer', value: selectedCustomer?.fullName },
                  { label: 'Period', value: `${startDate} → ${endDate} (${totalDays} days)` },
                  { label: 'Rate', value: `$${dailyRate}/day${weeklyRate ? ` · $${weeklyRate}/week` : ''}` },
                  { label: 'Total', value: `$${totalCost.toLocaleString()}` },
                  { label: 'Insurance', value: `${insuranceCompany} — ${insurancePolicy}` },
                  { label: 'Agreement', value: agreementSigned ? 'Signed' : 'Not signed' },
                  { label: 'Plate', value: selectedPlate?.plateNumber || 'None assigned' },
                  { label: 'Mileage Out', value: mileageOut.toLocaleString() },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between p-3">
                    <span className="text-gray-500 text-xs uppercase tracking-widest">{row.label}</span>
                    <span className="text-white text-sm">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#0a0a0a] border-t border-white/[0.06] p-4 flex items-center justify-between">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-xs uppercase tracking-widest transition-colors"
          >
            <ChevronLeft size={14} />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {step < 8 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-2 bg-tj-gold text-black px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-tj-gold/90 transition-all disabled:opacity-30"
            >
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={creating}
              className="flex items-center gap-2 bg-green-500 text-black px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-green-400 transition-all disabled:opacity-50"
            >
              {creating ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {creating ? 'Creating...' : 'Create Booking'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default RentalBookingWizard;
