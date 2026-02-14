import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Car,
  Calendar,
  DollarSign,
  User,
  Search,
  Loader2,
  Plus,
  Trash2,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Shield,
  FileText,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Vehicle,
  RentalBooking,
  RentalCustomer,
  RentalInsurance,
  InsuranceType,
  InsuranceVerificationFlags,
  Plate,
  TEXAS_MINIMUM_COVERAGE,
  TEXAS_MINIMUM_LABEL,
} from '../../types';
import { AddressInput } from '../AddressInput';
import { useScrollLock } from '../../hooks/useScrollLock';
import {
  searchCustomers,
  createCustomer,
  createBooking,
  updateBooking,
  getAvailableVehicles,
  calculateBookingTotal,
} from '../../services/rentalService';
import { getAvailableDealerPlates, assignPlateToBooking } from '../../services/plateService';
import {
  createInsurance,
  validateInsuranceCoverage,
  updateCustomerInsuranceCache,
  getCustomerLastInsurance,
} from '../../services/insuranceService';

// ================================================================
// TYPES
// ================================================================

interface RentalBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingCreated: () => void;
  vehicles: Vehicle[];
  preSelectedDate?: string;
  editBooking?: RentalBooking;
}

type SectionKey = 'customer' | 'vehicle' | 'terms' | 'review';

const SECTIONS: { key: SectionKey; label: string; icon: React.ReactNode }[] = [
  { key: 'customer', label: 'Customer', icon: <User size={14} /> },
  { key: 'vehicle', label: 'Vehicle & Dates', icon: <Car size={14} /> },
  { key: 'terms', label: 'Agreement', icon: <Shield size={14} /> },
  { key: 'review', label: 'Review', icon: <FileText size={14} /> },
];

// ================================================================
// COMPONENT
// ================================================================

