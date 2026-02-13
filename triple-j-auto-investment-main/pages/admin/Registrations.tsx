/**
 * Admin Registration Ledger - 6-Stage Workflow Management
 * Provides complete control over registration status tracking with
 * step-based UI, confirmation dialogs, and audit trail integration.
 *
 * Updated for 6-stage workflow (Phase 02-03):
 * sale_complete -> documents_collected -> submitted_to_dmv ->
 * dmv_processing -> sticker_ready -> sticker_delivered
 * (+ rejected branch from dmv_processing)
 */

import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/Store';
import {
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Copy,
  RefreshCw,
  X,
  Check,
  Circle,
  Shield,
  ClipboardCheck,
  Building,
  Package,
  Car,
  User,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  Link as LinkIcon,
  Loader2,
  Send,
  Bell
} from 'lucide-react';
import {
  getAllRegistrations,
  createRegistration,
  getRegistrationById,
  updateRegistrationStatus,
  updateDocumentChecklist,
  getRegistrationAudit,
  archiveRegistration,
  getTrackingLink
} from '../../services/registrationService';
import { getNotificationHistory } from '../../services/notificationService';
import {
  Registration,
  RegistrationStageKey,
  RegistrationAudit,
  RegistrationNotification,
  REGISTRATION_STAGES,
  VALID_TRANSITIONS,
  OWNERSHIP_COLORS
} from '../../types';
import RegistrationChecker from '../../components/admin/RegistrationChecker';

// Stage icons mapping for 6-stage workflow
const STAGE_ICONS: Record<RegistrationStageKey, React.ReactNode> = {
  sale_complete: <Car size={16} />,
  documents_collected: <FileText size={16} />,
  submitted_to_dmv: <Send size={16} />,
  dmv_processing: <Building size={16} />,
  sticker_ready: <CheckCircle size={16} />,
  sticker_delivered: <Package size={16} />,
  rejected: <AlertCircle size={16} />
};

