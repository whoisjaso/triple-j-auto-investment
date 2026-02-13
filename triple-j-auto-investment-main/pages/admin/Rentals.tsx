/**
 * Admin Rental Management Page
 *
 * Phase 06-06: Complete rental management hub with all modals integrated.
 *
 * Features:
 * - Calendar: Monthly booking visualization via RentalCalendar
 * - Active Rentals: Accordion-style booking detail with payments & late fees
 * - Fleet: Vehicle listing type controls and rental rate management
 * - Payment recording with mixed methods and running balance
 * - Late fee auto-calculation with admin override/waive
 * - Customer running total across all rentals
 * - Booking modal, agreement modal, condition report integration
 *
 * Requirements addressed:
 * - RENT-01: Dual inventory (sale_only / rental_only / both)
 * - RENT-02: Availability calendar with color-coded bookings
 * - RENT-04: Rental tracking (who has what car, when due back)
 * - RENT-06: Deposits and payments tracked per booking
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useStore } from '../../context/Store';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Car,
  ClipboardCheck,
  Key,
  FileText,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Calendar,
  Users,
  Truck,
  AlertTriangle,
  Clock,
  CheckCircle,
  DollarSign,
  ArrowRight,
  Loader2,
  X,
  Search,
  ChevronDown,
  ChevronUp,
  Trash2,
  PenTool,
  ClipboardList,
  Ban,
} from 'lucide-react';
import { BillOfSaleModal } from '../../components/admin/BillOfSaleModal';
import RentalCalendar from '../../components/admin/RentalCalendar';
import { RentalBookingModal } from '../../components/admin/RentalBookingModal';
import { RentalAgreementModal } from '../../components/admin/RentalAgreementModal';
import { RentalConditionReport } from '../../components/admin/RentalConditionReport';
import {
  getBookingsForMonth,
  getActiveBookings,
  getPaymentsForBooking,
  getConditionReports,
  returnBooking,
  cancelBooking,
  createPayment,
  deletePayment,
  updateBooking,
  updateVehicleListingType,
  updateVehicleRentalRates,
  calculateLateFee,
} from '../../services/rentalService';
import {
  RentalBooking,
  RentalBookingStatus,
  RentalPayment,
  RentalConditionReport as RentalConditionReportType,
  ListingType,
  PaymentMethod,
  Vehicle,
  PAYMENT_METHOD_LABELS,
} from '../../types';

// ================================================================
// ADMIN HEADER (duplicated per research guidance - pitfall #7)
// ================================================================

const AdminHeader = () => {
  const { logout, vehicles } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [showDocModal, setShowDocModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/inventory', label: 'Inventory', icon: Car },
    { path: '/admin/registrations', label: 'Registrations', icon: ClipboardCheck },
    { path: '/admin/rentals', label: 'Rentals', icon: Key },
  ];

  return (
    <>
      <header className="bg-black backdrop-blur-md border-b border-tj-gold/30 sticky top-0 z-[100] shadow-lg">
        <div className="max-w-[1800px] mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link to="/" className="flex items-center group">
              <img
                src="/GoldTripleJLogo.png"
                alt="Triple J Auto Investment"
                className="w-12 h-12 md:w-14 md:h-14 object-contain transition-transform group-hover:scale-110 drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]"
              />
            </Link>

            <nav className="hidden md:flex items-center gap-2">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-5 py-2.5 text-[11px] uppercase tracking-widest font-bold transition-all border ${
                    location.pathname === item.path
                      ? 'bg-tj-gold text-black border-tj-gold'
                      : 'text-gray-400 hover:text-white border-transparent hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <item.icon size={14} />
                  {item.label}
                </Link>
              ))}

              <button
                onClick={() => setShowDocModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 text-[11px] uppercase tracking-widest font-bold text-gray-400 hover:text-white border border-transparent hover:border-white/20 hover:bg-white/5 transition-all"
              >
                <FileText size={14} />
                Documents
              </button>

              <div className="h-6 w-px bg-gray-700 mx-2" />

              <button
                onClick={() => { logout(); navigate('/'); }}
                className="flex items-center gap-2 px-4 py-2.5 text-[11px] uppercase tracking-widest font-bold text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-all"
              >
                <LogOut size={14} />
                Logout
              </button>
            </nav>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white hover:text-tj-gold transition-colors"
            >
              <Menu size={24} />
            </button>
          </div>

          {mobileMenuOpen && (
            <nav className="md:hidden border-t border-white/10 py-4 space-y-2">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm uppercase tracking-widest font-bold transition-all ${
                    location.pathname === item.path
                      ? 'bg-tj-gold/10 text-tj-gold border-l-2 border-tj-gold'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              ))}

              <button
                onClick={() => { setShowDocModal(true); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm uppercase tracking-widest font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <FileText size={18} />
                Documents
              </button>

              <div className="border-t border-white/10 mt-2 pt-2">
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm uppercase tracking-widest font-bold text-red-400 hover:bg-red-900/20 transition-all"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </nav>
          )}
        </div>
      </header>

      <BillOfSaleModal
        isOpen={showDocModal}
        onClose={() => setShowDocModal(false)}
        vehicles={vehicles}
      />
    </>
  );
};

// ================================================================
// TAB TYPES
// ================================================================

type RentalTab = 'calendar' | 'active' | 'fleet';

// ================================================================
// FORMAT HELPERS
// ================================================================

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [yr, mo, da] = parts;
  return `${mo}/${da}/${yr}`;
};

// ================================================================
// BOOKING DETAIL COMPONENT (inline expansion)
// ================================================================

interface BookingDetailProps {
  booking: RentalBooking;
  allBookings: RentalBooking[];
  vehicles: Vehicle[];
  onRefresh: () => Promise<void>;
  onOpenAgreement: (booking: RentalBooking) => void;
  onClose: () => void;
}

const BookingDetail: React.FC<BookingDetailProps> = ({
  booking,
  allBookings,
  vehicles,
  onRefresh,
  onOpenAgreement,
  onClose,
}) => {
  // Payment state
  const [payments, setPayments] = useState<RentalPayment[]>(booking.payments || []);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);

  // Late fee override state
  const [showLateFeeOverride, setShowLateFeeOverride] = useState(false);
  const [overrideAmount, setOverrideAmount] = useState('');
  const [overrideNotes, setOverrideNotes] = useState('');
  const [savingOverride, setSavingOverride] = useState(false);

  // Condition report state
  const [showCheckoutReport, setShowCheckoutReport] = useState(false);
  const [showReturnReport, setShowReturnReport] = useState(false);
  const [conditionReports, setConditionReports] = useState<RentalConditionReportType[]>([]);

  // Return flow state
  const [showReturnFlow, setShowReturnFlow] = useState(false);
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnMileage, setReturnMileage] = useState('');
  const [processingReturn, setProcessingReturn] = useState(false);

  // Action loading
  const [actionLoading, setActionLoading] = useState(false);

  // Load payments and condition reports
  useEffect(() => {
    const loadData = async () => {
      setLoadingPayments(true);
      try {
        const [paymentsData, reportsData] = await Promise.all([
          getPaymentsForBooking(booking.id),
          getConditionReports(booking.id),
        ]);
        setPayments(paymentsData);
        setConditionReports(reportsData);
      } catch (err) {
        console.error('Error loading booking details:', err);
      } finally {
        setLoadingPayments(false);
      }
    };
    loadData();
  }, [booking.id]);

  // ---- Late fee calculation ----
  const lateFee = useMemo(() => {
    const isLate = booking.status === 'overdue' || (
      booking.status === 'returned' && booking.actualReturnDate &&
      new Date(booking.actualReturnDate) > new Date(booking.endDate)
    );
    if (!isLate) return null;
    return calculateLateFee(
      booking.endDate,
      booking.actualReturnDate || null,
      booking.dailyRate,
      booking.lateFeeOverride ?? null
    );
  }, [booking]);

  // ---- Balance calculations ----
  const totalPayments = useMemo(() =>
    payments.reduce((sum, p) => sum + p.amount, 0),
  [payments]);

  const lateFeeAmount = lateFee ? lateFee.amount : 0;
  const grandTotal = booking.totalCost + lateFeeAmount;
  const remainingBalance = grandTotal - totalPayments;

  // ---- Customer running total ----
  const customerTotals = useMemo(() => {
    if (!booking.customerId) return null;
    const customerBookings = allBookings.filter(
      b => b.customerId === booking.customerId && b.status !== 'cancelled'
    );
    let totalCost = 0;
    let totalPaid = 0;
    customerBookings.forEach(b => {
      totalCost += b.totalCost;
      // Calculate late fees for each booking
      const isLate = b.status === 'overdue' || (
        b.status === 'returned' && b.actualReturnDate &&
        new Date(b.actualReturnDate) > new Date(b.endDate)
      );
      if (isLate) {
        const lf = calculateLateFee(
          b.endDate,
          b.actualReturnDate || null,
          b.dailyRate,
          b.lateFeeOverride ?? null
        );
        totalCost += lf.amount;
      }
      // Sum payments from joined data
      if (b.payments) {
        totalPaid += b.payments.reduce((s, p) => s + p.amount, 0);
      }
    });
    return {
      totalCost,
      totalPaid,
      outstanding: totalCost - totalPaid,
      bookingCount: customerBookings.length,
    };
  }, [allBookings, booking.customerId]);

  // ---- Vehicle from store ----
  const vehicle = useMemo(() => {
    return booking.vehicle || vehicles.find(v => v.id === booking.vehicleId);
  }, [booking, vehicles]);

  const vehicleName = vehicle
    ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
    : 'Unknown Vehicle';

  // Pre-fill payment amount with remaining balance
  useEffect(() => {
    if (remainingBalance > 0 && !paymentAmount) {
      setPaymentAmount(remainingBalance.toFixed(2));
    }
  }, [remainingBalance]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Existing condition reports ----
  const checkoutReport = conditionReports.find(r => r.reportType === 'checkout');
  const returnReport = conditionReports.find(r => r.reportType === 'return');

  // ---- Handlers ----

  const handleRecordPayment = async () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    setRecordingPayment(true);
    try {
      const result = await createPayment({
        bookingId: booking.id,
        amount,
        paymentMethod,
        notes: paymentNotes.trim() || undefined,
      });
      if (result) {
        setPayments(prev => [result, ...prev]);
        setPaymentAmount('');
        setPaymentNotes('');
        await onRefresh();
      }
    } catch (err) {
      console.error('Error recording payment:', err);
    } finally {
      setRecordingPayment(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Delete this payment?')) return;
    setDeletingPaymentId(paymentId);
    try {
      const success = await deletePayment(paymentId);
      if (success) {
        setPayments(prev => prev.filter(p => p.id !== paymentId));
        await onRefresh();
      }
    } catch (err) {
      console.error('Error deleting payment:', err);
    } finally {
      setDeletingPaymentId(null);
    }
  };

  const handleLateFeeOverride = async () => {
    const amount = parseFloat(overrideAmount);
    if (isNaN(amount) || amount < 0) return;

    setSavingOverride(true);
    try {
      const success = await updateBooking(booking.id, {
        lateFeeOverride: amount,
        lateFeeNotes: overrideNotes.trim() || undefined,
      });
      if (success) {
        setShowLateFeeOverride(false);
        await onRefresh();
      }
    } catch (err) {
      console.error('Error saving late fee override:', err);
    } finally {
      setSavingOverride(false);
    }
  };

  const handleWaiveLateFee = async () => {
    setSavingOverride(true);
    try {
      const success = await updateBooking(booking.id, {
        lateFeeOverride: 0,
        lateFeeNotes: 'Waived by admin',
      });
      if (success) {
        await onRefresh();
      }
    } catch (err) {
      console.error('Error waiving late fee:', err);
    } finally {
      setSavingOverride(false);
    }
  };

  const handleResetLateFee = async () => {
    setSavingOverride(true);
    try {
      // Set override to undefined (null in DB) to revert to auto-calculate
      const { error } = await (await import('../../supabase/config')).supabase
        .from('rental_bookings')
        .update({ late_fee_override: null, late_fee_notes: null, updated_at: new Date().toISOString() })
        .eq('id', booking.id);
      if (!error) {
        await onRefresh();
      }
    } catch (err) {
      console.error('Error resetting late fee:', err);
    } finally {
      setSavingOverride(false);
    }
  };

  const handleProcessReturn = async () => {
    if (!returnMileage) return;
    setProcessingReturn(true);
    try {
      const success = await returnBooking(
        booking.id,
        returnDate,
        parseInt(returnMileage, 10)
      );
      if (success) {
        setShowReturnFlow(false);
        await onRefresh();
        // Prompt for return condition report if none exists
        if (!returnReport) {
          setShowReturnReport(true);
        }
      }
    } catch (err) {
      console.error('Error processing return:', err);
    } finally {
      setProcessingReturn(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!confirm('Are you sure you want to cancel this booking? This cannot be undone.')) return;
    setActionLoading(true);
    try {
      const success = await cancelBooking(booking.id);
      if (success) {
        await onRefresh();
        onClose();
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConditionReportComplete = async () => {
    setShowCheckoutReport(false);
    setShowReturnReport(false);
    // Reload condition reports
    const reports = await getConditionReports(booking.id);
    setConditionReports(reports);
    await onRefresh();
  };

  // Calculate rental duration
  const rentalDays = useMemo(() => {
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  }, [booking.startDate, booking.endDate]);

  return (
    <div className="bg-[#0a0a0a] border border-tj-gold/10 border-t-0">
      <div className="p-4 md:p-6 space-y-5">
        {/* ============ BOOKING HEADER ============ */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Vehicle thumbnail */}
            {vehicle?.imageUrl && (
              <div className="w-20 h-14 border border-gray-800 overflow-hidden shrink-0 hidden md:block">
                <img src={vehicle.imageUrl} alt={vehicleName} className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-tj-gold font-mono text-sm font-bold">{booking.bookingId}</span>
                <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider border ${
                  booking.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                  : booking.status === 'overdue' ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse'
                  : booking.status === 'reserved' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                  : booking.status === 'returned' ? 'bg-gray-500/20 text-gray-400 border-gray-500/50'
                  : 'bg-gray-500/20 text-gray-400 border-gray-500/50'
                }`}>
                  {booking.status}
                </span>
              </div>
              <p className="text-white text-sm">{vehicleName}</p>
              <p className="text-gray-500 text-xs flex items-center gap-1">
                <Users size={12} />
                {booking.customer?.fullName || 'Unknown Customer'}
                {booking.customer?.phone && <span className="ml-1 text-gray-600">| {booking.customer.phone}</span>}
                {booking.customer?.driversLicenseNumber && (
                  <span className="ml-1 text-gray-600">| DL: {booking.customer.driversLicenseNumber}</span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="self-start p-1 text-gray-500 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ============ DATES & COST ============ */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-0.5">Start</p>
            <p className="text-white text-sm">{formatDate(booking.startDate)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-0.5">End</p>
            <p className="text-white text-sm">{formatDate(booking.endDate)}</p>
          </div>
          {booking.actualReturnDate && (
            <div>
              <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-0.5">Returned</p>
              <p className="text-white text-sm">{formatDate(booking.actualReturnDate)}</p>
            </div>
          )}
          <div>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-0.5">Duration</p>
            <p className="text-white text-sm">{rentalDays} day{rentalDays !== 1 ? 's' : ''}</p>
          </div>
          <div>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-0.5">Daily Rate</p>
            <p className="text-white text-sm">{formatCurrency(booking.dailyRate)}/day</p>
          </div>
          {booking.weeklyRate && (
            <div>
              <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-0.5">Weekly Rate</p>
              <p className="text-white text-sm">{formatCurrency(booking.weeklyRate)}/wk</p>
            </div>
          )}
        </div>

        {/* ============ LATE FEE MANAGEMENT ============ */}
        {lateFee && (
          <div className={`border p-4 space-y-3 ${
            lateFee.amount === 0 && lateFee.isOverridden
              ? 'border-gray-700 bg-gray-900/30'
              : 'border-red-800/50 bg-red-900/10'
          }`}>
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] uppercase tracking-widest text-red-400 flex items-center gap-2">
                <AlertTriangle size={12} /> Late Fee
              </h4>
              <div className="flex items-center gap-2">
                {!lateFee.isOverridden && (
                  <>
                    <button
                      onClick={() => {
                        setOverrideAmount('');
                        setOverrideNotes('');
                        setShowLateFeeOverride(true);
                      }}
                      disabled={savingOverride}
                      className="px-2 py-1 text-[10px] uppercase tracking-wider border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
                    >
                      Override
                    </button>
                    <button
                      onClick={handleWaiveLateFee}
                      disabled={savingOverride}
                      className="px-2 py-1 text-[10px] uppercase tracking-wider border border-amber-700/50 text-amber-400 hover:bg-amber-900/20 transition-colors"
                    >
                      Waive
                    </button>
                  </>
                )}
                {lateFee.isOverridden && (
                  <button
                    onClick={handleResetLateFee}
                    disabled={savingOverride}
                    className="px-2 py-1 text-[10px] uppercase tracking-wider border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
                  >
                    Reset to Auto
                  </button>
                )}
              </div>
            </div>

            {lateFee.isOverridden ? (
              <div className="text-sm">
                {lateFee.amount === 0 ? (
                  <p className="text-gray-500">Late fee <span className="text-amber-400 font-medium">waived</span></p>
                ) : (
                  <p className="text-white">
                    Overridden: <span className="text-red-400 font-mono font-bold">{formatCurrency(lateFee.amount)}</span>
                  </p>
                )}
                {booking.lateFeeNotes && (
                  <p className="text-gray-500 text-xs mt-1">Notes: {booking.lateFeeNotes}</p>
                )}
                <p className="text-gray-600 text-xs mt-1">
                  ({lateFee.days} day{lateFee.days !== 1 ? 's' : ''} overdue)
                </p>
              </div>
            ) : (
              <div className="text-sm">
                <p className="text-white">
                  <span className="text-gray-400">{lateFee.days} day{lateFee.days !== 1 ? 's' : ''} overdue</span>
                  {' x '}
                  <span className="text-gray-400">{formatCurrency(booking.dailyRate)}/day</span>
                  {' = '}
                  <span className="text-red-400 font-mono font-bold">{formatCurrency(lateFee.amount)}</span>
                </p>
              </div>
            )}

            {/* Override form */}
            {showLateFeeOverride && (
              <div className="flex items-end gap-3 pt-2 border-t border-red-800/30">
                <div className="flex-1">
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Override Amount</label>
                  <div className="relative">
                    <DollarSign size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-600" />
                    <input
                      type="number"
                      value={overrideAmount}
                      onChange={e => setOverrideAmount(e.target.value)}
                      className="w-full bg-black border border-gray-700 pl-6 pr-3 py-2 text-white text-sm focus:outline-none focus:border-tj-gold"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Notes</label>
                  <input
                    type="text"
                    value={overrideNotes}
                    onChange={e => setOverrideNotes(e.target.value)}
                    className="w-full bg-black border border-gray-700 px-3 py-2 text-white text-sm focus:outline-none focus:border-tj-gold"
                    placeholder="Reason for override"
                  />
                </div>
                <button
                  onClick={handleLateFeeOverride}
                  disabled={savingOverride}
                  className="px-3 py-2 bg-tj-gold text-black text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors disabled:opacity-50"
                >
                  {savingOverride ? <Loader2 className="animate-spin" size={14} /> : 'Save'}
                </button>
                <button
                  onClick={() => setShowLateFeeOverride(false)}
                  className="px-3 py-2 border border-gray-700 text-gray-400 text-xs hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============ PAYMENTS SECTION ============ */}
        <div className="space-y-3">
          <h4 className="text-[10px] uppercase tracking-widest text-tj-gold flex items-center gap-2">
            <DollarSign size={12} /> Payments
          </h4>

          {/* Balance summary bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="bg-black/50 border border-tj-gold/10 p-3">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-0.5">Total Cost</p>
              <p className="text-white font-mono text-sm">{formatCurrency(booking.totalCost)}</p>
            </div>
            <div className="bg-black/50 border border-tj-gold/10 p-3">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-0.5">Late Fees</p>
              <p className={`font-mono text-sm ${
                lateFee && lateFee.isOverridden && lateFee.amount === 0 ? 'text-gray-500' : lateFee ? 'text-red-400' : 'text-gray-600'
              }`}>
                {lateFee ? (lateFee.isOverridden && lateFee.amount === 0 ? 'Waived' : formatCurrency(lateFee.amount)) : '$0.00'}
              </p>
            </div>
            <div className="bg-black/50 border border-tj-gold/10 p-3">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-0.5">Payments</p>
              <p className="text-emerald-400 font-mono text-sm">{formatCurrency(totalPayments)}</p>
            </div>
            <div className={`border p-3 ${
              remainingBalance <= 0 ? 'bg-emerald-900/10 border-emerald-800/50' : 'bg-red-900/10 border-red-800/50'
            }`}>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-0.5">Remaining</p>
              <p className={`font-mono text-sm font-bold ${remainingBalance <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {remainingBalance <= 0 ? 'PAID' : formatCurrency(remainingBalance)}
              </p>
            </div>
          </div>

          {/* Payment history table */}
          {loadingPayments ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="animate-spin text-tj-gold" size={16} />
            </div>
          ) : payments.length > 0 ? (
            <div className="border border-gray-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-black/50 text-[10px] uppercase tracking-widest text-gray-500">
                    <th className="text-left px-3 py-2">Date</th>
                    <th className="text-left px-3 py-2">Amount</th>
                    <th className="text-left px-3 py-2">Method</th>
                    <th className="text-left px-3 py-2 hidden md:table-cell">Notes</th>
                    <th className="text-right px-3 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(payment => (
                    <tr key={payment.id} className="border-t border-gray-800/50 hover:bg-white/5">
                      <td className="px-3 py-2 text-gray-300">{formatDate(payment.paymentDate)}</td>
                      <td className="px-3 py-2 text-emerald-400 font-mono">{formatCurrency(payment.amount)}</td>
                      <td className="px-3 py-2 text-white">
                        <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-[10px] uppercase tracking-wider">
                          {PAYMENT_METHOD_LABELS[payment.paymentMethod]}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-500 hidden md:table-cell">{payment.notes || '-'}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => handleDeletePayment(payment.id)}
                          disabled={deletingPaymentId === payment.id}
                          className="p-1 text-gray-600 hover:text-red-400 transition-colors disabled:opacity-50"
                          title="Delete payment"
                        >
                          {deletingPaymentId === payment.id ? (
                            <Loader2 className="animate-spin" size={12} />
                          ) : (
                            <Trash2 size={12} />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600 text-xs text-center py-3">No payments recorded yet</p>
          )}

          {/* Record payment form (inline) */}
          {booking.status !== 'cancelled' && (
            <div className="bg-black/30 border border-tj-gold/10 p-4 space-y-3">
              <h5 className="text-[10px] uppercase tracking-widest text-gray-500">Record Payment</h5>
              <div className="flex flex-col md:flex-row items-end gap-3">
                <div className="w-full md:w-32">
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Amount</label>
                  <div className="relative">
                    <DollarSign size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-600" />
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(e.target.value)}
                      className="w-full bg-black border border-gray-700 pl-6 pr-3 py-2 text-white text-sm focus:outline-none focus:border-tj-gold"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="w-full md:w-auto">
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Method</label>
                  <div className="flex gap-1">
                    {(Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][]).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setPaymentMethod(key)}
                        className={`px-3 py-2 text-[10px] uppercase tracking-wider border transition-colors ${
                          paymentMethod === key
                            ? 'bg-tj-gold text-black border-tj-gold font-bold'
                            : 'bg-black border-gray-700 text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 w-full md:w-auto">
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Notes</label>
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={e => setPaymentNotes(e.target.value)}
                    className="w-full bg-black border border-gray-700 px-3 py-2 text-white text-sm focus:outline-none focus:border-tj-gold"
                    placeholder="Optional"
                  />
                </div>

                <button
                  onClick={handleRecordPayment}
                  disabled={recordingPayment || !paymentAmount || parseFloat(paymentAmount) <= 0}
                  className="px-4 py-2 bg-tj-gold text-black text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                >
                  {recordingPayment ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <DollarSign size={14} />
                  )}
                  Record Payment
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ============ CUSTOMER RUNNING TOTAL ============ */}
        {customerTotals && customerTotals.bookingCount > 1 && (
          <div className="bg-black/30 border border-tj-gold/10 p-4">
            <h4 className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-2">
              <Users size={12} /> Customer Total ({booking.customer?.fullName || 'Unknown'})
            </h4>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <p className="text-gray-500">Total across {customerTotals.bookingCount} rentals</p>
                <p className="text-white font-mono">{formatCurrency(customerTotals.totalCost)}</p>
              </div>
              <div>
                <p className="text-gray-500">Total paid</p>
                <p className="text-emerald-400 font-mono">{formatCurrency(customerTotals.totalPaid)}</p>
              </div>
              <div>
                <p className="text-gray-500">Outstanding</p>
                <p className={`font-mono font-bold ${customerTotals.outstanding <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {customerTotals.outstanding <= 0 ? 'CLEAR' : formatCurrency(customerTotals.outstanding)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============ CONDITION REPORTS (inline) ============ */}
        {showCheckoutReport && (
          <div className="border border-blue-800/30 p-4">
            <RentalConditionReport
              bookingId={booking.id}
              reportType="checkout"
              vehicleName={vehicleName}
              onComplete={handleConditionReportComplete}
              existingReport={checkoutReport}
            />
          </div>
        )}

        {showReturnReport && (
          <div className="border border-amber-800/30 p-4">
            <RentalConditionReport
              bookingId={booking.id}
              reportType="return"
              vehicleName={vehicleName}
              onComplete={handleConditionReportComplete}
              existingReport={returnReport}
            />
          </div>
        )}

        {/* ============ RETURN FLOW ============ */}
        {showReturnFlow && (booking.status === 'active' || booking.status === 'overdue') && (
          <div className="border border-tj-gold/30 bg-tj-gold/5 p-4 space-y-3">
            <h4 className="text-[10px] uppercase tracking-widest text-tj-gold flex items-center gap-2">
              <CheckCircle size={12} /> Process Return
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Return Date</label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={e => setReturnDate(e.target.value)}
                  className="w-full bg-black border border-gray-700 px-3 py-2 text-white text-sm focus:outline-none focus:border-tj-gold"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">
                  Mileage In <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={returnMileage}
                  onChange={e => setReturnMileage(e.target.value)}
                  placeholder="Current odometer"
                  className="w-full bg-black border border-gray-700 px-3 py-2 text-white text-sm focus:outline-none focus:border-tj-gold font-mono"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleProcessReturn}
                disabled={processingReturn || !returnMileage}
                className="px-4 py-2 bg-tj-gold text-black text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {processingReturn ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle size={14} />}
                Confirm Return
              </button>
              <button
                onClick={() => setShowReturnFlow(false)}
                className="px-4 py-2 border border-gray-700 text-gray-400 text-xs uppercase tracking-wider hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ============ ACTIONS BAR ============ */}
        <div className="border-t border-gray-800 pt-4 flex flex-wrap gap-2">
          <button
            onClick={() => onOpenAgreement(booking)}
            className="px-3 py-2 border border-gray-700 text-gray-300 text-xs font-bold uppercase tracking-wider hover:border-tj-gold hover:text-tj-gold transition-colors flex items-center gap-2"
          >
            <PenTool size={12} /> Generate Agreement
          </button>

          <button
            onClick={() => setShowCheckoutReport(!showCheckoutReport)}
            className={`px-3 py-2 border text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors ${
              showCheckoutReport
                ? 'border-blue-500/50 text-blue-400 bg-blue-900/20'
                : checkoutReport
                ? 'border-green-700/50 text-green-400 hover:bg-green-900/10'
                : 'border-gray-700 text-gray-300 hover:border-blue-500/50 hover:text-blue-400'
            }`}
          >
            <ClipboardList size={12} /> {checkoutReport ? 'View Checkout Report' : 'Checkout Report'}
          </button>

          <button
            onClick={() => setShowReturnReport(!showReturnReport)}
            className={`px-3 py-2 border text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors ${
              showReturnReport
                ? 'border-amber-500/50 text-amber-400 bg-amber-900/20'
                : returnReport
                ? 'border-green-700/50 text-green-400 hover:bg-green-900/10'
                : 'border-gray-700 text-gray-300 hover:border-amber-500/50 hover:text-amber-400'
            }`}
          >
            <ClipboardList size={12} /> {returnReport ? 'View Return Report' : 'Return Report'}
          </button>

          {(booking.status === 'active' || booking.status === 'overdue') && (
            <button
              onClick={() => setShowReturnFlow(!showReturnFlow)}
              className={`px-3 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors ${
                showReturnFlow
                  ? 'bg-tj-gold text-black'
                  : 'bg-tj-gold/10 border border-tj-gold/30 text-tj-gold hover:bg-tj-gold hover:text-black'
              }`}
            >
              <ArrowRight size={12} /> Process Return
            </button>
          )}

          {booking.status !== 'cancelled' && booking.status !== 'returned' && (
            <button
              onClick={handleCancelBooking}
              disabled={actionLoading}
              className="px-3 py-2 border border-red-700/50 text-red-400 text-xs font-bold uppercase tracking-wider hover:bg-red-900/20 transition-colors flex items-center gap-2 ml-auto disabled:opacity-50"
            >
              {actionLoading ? <Loader2 className="animate-spin" size={12} /> : <Ban size={12} />}
              Cancel Booking
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ================================================================
// MAIN RENTALS PAGE
// ================================================================

const Rentals: React.FC = () => {
  const { vehicles, bookings, refreshBookings } = useStore();

  // Tab state
  const [activeTab, setActiveTab] = useState<RentalTab>('calendar');

  // Loading states
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Calendar state
  const [calendarBookings, setCalendarBookings] = useState<RentalBooking[]>([]);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());

  // Active rentals state
  const [activeRentals, setActiveRentals] = useState<RentalBooking[]>([]);

  // Fleet tab state
  const [fleetFilter, setFleetFilter] = useState<'rental' | 'all'>('rental');
  const [fleetSearch, setFleetSearch] = useState('');

  // Expanded booking detail (accordion - one at a time)
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

  // Modal states
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Agreement modal state
  const [agreementBooking, setAgreementBooking] = useState<RentalBooking | null>(null);

  // Return modal state (simple dialog for calendar tab quick actions)
  const [returnDialog, setReturnDialog] = useState<{
    bookingId: string;
    mileageIn: string;
  } | null>(null);

  // ================================================================
  // DATA LOADING
  // ================================================================

  const loadCalendarBookings = async (year?: number, month?: number) => {
    setLoading(true);
    try {
      const y = year ?? calendarYear;
      const m = month ?? calendarMonth;
      const data = await getBookingsForMonth(y, m);
      setCalendarBookings(data);
    } catch (error) {
      console.error('Error loading calendar bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveRentals = async () => {
    setLoading(true);
    try {
      const data = await getActiveBookings();
      setActiveRentals(data);
    } catch (error) {
      console.error('Error loading active rentals:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data on tab change
  useEffect(() => {
    if (activeTab === 'calendar') {
      loadCalendarBookings();
    } else if (activeTab === 'active') {
      loadActiveRentals();
    }
    // Fleet tab uses vehicles from store, no extra loading needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Reload calendar when month changes
  useEffect(() => {
    if (activeTab === 'calendar') {
      loadCalendarBookings(calendarYear, calendarMonth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarYear, calendarMonth]);

  // ================================================================
  // STATS
  // ================================================================

  const stats = useMemo(() => {
    const allStoreBookings = bookings;
    const nonCancelled = allStoreBookings.filter(b => b.status !== 'cancelled');
    const active = allStoreBookings.filter(b => b.status === 'active');
    const overdue = allStoreBookings.filter(b => b.status === 'overdue');
    const rentalFleet = vehicles.filter(v =>
      v.listingType === 'rental_only' || v.listingType === 'both'
    );

    return {
      totalBookings: nonCancelled.length,
      activeCount: active.length,
      overdueCount: overdue.length,
      fleetSize: rentalFleet.length,
    };
  }, [bookings, vehicles]);

  // ================================================================
  // HANDLERS
  // ================================================================

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setShowBookingModal(true);
  };

  const handleBookingClick = (booking: RentalBooking) => {
    // Switch to Active Rentals tab and expand the booking
    setExpandedBookingId(booking.id);
    setActiveTab('active');
  };

  const handleReturnBooking = async () => {
    if (!returnDialog) return;
    setActionLoading(returnDialog.bookingId);
    try {
      const today = new Date().toISOString().split('T')[0];
      const mileageIn = parseInt(returnDialog.mileageIn) || 0;
      const success = await returnBooking(returnDialog.bookingId, today, mileageIn);
      if (success) {
        setReturnDialog(null);
        await refreshBookings();
        if (activeTab === 'active') await loadActiveRentals();
        if (activeTab === 'calendar') await loadCalendarBookings();
      }
    } catch (error) {
      console.error('Error returning booking:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setActionLoading(bookingId);
    try {
      const success = await cancelBooking(bookingId);
      if (success) {
        await refreshBookings();
        if (activeTab === 'active') await loadActiveRentals();
        if (activeTab === 'calendar') await loadCalendarBookings();
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleListingTypeChange = async (vehicleId: string, listingType: ListingType) => {
    setActionLoading(vehicleId);
    try {
      await updateVehicleListingType(vehicleId, listingType);
    } catch (error) {
      console.error('Error updating listing type:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRateUpdate = async (
    vehicleId: string,
    dailyRate: number,
    weeklyRate?: number
  ) => {
    setActionLoading(vehicleId);
    try {
      await updateVehicleRentalRates(vehicleId, dailyRate, weeklyRate);
    } catch (error) {
      console.error('Error updating rental rates:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    await refreshBookings();
    if (activeTab === 'calendar') await loadCalendarBookings();
    if (activeTab === 'active') await loadActiveRentals();
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, calendarYear, calendarMonth]);

  const handleBookingCreated = async () => {
    setShowBookingModal(false);
    setSelectedDate(null);
    await handleRefresh();
  };

  const handleAgreementSigned = async () => {
    setAgreementBooking(null);
    await handleRefresh();
  };

  const handleOpenAgreement = (booking: RentalBooking) => {
    setAgreementBooking(booking);
  };

  // ================================================================
  // ACTIVE RENTALS - sorted: overdue first, then by end_date ascending
  // ================================================================

  const sortedActiveRentals = useMemo(() => {
    return [...activeRentals].sort((a, b) => {
      // Overdue first
      if (a.status === 'overdue' && b.status !== 'overdue') return -1;
      if (b.status === 'overdue' && a.status !== 'overdue') return 1;
      // Then by end_date ascending (soonest due back on top)
      return a.endDate.localeCompare(b.endDate);
    });
  }, [activeRentals]);

  // ================================================================
  // FLEET - filtered vehicles
  // ================================================================

  const fleetVehicles = useMemo(() => {
    let filtered = vehicles;

    if (fleetFilter === 'rental') {
      filtered = filtered.filter(v =>
        v.listingType === 'rental_only' || v.listingType === 'both'
      );
    }

    if (fleetSearch) {
      const q = fleetSearch.toLowerCase();
      filtered = filtered.filter(v =>
        `${v.year} ${v.make} ${v.model}`.toLowerCase().includes(q) ||
        v.vin.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [vehicles, fleetFilter, fleetSearch]);

  // Find active booking for a vehicle
  const getActiveBookingForVehicle = (vehicleId: string): RentalBooking | undefined => {
    return bookings.find(
      b => b.vehicleId === vehicleId && (b.status === 'active' || b.status === 'overdue')
    );
  };

  // Calculate days remaining or overdue
  const getDaysInfo = (booking: RentalBooking): { label: string; isOverdue: boolean } => {
    const today = new Date();
    const end = new Date(booking.endDate);
    const diffMs = end.getTime() - today.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (days < 0) {
      return { label: `${Math.abs(days)} days overdue`, isOverdue: true };
    }
    if (days === 0) {
      return { label: 'Due today', isOverdue: false };
    }
    return { label: `${days} days remaining`, isOverdue: false };
  };

  // ================================================================
  // RENDER
  // ================================================================

  return (
    <>
      <AdminHeader />

      <div className="min-h-screen bg-black px-4 md:px-8 pb-4 md:pb-8 pt-4 md:pt-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-display text-white tracking-wide mb-1">
                Rental Management
              </h1>
              <p className="text-gray-500 text-sm">
                Calendar, active rentals, and fleet management
              </p>
              <div className="h-px w-24 bg-gradient-to-r from-tj-gold/60 to-transparent" />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-3 border border-gray-700 hover:border-tj-gold text-gray-400 hover:text-tj-gold transition-colors"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => setShowBookingModal(true)}
                className="px-4 py-3 bg-tj-gold text-black font-bold text-sm tracking-wider hover:bg-white transition-colors flex items-center gap-2"
              >
                <Plus size={18} />
                New Booking
              </button>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-tj-gold/20 to-transparent mb-6" />

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-tj-dark border border-tj-gold/20 hover:border-tj-gold/40 transition-all duration-500 hover:shadow-[0_0_30px_rgba(212,175,55,0.1)] p-4">
              <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Total Bookings</p>
              <p className="text-white text-2xl font-mono">{stats.totalBookings}</p>
            </div>
            <div className="bg-tj-dark border border-tj-gold/20 hover:border-tj-gold/40 transition-all duration-500 hover:shadow-[0_0_30px_rgba(212,175,55,0.1)] p-4">
              <p className="text-emerald-400 text-[10px] uppercase tracking-widest mb-1">Active</p>
              <p className="text-emerald-400 text-2xl font-mono">{stats.activeCount}</p>
            </div>
            <div className="bg-tj-dark border border-tj-gold/20 hover:border-tj-gold/40 transition-all duration-500 hover:shadow-[0_0_30px_rgba(212,175,55,0.1)] p-4 relative">
              <p className="text-red-400 text-[10px] uppercase tracking-widest mb-1">Overdue</p>
              <p className={`text-2xl font-mono ${stats.overdueCount > 0 ? 'text-red-400' : 'text-gray-600'}`}>
                {stats.overdueCount}
              </p>
              {stats.overdueCount > 0 && (
                <span className="absolute top-3 right-3 w-6 h-6 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {stats.overdueCount}
                </span>
              )}
            </div>
            <div className="bg-tj-dark border border-tj-gold/20 hover:border-tj-gold/40 transition-all duration-500 hover:shadow-[0_0_30px_rgba(212,175,55,0.1)] p-4">
              <p className="text-blue-400 text-[10px] uppercase tracking-widest mb-1">Fleet Size</p>
              <p className="text-blue-400 text-2xl font-mono">{stats.fleetSize}</p>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-tj-gold/20 to-transparent mb-6" />

          {/* Tab Navigation */}
          <div className="flex border-b border-tj-gold/20 mb-6">
            {([
              { key: 'calendar' as RentalTab, label: 'Calendar', icon: Calendar },
              { key: 'active' as RentalTab, label: 'Active Rentals', icon: Clock },
              { key: 'fleet' as RentalTab, label: 'Fleet', icon: Truck },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-6 py-3 text-[11px] uppercase tracking-widest font-bold border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'text-tj-gold border-tj-gold'
                    : 'text-gray-500 border-transparent hover:text-gray-300 hover:border-gray-600'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-tj-gold" size={32} />
            </div>
          )}

          {/* ============================================================ */}
          {/* CALENDAR TAB */}
          {/* ============================================================ */}
          {activeTab === 'calendar' && !loading && (
            <div>
              <RentalCalendar
                bookings={calendarBookings}
                onDateClick={handleDateClick}
                onBookingClick={handleBookingClick}
              />

              {/* Selected booking detail (inline expansion from calendar click) */}
              {expandedBookingId && (() => {
                const calBooking = calendarBookings.find(b => b.id === expandedBookingId);
                if (!calBooking) return null;
                return (
                  <div className="mt-4">
                    <BookingDetail
                      booking={calBooking}
                      allBookings={bookings}
                      vehicles={vehicles}
                      onRefresh={handleRefresh}
                      onOpenAgreement={handleOpenAgreement}
                      onClose={() => setExpandedBookingId(null)}
                    />
                  </div>
                );
              })()}
            </div>
          )}

          {/* ============================================================ */}
          {/* ACTIVE RENTALS TAB */}
          {/* ============================================================ */}
          {activeTab === 'active' && !loading && (
            <div>
              {sortedActiveRentals.length === 0 ? (
                <div className="text-center py-16 bg-tj-dark border border-tj-gold/10">
                  <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
                  <p className="text-gray-400 text-lg mb-2">No Active Rentals</p>
                  <p className="text-gray-600 text-sm">All vehicles are currently available.</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {sortedActiveRentals.map(booking => {
                    const daysInfo = getDaysInfo(booking);
                    const isExpanded = expandedBookingId === booking.id;
                    const lateFee = booking.status === 'overdue'
                      ? calculateLateFee(
                          booking.endDate,
                          booking.actualReturnDate || null,
                          booking.dailyRate,
                          booking.lateFeeOverride ?? null
                        )
                      : null;

                    return (
                      <div key={booking.id}>
                        {/* Collapsed row */}
                        <div
                          className={`bg-tj-dark border p-4 md:p-5 cursor-pointer transition-colors hover:bg-white/[0.02] ${
                            booking.status === 'overdue'
                              ? 'border-red-500/50 bg-red-900/10'
                              : isExpanded ? 'border-tj-gold/30 shadow-[0_0_20px_rgba(212,175,55,0.05)]' : 'border-gray-800 hover:border-tj-gold/20 hover:shadow-[0_0_20px_rgba(212,175,55,0.05)]'
                          } ${isExpanded ? 'border-b-0' : ''}`}
                          onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                        >
                          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                            {/* Expand chevron */}
                            <button className="text-gray-500 hidden md:block">
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>

                            {/* Booking ID + Status */}
                            <div className="flex items-center gap-3 min-w-0">
                              <span className={`px-3 py-1 text-[10px] uppercase tracking-wider border whitespace-nowrap ${
                                booking.status === 'overdue'
                                  ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse'
                                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                              }`}>
                                {booking.status === 'overdue' ? 'OVERDUE' : 'ACTIVE'}
                              </span>
                              <span className="text-tj-gold font-mono text-sm">{booking.bookingId}</span>
                            </div>

                            {/* Vehicle Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium truncate">
                                {booking.vehicle
                                  ? `${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}`
                                  : 'Unknown Vehicle'}
                              </p>
                              <p className="text-gray-500 text-xs flex items-center gap-1">
                                <Users size={12} />
                                {booking.customer?.fullName || 'Unknown Customer'}
                              </p>
                            </div>

                            {/* Dates */}
                            <div className="text-sm hidden md:block">
                              <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Period</p>
                              <p className="text-gray-300">
                                {booking.startDate} <ArrowRight size={12} className="inline mx-1" /> {booking.endDate}
                              </p>
                            </div>

                            {/* Days Info */}
                            <div className="text-sm">
                              <p className={`font-mono ${daysInfo.isOverdue ? 'text-red-400 font-bold' : 'text-gray-300'}`}>
                                {daysInfo.label}
                              </p>
                            </div>

                            {/* Late Fee */}
                            {lateFee && (
                              <div className="text-sm">
                                <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Late Fee</p>
                                <p className={`font-mono ${
                                  lateFee.isOverridden && lateFee.amount === 0
                                    ? 'text-gray-500'
                                    : 'text-red-400'
                                }`}>
                                  {lateFee.isOverridden && lateFee.amount === 0
                                    ? 'Waived'
                                    : formatCurrency(lateFee.amount)}
                                  {lateFee.days > 0 && (
                                    <span className="text-gray-500 text-xs ml-1">({lateFee.days}d)</span>
                                  )}
                                </p>
                              </div>
                            )}

                            {/* Quick Actions */}
                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => setReturnDialog({ bookingId: booking.id, mileageIn: '' })}
                                className="px-3 py-1.5 bg-tj-gold text-black text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors"
                              >
                                Return
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Expanded detail */}
                        {isExpanded && (
                          <BookingDetail
                            booking={booking}
                            allBookings={bookings}
                            vehicles={vehicles}
                            onRefresh={handleRefresh}
                            onOpenAgreement={handleOpenAgreement}
                            onClose={() => setExpandedBookingId(null)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* FLEET TAB */}
          {/* ============================================================ */}
          {activeTab === 'fleet' && !loading && (
            <div>
              {/* Fleet Controls */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search vehicles..."
                    value={fleetSearch}
                    onChange={e => setFleetSearch(e.target.value)}
                    className="w-full bg-tj-dark border border-gray-700 pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-tj-gold transition-colors"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFleetFilter('rental')}
                    className={`px-4 py-3 text-[11px] uppercase tracking-widest font-bold border transition-colors ${
                      fleetFilter === 'rental'
                        ? 'bg-tj-gold text-black border-tj-gold'
                        : 'text-gray-400 border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    Rental Fleet Only
                  </button>
                  <button
                    onClick={() => setFleetFilter('all')}
                    className={`px-4 py-3 text-[11px] uppercase tracking-widest font-bold border transition-colors ${
                      fleetFilter === 'all'
                        ? 'bg-tj-gold text-black border-tj-gold'
                        : 'text-gray-400 border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    All Vehicles
                  </button>
                </div>
              </div>

              {/* Fleet List */}
              {fleetVehicles.length === 0 ? (
                <div className="text-center py-16 bg-tj-dark border border-tj-gold/10">
                  <Car className="mx-auto text-gray-700 mb-4" size={48} />
                  <p className="text-gray-500 mb-2">
                    {fleetFilter === 'rental'
                      ? 'No vehicles configured for rental'
                      : 'No vehicles found'}
                  </p>
                  <p className="text-gray-600 text-sm">
                    Set a vehicle's listing type to "Rental Only" or "Both" to add it to the rental fleet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {fleetVehicles.map(vehicle => {
                    const activeBooking = getActiveBookingForVehicle(vehicle.id);
                    const isRental = vehicle.listingType === 'rental_only' || vehicle.listingType === 'both';

                    return (
                      <FleetVehicleRow
                        key={vehicle.id}
                        vehicle={vehicle}
                        activeBooking={activeBooking}
                        isRental={isRental}
                        actionLoading={actionLoading}
                        onListingTypeChange={handleListingTypeChange}
                        onRateUpdate={handleRateUpdate}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* RETURN VEHICLE DIALOG (simple, for quick actions) */}
          {/* ============================================================ */}
          {returnDialog && (
            <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-50 p-4">
              <div className="bg-[#080808] border border-tj-gold/30 shadow-[0_0_100px_rgba(0,0,0,1)] w-full max-w-md">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                  <h3 className="text-white font-display text-lg tracking-wide">Return Vehicle</h3>
                  <button
                    onClick={() => setReturnDialog(null)}
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-gray-500 text-[10px] uppercase tracking-widest mb-2">
                      Mileage In
                    </label>
                    <input
                      type="number"
                      value={returnDialog.mileageIn}
                      onChange={e => setReturnDialog({ ...returnDialog, mileageIn: e.target.value })}
                      className="w-full bg-black border border-gray-700 px-4 py-3 text-white text-sm focus:outline-none focus:border-tj-gold"
                      placeholder="Enter current mileage"
                    />
                  </div>
                </div>

                <div className="p-6 border-t border-gray-800 flex justify-end gap-4">
                  <button
                    onClick={() => setReturnDialog(null)}
                    className="px-6 py-3 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReturnBooking}
                    disabled={actionLoading !== null}
                    className="px-6 py-3 bg-tj-gold text-black font-bold text-sm tracking-wider hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {actionLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        Confirm Return
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* MODALS */}
          {/* ============================================================ */}

          {/* Booking Modal */}
          <RentalBookingModal
            isOpen={showBookingModal}
            onClose={() => { setShowBookingModal(false); setSelectedDate(null); }}
            onBookingCreated={handleBookingCreated}
            vehicles={vehicles}
            preSelectedDate={selectedDate || undefined}
          />

          {/* Agreement Modal */}
          {agreementBooking && agreementBooking.customer && (() => {
            const agVehicle = agreementBooking.vehicle || vehicles.find(v => v.id === agreementBooking.vehicleId);
            if (!agVehicle) return null;
            return (
              <RentalAgreementModal
                isOpen={!!agreementBooking}
                onClose={() => setAgreementBooking(null)}
                booking={agreementBooking}
                customer={agreementBooking.customer}
                vehicle={agVehicle}
                onAgreementSigned={handleAgreementSigned}
              />
            );
          })()}
        </div>
      </div>
    </>
  );
};

// ================================================================
// FLEET VEHICLE ROW COMPONENT
// ================================================================

interface FleetVehicleRowProps {
  vehicle: Vehicle;
  activeBooking?: RentalBooking;
  isRental: boolean;
  actionLoading: string | null;
  onListingTypeChange: (vehicleId: string, listingType: ListingType) => Promise<void>;
  onRateUpdate: (vehicleId: string, dailyRate: number, weeklyRate?: number) => Promise<void>;
}

const FleetVehicleRow: React.FC<FleetVehicleRowProps> = ({
  vehicle,
  activeBooking,
  isRental,
  actionLoading,
  onListingTypeChange,
  onRateUpdate,
}) => {
  const [dailyRate, setDailyRate] = useState(String(vehicle.dailyRate || ''));
  const [weeklyRate, setWeeklyRate] = useState(String(vehicle.weeklyRate || ''));

  const handleDailyBlur = () => {
    const rate = parseFloat(dailyRate);
    if (!isNaN(rate) && rate > 0 && rate !== vehicle.dailyRate) {
      const weekly = weeklyRate ? parseFloat(weeklyRate) : undefined;
      onRateUpdate(vehicle.id, rate, weekly);
    }
  };

  const handleWeeklyBlur = () => {
    const weekly = weeklyRate ? parseFloat(weeklyRate) : undefined;
    const daily = parseFloat(dailyRate) || vehicle.dailyRate || 0;
    if (daily > 0 && weekly !== vehicle.weeklyRate) {
      onRateUpdate(vehicle.id, daily, weekly);
    }
  };

  return (
    <div className="bg-tj-dark border border-gray-800 hover:border-tj-gold/20 transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,175,55,0.05)] p-4 md:p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        {/* Vehicle Image */}
        <div className="w-16 h-12 bg-black/50 border border-gray-800 flex items-center justify-center shrink-0 overflow-hidden">
          {vehicle.imageUrl ? (
            <img
              src={vehicle.imageUrl}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <Car size={20} className="text-gray-600" />
          )}
        </div>

        {/* Vehicle Info */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </p>
          <p className="text-gray-600 text-xs font-mono">{vehicle.vin}</p>
          {activeBooking && (
            <p className="text-emerald-400 text-xs mt-1 flex items-center gap-1">
              <Users size={12} />
              Currently Rented to {activeBooking.customer?.fullName || 'Unknown'} - Returns {activeBooking.endDate}
            </p>
          )}
        </div>

        {/* Current Status */}
        <div className="hidden md:block">
          <span className={`px-2 py-1 text-[10px] uppercase tracking-widest border ${
            vehicle.status === 'Available'
              ? 'border-green-500/50 text-green-400'
              : vehicle.status === 'Sold'
              ? 'border-gray-600 text-gray-500'
              : 'border-amber-500/50 text-amber-400'
          }`}>
            {vehicle.status}
          </span>
        </div>

        {/* Listing Type Dropdown */}
        <div>
          <select
            value={vehicle.listingType || 'sale_only'}
            onChange={e => onListingTypeChange(vehicle.id, e.target.value as ListingType)}
            disabled={actionLoading === vehicle.id}
            className="bg-black border border-gray-700 px-3 py-2 text-white text-xs focus:outline-none focus:border-tj-gold disabled:opacity-50"
          >
            <option value="sale_only">Sale Only</option>
            <option value="rental_only">Rental Only</option>
            <option value="both">Both</option>
          </select>
        </div>

        {/* Rental Rates (only if rental eligible) */}
        {isRental && (
          <div className="flex items-center gap-2">
            <div>
              <label className="block text-gray-500 text-[9px] uppercase tracking-widest mb-1">Daily</label>
              <div className="relative">
                <DollarSign size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  type="number"
                  value={dailyRate}
                  onChange={e => setDailyRate(e.target.value)}
                  onBlur={handleDailyBlur}
                  className="w-20 bg-black border border-gray-700 pl-6 pr-2 py-1.5 text-white text-xs focus:outline-none focus:border-tj-gold"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-500 text-[9px] uppercase tracking-widest mb-1">Weekly</label>
              <div className="relative">
                <DollarSign size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  type="number"
                  value={weeklyRate}
                  onChange={e => setWeeklyRate(e.target.value)}
                  onBlur={handleWeeklyBlur}
                  className="w-20 bg-black border border-gray-700 pl-6 pr-2 py-1.5 text-white text-xs focus:outline-none focus:border-tj-gold"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Rentals;
