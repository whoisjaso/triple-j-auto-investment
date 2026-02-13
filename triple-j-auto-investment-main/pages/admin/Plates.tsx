/**
 * Admin Plate Management Page
 *
 * Phase 07-02: Dedicated plate tracking page with split-view dashboard.
 *
 * Features:
 * - Split view: Plates Out (3/5) + Plate Inventory (2/5)
 * - Stats bar: Total, Out Now, Available, Active Alerts, Expiring Soon
 * - Plate CRUD: Add, edit, delete plates
 * - Mark Returned: Quick-action from Plates Out panel
 * - Assignment History: Accordion-expand timeline per plate
 * - Buyer's tag expiration countdown with 4-tier severity colors
 * - Overdue plates sorted to top
 *
 * Requirements addressed:
 * - PLAT-01: Plates as first-class entities
 * - PLAT-02: Vehicle assignment tracking
 * - PLAT-03: Customer tracking
 * - PLAT-04: Dashboard ("where are my plates RIGHT NOW")
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useStore } from '../../context/Store';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Car,
  ClipboardCheck,
  Key,
  CreditCard,
  FileText,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Loader2,
  X,
  Check,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Phone,
  AlertTriangle,
  Clock,
  Shield,
  CheckCircle,
  Upload,
  Filter,
} from 'lucide-react';
import { BillOfSaleModal } from '../../components/admin/BillOfSaleModal';
import { PlateAssignmentHistory } from '../../components/admin/PlateAssignmentHistory';
import {
  getAllPlates,
  getActiveAlerts,
  createPlate,
  updatePlate,
  deletePlate,
  returnPlateAssignment,
  uploadPlatePhoto,
  calculateTagExpiry,
} from '../../services/plateService';
import {
  Plate,
  PlateType,
  PlateStatus,
  PlateAlert,
  PLATE_TYPE_LABELS,
  PLATE_STATUS_LABELS,
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
    { path: '/admin/plates', label: 'Plates', icon: CreditCard },
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
// FORMAT HELPERS
// ================================================================

const formatDate = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

const formatDateShort = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

// ================================================================
// TYPE BADGE COMPONENT
// ================================================================

const PLATE_TYPE_COLORS: Record<PlateType, string> = {
  dealer: 'text-blue-400 bg-blue-500/20 border-blue-500/50',
  buyer_tag: 'text-amber-400 bg-amber-500/20 border-amber-500/50',
  permanent: 'text-gray-400 bg-gray-500/20 border-gray-500/50',
};

const PLATE_STATUS_COLORS: Record<PlateStatus, string> = {
  available: 'text-green-400 bg-green-500/20 border-green-500/50',
  assigned: 'text-amber-400 bg-amber-500/20 border-amber-500/50',
  expired: 'text-red-400 bg-red-500/20 border-red-500/50',
  lost: 'text-gray-400 bg-gray-500/20 border-gray-500/50',
};

const SEVERITY_COLORS: Record<string, string> = {
  ok: 'text-green-400 bg-green-500/20',
  warning: 'text-amber-400 bg-amber-500/20',
  urgent: 'text-red-400 bg-red-500/20',
  expired: 'text-red-500 bg-red-500/30',
};

// ================================================================
// ADD/EDIT PLATE FORM
// ================================================================

interface PlateFormData {
  plateNumber: string;
  plateType: PlateType;
  expirationDate: string;
  notes: string;
}

const emptyFormData: PlateFormData = {
  plateNumber: '',
  plateType: 'dealer',
  expirationDate: '',
  notes: '',
};

interface PlateFormProps {
  initialData?: PlateFormData;
  editId?: string;
  onSubmit: (data: PlateFormData, photoFile?: File) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

const PlateForm: React.FC<PlateFormProps> = ({ initialData, editId, onSubmit, onCancel, loading }) => {
  const [form, setForm] = useState<PlateFormData>(initialData || emptyFormData);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form, photoFile || undefined);
  };

  // Auto-suggest expiration for buyer's tags: 60 days from today
  useEffect(() => {
    if (form.plateType === 'buyer_tag' && !form.expirationDate && !editId) {
      const suggestedDate = new Date();
      suggestedDate.setDate(suggestedDate.getDate() + 60);
      setForm(prev => ({ ...prev, expirationDate: suggestedDate.toISOString().split('T')[0] }));
    }
  }, [form.plateType, form.expirationDate, editId]);

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Plate Number */}
      <div>
        <label className="block text-[9px] uppercase tracking-widest text-gray-500 mb-1">Plate Number *</label>
        <input
          type="text"
          value={form.plateNumber}
          onChange={e => setForm(prev => ({ ...prev, plateNumber: e.target.value.toUpperCase() }))}
          required
          placeholder="e.g. DLR-1234"
          className="w-full bg-black border border-gray-700 text-white text-sm px-3 py-2 focus:border-tj-gold focus:outline-none placeholder-gray-600"
        />
      </div>

      {/* Type */}
      <div>
        <label className="block text-[9px] uppercase tracking-widest text-gray-500 mb-1">Type *</label>
        <div className="flex gap-2">
          {(['dealer', 'buyer_tag', 'permanent'] as PlateType[]).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setForm(prev => ({ ...prev, plateType: type }))}
              className={`flex-1 px-3 py-2 text-[10px] uppercase tracking-widest font-bold border transition-all ${
                form.plateType === type
                  ? 'bg-tj-gold text-black border-tj-gold'
                  : 'text-gray-400 border-gray-700 hover:border-gray-500'
              }`}
            >
              {PLATE_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Expiration Date */}
      {(form.plateType === 'buyer_tag' || form.plateType === 'dealer') && (
        <div>
          <label className="block text-[9px] uppercase tracking-widest text-gray-500 mb-1">
            Expiration Date {form.plateType === 'buyer_tag' ? '*' : '(optional)'}
          </label>
          <input
            type="date"
            value={form.expirationDate}
            onChange={e => setForm(prev => ({ ...prev, expirationDate: e.target.value }))}
            required={form.plateType === 'buyer_tag'}
            className="w-full bg-black border border-gray-700 text-white text-sm px-3 py-2 focus:border-tj-gold focus:outline-none"
          />
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-[9px] uppercase tracking-widest text-gray-500 mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
          rows={2}
          placeholder="Optional notes..."
          className="w-full bg-black border border-gray-700 text-white text-sm px-3 py-2 focus:border-tj-gold focus:outline-none placeholder-gray-600 resize-none"
        />
      </div>

      {/* Photo Upload */}
      <div>
        <label className="block text-[9px] uppercase tracking-widest text-gray-500 mb-1">Photo</label>
        <label className="flex items-center gap-2 px-3 py-2 border border-gray-700 text-gray-400 text-sm cursor-pointer hover:border-gray-500 transition-colors">
          <Upload size={14} />
          {photoFile ? photoFile.name : 'Upload plate photo...'}
          <input
            type="file"
            accept="image/*"
            onChange={e => setPhotoFile(e.target.files?.[0] || null)}
            className="hidden"
          />
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={loading || !form.plateNumber}
          className="flex-1 px-4 py-2.5 bg-tj-gold text-black font-bold text-xs uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          {editId ? 'Save Changes' : 'Add Plate'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 border border-gray-700 text-gray-400 font-bold text-xs uppercase tracking-widest hover:border-gray-500 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

// ================================================================
// DAYS REMAINING HELPER
// ================================================================

const DaysIndicator: React.FC<{ expectedReturnDate?: string }> = ({ expectedReturnDate }) => {
  if (!expectedReturnDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const returnDate = new Date(expectedReturnDate);
  returnDate.setHours(0, 0, 0, 0);
  const diffMs = returnDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    const overdue = Math.abs(daysRemaining);
    return (
      <span className="text-red-400 font-mono text-sm font-bold animate-pulse">
        {overdue}d overdue
      </span>
    );
  }

  if (daysRemaining === 0) {
    return (
      <span className="text-amber-400 font-mono text-sm font-bold">
        Due today
      </span>
    );
  }

  return (
    <span className="text-green-400 font-mono text-sm">
      {daysRemaining}d remaining
    </span>
  );
};

// ================================================================
// TAG EXPIRY BADGE
// ================================================================

const TagExpiryBadge: React.FC<{ expirationDate: string }> = ({ expirationDate }) => {
  const { daysRemaining, severity } = calculateTagExpiry(expirationDate);
  const colorClass = SEVERITY_COLORS[severity] || SEVERITY_COLORS.ok;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold ${colorClass} ${severity === 'expired' ? 'animate-pulse' : ''}`}>
      {severity === 'expired' ? 'EXPIRED' : `${daysRemaining}d`}
    </span>
  );
};

// ================================================================
// MAIN COMPONENT
// ================================================================

const Plates = () => {
  // ---- Data State ----
  const [plates, setPlates] = useState<Plate[]>([]);
  const [alerts, setAlerts] = useState<PlateAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ---- UI State ----
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editPlateId, setEditPlateId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // ---- Inventory Filters ----
  const [typeFilter, setTypeFilter] = useState<PlateType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<PlateStatus | 'all'>('all');

  // ================================================================
  // DATA LOADING
  // ================================================================

  const loadData = useCallback(async () => {
    try {
      const [platesData, alertsData] = await Promise.all([
        getAllPlates(),
        getActiveAlerts(),
      ]);
      setPlates(platesData);
      setAlerts(alertsData);
    } catch (error) {
      console.error('Error loading plate data:', error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadData();
      setLoading(false);
    };
    init();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // ================================================================
  // DERIVED DATA (useMemo)
  // ================================================================

  const platesOut = useMemo(() => {
    const assigned = plates.filter(p => p.status === 'assigned' && p.currentAssignment);

    // Sort: overdue first (most overdue at top), then by expected return ascending
    return assigned.sort((a, b) => {
      const aReturn = a.currentAssignment?.expectedReturnDate;
      const bReturn = b.currentAssignment?.expectedReturnDate;

      if (!aReturn && !bReturn) return 0;
      if (!aReturn) return 1;
      if (!bReturn) return -1;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const aDate = new Date(aReturn);
      const bDate = new Date(bReturn);
      aDate.setHours(0, 0, 0, 0);
      bDate.setHours(0, 0, 0, 0);

      const aDiff = aDate.getTime() - today.getTime();
      const bDiff = bDate.getTime() - today.getTime();

      // Both overdue or both not: sort by date ascending
      if (aDiff < 0 && bDiff < 0) return aDiff - bDiff; // most overdue first
      if (aDiff < 0) return -1; // a is overdue, goes first
      if (bDiff < 0) return 1; // b is overdue, goes first
      return aDiff - bDiff; // nearest return first
    });
  }, [plates]);

  const filteredInventory = useMemo(() => {
    return plates.filter(p => {
      if (typeFilter !== 'all' && p.plateType !== typeFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      return true;
    });
  }, [plates, typeFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = plates.length;
    const outNow = plates.filter(p => p.status === 'assigned').length;
    const available = plates.filter(p => p.status === 'available').length;
    const activeAlerts = alerts.length;

    // Expiring soon: buyer's tags within 14 days
    const expiringSoon = plates.filter(p => {
      if (p.plateType !== 'buyer_tag' || !p.expirationDate) return false;
      const { daysRemaining, severity } = calculateTagExpiry(p.expirationDate);
      return daysRemaining > 0 && (severity === 'warning' || severity === 'urgent');
    }).length;

    // Check if any plates-out are overdue
    const hasOverdue = platesOut.some(p => {
      if (!p.currentAssignment?.expectedReturnDate) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const returnDate = new Date(p.currentAssignment.expectedReturnDate);
      returnDate.setHours(0, 0, 0, 0);
      return returnDate < today;
    });

    return { total, outNow, available, activeAlerts, expiringSoon, hasOverdue };
  }, [plates, alerts, platesOut]);

  // ================================================================
  // HANDLERS
  // ================================================================

  const showToast = (message: string) => {
    setSuccessToast(message);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleAddPlate = async (data: PlateFormData, photoFile?: File) => {
    setFormLoading(true);
    try {
      const newPlate = await createPlate({
        plateNumber: data.plateNumber,
        plateType: data.plateType,
        expirationDate: data.expirationDate || undefined,
        notes: data.notes || undefined,
      });

      if (newPlate && photoFile) {
        await uploadPlatePhoto(newPlate.id, photoFile);
      }

      if (newPlate) {
        setShowAddForm(false);
        await loadData();
        showToast('Plate added successfully');
      }
    } catch (error) {
      console.error('Error adding plate:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditPlate = async (data: PlateFormData, photoFile?: File) => {
    if (!editPlateId) return;
    setFormLoading(true);
    try {
      const success = await updatePlate(editPlateId, {
        plateNumber: data.plateNumber,
        plateType: data.plateType,
        expirationDate: data.expirationDate || undefined,
        notes: data.notes || undefined,
      });

      if (success && photoFile) {
        await uploadPlatePhoto(editPlateId, photoFile);
      }

      if (success) {
        setEditPlateId(null);
        await loadData();
        showToast('Plate updated successfully');
      }
    } catch (error) {
      console.error('Error editing plate:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeletePlate = async (plateId: string, plateNumber: string) => {
    if (!confirm(`Delete plate ${plateNumber}? This cannot be undone.`)) return;
    setActionLoading(plateId);
    try {
      const success = await deletePlate(plateId);
      if (success) {
        await loadData();
        showToast('Plate deleted');
      }
    } catch (error) {
      console.error('Error deleting plate:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkReturned = async (plate: Plate) => {
    if (!plate.currentAssignment) return;
    setActionLoading(plate.id);
    try {
      const success = await returnPlateAssignment(plate.currentAssignment.id, true);
      if (success) {
        await loadData();
        showToast(`${plate.plateNumber} marked as returned`);
      }
    } catch (error) {
      console.error('Error marking plate returned:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleHistory = (plateId: string) => {
    setExpandedHistoryId(prev => prev === plateId ? null : plateId);
  };

  // ================================================================
  // LOADING STATE
  // ================================================================

  if (loading) {
    return (
      <>
        <AdminHeader />
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <Loader2 size={32} className="text-tj-gold animate-spin mx-auto mb-4" />
            <p className="text-gray-500 text-xs uppercase tracking-widest">Loading plate data...</p>
          </div>
        </div>
      </>
    );
  }

  // ================================================================
  // RENDER
  // ================================================================

  return (
    <>
      <AdminHeader />

      {/* Success Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-900/90 border border-green-500/50 text-green-300 px-4 py-3 text-sm flex items-center gap-2 shadow-lg">
          <CheckCircle size={16} />
          {successToast}
        </div>
      )}

      <div className="min-h-screen bg-black p-4 md:p-8 lg:p-12 font-sans text-gray-100 relative">
        <div className="max-w-[1800px] mx-auto">

          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="font-display text-2xl text-white tracking-widest flex items-center gap-3">
                <CreditCard className="text-tj-gold" size={24} />
                PLATE TRACKING
              </h1>
              <p className="text-xs text-gray-500 font-mono mt-1 uppercase tracking-widest">
                Where are my plates right now
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="mt-3 md:mt-0 px-4 py-2.5 border border-gray-700 text-gray-400 font-bold text-xs uppercase tracking-widest hover:border-tj-gold hover:text-tj-gold transition-all flex items-center gap-2"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-tj-gold/20 to-transparent mb-6" />

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-tj-dark border border-tj-gold/20 hover:border-tj-gold/40 transition-all duration-500 hover:shadow-[0_0_30px_rgba(212,175,55,0.1)] p-4">
              <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Total Plates</p>
              <p className="text-white text-2xl font-mono">{stats.total}</p>
            </div>
            <div className="bg-tj-dark border border-tj-gold/20 hover:border-tj-gold/40 transition-all duration-500 hover:shadow-[0_0_30px_rgba(212,175,55,0.1)] p-4 relative">
              <p className="text-amber-400 text-[10px] uppercase tracking-widest mb-1">Out Now</p>
              <p className={`text-2xl font-mono ${stats.outNow > 0 ? 'text-amber-400' : 'text-gray-600'}`}>
                {stats.outNow}
              </p>
              {stats.hasOverdue && (
                <span className="absolute top-3 right-3 w-6 h-6 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  !
                </span>
              )}
            </div>
            <div className="bg-tj-dark border border-tj-gold/20 hover:border-tj-gold/40 transition-all duration-500 hover:shadow-[0_0_30px_rgba(212,175,55,0.1)] p-4">
              <p className="text-green-400 text-[10px] uppercase tracking-widest mb-1">Available</p>
              <p className="text-green-400 text-2xl font-mono">{stats.available}</p>
            </div>
            <div className="bg-tj-dark border border-tj-gold/20 hover:border-tj-gold/40 transition-all duration-500 hover:shadow-[0_0_30px_rgba(212,175,55,0.1)] p-4">
              <p className={`text-[10px] uppercase tracking-widest mb-1 ${stats.activeAlerts > 0 ? 'text-red-400' : 'text-gray-500'}`}>Active Alerts</p>
              <p className={`text-2xl font-mono ${stats.activeAlerts > 0 ? 'text-red-400' : 'text-gray-600'}`}>
                {stats.activeAlerts}
              </p>
            </div>
            <div className="bg-tj-dark border border-tj-gold/20 hover:border-tj-gold/40 transition-all duration-500 hover:shadow-[0_0_30px_rgba(212,175,55,0.1)] p-4">
              <p className="text-amber-400 text-[10px] uppercase tracking-widest mb-1">Expiring Soon</p>
              <p className={`text-2xl font-mono ${stats.expiringSoon > 0 ? 'text-amber-400' : 'text-gray-600'}`}>
                {stats.expiringSoon}
              </p>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-tj-gold/20 to-transparent mb-6" />

          {/* Split View Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* ============================================ */}
            {/* LEFT PANEL - Plates Currently Out (3/5)      */}
            {/* ============================================ */}
            <div className="lg:col-span-3">
              <div className="bg-tj-dark border border-tj-gold/20">
                {/* Panel Header */}
                <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="text-white font-display tracking-widest text-sm flex items-center gap-2">
                      <Shield size={16} className="text-tj-gold" />
                      PLATES OUT
                    </h2>
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                      {platesOut.length}
                    </span>
                  </div>
                </div>

                {/* Plates Out List */}
                <div className="divide-y divide-gray-800">
                  {platesOut.length === 0 ? (
                    <div className="p-8 text-center">
                      <CheckCircle size={32} className="text-green-500 mx-auto mb-3" />
                      <p className="text-green-400 text-sm font-bold uppercase tracking-widest">All plates accounted for</p>
                      <p className="text-gray-600 text-xs mt-1">No plates currently assigned</p>
                    </div>
                  ) : (
                    platesOut.map(plate => {
                      const assignment = plate.currentAssignment!;
                      const isHistoryOpen = expandedHistoryId === plate.id;
                      const isOverdue = assignment.expectedReturnDate
                        ? (() => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const ret = new Date(assignment.expectedReturnDate);
                            ret.setHours(0, 0, 0, 0);
                            return ret < today;
                          })()
                        : false;

                      return (
                        <div key={plate.id} className={`${isOverdue ? 'bg-red-900/10 border-l-2 border-l-red-500' : ''}`}>
                          <div className="p-4">
                            {/* Top row: plate number + type + days indicator */}
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-white text-lg font-bold font-mono tracking-wider">
                                    {plate.plateNumber}
                                  </span>
                                  <span className={`inline-flex items-center px-2 py-0.5 text-[9px] uppercase tracking-widest font-bold border ${PLATE_TYPE_COLORS[plate.plateType]}`}>
                                    {PLATE_TYPE_LABELS[plate.plateType]}
                                  </span>
                                </div>

                                {/* Customer info */}
                                {assignment.customerName && (
                                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                                    <span className="text-gray-200 text-sm">{assignment.customerName}</span>
                                    {assignment.customerPhone && (
                                      <a
                                        href={`tel:${assignment.customerPhone}`}
                                        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-tj-gold transition-colors"
                                      >
                                        <Phone size={11} />
                                        {assignment.customerPhone}
                                      </a>
                                    )}
                                  </div>
                                )}

                                {/* Vehicle info */}
                                {assignment.vehicle && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    {assignment.vehicle.year} {assignment.vehicle.make} {assignment.vehicle.model}
                                  </p>
                                )}

                                {/* Dates row */}
                                <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-500 font-mono">
                                  <span>Assigned: {formatDateShort(assignment.assignedAt)}</span>
                                  {assignment.expectedReturnDate && (
                                    <span>Return: {formatDateShort(assignment.expectedReturnDate)}</span>
                                  )}
                                </div>

                                {/* Buyer's tag expiration */}
                                {plate.plateType === 'buyer_tag' && plate.expirationDate && (
                                  <div className="mt-2 flex items-center gap-2">
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Tag expires:</span>
                                    <TagExpiryBadge expirationDate={plate.expirationDate} />
                                  </div>
                                )}

                                {/* Notes (truncated) */}
                                {plate.notes && (
                                  <p className="text-[10px] text-gray-600 mt-1 truncate max-w-[300px]" title={plate.notes}>
                                    {plate.notes}
                                  </p>
                                )}
                              </div>

                              {/* Right side: days remaining + actions */}
                              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                <DaysIndicator expectedReturnDate={assignment.expectedReturnDate} />

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleMarkReturned(plate)}
                                    disabled={actionLoading === plate.id}
                                    className="px-3 py-1.5 bg-green-900/30 border border-green-500/50 text-green-400 text-[10px] uppercase tracking-widest font-bold hover:bg-green-900/50 transition-colors disabled:opacity-50 flex items-center gap-1"
                                  >
                                    {actionLoading === plate.id ? (
                                      <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                      <Check size={12} />
                                    )}
                                    Returned
                                  </button>
                                  <button
                                    onClick={() => toggleHistory(plate.id)}
                                    className={`px-3 py-1.5 border text-[10px] uppercase tracking-widest font-bold transition-colors flex items-center gap-1 ${
                                      isHistoryOpen
                                        ? 'border-tj-gold/50 text-tj-gold bg-tj-gold/10'
                                        : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                                    }`}
                                  >
                                    <Clock size={12} />
                                    History
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Expanded History */}
                          {isHistoryOpen && (
                            <div className="px-4 pb-4 border-t border-gray-800/50 mt-0">
                              <PlateAssignmentHistory plateId={plate.id} isOpen={isHistoryOpen} />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* ============================================ */}
            {/* RIGHT PANEL - Plate Inventory (2/5)          */}
            {/* ============================================ */}
            <div className="lg:col-span-2">
              <div className="bg-tj-dark border border-tj-gold/20">
                {/* Panel Header */}
                <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                  <h2 className="text-white font-display tracking-widest text-sm flex items-center gap-2">
                    <CreditCard size={16} className="text-tj-gold" />
                    ALL PLATES
                  </h2>
                  <button
                    onClick={() => { setShowAddForm(true); setEditPlateId(null); }}
                    className="px-3 py-1.5 bg-tj-gold text-black font-bold text-[10px] uppercase tracking-widest hover:bg-white transition-colors flex items-center gap-1"
                  >
                    <Plus size={12} />
                    Add Plate
                  </button>
                </div>

                {/* Add Plate Form */}
                {showAddForm && (
                  <div className="p-4 border-b border-gray-800 bg-black/30">
                    <p className="text-[9px] uppercase tracking-widest text-tj-gold mb-3 font-bold">New Plate</p>
                    <PlateForm
                      onSubmit={handleAddPlate}
                      onCancel={() => setShowAddForm(false)}
                      loading={formLoading}
                    />
                  </div>
                )}

                {/* Filter Row */}
                <div className="p-4 border-b border-gray-800 flex flex-wrap gap-2">
                  <div className="flex items-center gap-1">
                    <Filter size={12} className="text-gray-500" />
                    <select
                      value={typeFilter}
                      onChange={e => setTypeFilter(e.target.value as PlateType | 'all')}
                      className="bg-black border border-gray-700 text-gray-300 text-[10px] uppercase tracking-widest px-2 py-1 focus:border-tj-gold focus:outline-none"
                    >
                      <option value="all">All Types</option>
                      <option value="dealer">Dealer</option>
                      <option value="buyer_tag">Buyer's Tag</option>
                      <option value="permanent">Permanent</option>
                    </select>
                  </div>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as PlateStatus | 'all')}
                    className="bg-black border border-gray-700 text-gray-300 text-[10px] uppercase tracking-widest px-2 py-1 focus:border-tj-gold focus:outline-none"
                  >
                    <option value="all">All Status</option>
                    <option value="available">Available</option>
                    <option value="assigned">Assigned</option>
                    <option value="expired">Expired</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>

                {/* Plate List */}
                <div className="divide-y divide-gray-800 max-h-[70vh] overflow-y-auto">
                  {filteredInventory.length === 0 ? (
                    <div className="p-8 text-center text-gray-600 text-xs uppercase tracking-widest">
                      No plates match filters
                    </div>
                  ) : (
                    filteredInventory.map(plate => {
                      const isEditing = editPlateId === plate.id;
                      const isHistoryOpen = expandedHistoryId === plate.id;
                      const hasActiveAssignment = plate.status === 'assigned' && plate.currentAssignment;

                      return (
                        <div key={plate.id}>
                          {isEditing ? (
                            <div className="p-4 bg-black/30">
                              <p className="text-[9px] uppercase tracking-widest text-tj-gold mb-3 font-bold">Edit Plate</p>
                              <PlateForm
                                initialData={{
                                  plateNumber: plate.plateNumber,
                                  plateType: plate.plateType,
                                  expirationDate: plate.expirationDate || '',
                                  notes: plate.notes || '',
                                }}
                                editId={plate.id}
                                onSubmit={handleEditPlate}
                                onCancel={() => setEditPlateId(null)}
                                loading={formLoading}
                              />
                            </div>
                          ) : (
                            <div className="p-3">
                              {/* Main row */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-white text-sm font-bold font-mono">
                                      {plate.plateNumber}
                                    </span>
                                    <span className={`inline-flex items-center px-1.5 py-0.5 text-[8px] uppercase tracking-widest font-bold border ${PLATE_TYPE_COLORS[plate.plateType]}`}>
                                      {plate.plateType === 'buyer_tag' ? 'Tag' : plate.plateType === 'dealer' ? 'DLR' : 'PMT'}
                                    </span>
                                    <span className={`inline-flex items-center px-1.5 py-0.5 text-[8px] uppercase tracking-widest font-bold border ${PLATE_STATUS_COLORS[plate.status]}`}>
                                      {PLATE_STATUS_LABELS[plate.status]}
                                    </span>
                                  </div>

                                  {/* Expiration with severity */}
                                  {plate.expirationDate && (
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-[10px] text-gray-500">Exp:</span>
                                      <span className="text-[10px] text-gray-400 font-mono">{formatDate(plate.expirationDate)}</span>
                                      {plate.plateType === 'buyer_tag' && (
                                        <TagExpiryBadge expirationDate={plate.expirationDate} />
                                      )}
                                    </div>
                                  )}

                                  {/* Current vehicle (if assigned) */}
                                  {plate.currentAssignment?.vehicle && (
                                    <p className="text-[10px] text-gray-500 mt-0.5">
                                      {plate.currentAssignment.vehicle.year} {plate.currentAssignment.vehicle.make} {plate.currentAssignment.vehicle.model}
                                    </p>
                                  )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button
                                    onClick={() => toggleHistory(plate.id)}
                                    className={`p-1.5 transition-colors ${
                                      isHistoryOpen ? 'text-tj-gold' : 'text-gray-600 hover:text-gray-400'
                                    }`}
                                    title="View History"
                                  >
                                    <Clock size={14} />
                                  </button>
                                  <button
                                    onClick={() => { setEditPlateId(plate.id); setShowAddForm(false); }}
                                    className="p-1.5 text-gray-600 hover:text-gray-400 transition-colors"
                                    title="Edit"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  {!hasActiveAssignment && (
                                    <button
                                      onClick={() => handleDeletePlate(plate.id, plate.plateNumber)}
                                      disabled={actionLoading === plate.id}
                                      className="p-1.5 text-gray-600 hover:text-red-400 transition-colors disabled:opacity-50"
                                      title="Delete"
                                    >
                                      {actionLoading === plate.id ? (
                                        <Loader2 size={14} className="animate-spin" />
                                      ) : (
                                        <Trash2 size={14} />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Expanded History (inventory panel) */}
                          {isHistoryOpen && !isEditing && (
                            <div className="px-3 pb-3 border-t border-gray-800/50">
                              <PlateAssignmentHistory plateId={plate.id} isOpen={isHistoryOpen} />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default Plates;