export const RentalBookingModal: React.FC<RentalBookingModalProps> = ({
  isOpen,
  onClose,
  onBookingCreated,
  vehicles,
  preSelectedDate,
  editBooking,
}) => {
  // ---- Section navigation ----
  const [activeSection, setActiveSection] = useState<SectionKey>('customer');

  // ---- Customer state ----
  const [customerSearch, setCustomerSearch] = useState('');
  const [searchResults, setSearchResults] = useState<RentalCustomer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<RentalCustomer | null>(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerDL, setCustomerDL] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [employerName, setEmployerName] = useState('');
  const [employerPhone, setEmployerPhone] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  // ---- Vehicle & dates state ----
  const defaultStart = preSelectedDate || new Date().toISOString().split('T')[0];
  const defaultEnd = (() => {
    const d = new Date(defaultStart);
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  })();

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [mileageOut, setMileageOut] = useState('');
  const [mileageLimit, setMileageLimit] = useState('');

  // ---- Plate selection state ----
  const [availablePlates, setAvailablePlates] = useState<Plate[]>([]);
  const [selectedPlateId, setSelectedPlateId] = useState('');
  const [loadingPlates, setLoadingPlates] = useState(false);

  // ---- Agreement terms state ----
  const [authorizedDrivers, setAuthorizedDrivers] = useState<string[]>([]);
  const [newDriverName, setNewDriverName] = useState('');
  const [outOfStatePermitted, setOutOfStatePermitted] = useState(false);
  const [permittedStates, setPermittedStates] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  // ---- Insurance state ----
  const [insType, setInsType] = useState<InsuranceType>('customer_provided');
  const [insCompany, setInsCompany] = useState('');
  const [insPolicyNumber, setInsPolicyNumber] = useState('');
  const [insEffectiveDate, setInsEffectiveDate] = useState('');
  const [insExpirationDate, setInsExpirationDate] = useState('');
  const [insBiPerPerson, setInsBiPerPerson] = useState('');
  const [insBiPerAccident, setInsBiPerAccident] = useState('');
  const [insPropertyDamage, setInsPropertyDamage] = useState('');
  const [insDealerDailyRate, setInsDealerDailyRate] = useState('');
  const [insPreFilled, setInsPreFilled] = useState(false);

  // ---- Submission state ----
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ---- Scroll lock ----
  useScrollLock(isOpen);

  const isEditMode = !!editBooking;

  // ================================================================
  // DERIVED VALUES
  // ================================================================

  const selectedVehicle = useMemo(() => {
    return availableVehicles.find(v => v.id === selectedVehicleId)
      || vehicles.find(v => v.id === selectedVehicleId);
  }, [availableVehicles, vehicles, selectedVehicleId]);

  const rentalDays = useMemo(() => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diff = e.getTime() - s.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [startDate, endDate]);

  const totalCost = useMemo(() => {
    if (!selectedVehicle || !selectedVehicle.dailyRate) return 0;
    return calculateBookingTotal(
      startDate,
      endDate,
      selectedVehicle.dailyRate,
      selectedVehicle.weeklyRate
    );
  }, [startDate, endDate, selectedVehicle]);

  const dateError = useMemo(() => {
    if (new Date(endDate) <= new Date(startDate)) {
      return 'End date must be after start date';
    }
    if (selectedVehicle) {
      if (selectedVehicle.minRentalDays && rentalDays < selectedVehicle.minRentalDays) {
        return `Minimum rental: ${selectedVehicle.minRentalDays} days`;
      }
      if (selectedVehicle.maxRentalDays && rentalDays > selectedVehicle.maxRentalDays) {
        return `Maximum rental: ${selectedVehicle.maxRentalDays} days`;
      }
    }
    return null;
  }, [startDate, endDate, rentalDays, selectedVehicle]);

  // Insurance computed values
  const insDealerTotal = useMemo(() => {
    const rate = parseFloat(insDealerDailyRate);
    if (isNaN(rate) || rate <= 0) return 0;
    return rate * rentalDays;
  }, [insDealerDailyRate, rentalDays]);

  const insValidationFlags = useMemo((): InsuranceVerificationFlags | null => {
    if (insType !== 'customer_provided') return null;
    if (!insCompany && !insPolicyNumber && !insExpirationDate) return null;
    return validateInsuranceCoverage(
      {
        insuranceCompany: insCompany || undefined,
        policyNumber: insPolicyNumber || undefined,
        effectiveDate: insEffectiveDate || undefined,
        expirationDate: insExpirationDate || undefined,
        bodilyInjuryPerPerson: insBiPerPerson ? parseInt(insBiPerPerson, 10) : undefined,
        bodilyInjuryPerAccident: insBiPerAccident ? parseInt(insBiPerAccident, 10) : undefined,
        propertyDamage: insPropertyDamage ? parseInt(insPropertyDamage, 10) : undefined,
      } as Partial<RentalInsurance>,
      endDate
    );
  }, [insType, insCompany, insPolicyNumber, insEffectiveDate, insExpirationDate,
      insBiPerPerson, insBiPerAccident, insPropertyDamage, endDate]);

  const insHasIssues = insValidationFlags
    ? !Object.values(insValidationFlags).every(Boolean)
    : false;

  // ================================================================
  // EFFECTS
  // ================================================================

  // Pre-fill for edit mode
  useEffect(() => {
    if (editBooking) {
      setStartDate(editBooking.startDate);
      setEndDate(editBooking.endDate);
      setSelectedVehicleId(editBooking.vehicleId);
      setMileageOut(editBooking.mileageOut?.toString() || '');
      setMileageLimit(editBooking.mileageLimit?.toString() || '');
      setAuthorizedDrivers(editBooking.authorizedDrivers || []);
      setOutOfStatePermitted(editBooking.outOfStatePermitted || false);
      setPermittedStates((editBooking.permittedStates || []).join(', '));
      setAdminNotes(editBooking.notes || '');
      if (editBooking.customer) {
        setSelectedCustomer(editBooking.customer);
        setCustomerName(editBooking.customer.fullName);
        setCustomerPhone(editBooking.customer.phone);
        setCustomerEmail(editBooking.customer.email || '');
        setCustomerDL(editBooking.customer.driversLicenseNumber);
        setCustomerAddress(editBooking.customer.address);
        setEmergencyName(editBooking.customer.emergencyContactName || '');
        setEmergencyPhone(editBooking.customer.emergencyContactPhone || '');
        setEmployerName(editBooking.customer.employerName || '');
        setEmployerPhone(editBooking.customer.employerPhone || '');
        setCustomerNotes(editBooking.customer.notes || '');
      }
    }
  }, [editBooking]);

  // Fetch available vehicles when dates change
  useEffect(() => {
    if (!startDate || !endDate) return;
    if (new Date(endDate) <= new Date(startDate)) return;

    let cancelled = false;
    setIsLoadingVehicles(true);

    getAvailableVehicles(startDate, endDate).then(result => {
      if (!cancelled) {
        setAvailableVehicles(result);
        setIsLoadingVehicles(false);
        // Auto-select if only one available
        if (result.length === 1 && !selectedVehicleId) {
          setSelectedVehicleId(result[0].id);
          if (result[0].mileage) setMileageOut(result[0].mileage.toString());
        }
      }
    });

    return () => { cancelled = true; };
  }, [startDate, endDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch available dealer plates when a vehicle is selected (new bookings only)
  useEffect(() => {
    if (!selectedVehicleId) {
      setAvailablePlates([]);
      setSelectedPlateId('');
      return;
    }
    if (isEditMode) return; // Plates are assigned at creation time only
    setLoadingPlates(true);
    getAvailableDealerPlates().then(plates => {
      setAvailablePlates(plates);
      setLoadingPlates(false);
      // Auto-select if only one available
      if (plates.length === 1) setSelectedPlateId(plates[0].id);
    }).catch(() => setLoadingPlates(false));
  }, [selectedVehicleId, isEditMode]);

  // Add primary renter as first authorized driver when customer name changes
  useEffect(() => {
    if (customerName.trim() && authorizedDrivers.length === 0) {
      setAuthorizedDrivers([customerName.trim()]);
    } else if (customerName.trim() && authorizedDrivers.length > 0) {
      // Update the first driver name (primary renter)
      setAuthorizedDrivers(prev => [customerName.trim(), ...prev.slice(1)]);
    }
  }, [customerName]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-fill insurance from customer's last booking when customer is selected
  useEffect(() => {
    if (!selectedCustomer?.id || isEditMode) return;
    let cancelled = false;
    getCustomerLastInsurance(selectedCustomer.id).then(cached => {
      if (cancelled) return;
      if (cached) {
        if (cached.company) setInsCompany(cached.company);
        if (cached.policyNumber) setInsPolicyNumber(cached.policyNumber);
        if (cached.expiry) setInsExpirationDate(cached.expiry);
        setInsPreFilled(true);
      }
    });
    return () => { cancelled = true; };
  }, [selectedCustomer?.id, isEditMode]);

  // ================================================================
  // HANDLERS
  // ================================================================

  // Customer search with debounce
  const handleCustomerSearch = useCallback(async (query: string) => {
    setCustomerSearch(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchCustomers(query);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSelectCustomer = (customer: RentalCustomer) => {
    setSelectedCustomer(customer);
    setIsNewCustomer(false);
    setCustomerName(customer.fullName);
    setCustomerPhone(customer.phone);
    setCustomerEmail(customer.email || '');
    setCustomerDL(customer.driversLicenseNumber);
    setCustomerAddress(customer.address);
    setEmergencyName(customer.emergencyContactName || '');
    setEmergencyPhone(customer.emergencyContactPhone || '');
    setEmployerName(customer.employerName || '');
    setEmployerPhone(customer.employerPhone || '');
    setCustomerNotes(customer.notes || '');
    setSearchResults([]);
    setCustomerSearch('');
  };

  const handleNewCustomer = () => {
    setSelectedCustomer(null);
    setIsNewCustomer(true);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setCustomerDL('');
    setCustomerAddress('');
    setEmergencyName('');
    setEmergencyPhone('');
    setEmployerName('');
    setEmployerPhone('');
    setCustomerNotes('');
    setSearchResults([]);
    setCustomerSearch('');
  };

  const handleSelectVehicle = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    const v = availableVehicles.find(av => av.id === vehicleId);
    if (v && v.mileage) {
      setMileageOut(v.mileage.toString());
    }
  };

  const handleAddDriver = () => {
    if (newDriverName.trim()) {
      setAuthorizedDrivers(prev => [...prev, newDriverName.trim()]);
      setNewDriverName('');
    }
  };

  const handleRemoveDriver = (index: number) => {
    if (index === 0) return; // Don't remove primary renter
    setAuthorizedDrivers(prev => prev.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setAvailablePlates([]);
    setSelectedPlateId('');
    onClose();
  };

  // ---- Submit ----
  const handleSubmit = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      let customerId = selectedCustomer?.id;

      // Create new customer if needed
      if (!customerId || isNewCustomer) {
        const newCustomer = await createCustomer({
          fullName: customerName.trim(),
          phone: customerPhone.trim(),
          email: customerEmail.trim() || undefined,
          driversLicenseNumber: customerDL.trim(),
          address: customerAddress.trim(),
          emergencyContactName: emergencyName.trim() || undefined,
          emergencyContactPhone: emergencyPhone.trim() || undefined,
          employerName: employerName.trim() || undefined,
          employerPhone: employerPhone.trim() || undefined,
          notes: customerNotes.trim() || undefined,
        });

        if (!newCustomer) {
          setErrorMessage('Failed to create customer. Please try again.');
          setIsSubmitting(false);
          return;
        }
        customerId = newCustomer.id;
      }

      const bookingData: Partial<RentalBooking> = {
        vehicleId: selectedVehicleId,
        customerId,
        startDate,
        endDate,
        dailyRate: selectedVehicle?.dailyRate || 0,
        weeklyRate: selectedVehicle?.weeklyRate,
        totalCost,
        authorizedDrivers,
        outOfStatePermitted,
        permittedStates: outOfStatePermitted
          ? permittedStates.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        mileageOut: mileageOut ? parseInt(mileageOut, 10) : undefined,
        mileageLimit: mileageLimit ? parseInt(mileageLimit, 10) : undefined,
        notes: adminNotes.trim() || undefined,
      };

      if (isEditMode && editBooking) {
        const success = await updateBooking(editBooking.id, bookingData);
        if (!success) {
          setErrorMessage('Failed to update booking. Please try again.');
          setIsSubmitting(false);
          return;
        }
      } else {
        const result = await createBooking(bookingData);
        if (!result) {
          setErrorMessage('Failed to create booking. Please try again.');
          setIsSubmitting(false);
          return;
        }

        // Assign plate to the new booking
        if (selectedPlateId && result.id) {
          try {
            await assignPlateToBooking(
              selectedPlateId,
              result.id,
              selectedVehicleId,
              customerName.trim(),
              customerPhone.trim(),
              endDate
            );
          } catch (plateErr) {
            console.error('Plate assignment failed:', plateErr);
            // Booking was created successfully, warn about plate assignment failure
            // Don't block the booking creation -- graceful degradation per research
            setSuccessMessage('Booking created, but plate assignment failed. Please assign the plate manually from the Plates page.');
            setTimeout(() => { onBookingCreated(); handleClose(); }, 2000);
            return;
          }
        }

        // Create insurance record (soft-block: booking succeeds even if insurance fails)
        if (result.id && (insCompany || insPolicyNumber || insType === 'dealer_coverage')) {
          try {
            const insResult = await createInsurance({
              bookingId: result.id,
              insuranceType: insType,
              insuranceCompany: insCompany || undefined,
              policyNumber: insPolicyNumber || undefined,
              effectiveDate: insEffectiveDate || undefined,
              expirationDate: insExpirationDate || undefined,
              bodilyInjuryPerPerson: insBiPerPerson ? parseInt(insBiPerPerson, 10) : undefined,
              bodilyInjuryPerAccident: insBiPerAccident ? parseInt(insBiPerAccident, 10) : undefined,
              propertyDamage: insPropertyDamage ? parseInt(insPropertyDamage, 10) : undefined,
              dealerCoverageDailyRate: insType === 'dealer_coverage' && insDealerDailyRate ? parseFloat(insDealerDailyRate) : undefined,
              dealerCoverageTotal: insType === 'dealer_coverage' ? insDealerTotal : undefined,
              bookingEndDate: endDate,
            });

            // Cache customer insurance for future pre-fill
            if (insResult && insType === 'customer_provided' && customerId) {
              await updateCustomerInsuranceCache(customerId, {
                insuranceCompany: insCompany,
                policyNumber: insPolicyNumber,
                expirationDate: insExpirationDate,
              });
            }
          } catch (insErr) {
            console.error('Insurance creation failed:', insErr);
            // Don't fail the booking -- insurance can be added from BookingDetail
          }
        }
      }

      setSuccessMessage(isEditMode ? 'Booking updated successfully!' : 'Booking created successfully!');
      setTimeout(() => {
        onBookingCreated();
        handleClose();
      }, 800);
    } catch (err: any) {
      // Check for EXCLUDE constraint violation (double-booking)
      const msg = err?.message || err?.toString() || '';
      if (msg.includes('exclusion') || msg.includes('overlaps') || msg.includes('23P01')) {
        setErrorMessage('This vehicle is already booked for those dates. Please choose different dates or another vehicle.');
      } else {
        setErrorMessage(`Error: ${msg || 'Something went wrong. Please try again.'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---- Form validation ----
  const isCustomerValid = !!(customerName.trim() && customerPhone.trim() && customerDL.trim() && customerAddress.trim());
  const isVehicleValid = !!(selectedVehicleId && startDate && endDate && !dateError && (isEditMode || selectedPlateId));
  const isFormValid = isCustomerValid && isVehicleValid;

  // ================================================================
  // RENDER HELPERS
  // ================================================================

  const renderSectionNav = () => (
    <div className="flex border-b border-tj-gold/20 shrink-0">
      {SECTIONS.map((sec) => (
        <button
          key={sec.key}
          type="button"
          onClick={() => setActiveSection(sec.key)}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-[10px] uppercase tracking-widest transition-all border-b-2 ${
            activeSection === sec.key
              ? 'border-tj-gold text-tj-gold bg-tj-gold/5'
              : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
          }`}
        >
          {sec.icon}
          <span className="hidden sm:inline">{sec.label}</span>
        </button>
      ))}
    </div>
  );

  const renderCustomerSection = () => (
    <div className="space-y-4">
      {/* Search existing customers */}
      <div className="relative">
        <label className="block text-[10px] uppercase tracking-widest text-tj-gold mb-2 flex items-center gap-2">
          <Search size={12} /> Search Existing Customer
        </label>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
          <input
            type="text"
            value={customerSearch}
            onChange={(e) => handleCustomerSearch(e.target.value)}
            placeholder="Search by name, phone, or DL#..."
            className="w-full bg-black border border-gray-700 pl-10 pr-4 py-3 text-white text-sm focus:border-tj-gold outline-none transition-colors placeholder-gray-600"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-tj-gold animate-spin" size={14} />
          )}
        </div>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-[#0a0a0a] border border-gray-800 shadow-xl max-h-48 overflow-y-auto">
            {searchResults.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelectCustomer(c)}
                className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-tj-gold/10 hover:text-tj-gold border-b border-gray-800 last:border-0 transition-colors"
              >
                <span className="font-medium">{c.fullName}</span>
                <span className="text-gray-500 ml-2">{c.phone}</span>
                <span className="text-gray-600 ml-2 text-xs">DL: {c.driversLicenseNumber}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleNewCustomer}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-gray-300 text-xs uppercase tracking-widest hover:bg-tj-gold/10 hover:text-tj-gold hover:border-tj-gold/30 transition-all"
        >
          <Plus size={12} /> New Customer
        </button>
        {selectedCustomer && !isNewCustomer && (
          <span className="flex items-center gap-2 text-green-400 text-xs">
            <CheckCircle size={14} />
            Selected: {selectedCustomer.fullName}
          </span>
        )}
      </div>

      {/* Customer form fields */}
      <div className="space-y-4 bg-black/30 border border-white/5 p-4">
        <h4 className="text-[10px] uppercase tracking-widest text-gray-500">Customer Details</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="John Doe"
              className="w-full bg-black border border-gray-700 px-4 py-3 text-white text-sm focus:border-tj-gold outline-none transition-colors placeholder-gray-600"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 flex items-center gap-1">
              <Phone size={10} /> Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full bg-black border border-gray-700 px-4 py-3 text-white text-sm focus:border-tj-gold outline-none transition-colors placeholder-gray-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 flex items-center gap-1">
              <Mail size={10} /> Email
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="john@example.com"
              className="w-full bg-black border border-gray-700 px-4 py-3 text-white text-sm focus:border-tj-gold outline-none transition-colors placeholder-gray-600"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 flex items-center gap-1">
              <CreditCard size={10} /> Driver's License # <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={customerDL}
              onChange={(e) => setCustomerDL(e.target.value)}
              placeholder="DL12345678"
              className="w-full bg-black border border-gray-700 px-4 py-3 text-white text-sm focus:border-tj-gold outline-none transition-colors placeholder-gray-600 font-mono"
            />
          </div>
        </div>

        <AddressInput
          value={customerAddress}
          onChange={setCustomerAddress}
          label="Full Address"
          placeholder="Start typing address..."
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">
              Emergency Contact Name
            </label>
            <input
              type="text"
              value={emergencyName}
              onChange={(e) => setEmergencyName(e.target.value)}
              placeholder="Optional"
              className="w-full bg-black border border-gray-700 px-4 py-3 text-white text-sm focus:border-tj-gold outline-none transition-colors placeholder-gray-600"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">
              Emergency Contact Phone
            </label>
            <input
              type="tel"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              placeholder="Optional"
              className="w-full bg-black border border-gray-700 px-4 py-3 text-white text-sm focus:border-tj-gold outline-none transition-colors placeholder-gray-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">
              Employer Name
            </label>
            <input
              type="text"
              value={employerName}
              onChange={(e) => setEmployerName(e.target.value)}
              placeholder="Optional"
              className="w-full bg-black border border-gray-700 px-4 py-3 text-white text-sm focus:border-tj-gold outline-none transition-colors placeholder-gray-600"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">
              Employer Phone
            </label>
            <input
              type="tel"
              value={employerPhone}
              onChange={(e) => setEmployerPhone(e.target.value)}
              placeholder="Optional"
              className="w-full bg-black border border-gray-700 px-4 py-3 text-white text-sm focus:border-tj-gold outline-none transition-colors placeholder-gray-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">
            Notes
          </label>
          <textarea
            value={customerNotes}
            onChange={(e) => setCustomerNotes(e.target.value)}
            placeholder="Optional notes about this customer..."
            rows={2}
            className="w-full bg-black border border-gray-700 px-4 py-3 text-white text-sm focus:border-tj-gold outline-none transition-colors placeholder-gray-600 resize-none"
          />
        </div>
      </div>
    </div>
  );

  const renderVehicleSection = () => (
    <div className="space-y-4">
      {/* Date range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-tj-gold mb-2 flex items-center gap-2">
            <Calendar size={12} /> Start Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-black border border-gray-700 px-4 py-3 text-white text-sm focus:border-tj-gold outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-tj-gold mb-2 flex items-center gap-2">
            <Calendar size={12} /> End Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-black border border-gray-700 px-4 py-3 text-white text-sm focus:border-tj-gold outline-none transition-colors"
          />
        </div>
      </div>

      {dateError && (
        <div className="flex items-center gap-2 text-red-400 text-xs bg-red-900/20 border border-red-800/30 px-3 py-2">
          <AlertCircle size={14} />
          {dateError}
        </div>
      )}

      {!dateError && startDate && endDate && (
        <div className="text-xs text-gray-400">
          Duration: <span className="text-white font-medium">{rentalDays} day{rentalDays !== 1 ? 's' : ''}</span>
          {rentalDays >= 7 && <span className="text-gray-500 ml-1">({Math.floor(rentalDays / 7)}w {rentalDays % 7}d)</span>}
        </div>
      )}

      {/* Available vehicles */}
      <div>
        <label className="block text-[10px] uppercase tracking-widest text-tj-gold mb-2 flex items-center gap-2">
          <Car size={12} /> Select Vehicle <span className="text-red-500">*</span>
        </label>

        {isLoadingVehicles ? (
          <div className="flex items-center gap-2 text-gray-500 py-4">
            <Loader2 className="animate-spin" size={16} />
            <span className="text-sm">Checking availability...</span>
          </div>
        ) : availableVehicles.length === 0 ? (
          <div className="bg-black/50 border border-white/10 p-4 text-center text-gray-500 text-sm">
            No vehicles available for these dates. Try different dates or check vehicle rental settings.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 max-h-[240px] overflow-y-auto pr-1">
            {availableVehicles.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => handleSelectVehicle(v.id)}
                className={`flex items-center gap-3 p-3 border text-left transition-all ${
                  selectedVehicleId === v.id
                    ? 'border-tj-gold bg-tj-gold/10 text-white'
                    : 'border-white/10 bg-black/50 text-gray-300 hover:border-white/30'
                }`}
              >
                {v.imageUrl && (
                  <img
                    src={v.imageUrl}
                    alt={`${v.year} ${v.make} ${v.model}`}
                    className="w-16 h-12 object-cover border border-white/10 flex-shrink-0"
                  />
                )}
                <div className="flex-grow min-w-0">
                  <div className="font-medium text-sm truncate">
                    {v.year} {v.make} {v.model}
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono">{v.vin}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm text-tj-gold font-medium">${v.dailyRate}/day</div>
                  {v.weeklyRate && (
                    <div className="text-[10px] text-gray-500">${v.weeklyRate}/week</div>
                  )}
                </div>
                {selectedVehicleId === v.id && (
                  <CheckCircle className="text-tj-gold flex-shrink-0" size={18} />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Rate & cost display */}
      {selectedVehicle && (
        <div className="bg-black/50 border border-white/10 p-4 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Daily Rate</span>
            <span className="text-white">${selectedVehicle.dailyRate || 0}/day</span>
          </div>
          {selectedVehicle.weeklyRate && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Weekly Rate</span>
              <span className="text-white">${selectedVehicle.weeklyRate}/week</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-medium border-t border-white/10 pt-2 mt-2">
            <span className="text-tj-gold">Total Cost ({rentalDays} days)</span>
            <span className="text-tj-gold">${totalCost.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Mileage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">
            Mileage Out
          </label>
          <input
            type="number"
            value={mileageOut}
            onChange={(e) => setMileageOut(e.target.value)}
            placeholder="Current mileage"
            className="w-full bg-black border border-gray-700 px-4 py-3 text-white text-sm focus:border-tj-gold outline-none transition-colors placeholder-gray-600 font-mono"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">
            Mileage Limit
          </label>
          <input
            type="number"
            value={mileageLimit}
            onChange={(e) => setMileageLimit(e.target.value)}
            placeholder="Optional limit"
            className="w-full bg-black border border-gray-700 px-4 py-3 text-white text-sm focus:border-tj-gold outline-none transition-colors placeholder-gray-600 font-mono"
          />
        </div>
      </div>

      {/* Plate selection (new bookings only) */}
      {selectedVehicleId && !isEditMode && (
        <div className="mt-6 border-t border-gray-800 pt-4">
          <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">
            Assign Dealer Plate <span className="text-red-500">*</span>
          </label>
          {loadingPlates ? (
            <div className="text-gray-500 text-sm">Loading available plates...</div>
          ) : availablePlates.length === 0 ? (
            <div className="text-amber-400 text-sm flex items-center gap-2">
              <AlertTriangle size={14} />
              No dealer plates available. Create plates in the Plates page first.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availablePlates.map(plate => (
                <button
                  key={plate.id}
                  type="button"
                  onClick={() => setSelectedPlateId(plate.id)}
                  className={`p-3 border text-left text-sm transition-all ${
                    selectedPlateId === plate.id
                      ? 'border-tj-gold bg-tj-gold/10 text-white'
                      : 'border-gray-700 hover:border-gray-500 text-gray-300'
                  }`}
                >
                  <span className="font-bold">{plate.plateNumber}</span>
                  {plate.expirationDate && (
                    <span className="block text-[10px] text-gray-500 mt-1">
                      Exp: {new Date(plate.expirationDate).toLocaleDateString()}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderTermsSection = () => (
    <div className="space-y-4">
      {/* Authorized drivers */}
      <div className="bg-black/30 border border-white/5 p-4 space-y-3">
        <label className="block text-[10px] uppercase tracking-widest text-tj-gold flex items-center gap-2">
          <User size={12} /> Authorized Drivers
        </label>

        <div className="space-y-2">
          {authorizedDrivers.map((driver, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className={`flex-grow bg-black border px-4 py-2 text-sm ${
                index === 0 ? 'border-tj-gold/30 text-tj-gold' : 'border-gray-700 text-white'
              }`}>
                {driver}
                {index === 0 && <span className="text-[10px] text-gray-500 ml-2">(Primary Renter)</span>}
              </div>
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => handleRemoveDriver(index)}
                  className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newDriverName}
            onChange={(e) => setNewDriverName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDriver())}
            placeholder="Additional driver name"
            className="flex-grow bg-black border border-gray-700 px-4 py-2 text-white text-sm focus:border-tj-gold outline-none transition-colors placeholder-gray-600"
          />
          <button
            type="button"
            onClick={handleAddDriver}
            disabled={!newDriverName.trim()}
            className="px-3 py-2 bg-white/5 border border-white/10 text-gray-300 hover:bg-tj-gold/10 hover:text-tj-gold hover:border-tj-gold/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Geographic restrictions */}
      <div className="bg-black/30 border border-white/5 p-4 space-y-3">
        <label className="block text-[10px] uppercase tracking-widest text-tj-gold flex items-center gap-2">
          <MapPin size={12} /> Geographic Restrictions
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={outOfStatePermitted}
            onChange={(e) => setOutOfStatePermitted(e.target.checked)}
            className="w-4 h-4 accent-yellow-500"
          />
          <span className="text-sm text-gray-300">Out-of-state driving permitted</span>
        </label>

        {outOfStatePermitted && (
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">
              Permitted States (comma-separated)
            </label>
            <input
              type="text"
              value={permittedStates}
              onChange={(e) => setPermittedStates(e.target.value)}
              placeholder="e.g., Louisiana, Oklahoma, New Mexico"
              className="w-full bg-black border border-gray-700 px-4 py-3 text-white text-sm focus:border-tj-gold outline-none transition-colors placeholder-gray-600"
            />
          </div>
        )}
      </div>

      {/* Insurance Information */}
      <div className="bg-black/30 border border-white/5 p-4 space-y-3">
        <label className="block text-[10px] uppercase tracking-widest text-tj-gold flex items-center gap-2">
          <Shield size={12} /> Insurance Information
        </label>

        {insPreFilled && (
          <p className="text-gray-500 text-xs italic">Pre-filled from previous rental.</p>
        )}

        {/* Insurance type toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setInsType('customer_provided')}
            className={`flex-1 px-3 py-2 text-[10px] uppercase tracking-wider border transition-colors ${
              insType === 'customer_provided'
                ? 'bg-tj-gold text-black border-tj-gold font-bold'
                : 'bg-black border-gray-700 text-gray-400 hover:border-gray-500'
            }`}
          >
            Customer Insurance
          </button>
          <button
            type="button"
            onClick={() => setInsType('dealer_coverage')}
            className={`flex-1 px-3 py-2 text-[10px] uppercase tracking-wider border transition-colors ${
              insType === 'dealer_coverage'
                ? 'bg-tj-gold text-black border-tj-gold font-bold'
                : 'bg-black border-gray-700 text-gray-400 hover:border-gray-500'
            }`}
          >
            Dealer Coverage
          </button>
        </div>

        {insType === 'customer_provided' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">
                  Insurance Company
                </label>
                <input
                  type="text"
                  value={insCompany}
                  onChange={e => setInsCompany(e.target.value)}
                  placeholder="e.g., State Farm, GEICO"
                  className="w-full bg-black border border-gray-700 px-3 py-2.5 text-white text-sm focus:border-tj-gold outline-none transition-colors placeholder-gray-600"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">
                  Policy Number
                </label>
                <input
                  type="text"
                  value={insPolicyNumber}
                  onChange={e => setInsPolicyNumber(e.target.value)}
                  placeholder="Policy #"
                  className="w-full bg-black border border-gray-700 px-3 py-2.5 text-white text-sm focus:border-tj-gold outline-none transition-colors placeholder-gray-600 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">
                  Effective Date
                </label>
                <input
                  type="date"
                  value={insEffectiveDate}
                  onChange={e => setInsEffectiveDate(e.target.value)}
                  className="w-full bg-black border border-gray-700 px-3 py-2.5 text-white text-sm focus:border-tj-gold outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">
                  Expiration Date
                </label>
                <input
                  type="date"
                  value={insExpirationDate}
                  onChange={e => setInsExpirationDate(e.target.value)}
                  className="w-full bg-black border border-gray-700 px-3 py-2.5 text-white text-sm focus:border-tj-gold outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">
                  BI / Person ($)
                </label>
                <input
                  type="number"
                  value={insBiPerPerson}
                  onChange={e => setInsBiPerPerson(e.target.value)}
                  placeholder={`Min: $${TEXAS_MINIMUM_COVERAGE.bodilyInjuryPerPerson.toLocaleString()}`}
                  className="w-full bg-black border border-gray-700 px-3 py-2.5 text-white text-sm focus:border-tj-gold outline-none transition-colors placeholder-gray-600 font-mono"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">
                  BI / Accident ($)
                </label>
                <input
                  type="number"
                  value={insBiPerAccident}
                  onChange={e => setInsBiPerAccident(e.target.value)}
                  placeholder={`Min: $${TEXAS_MINIMUM_COVERAGE.bodilyInjuryPerAccident.toLocaleString()}`}
                  className="w-full bg-black border border-gray-700 px-3 py-2.5 text-white text-sm focus:border-tj-gold outline-none transition-colors placeholder-gray-600 font-mono"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">
                  Property Dmg ($)
                </label>
                <input
                  type="number"
                  value={insPropertyDamage}
                  onChange={e => setInsPropertyDamage(e.target.value)}
                  placeholder={`Min: $${TEXAS_MINIMUM_COVERAGE.propertyDamage.toLocaleString()}`}
                  className="w-full bg-black border border-gray-700 px-3 py-2.5 text-white text-sm focus:border-tj-gold outline-none transition-colors placeholder-gray-600 font-mono"
                  min="0"
                />
              </div>
            </div>

            <p className="text-gray-600 text-[11px]">
              Texas requires minimum {TEXAS_MINIMUM_LABEL} liability coverage.
            </p>
          </>
        ) : (
          <div className="space-y-2">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">
                Dealer Coverage Daily Rate
              </label>
              <div className="relative w-40">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-sm">$</span>
                <input
                  type="number"
                  value={insDealerDailyRate}
                  onChange={e => setInsDealerDailyRate(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-black border border-gray-700 pl-7 pr-3 py-2.5 text-white text-sm focus:border-tj-gold outline-none transition-colors placeholder-gray-600 font-mono"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            {insDealerTotal > 0 && (
              <p className="text-gray-300 text-xs">
                Dealer coverage at ${parseFloat(insDealerDailyRate).toFixed(2)}/day.
                Total: <span className="text-tj-gold font-mono font-bold">${insDealerTotal.toFixed(2)}</span> for {rentalDays} days.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Admin notes */}
      <div>
        <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">
          Admin Notes
        </label>
        <textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Internal notes about this booking..."
          rows={3}
          className="w-full bg-black border border-gray-700 px-4 py-3 text-white text-sm focus:border-tj-gold outline-none transition-colors placeholder-gray-600 resize-none"
        />
      </div>
    </div>
  );

  const renderReviewSection = () => (
    <div className="space-y-4">
      {/* Customer summary */}
      <div className="bg-black/30 border border-white/5 p-4 space-y-2">
        <h4 className="text-[10px] uppercase tracking-widest text-tj-gold flex items-center gap-2">
          <User size={12} /> Customer
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-500">Name:</span>{' '}
            <span className="text-white">{customerName || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500">Phone:</span>{' '}
            <span className="text-white">{customerPhone || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500">DL#:</span>{' '}
            <span className="text-white font-mono">{customerDL || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500">Email:</span>{' '}
            <span className="text-white">{customerEmail || '-'}</span>
          </div>
        </div>
        {!isCustomerValid && (
          <div className="flex items-center gap-2 text-amber-400 text-[10px] mt-1">
            <AlertCircle size={12} /> Missing required customer fields
          </div>
        )}
      </div>

      {/* Vehicle & dates summary */}
      <div className="bg-black/30 border border-white/5 p-4 space-y-2">
        <h4 className="text-[10px] uppercase tracking-widest text-tj-gold flex items-center gap-2">
          <Car size={12} /> Vehicle & Dates
        </h4>
        {selectedVehicle ? (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500">Vehicle:</span>{' '}
              <span className="text-white">{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</span>
            </div>
            <div>
              <span className="text-gray-500">VIN:</span>{' '}
              <span className="text-white font-mono text-[10px]">{selectedVehicle.vin}</span>
            </div>
            <div>
              <span className="text-gray-500">Dates:</span>{' '}
              <span className="text-white">{startDate} to {endDate}</span>
            </div>
            <div>
              <span className="text-gray-500">Duration:</span>{' '}
              <span className="text-white">{rentalDays} days</span>
            </div>
            <div>
              <span className="text-gray-500">Daily Rate:</span>{' '}
              <span className="text-white">${selectedVehicle.dailyRate}/day</span>
            </div>
            <div>
              <span className="text-gray-500">Total Cost:</span>{' '}
              <span className="text-tj-gold font-medium">${totalCost.toFixed(2)}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-amber-400 text-[10px]">
            <AlertCircle size={12} /> No vehicle selected
          </div>
        )}
      </div>

      {/* Terms summary */}
      <div className="bg-black/30 border border-white/5 p-4 space-y-2">
        <h4 className="text-[10px] uppercase tracking-widest text-tj-gold flex items-center gap-2">
          <Shield size={12} /> Agreement Terms
        </h4>
        <div className="text-xs space-y-1">
          <div>
            <span className="text-gray-500">Authorized Drivers:</span>{' '}
            <span className="text-white">{authorizedDrivers.join(', ') || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500">Out-of-State:</span>{' '}
            <span className={outOfStatePermitted ? 'text-green-400' : 'text-red-400'}>
              {outOfStatePermitted ? `Yes (${permittedStates || 'no states listed'})` : 'Not permitted'}
            </span>
          </div>
          {mileageLimit && (
            <div>
              <span className="text-gray-500">Mileage Limit:</span>{' '}
              <span className="text-white">{parseInt(mileageLimit).toLocaleString()} mi</span>
            </div>
          )}
        </div>
      </div>

      {/* Insurance summary */}
      {(insCompany || insPolicyNumber || insType === 'dealer_coverage') && (
        <div className="bg-black/30 border border-white/5 p-4 space-y-2">
          <h4 className="text-[10px] uppercase tracking-widest text-tj-gold flex items-center gap-2">
            <Shield size={12} /> Insurance
          </h4>
          <div className="text-xs space-y-1">
            <div>
              <span className="text-gray-500">Type:</span>{' '}
              <span className="text-white">
                {insType === 'customer_provided' ? 'Customer Provided' : 'Dealer Coverage'}
              </span>
            </div>
            {insType === 'customer_provided' ? (
              <>
                {insCompany && (
                  <div>
                    <span className="text-gray-500">Company:</span>{' '}
                    <span className="text-white">{insCompany}</span>
                  </div>
                )}
                {insPolicyNumber && (
                  <div>
                    <span className="text-gray-500">Policy #:</span>{' '}
                    <span className="text-white font-mono">{insPolicyNumber}</span>
                  </div>
                )}
                {insExpirationDate && (
                  <div>
                    <span className="text-gray-500">Expires:</span>{' '}
                    <span className="text-white">{insExpirationDate}</span>
                  </div>
                )}
              </>
            ) : (
              insDealerTotal > 0 && (
                <div>
                  <span className="text-gray-500">Coverage:</span>{' '}
                  <span className="text-white">${parseFloat(insDealerDailyRate).toFixed(2)}/day = ${insDealerTotal.toFixed(2)}</span>
                </div>
              )
            )}
          </div>
          {/* Soft-block warning */}
          {insHasIssues && insType === 'customer_provided' && (
            <div className="flex items-start gap-2 text-amber-400 text-[10px] mt-2 bg-amber-900/10 border border-amber-800/30 px-3 py-2">
              <AlertTriangle size={12} className="shrink-0 mt-0.5" />
              <span>Insurance issues detected. You can still create the booking and verify later.</span>
            </div>
          )}
        </div>
      )}

      {/* Submit button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!isFormValid || isSubmitting}
        className="w-full bg-tj-gold text-black font-bold py-4 text-xs uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" size={16} />
            {isEditMode ? 'Updating...' : 'Creating...'}
          </>
        ) : (
          <>
            <CheckCircle size={16} />
            {isEditMode ? 'Update Booking' : 'Create Booking'}
          </>
        )}
      </button>

      {!isFormValid && (
        <p className="text-[10px] text-gray-500 text-center">
          Fill in all required fields to {isEditMode ? 'update' : 'create'} the booking
        </p>
      )}
    </div>
  );

  // ================================================================
  // PORTAL RENDER
  // ================================================================

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl max-h-[90vh] bg-[#080808] border border-tj-gold/30 shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-tj-gold/10 border border-tj-gold/30 flex items-center justify-center">
                  <Car className="text-tj-gold" size={20} />
                </div>
                <div>
                  <h2 className="font-display text-xl text-white tracking-wider">
                    {isEditMode ? 'Edit Booking' : 'New Rental Booking'}
                  </h2>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                    {isEditMode ? `Booking ${editBooking?.bookingId}` : 'Create a new rental reservation'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-white p-2 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="bg-red-900/20 border-b border-red-700/50 px-4 py-3 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  <AlertCircle className="text-red-500 flex-shrink-0" size={16} />
                  <span className="text-red-400 text-sm">{errorMessage}</span>
                </div>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Success banner */}
            {successMessage && (
              <div className="bg-green-900/20 border-b border-green-700/50 px-4 py-3 flex items-center gap-3 shrink-0">
                <CheckCircle className="text-green-500 flex-shrink-0" size={16} />
                <span className="text-green-400 text-sm">{successMessage}</span>
              </div>
            )}

            {/* Section navigation */}
            {renderSectionNav()}

            {/* Content */}
            <div className="flex-grow overflow-y-auto p-4 md:p-6">
              {activeSection === 'customer' && renderCustomerSection()}
              {activeSection === 'vehicle' && renderVehicleSection()}
              {activeSection === 'terms' && renderTermsSection()}
              {activeSection === 'review' && renderReviewSection()}
            </div>

            {/* Footer - Next/Prev navigation */}
            <div className="flex items-center justify-between p-4 border-t border-tj-gold/20 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const idx = SECTIONS.findIndex(s => s.key === activeSection);
                  if (idx > 0) setActiveSection(SECTIONS[idx - 1].key);
                }}
                disabled={activeSection === 'customer'}
                className="px-4 py-2 bg-white/5 border border-white/10 text-gray-400 text-xs uppercase tracking-widest hover:text-white hover:border-white/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                {SECTIONS.map((sec, idx) => (
                  <React.Fragment key={sec.key}>
                    <span className={activeSection === sec.key ? 'text-tj-gold' : ''}>
                      {sec.label}
                    </span>
                    {idx < SECTIONS.length - 1 && <ChevronRight size={10} className="text-gray-700" />}
                  </React.Fragment>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  const idx = SECTIONS.findIndex(s => s.key === activeSection);
                  if (idx < SECTIONS.length - 1) setActiveSection(SECTIONS[idx + 1].key);
                }}
                disabled={activeSection === 'review'}
                className="px-4 py-2 bg-tj-gold/10 border border-tj-gold/30 text-tj-gold text-xs uppercase tracking-widest hover:bg-tj-gold hover:text-black transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Next <ChevronRight size={12} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default RentalBookingModal;
