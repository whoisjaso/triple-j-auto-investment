import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronRight, ChevronLeft, X, Check, Camera, Gauge, AlertTriangle,
  CreditCard, DollarSign, Loader2, Clock,
} from 'lucide-react';
import {
  returnBooking,
  calculateLateFee,
  getPaymentsForBooking,
  createPayment,
} from '../../services/rentalService';
import type { RentalBooking, RentalPayment, PaymentMethod } from '../../types';

// ================================================================
// TYPES
// ================================================================
interface Props {
  isOpen: boolean;
  booking: RentalBooking;
  onClose: () => void;
  onReturned: () => void;
}

const STEP_LABELS = ['Condition', 'Mileage', 'Damage', 'Plate Return', 'Late Fees', 'Payment'];

const DAMAGE_ITEMS = [
  'Front bumper', 'Rear bumper', 'Driver side', 'Passenger side',
  'Hood', 'Roof', 'Trunk', 'Windshield', 'Interior', 'Tires',
];

// ================================================================
// WIZARD COMPONENT
// ================================================================
const RentalReturnWizard = ({ isOpen, booking, onClose, onReturned }: Props) => {
  const [step, setStep] = useState(1);

  // Step 1: Condition
  const [conditionNotes, setConditionNotes] = useState('');

  // Step 2: Mileage
  const [mileageIn, setMileageIn] = useState(0);

  // Step 3: Damage
  const [damages, setDamages] = useState<{ area: string; checked: boolean; notes: string }[]>(
    DAMAGE_ITEMS.map(area => ({ area, checked: false, notes: '' }))
  );
  const [damageCharges, setDamageCharges] = useState(0);

  // Step 4: Plate
  const [plateReturned, setPlateReturned] = useState(false);
  const [returningPlate, setReturningPlate] = useState(false);

  // Step 5: Late fees
  const [lateFeeOverride, setLateFeeOverride] = useState<number | null>(null);

  // Step 6: Payment
  const [payments, setPayments] = useState<RentalPayment[]>([]);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [submitting, setSubmitting] = useState(false);
  const [processing, setProcessing] = useState(false);

  // ================================================================
  // COMPUTED
  // ================================================================
  const today = new Date().toISOString().split('T')[0];
  const lateFee = useMemo(() =>
    calculateLateFee(booking.endDate, today, booking.dailyRate, lateFeeOverride),
    [booking.endDate, booking.dailyRate, lateFeeOverride]
  );

  const milesDriven = mileageIn > (booking.mileageOut || 0) ? mileageIn - (booking.mileageOut || 0) : 0;

  const totalOwed = useMemo(() => {
    return booking.totalCost + lateFee.amount + damageCharges;
  }, [booking.totalCost, lateFee.amount, damageCharges]);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = totalOwed - totalPaid;

  // ================================================================
  // HANDLERS
  // ================================================================
  useEffect(() => {
    if (step === 6) loadPayments();
  }, [step]);

  const loadPayments = async () => {
    const data = await getPaymentsForBooking(booking.id);
    setPayments(data);
  };

  const handleReturnPlate = async () => {
    setReturningPlate(true);
    // Mark plate returned — uses the booking's plate assignment
    // In production, the plate assignment ID would be looked up from the booking
    // For now, just mark the UI state and let the returnBooking call handle cleanup
    setPlateReturned(true);
    setReturningPlate(false);
  };

  const handleAddPayment = async () => {
    if (paymentAmount <= 0) return;
    setSubmitting(true);
    await createPayment({
      bookingId: booking.id,
      amount: paymentAmount,
      paymentMethod,
    });
    setPaymentAmount(0);
    await loadPayments();
    setSubmitting(false);
  };

  const handleFinalize = async () => {
    setProcessing(true);
    await returnBooking(booking.id, today, mileageIn);
    onReturned();
    setProcessing(false);
  };

  const canProceed = () => {
    switch (step) {
      case 2: return mileageIn > 0;
      default: return true;
    }
  };

  if (!isOpen) return null;

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
            <h2 className="text-white text-lg font-bold tracking-tight">Return Vehicle</h2>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest">
              Step {step} of 6 — {STEP_LABELS[step - 1]} · Booking #{booking.bookingId}
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
        <div className="p-6 space-y-4 min-h-[280px]">
          {/* STEP 1: Condition Report */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-gray-500 text-[10px] uppercase tracking-widest">Post-Rental Condition Notes</p>
              <textarea
                value={conditionNotes}
                onChange={e => setConditionNotes(e.target.value)}
                rows={5}
                placeholder="Describe the overall condition of the vehicle on return..."
                className="w-full bg-black border border-white/[0.08] text-white text-sm px-3 py-2 focus:border-tj-gold/50 focus:outline-none resize-none"
              />
              <p className="text-gray-600 text-[10px]">Tip: Take photos of all sides and interior before continuing</p>
            </div>
          )}

          {/* STEP 2: Mileage */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-black border border-white/[0.06] p-3">
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest">Mileage Out</p>
                  <p className="text-white text-lg font-mono">{(booking.mileageOut || 0).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 block">Mileage In</label>
                  <input
                    type="number"
                    value={mileageIn || ''}
                    onChange={e => setMileageIn(Number(e.target.value))}
                    className="w-full bg-black border border-white/[0.08] text-white text-lg px-3 py-2 focus:border-tj-gold/50 focus:outline-none font-mono"
                  />
                </div>
                <div className="bg-black border border-tj-gold/20 p-3">
                  <p className="text-tj-gold text-[10px] uppercase tracking-widest">Miles Driven</p>
                  <p className="text-tj-gold text-lg font-mono">{milesDriven.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Damage Assessment */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-gray-500 text-[10px] uppercase tracking-widest">Flag any new damage</p>
              <div className="grid grid-cols-2 gap-2">
                {damages.map((d, i) => (
                  <div key={d.area} className={`border p-3 transition-all ${d.checked ? 'border-red-500/30 bg-red-500/5' : 'border-white/[0.06]'}`}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <button
                        onClick={() => {
                          const updated = [...damages];
                          updated[i] = { ...updated[i], checked: !updated[i].checked };
                          setDamages(updated);
                        }}
                        className={`w-4 h-4 border flex items-center justify-center transition-all ${
                          d.checked ? 'bg-red-500/20 border-red-500 text-red-400' : 'border-white/20 text-transparent'
                        }`}
                      >
                        <Check size={10} />
                      </button>
                      <span className={`text-xs ${d.checked ? 'text-white' : 'text-gray-400'}`}>{d.area}</span>
                    </label>
                    {d.checked && (
                      <input
                        type="text"
                        placeholder="Describe damage..."
                        value={d.notes}
                        onChange={e => {
                          const updated = [...damages];
                          updated[i] = { ...updated[i], notes: e.target.value };
                          setDamages(updated);
                        }}
                        className="mt-2 w-full bg-black border border-white/[0.06] text-white text-xs px-2 py-1 focus:outline-none"
                      />
                    )}
                  </div>
                ))}
              </div>
              {damages.some(d => d.checked) && (
                <div>
                  <label className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 block">Damage Charges ($)</label>
                  <input
                    type="number"
                    value={damageCharges || ''}
                    onChange={e => setDamageCharges(Number(e.target.value))}
                    className="w-full bg-black border border-red-500/20 text-white text-sm px-3 py-2 focus:border-red-500/50 focus:outline-none font-mono"
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Plate Return */}
          {step === 4 && (
            <div className="space-y-4 text-center py-8">
              {plateReturned ? (
                <div className="space-y-3">
                  <Check size={48} className="text-green-400 mx-auto" />
                  <p className="text-green-400 text-sm font-bold">Plate Collected & Returned</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <CreditCard size={48} className="text-gray-600 mx-auto" />
                  <p className="text-gray-400 text-sm">Collect the dealer plate from the customer</p>
                  <button
                    onClick={handleReturnPlate}
                    disabled={returningPlate}
                    className="mx-auto flex items-center gap-2 bg-tj-gold text-black px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-tj-gold/90 transition-all disabled:opacity-50"
                  >
                    {returningPlate ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    Mark Plate Returned
                  </button>
                  <button
                    onClick={() => setStep(5)}
                    className="text-gray-500 hover:text-white text-xs transition-colors"
                  >
                    Skip (no plate assigned)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Late Fees */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-black border border-white/[0.06] p-3">
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest">Due Date</p>
                  <p className="text-white text-sm font-mono">{booking.endDate}</p>
                </div>
                <div className="bg-black border border-white/[0.06] p-3">
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest">Return Date</p>
                  <p className="text-white text-sm font-mono">{today}</p>
                </div>
                <div className={`bg-black border p-3 ${lateFee.days > 0 ? 'border-red-500/30' : 'border-green-500/30'}`}>
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest">Late Days</p>
                  <p className={`text-lg font-mono ${lateFee.days > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {lateFee.days}
                  </p>
                </div>
              </div>

              <div className="bg-black border border-white/[0.06] p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest">Late Fee (${booking.dailyRate}/day)</p>
                  <p className="text-red-400 text-lg font-mono">${lateFee.amount.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 block">Override Amount (optional)</label>
                  <input
                    type="number"
                    value={lateFeeOverride ?? ''}
                    onChange={e => setLateFeeOverride(e.target.value === '' ? null : Number(e.target.value))}
                    placeholder="Leave blank for auto-calculated"
                    className="w-full bg-black border border-white/[0.08] text-white text-sm px-3 py-2 focus:border-tj-gold/50 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Payment Summary */}
          {step === 6 && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-black border border-white/[0.06] divide-y divide-white/[0.06]">
                <div className="flex justify-between p-3">
                  <span className="text-gray-500 text-xs">Rental Total</span>
                  <span className="text-white text-sm font-mono">${booking.totalCost.toLocaleString()}</span>
                </div>
                {lateFee.amount > 0 && (
                  <div className="flex justify-between p-3">
                    <span className="text-gray-500 text-xs">Late Fee ({lateFee.days} days)</span>
                    <span className="text-red-400 text-sm font-mono">${lateFee.amount.toLocaleString()}</span>
                  </div>
                )}
                {damageCharges > 0 && (
                  <div className="flex justify-between p-3">
                    <span className="text-gray-500 text-xs">Damage Charges</span>
                    <span className="text-red-400 text-sm font-mono">${damageCharges.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between p-3 bg-white/[0.02]">
                  <span className="text-white text-sm font-bold">Total Owed</span>
                  <span className="text-tj-gold text-lg font-mono font-bold">${totalOwed.toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-gray-500 text-xs">Payments Received</span>
                  <span className="text-green-400 text-sm font-mono">${totalPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-3 bg-white/[0.02]">
                  <span className="text-white text-sm font-bold">Balance</span>
                  <span className={`text-lg font-mono font-bold ${balance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    ${Math.abs(balance).toLocaleString()}
                    {balance < 0 && ' (overpaid)'}
                  </span>
                </div>
              </div>

              {/* Payment History */}
              {payments.length > 0 && (
                <div className="border border-white/[0.06] divide-y divide-white/[0.06]">
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest p-3">Payment History</p>
                  {payments.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 text-xs">
                      <span className="text-gray-500 font-mono">{new Date(p.paymentDate).toLocaleDateString()}</span>
                      <span className="text-gray-400 uppercase tracking-widest">{p.paymentMethod}</span>
                      <span className="text-green-400 font-mono">${p.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Payment */}
              {balance > 0 && (
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={paymentAmount || ''}
                    onChange={e => setPaymentAmount(Number(e.target.value))}
                    placeholder="Amount"
                    className="flex-1 bg-black border border-white/[0.08] text-white text-sm px-3 py-2 focus:border-tj-gold/50 focus:outline-none font-mono"
                  />
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="bg-black border border-white/[0.08] text-white text-sm px-3 py-2 focus:border-tj-gold/50 focus:outline-none"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="zelle">Zelle</option>
                    <option value="cashapp">CashApp</option>
                  </select>
                  <button
                    onClick={handleAddPayment}
                    disabled={submitting || paymentAmount <= 0}
                    className="px-4 bg-green-500 text-black text-xs font-bold uppercase tracking-widest disabled:opacity-30"
                  >
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <DollarSign size={14} />}
                  </button>
                </div>
              )}
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

          {step < 6 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-2 bg-tj-gold text-black px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-tj-gold/90 transition-all disabled:opacity-30"
            >
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleFinalize}
              disabled={processing}
              className="flex items-center gap-2 bg-green-500 text-black px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-green-400 transition-all disabled:opacity-50"
            >
              {processing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {processing ? 'Processing...' : 'Complete Return'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default RentalReturnWizard;
