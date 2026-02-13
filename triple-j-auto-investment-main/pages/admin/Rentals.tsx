/**
 * Admin Rental Management Page
 *
 * Phase 06-03: Main rental management interface with three tabs:
 * - Calendar: Monthly booking visualization via RentalCalendar
 * - Active Rentals: Current renters with overdue highlighting
 * - Fleet: Vehicle listing type controls and rental rate management
 *
 * Requirements addressed:
 * - RENT-01: Dual inventory (sale_only / rental_only / both)
 * - RENT-02: Availability calendar with color-coded bookings
 * - RENT-04: Rental tracking (who has what car, when due back)
 */

import React, { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import { BillOfSaleModal } from '../../components/admin/BillOfSaleModal';
import RentalCalendar from '../../components/admin/RentalCalendar';
import {
  getBookingsForMonth,
  getActiveBookings,
  returnBooking,
  cancelBooking,
  updateVehicleListingType,
  updateVehicleRentalRates,
  calculateLateFee,
} from '../../services/rentalService';
import {
  RentalBooking,
  RentalBookingStatus,
  ListingType,
  Vehicle,
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

  // Return modal state
  const [returnDialog, setReturnDialog] = useState<{
    bookingId: string;
    mileageIn: string;
  } | null>(null);

  // Placeholder hooks for modals (created in Plans 04-05)
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<RentalBooking | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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
    const allBookings = activeTab === 'calendar' ? calendarBookings : activeRentals;
    // Use bookings from store for total count (or combine both)
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
  }, [bookings, vehicles, activeTab, calendarBookings, activeRentals]);

  // ================================================================
  // HANDLERS
  // ================================================================

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setShowBookingModal(true);
  };

  const handleBookingClick = (booking: RentalBooking) => {
    setSelectedBooking(booking);
    // For now, just expand inline - detail modal comes in later plan
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
      // Vehicle list will update via store refresh or we reload the page
      // For now just wait a moment and the store should pick up the change
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

  const handleRefresh = async () => {
    setLoading(true);
    await refreshBookings();
    if (activeTab === 'calendar') await loadCalendarBookings();
    if (activeTab === 'active') await loadActiveRentals();
    setLoading(false);
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

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-tj-dark border border-gray-800 p-4">
              <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Total Bookings</p>
              <p className="text-white text-2xl font-mono">{stats.totalBookings}</p>
            </div>
            <div className="bg-tj-dark border border-gray-800 p-4">
              <p className="text-emerald-400 text-[10px] uppercase tracking-widest mb-1">Active</p>
              <p className="text-emerald-400 text-2xl font-mono">{stats.activeCount}</p>
            </div>
            <div className="bg-tj-dark border border-gray-800 p-4">
              <p className="text-red-400 text-[10px] uppercase tracking-widest mb-1">Overdue</p>
              <p className={`text-2xl font-mono ${stats.overdueCount > 0 ? 'text-red-400' : 'text-gray-600'}`}>
                {stats.overdueCount}
                {stats.overdueCount > 0 && (
                  <AlertTriangle size={14} className="inline ml-2 mb-1 animate-pulse" />
                )}
              </p>
            </div>
            <div className="bg-tj-dark border border-gray-800 p-4">
              <p className="text-blue-400 text-[10px] uppercase tracking-widest mb-1">Fleet Size</p>
              <p className="text-blue-400 text-2xl font-mono">{stats.fleetSize}</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-800 mb-6">
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

              {/* Selected booking detail (inline expansion) */}
              {selectedBooking && (
                <div className="mt-4 bg-tj-dark border border-gray-800 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-white font-display text-lg tracking-wide">
                        {selectedBooking.bookingId}
                      </h4>
                      <p className="text-gray-500 text-sm">
                        {selectedBooking.customer?.fullName || 'Unknown Customer'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 text-[10px] uppercase tracking-wider border ${
                        selectedBooking.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                          : selectedBooking.status === 'overdue'
                          ? 'bg-red-500/20 text-red-400 border-red-500/50'
                          : selectedBooking.status === 'reserved'
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                          : 'bg-gray-500/20 text-gray-400 border-gray-500/50'
                      }`}>
                        {selectedBooking.status}
                      </span>
                      <button
                        onClick={() => setSelectedBooking(null)}
                        className="p-1 text-gray-500 hover:text-white transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Vehicle</p>
                      <p className="text-white">
                        {selectedBooking.vehicle
                          ? `${selectedBooking.vehicle.year} ${selectedBooking.vehicle.make} ${selectedBooking.vehicle.model}`
                          : selectedBooking.vehicleId.slice(0, 8)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Dates</p>
                      <p className="text-white">{selectedBooking.startDate} to {selectedBooking.endDate}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Daily Rate</p>
                      <p className="text-white">${selectedBooking.dailyRate}/day</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Total</p>
                      <p className="text-tj-gold font-mono">${selectedBooking.totalCost.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Quick actions */}
                  {(selectedBooking.status === 'active' || selectedBooking.status === 'overdue') && (
                    <div className="mt-4 pt-4 border-t border-gray-800 flex gap-3">
                      <button
                        onClick={() => setReturnDialog({ bookingId: selectedBooking.id, mileageIn: '' })}
                        className="px-4 py-2 bg-tj-gold text-black text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors"
                      >
                        Return Vehicle
                      </button>
                      <button
                        onClick={() => handleCancelBooking(selectedBooking.id)}
                        disabled={actionLoading === selectedBooking.id}
                        className="px-4 py-2 border border-red-500/50 text-red-400 text-xs font-bold uppercase tracking-wider hover:bg-red-900/20 transition-colors disabled:opacity-50"
                      >
                        Cancel Booking
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* RentalBookingModal will be added by Plan 04 */}
            </div>
          )}

          {/* ============================================================ */}
          {/* ACTIVE RENTALS TAB */}
          {/* ============================================================ */}
          {activeTab === 'active' && !loading && (
            <div>
              {sortedActiveRentals.length === 0 ? (
                <div className="text-center py-16 bg-tj-dark border border-gray-800">
                  <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
                  <p className="text-gray-400 text-lg mb-2">No Active Rentals</p>
                  <p className="text-gray-600 text-sm">All vehicles are currently available.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedActiveRentals.map(booking => {
                    const daysInfo = getDaysInfo(booking);
                    const lateFee = booking.status === 'overdue'
                      ? calculateLateFee(
                          booking.endDate,
                          booking.actualReturnDate || null,
                          booking.dailyRate,
                          booking.lateFeeOverride ?? null
                        )
                      : null;

                    return (
                      <div
                        key={booking.id}
                        className={`bg-tj-dark border p-4 md:p-6 ${
                          booking.status === 'overdue'
                            ? 'border-red-500/50 bg-red-900/10'
                            : 'border-gray-800'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
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
                                  : `$${lateFee.amount.toLocaleString()}`}
                                {lateFee.days > 0 && (
                                  <span className="text-gray-500 text-xs ml-1">({lateFee.days}d)</span>
                                )}
                              </p>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setReturnDialog({ bookingId: booking.id, mileageIn: '' })}
                              className="px-3 py-1.5 bg-tj-gold text-black text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors"
                            >
                              Return
                            </button>
                            <button
                              onClick={() => setSelectedBooking(selectedBooking?.id === booking.id ? null : booking)}
                              className="px-3 py-1.5 border border-gray-700 text-gray-400 text-xs font-bold uppercase tracking-wider hover:text-white hover:border-gray-500 transition-colors"
                            >
                              View
                            </button>
                          </div>
                        </div>
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
                <div className="text-center py-16 bg-tj-dark border border-gray-800">
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
          {/* RETURN VEHICLE DIALOG */}
          {/* ============================================================ */}
          {returnDialog && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-tj-dark border border-gray-700 w-full max-w-md">
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

          {/* RentalBookingModal will be added by Plan 04 */}
          {/* RentalAgreementModal will be added by Plan 05 */}
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
    <div className="bg-tj-dark border border-gray-800 p-4 md:p-6">
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