const Registrations: React.FC = () => {
  const { vehicles, user } = useStore();

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    registrationId: string;
    currentStage: RegistrationStageKey;
    targetStage: RegistrationStageKey;
    requiresNotes: boolean;
  } | null>(null);
  const [confirmNotes, setConfirmNotes] = useState('');

  // Notify customer checkbox state
  const [notifyCustomer, setNotifyCustomer] = useState(true);

  // Audit history state
  const [auditHistory, setAuditHistory] = useState<RegistrationAudit[]>([]);
  const [showAuditHistory, setShowAuditHistory] = useState<string | null>(null);

  // Notification history state
  const [notificationHistory, setNotificationHistory] = useState<RegistrationNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState<string | null>(null);

  // Create form state
  const [createForm, setCreateForm] = useState({
    vehicleId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    vin: '',
    vehicleYear: new Date().getFullYear(),
    vehicleMake: '',
    vehicleModel: '',
    plateNumber: ''
  });

  // Load registrations
  const loadRegistrations = async () => {
    setLoading(true);
    try {
      const data = await getAllRegistrations();
      setRegistrations(data);
    } catch (error) {
      console.error('Error loading registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegistrations();
  }, []);

  // Filter registrations
  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch =
      searchQuery === '' ||
      reg.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.vin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${reg.vehicleYear} ${reg.vehicleMake} ${reg.vehicleModel}`.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'in_progress' && reg.currentStage !== 'sticker_delivered' && reg.currentStage !== 'rejected') ||
      (statusFilter === 'complete' && reg.currentStage === 'sticker_delivered') ||
      (statusFilter === 'rejected' && reg.currentStage === 'rejected');

    return matchesSearch && matchesStatus;
  });

  // Open confirmation dialog for status change
  const openConfirmDialog = (
    registrationId: string,
    currentStage: RegistrationStageKey,
    targetStage: RegistrationStageKey
  ) => {
    setConfirmDialog({
      open: true,
      registrationId,
      currentStage,
      targetStage,
      requiresNotes: targetStage === 'rejected'
    });
    setConfirmNotes('');
    setNotifyCustomer(true);
  };

  // Handle confirmed status change
  const handleConfirmedStatusChange = async () => {
    if (!confirmDialog) return;

    setActionLoading(confirmDialog.registrationId);
    try {
      const success = await updateRegistrationStatus(
        confirmDialog.registrationId,
        confirmDialog.targetStage,
        {
          changeReason: confirmNotes || undefined,
          rejectionNotes: confirmDialog.targetStage === 'rejected' ? confirmNotes : undefined,
          notifyCustomer: notifyCustomer
        }
      );

      if (success) {
        await loadRegistrations();
        setConfirmDialog(null);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle document checklist toggle
  const handleDocToggle = async (
    registrationId: string,
    docKey: string,
    value: boolean
  ) => {
    setActionLoading(registrationId);
    try {
      await updateDocumentChecklist(
        registrationId,
        { [docKey]: value }
      );
      await loadRegistrations();
    } catch (error) {
      console.error('Error updating document:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Load audit history for a registration
  const loadAuditHistory = async (registrationId: string) => {
    const history = await getRegistrationAudit(registrationId);
    setAuditHistory(history);
    setShowAuditHistory(registrationId);
  };

  // Load notification history for a registration
  const loadNotificationHistory = async (registrationId: string) => {
    const history = await getNotificationHistory(registrationId);
    setNotificationHistory(history);
    setShowNotifications(registrationId);
  };

  // Handle create registration
  const handleCreateRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('create');

    try {
      const result = await createRegistration({
        vehicleId: createForm.vehicleId || undefined,
        customerName: createForm.customerName,
        customerEmail: createForm.customerEmail || undefined,
        customerPhone: createForm.customerPhone || undefined,
        customerAddress: createForm.customerAddress || undefined,
        vin: createForm.vin,
        vehicleYear: createForm.vehicleYear,
        vehicleMake: createForm.vehicleMake,
        vehicleModel: createForm.vehicleModel,
        plateNumber: createForm.plateNumber || undefined
      });

      if (result) {
        await loadRegistrations();
        setShowCreateModal(false);
        setCreateForm({
          vehicleId: '',
          customerName: '',
          customerEmail: '',
          customerPhone: '',
          customerAddress: '',
          vin: '',
          vehicleYear: new Date().getFullYear(),
          vehicleMake: '',
          vehicleModel: '',
          plateNumber: ''
        });
      }
    } catch (error) {
      console.error('Error creating registration:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Copy tracker link (using token-based URL)
  const handleCopyLink = async (registration: Registration) => {
    const link = getTrackingLink(registration);
    const fullUrl = `${window.location.origin}/#${link}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopiedId(registration.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Populate form from vehicle
  const populateFromVehicle = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      setCreateForm(prev => ({
        ...prev,
        vehicleId,
        vin: vehicle.vin,
        vehicleYear: vehicle.year,
        vehicleMake: vehicle.make,
        vehicleModel: vehicle.model
      }));
    }
  };

  return (
    <div className="min-h-screen bg-black px-4 md:px-8 pb-4 md:pb-8 pt-32">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-display text-white tracking-wide mb-1">
              Registration Ledger
            </h1>
            <p className="text-gray-500 text-sm">
              6-Stage workflow management with full audit trail
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={loadRegistrations}
              disabled={loading}
              className="p-3 border border-gray-700 hover:border-tj-gold text-gray-400 hover:text-tj-gold transition-colors"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-3 bg-tj-gold text-black font-bold text-sm tracking-wider hover:bg-white transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              New Registration
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              placeholder="Search by order ID, customer, VIN..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-tj-dark border border-gray-700 pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-tj-gold transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-tj-dark border border-gray-700 px-4 py-3 text-white text-sm focus:outline-none focus:border-tj-gold"
          >
            <option value="all">All Status</option>
            <option value="in_progress">In Progress</option>
            <option value="complete">Complete</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-tj-dark border border-gray-800 p-4">
            <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Total</p>
            <p className="text-white text-2xl font-mono">{registrations.length}</p>
          </div>
          <div className="bg-tj-dark border border-gray-800 p-4">
            <p className="text-amber-400 text-[10px] uppercase tracking-widest mb-1">In Progress</p>
            <p className="text-amber-400 text-2xl font-mono">
              {registrations.filter(r => r.currentStage !== 'sticker_delivered' && r.currentStage !== 'rejected').length}
            </p>
          </div>
          <div className="bg-tj-dark border border-gray-800 p-4">
            <p className="text-orange-400 text-[10px] uppercase tracking-widest mb-1">Rejected</p>
            <p className="text-orange-400 text-2xl font-mono">
              {registrations.filter(r => r.currentStage === 'rejected').length}
            </p>
          </div>
          <div className="bg-tj-dark border border-gray-800 p-4">
            <p className="text-green-400 text-[10px] uppercase tracking-widest mb-1">Complete</p>
            <p className="text-green-400 text-2xl font-mono">
              {registrations.filter(r => r.currentStage === 'sticker_delivered').length}
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-tj-gold" size={32} />
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredRegistrations.length === 0 && (
          <div className="text-center py-16 bg-tj-dark border border-gray-800">
            <Car className="mx-auto text-gray-700 mb-4" size={48} />
            <p className="text-gray-500 mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'No registrations match your filters'
                : 'No registrations yet'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-tj-gold text-black font-bold text-sm tracking-wider hover:bg-white transition-colors"
            >
              Create First Registration
            </button>
          </div>
        )}

        {/* Registrations List */}
        {!loading && filteredRegistrations.length > 0 && (
          <div className="space-y-4">
            {filteredRegistrations.map(reg => (
              <div key={reg.id} className="bg-tj-dark border border-gray-800">
                {/* Header Row */}
                <div
                  className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setExpandedId(expandedId === reg.id ? null : reg.id)}
                >
                  <div
                    className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center border ${
                      reg.currentStage === 'sticker_delivered'
                        ? 'bg-green-500/20 border-green-500/50'
                        : reg.currentStage === 'rejected'
                        ? 'bg-red-500/20 border-red-500/50'
                        : 'bg-amber-500/20 border-amber-500/50'
                    }`}
                  >
                    {reg.currentStage === 'sticker_delivered' ? (
                      <CheckCircle className="text-green-400" size={18} />
                    ) : reg.currentStage === 'rejected' ? (
                      <AlertCircle className="text-red-400" size={18} />
                    ) : (
                      <Clock className="text-amber-400" size={18} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 md:gap-4">
                      <span className="text-tj-gold font-mono text-sm">{reg.orderId}</span>
                      <span className="text-white font-medium truncate">
                        {reg.vehicleYear} {reg.vehicleMake} {reg.vehicleModel}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-1">
                      <span className="text-gray-500 text-xs flex items-center gap-1">
                        <User size={12} />
                        {reg.customerName}
                      </span>
                      <span className="text-gray-600 text-xs font-mono">{reg.vin.slice(0, 11)}...</span>
                    </div>
                  </div>

                  {/* Current Stage Badge */}
                  <div className="hidden md:block">
                    <span
                      className={`px-3 py-1 text-[10px] uppercase tracking-wider border ${
                        reg.currentStage === 'rejected'
                          ? 'bg-red-500/20 text-red-400 border-red-500/50'
                          : reg.currentStage === 'sticker_delivered'
                          ? 'bg-green-500/20 text-green-400 border-green-500/50'
                          : OWNERSHIP_COLORS[
                              REGISTRATION_STAGES.find(s => s.key === reg.currentStage)?.ownership || 'dealer'
                            ].bg +
                            ' ' +
                            OWNERSHIP_COLORS[
                              REGISTRATION_STAGES.find(s => s.key === reg.currentStage)?.ownership || 'dealer'
                            ].text +
                            ' ' +
                            OWNERSHIP_COLORS[
                              REGISTRATION_STAGES.find(s => s.key === reg.currentStage)?.ownership || 'dealer'
                            ].border
                      }`}
                    >
                      {REGISTRATION_STAGES.find(s => s.key === reg.currentStage)?.label || reg.currentStage}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleCopyLink(reg);
                      }}
                      className="p-2 text-gray-500 hover:text-tj-gold transition-colors"
                      title="Copy customer tracking link"
                    >
                      {copiedId === reg.id ? (
                        <Check size={16} className="text-green-400" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                    <a
                      href={`/#${getTrackingLink(reg)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="p-2 text-gray-500 hover:text-tj-gold transition-colors"
                      title="Open tracker"
                    >
                      <ExternalLink size={16} />
                    </a>
                    <ChevronDown
                      size={20}
                      className={`text-gray-500 transition-transform ${
                        expandedId === reg.id ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedId === reg.id && (
                  <div className="border-t border-gray-800 p-4 md:p-6">
                    {/* Customer Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-800">
                      <div>
                        <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Customer</p>
                        <p className="text-white font-medium">{reg.customerName}</p>
                      </div>
                      {reg.customerPhone && (
                        <div>
                          <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Phone</p>
                          <a
                            href={`tel:${reg.customerPhone}`}
                            className="text-tj-gold hover:underline flex items-center gap-2"
                          >
                            <Phone size={14} />
                            {reg.customerPhone}
                          </a>
                        </div>
                      )}
                      {reg.customerEmail && (
                        <div>
                          <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Email</p>
                          <a
                            href={`mailto:${reg.customerEmail}`}
                            className="text-tj-gold hover:underline flex items-center gap-2"
                          >
                            <Mail size={14} />
                            {reg.customerEmail}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Document Checklist */}
                    <div className="mb-6 pb-6 border-b border-gray-800">
                      <h4 className="text-white text-sm uppercase tracking-widest mb-4">Document Checklist</h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {[
                          { key: 'docTitleFront', label: 'Title (Front)' },
                          { key: 'docTitleBack', label: 'Title (Back)' },
                          { key: 'doc130u', label: '130-U' },
                          { key: 'docInsurance', label: 'Insurance' },
                          { key: 'docInspection', label: 'Inspection' }
                        ].map(doc => (
                          <button
                            key={doc.key}
                            onClick={() => handleDocToggle(reg.id, doc.key, !reg[doc.key as keyof Registration])}
                            disabled={actionLoading === reg.id}
                            className={`p-3 border flex items-center gap-2 transition-colors disabled:opacity-50 ${
                              reg[doc.key as keyof Registration]
                                ? 'border-green-500/50 bg-green-900/20 text-green-400'
                                : 'border-gray-700 text-gray-500 hover:border-gray-600'
                            }`}
                          >
                            {reg[doc.key as keyof Registration] ? <Check size={14} /> : <Circle size={14} />}
                            <span className="text-xs">{doc.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Pre-Submission Checker */}
                    <RegistrationChecker
                      registration={reg}
                      onRefresh={loadRegistrations}
                    />

                    {/* Stage Progress */}
                    <h4 className="text-white text-sm uppercase tracking-widest mb-4">Registration Progress</h4>
                    <div className="space-y-2">
                      {REGISTRATION_STAGES.filter(s => s.key !== 'rejected').map((stageConfig, index) => {
                        const isCurrent = reg.currentStage === stageConfig.key;
                        const currentStageOrder = REGISTRATION_STAGES.find(s => s.key === reg.currentStage)?.order ?? 0;
                        const isComplete = stageConfig.order < currentStageOrder && reg.currentStage !== 'rejected';
                        const canAdvanceTo = VALID_TRANSITIONS[reg.currentStage]?.includes(stageConfig.key);

                        return (
                          <div
                            key={stageConfig.key}
                            className={`flex items-center gap-4 p-3 border ${
                              isCurrent
                                ? 'border-tj-gold/50 bg-tj-gold/10'
                                : isComplete
                                ? 'border-green-500/30 bg-green-900/10'
                                : 'border-gray-800'
                            }`}
                          >
                            <span className="text-gray-600 text-xs font-mono w-6">{index + 1}</span>
                            <div className={`${isCurrent ? 'text-tj-gold' : isComplete ? 'text-green-500' : 'text-gray-600'}`}>
                              {STAGE_ICONS[stageConfig.key]}
                            </div>
                            <span className={`flex-1 text-sm ${isCurrent ? 'text-white font-medium' : isComplete ? 'text-green-400' : 'text-gray-500'}`}>
                              {stageConfig.label}
                            </span>

                            {/* Milestone date if applicable */}
                            {stageConfig.key === 'sale_complete' && reg.saleDate && (
                              <span className="text-gray-500 text-xs">{formatDate(reg.saleDate)}</span>
                            )}
                            {stageConfig.key === 'submitted_to_dmv' && reg.submissionDate && (
                              <span className="text-gray-500 text-xs">{formatDate(reg.submissionDate)}</span>
                            )}
                            {stageConfig.key === 'sticker_ready' && reg.approvalDate && (
                              <span className="text-gray-500 text-xs">{formatDate(reg.approvalDate)}</span>
                            )}
                            {stageConfig.key === 'sticker_delivered' && reg.deliveryDate && (
                              <span className="text-gray-500 text-xs">{formatDate(reg.deliveryDate)}</span>
                            )}

                            {/* Status indicator */}
                            <div className="shrink-0">
                              {isComplete ? (
                                <CheckCircle className="text-green-400" size={14} />
                              ) : isCurrent ? (
                                <Clock className="text-tj-gold" size={14} />
                              ) : (
                                <Circle className="text-gray-600" size={14} />
                              )}
                            </div>

                            {/* Advance button */}
                            {canAdvanceTo && (
                              <button
                                onClick={() => openConfirmDialog(reg.id, reg.currentStage, stageConfig.key)}
                                disabled={actionLoading === reg.id}
                                className="px-3 py-1 bg-tj-gold text-black text-xs font-bold hover:bg-white transition-colors disabled:opacity-50"
                              >
                                Mark {stageConfig.label.split(' ')[0]}
                              </button>
                            )}
                          </div>
                        );
                      })}

                      {/* Rejected state - show if current or show reject button from dmv_processing */}
                      {reg.currentStage === 'rejected' ? (
                        <div className="flex items-center gap-4 p-3 border border-red-500/50 bg-red-900/20">
                          <AlertCircle className="text-red-400" size={16} />
                          <div className="flex-1">
                            <span className="text-red-400 text-sm font-medium">Rejected by DMV</span>
                            {reg.rejectionNotes && (
                              <p className="text-red-300 text-xs mt-1">{reg.rejectionNotes}</p>
                            )}
                          </div>
                          <button
                            onClick={() => openConfirmDialog(reg.id, 'rejected', 'submitted_to_dmv')}
                            disabled={actionLoading === reg.id}
                            className="px-3 py-1 bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition-colors disabled:opacity-50"
                          >
                            Resubmit
                          </button>
                        </div>
                      ) : reg.currentStage === 'dmv_processing' && (
                        <button
                          onClick={() => openConfirmDialog(reg.id, reg.currentStage, 'rejected')}
                          disabled={actionLoading === reg.id}
                          className="w-full p-3 border border-red-500/30 text-red-400 text-sm hover:bg-red-900/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <AlertCircle size={14} />
                          Mark as Rejected
                        </button>
                      )}
                    </div>

                    {/* Notes Section */}
                    <div className="mt-6 pt-6 border-t border-gray-800">
                      <h4 className="text-white text-sm uppercase tracking-widest mb-2">Admin Notes</h4>
                      <p className="text-gray-400 text-sm">{reg.notes || 'No notes'}</p>
                    </div>

                    {/* Audit & Notification History Links */}
                    <div className="mt-4 flex items-center gap-4">
                      <button
                        onClick={() => loadAuditHistory(reg.id)}
                        className="text-gray-500 text-xs hover:text-tj-gold transition-colors flex items-center gap-1"
                      >
                        <Clock size={12} />
                        View Change History
                      </button>
                      <button
                        onClick={() => loadNotificationHistory(reg.id)}
                        className="flex items-center gap-1.5 text-gray-500 hover:text-tj-gold transition-colors text-xs"
                        title="View notification history"
                      >
                        <Bell size={14} />
                        Notifications
                      </button>
                    </div>

                    {/* Tracker Link */}
                    <div className="mt-6 pt-6 border-t border-gray-800">
                      <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2">
                        Customer Tracker Link
                      </p>
                      <div className="flex items-center gap-2 bg-black p-3 border border-gray-800">
                        <LinkIcon size={14} className="text-gray-600 shrink-0" />
                        <code className="text-tj-gold text-xs flex-1 truncate">
                          {window.location.origin}/#/track/{reg.orderId}-{reg.accessToken}
                        </code>
                        <button
                          onClick={() => handleCopyLink(reg)}
                          className="text-gray-500 hover:text-white transition-colors"
                        >
                          {copiedId === reg.id ? (
                            <Check size={14} className="text-green-400" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-tj-dark border border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-800 flex justify-between items-center sticky top-0 bg-tj-dark">
                <h3 className="text-white font-display text-lg tracking-wide">New Registration</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateRegistration} className="p-6 space-y-6">
                {/* Vehicle Selection */}
                <div>
                  <label className="block text-gray-500 text-[10px] uppercase tracking-widest mb-2">
                    Select Vehicle (Optional)
                  </label>
                  <select
                    value={createForm.vehicleId}
                    onChange={e => populateFromVehicle(e.target.value)}
                    className="w-full bg-black border border-gray-700 px-4 py-3 text-white text-sm focus:outline-none focus:border-tj-gold"
                  >
                    <option value="">-- Select from inventory --</option>
                    {vehicles
                      .filter(v => v.status === 'Sold' || v.status === 'Pending')
                      .map(v => (
                        <option key={v.id} value={v.id}>
                          {v.year} {v.make} {v.model} - {v.vin}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Customer Info */}
                <div className="border-t border-gray-800 pt-6">
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-4">Customer Information</p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-500 text-[10px] uppercase tracking-widest mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={createForm.customerName}
                        onChange={e => setCreateForm(p => ({ ...p, customerName: e.target.value }))}
                        className="w-full bg-black border border-gray-700 px-4 py-3 text-white text-sm focus:outline-none focus:border-tj-gold"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-500 text-[10px] uppercase tracking-widest mb-2">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={createForm.customerPhone}
                          onChange={e => setCreateForm(p => ({ ...p, customerPhone: e.target.value }))}
                          className="w-full bg-black border border-gray-700 px-4 py-3 text-white text-sm focus:outline-none focus:border-tj-gold"
                          placeholder="(555) 123-4567"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-500 text-[10px] uppercase tracking-widest mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={createForm.customerEmail}
                          onChange={e => setCreateForm(p => ({ ...p, customerEmail: e.target.value }))}
                          className="w-full bg-black border border-gray-700 px-4 py-3 text-white text-sm focus:outline-none focus:border-tj-gold"
                          placeholder="john@email.com"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-500 text-[10px] uppercase tracking-widest mb-2">
                        Address
                      </label>
                      <textarea
                        value={createForm.customerAddress}
                        onChange={e => setCreateForm(p => ({ ...p, customerAddress: e.target.value }))}
                        className="w-full bg-black border border-gray-700 px-4 py-3 text-white text-sm focus:outline-none focus:border-tj-gold resize-none"
                        rows={2}
                        placeholder="123 Main St, Houston, TX 77001"
                      />
                    </div>
                  </div>
                </div>

                {/* Vehicle Info */}
                <div className="border-t border-gray-800 pt-6">
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-4">Vehicle Information</p>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-500 text-[10px] uppercase tracking-widest mb-2">
                          VIN *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={17}
                          value={createForm.vin}
                          onChange={e => setCreateForm(p => ({ ...p, vin: e.target.value.toUpperCase() }))}
                          className="w-full bg-black border border-gray-700 px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-tj-gold"
                          placeholder="1HGBH41JXMN109186"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-500 text-[10px] uppercase tracking-widest mb-2">
                          Plate Number
                        </label>
                        <input
                          type="text"
                          value={createForm.plateNumber}
                          onChange={e => setCreateForm(p => ({ ...p, plateNumber: e.target.value.toUpperCase() }))}
                          className="w-full bg-black border border-gray-700 px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-tj-gold"
                          placeholder="ABC-1234"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-gray-500 text-[10px] uppercase tracking-widest mb-2">
                          Year *
                        </label>
                        <input
                          type="number"
                          required
                          min={1900}
                          max={new Date().getFullYear() + 1}
                          value={createForm.vehicleYear}
                          onChange={e => setCreateForm(p => ({ ...p, vehicleYear: parseInt(e.target.value) || 0 }))}
                          className="w-full bg-black border border-gray-700 px-4 py-3 text-white text-sm focus:outline-none focus:border-tj-gold"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-500 text-[10px] uppercase tracking-widest mb-2">
                          Make *
                        </label>
                        <input
                          type="text"
                          required
                          value={createForm.vehicleMake}
                          onChange={e => setCreateForm(p => ({ ...p, vehicleMake: e.target.value }))}
                          className="w-full bg-black border border-gray-700 px-4 py-3 text-white text-sm focus:outline-none focus:border-tj-gold"
                          placeholder="Toyota"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-500 text-[10px] uppercase tracking-widest mb-2">
                          Model *
                        </label>
                        <input
                          type="text"
                          required
                          value={createForm.vehicleModel}
                          onChange={e => setCreateForm(p => ({ ...p, vehicleModel: e.target.value }))}
                          className="w-full bg-black border border-gray-700 px-4 py-3 text-white text-sm focus:outline-none focus:border-tj-gold"
                          placeholder="Camry"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <div className="border-t border-gray-800 pt-6 flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-3 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading === 'create'}
                    className="px-6 py-3 bg-tj-gold text-black font-bold text-sm tracking-wider hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {actionLoading === 'create' ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        Create Registration
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Status Change Confirmation Dialog */}
        {confirmDialog && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-tj-dark border border-gray-700 w-full max-w-md">
              <div className="p-6 border-b border-gray-800">
                <h3 className="text-white font-display text-lg tracking-wide">
                  Confirm Status Change
                </h3>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-gray-400">
                  Change status from{' '}
                  <span className="text-white font-medium">
                    {REGISTRATION_STAGES.find(s => s.key === confirmDialog.currentStage)?.label}
                  </span>
                  {' '}to{' '}
                  <span className={confirmDialog.targetStage === 'rejected' ? 'text-red-400' : 'text-tj-gold'}>
                    {REGISTRATION_STAGES.find(s => s.key === confirmDialog.targetStage)?.label}
                  </span>
                  ?
                </p>

                <div>
                  <label className="block text-gray-500 text-[10px] uppercase tracking-widest mb-2">
                    {confirmDialog.requiresNotes ? 'Rejection Notes (Required)' : 'Change Notes (Optional)'}
                  </label>
                  <textarea
                    value={confirmNotes}
                    onChange={e => setConfirmNotes(e.target.value)}
                    placeholder={confirmDialog.requiresNotes
                      ? 'Enter reason for rejection from DMV...'
                      : 'Add optional note for audit trail...'
                    }
                    className="w-full bg-black border border-gray-700 px-4 py-3 text-white text-sm focus:outline-none focus:border-tj-gold resize-none"
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="notify-customer"
                    checked={notifyCustomer}
                    onChange={e => setNotifyCustomer(e.target.checked)}
                    className="w-4 h-4 accent-tj-gold"
                  />
                  <label htmlFor="notify-customer" className="text-gray-400 text-sm">
                    Notify customer via SMS/Email
                  </label>
                </div>
              </div>

              <div className="p-6 border-t border-gray-800 flex justify-end gap-4">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="px-6 py-3 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmedStatusChange}
                  disabled={actionLoading !== null || (confirmDialog.requiresNotes && !confirmNotes.trim())}
                  className={`px-6 py-3 font-bold text-sm tracking-wider transition-colors disabled:opacity-50 flex items-center gap-2 ${
                    confirmDialog.targetStage === 'rejected'
                      ? 'bg-red-500 text-white hover:bg-red-400'
                      : 'bg-tj-gold text-black hover:bg-white'
                  }`}
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Confirm
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Audit History Modal */}
        {showAuditHistory && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-tj-dark border border-gray-700 w-full max-w-2xl max-h-[80vh] flex flex-col">
              <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                <h3 className="text-white font-display text-lg tracking-wide">
                  Change History
                </h3>
                <button
                  onClick={() => setShowAuditHistory(null)}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {auditHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No change history recorded</p>
                ) : (
                  <div className="space-y-4">
                    {auditHistory.map(audit => (
                      <div key={audit.id} className="border border-gray-800 p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-xs px-2 py-1 ${
                            audit.operation === 'INSERT' ? 'bg-green-500/20 text-green-400' :
                            audit.operation === 'UPDATE' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {audit.operation}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {new Date(audit.changedAt).toLocaleString()}
                          </span>
                        </div>

                        {audit.changeReason && (
                          <p className="text-gray-400 text-sm mb-2 italic">"{audit.changeReason}"</p>
                        )}

                        {audit.changedFields && Object.keys(audit.changedFields).length > 0 && (
                          <div className="space-y-1">
                            {Object.entries(audit.changedFields).map(([field, values]) => (
                              <div key={field} className="text-xs">
                                <span className="text-gray-500">{field}:</span>{' '}
                                <span className="text-red-400 line-through">{String((values as { old: unknown; new: unknown }).old ?? 'null')}</span>
                                {' -> '}
                                <span className="text-green-400">{String((values as { old: unknown; new: unknown }).new ?? 'null')}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notification History Modal */}
        {showNotifications && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-tj-dark border border-gray-700 w-full max-w-2xl max-h-[80vh] flex flex-col">
              <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                <h3 className="text-white font-display text-lg tracking-wide">
                  Notification History
                </h3>
                <button
                  onClick={() => setShowNotifications(null)}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 space-y-3">
                {notificationHistory.length === 0 ? (
                  <p className="text-gray-500 text-sm">No notifications sent yet.</p>
                ) : (
                  notificationHistory.map(n => (
                    <div key={n.id} className="border border-gray-800 p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 uppercase tracking-wider ${
                            n.channel === 'sms'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-purple-500/20 text-purple-400'
                          }`}>
                            {n.channel}
                          </span>
                          <span className={`text-xs ${n.delivered ? 'text-green-400' : n.deliveryError ? 'text-red-400' : 'text-gray-500'}`}>
                            {n.delivered ? 'Delivered' : n.deliveryError ? 'Failed' : 'Pending'}
                          </span>
                        </div>
                        <span className="text-gray-600 text-xs">
                          {new Date(n.sentAt).toLocaleString()}
                        </span>
                      </div>
                      {n.oldStage && n.newStage && (
                        <p className="text-gray-400 text-xs">
                          Stage: {n.oldStage} &rarr; {n.newStage}
                        </p>
                      )}
                      <p className="text-gray-300 text-sm">{n.recipient}</p>
                      {n.deliveryError && (
                        <p className="text-red-400/70 text-xs">Error: {n.deliveryError}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Registrations;
