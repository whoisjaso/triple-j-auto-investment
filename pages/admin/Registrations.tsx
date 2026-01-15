/**
 * Admin Registration Ledger - Full 7-Stage Workflow Management
 * Provides complete control over registration status tracking
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
  Loader2
} from 'lucide-react';
import {
  getAllRegistrations,
  createRegistration,
  updateStageStatus,
  blockStage,
  addStageNotes,
  getRegistrationById
} from '../../services/registrationService';
import {
  Registration,
  RegistrationStage,
  RegistrationStageKey,
  RegistrationStageStatus,
  REGISTRATION_STAGES,
  OWNERSHIP_COLORS,
  STATUS_COLORS
} from '../../types';

// Stage icons mapping
const STAGE_ICONS: Record<string, React.ReactNode> = {
  payment: <Shield size={16} />,
  insurance: <FileText size={16} />,
  inspection: <ClipboardCheck size={16} />,
  submission: <FileText size={16} />,
  dmv_processing: <Building size={16} />,
  approved: <CheckCircle size={16} />,
  ready: <Package size={16} />
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

  // Create form state
  const [createForm, setCreateForm] = useState({
    vehicleId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    vin: '',
    vehicleYear: new Date().getFullYear(),
    vehicleMake: '',
    vehicleModel: ''
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
      reg.currentStatus === statusFilter ||
      (statusFilter === 'action_required' && reg.stages?.some(s => s.status === 'pending' && s.ownership === 'customer'));

    return matchesSearch && matchesStatus;
  });

  // Handle stage status update
  const handleStageUpdate = async (
    registrationId: string,
    stageKey: RegistrationStageKey,
    newStatus: RegistrationStageStatus,
    blockedReason?: string
  ) => {
    setActionLoading(`${registrationId}-${stageKey}`);
    try {
      const success = await updateStageStatus(
        registrationId,
        stageKey,
        newStatus,
        blockedReason ? { blockedReason } : undefined
      );
      if (success) {
        await loadRegistrations();
      }
    } catch (error) {
      console.error('Error updating stage:', error);
    } finally {
      setActionLoading(null);
    }
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
        vin: createForm.vin,
        vehicleYear: createForm.vehicleYear,
        vehicleMake: createForm.vehicleMake,
        vehicleModel: createForm.vehicleModel
      });

      if (result) {
        await loadRegistrations();
        setShowCreateModal(false);
        setCreateForm({
          vehicleId: '',
          customerName: '',
          customerEmail: '',
          customerPhone: '',
          vin: '',
          vehicleYear: new Date().getFullYear(),
          vehicleMake: '',
          vehicleModel: ''
        });
      }
    } catch (error) {
      console.error('Error creating registration:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Copy tracker link
  const copyTrackerLink = (orderId: string) => {
    const link = `${window.location.origin}/#/track/${orderId}`;
    navigator.clipboard.writeText(link);
  };

  // Get stage for a registration
  const getStage = (reg: Registration, stageKey: RegistrationStageKey): RegistrationStage | undefined => {
    return reg.stages?.find(s => s.stageKey === stageKey);
  };

  // Get status icon
  const getStatusIcon = (status: RegistrationStageStatus, size: number = 14) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="text-green-400" size={size} />;
      case 'pending':
        return <Clock className="text-amber-400" size={size} />;
      case 'blocked':
        return <AlertCircle className="text-red-400" size={size} />;
      default:
        return <Circle className="text-gray-600" size={size} />;
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
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
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-display text-white tracking-wide mb-1">
              Registration Ledger
            </h1>
            <p className="text-gray-500 text-sm">
              7-Stage workflow management with full audit trail
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
            <option value="pending">Pending</option>
            <option value="complete">Complete</option>
            <option value="blocked">Blocked</option>
            <option value="action_required">Action Required</option>
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
              {registrations.filter(r => r.currentStatus === 'pending').length}
            </p>
          </div>
          <div className="bg-tj-dark border border-gray-800 p-4">
            <p className="text-red-400 text-[10px] uppercase tracking-widest mb-1">Blocked</p>
            <p className="text-red-400 text-2xl font-mono">
              {registrations.filter(r => r.stages?.some(s => s.status === 'blocked')).length}
            </p>
          </div>
          <div className="bg-tj-dark border border-gray-800 p-4">
            <p className="text-green-400 text-[10px] uppercase tracking-widest mb-1">Complete</p>
            <p className="text-green-400 text-2xl font-mono">
              {registrations.filter(r => r.currentStatus === 'complete' && r.currentStage === 'ready').length}
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
                      reg.currentStatus === 'complete'
                        ? 'bg-green-500/20 border-green-500/50'
                        : reg.currentStatus === 'blocked' || reg.stages?.some(s => s.status === 'blocked')
                        ? 'bg-red-500/20 border-red-500/50'
                        : 'bg-amber-500/20 border-amber-500/50'
                    }`}
                  >
                    {getStatusIcon(
                      reg.stages?.some(s => s.status === 'blocked')
                        ? 'blocked'
                        : reg.currentStatus,
                      18
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
                        OWNERSHIP_COLORS[
                          REGISTRATION_STAGES.find(s => s.key === reg.currentStage)?.ownership || 'dealer'
                        ].bg
                      } ${
                        OWNERSHIP_COLORS[
                          REGISTRATION_STAGES.find(s => s.key === reg.currentStage)?.ownership || 'dealer'
                        ].text
                      } ${
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
                        copyTrackerLink(reg.orderId);
                      }}
                      className="p-2 text-gray-500 hover:text-tj-gold transition-colors"
                      title="Copy tracker link"
                    >
                      <Copy size={16} />
                    </button>
                    <a
                      href={`/#/track/${reg.orderId}`}
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

                    {/* Stage Pipeline */}
                    <h4 className="text-white text-sm uppercase tracking-widest mb-4">Stage Progress</h4>
                    <div className="space-y-3">
                      {REGISTRATION_STAGES.map((stageConfig, index) => {
                        const stage = getStage(reg, stageConfig.key);
                        const status = stage?.status || 'waiting';
                        const ownershipColors = OWNERSHIP_COLORS[stageConfig.ownership];
                        const isLoading = actionLoading === `${reg.id}-${stageConfig.key}`;

                        return (
                          <div
                            key={stageConfig.key}
                            className={`flex items-center gap-4 p-3 border ${
                              status === 'blocked'
                                ? 'border-red-500/30 bg-red-900/10'
                                : status === 'pending'
                                ? 'border-amber-500/30 bg-amber-900/10'
                                : status === 'complete'
                                ? 'border-green-500/30 bg-green-900/10'
                                : 'border-gray-800'
                            }`}
                          >
                            {/* Stage Icon & Number */}
                            <div className="flex items-center gap-3 w-48 shrink-0">
                              <span className="text-gray-600 text-xs font-mono">{index + 1}</span>
                              <div className={status === 'complete' ? 'text-green-500' : status === 'pending' ? 'text-amber-500' : status === 'blocked' ? 'text-red-500' : 'text-gray-600'}>
                                {STAGE_ICONS[stageConfig.key]}
                              </div>
                              <span className="text-white text-sm font-medium">{stageConfig.label}</span>
                            </div>

                            {/* Ownership Badge */}
                            <span
                              className={`px-2 py-0.5 text-[9px] uppercase tracking-wider ${ownershipColors.bg} ${ownershipColors.text} border ${ownershipColors.border} hidden md:inline-block`}
                            >
                              {stageConfig.ownershipLabel}
                            </span>

                            {/* Status & Timing */}
                            <div className="flex-1 text-gray-500 text-xs hidden md:block">
                              {status === 'complete' && stage?.completedAt && (
                                <span className="text-green-400">Completed {formatDate(stage.completedAt)}</span>
                              )}
                              {status === 'pending' && (
                                <span className="text-amber-400">In Progress</span>
                              )}
                              {status === 'blocked' && stage?.blockedReason && (
                                <span className="text-red-400">{stage.blockedReason}</span>
                              )}
                            </div>

                            {/* Status Indicator */}
                            <div className="shrink-0">{getStatusIcon(status)}</div>

                            {/* Actions Dropdown */}
                            <select
                              value={status}
                              onChange={e => {
                                const newStatus = e.target.value as RegistrationStageStatus;
                                if (newStatus === 'blocked') {
                                  const reason = prompt('Enter blocked reason:');
                                  if (reason) {
                                    handleStageUpdate(reg.id, stageConfig.key, newStatus, reason);
                                  }
                                } else {
                                  handleStageUpdate(reg.id, stageConfig.key, newStatus);
                                }
                              }}
                              disabled={isLoading}
                              className="bg-black border border-gray-700 text-white text-xs px-2 py-1 focus:outline-none focus:border-tj-gold disabled:opacity-50"
                            >
                              <option value="waiting">Waiting</option>
                              <option value="pending">Pending</option>
                              <option value="complete">Complete</option>
                              <option value="blocked">Blocked</option>
                            </select>
                          </div>
                        );
                      })}
                    </div>

                    {/* Tracker Link */}
                    <div className="mt-6 pt-6 border-t border-gray-800">
                      <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2">
                        Customer Tracker Link
                      </p>
                      <div className="flex items-center gap-2 bg-black p-3 border border-gray-800">
                        <LinkIcon size={14} className="text-gray-600 shrink-0" />
                        <code className="text-tj-gold text-xs flex-1 truncate">
                          {window.location.origin}/#/track/{reg.orderId}
                        </code>
                        <button
                          onClick={() => copyTrackerLink(reg.orderId)}
                          className="text-gray-500 hover:text-white transition-colors"
                        >
                          <Copy size={14} />
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
                    <option value="">— Select from inventory —</option>
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
                  </div>
                </div>

                {/* Vehicle Info */}
                <div className="border-t border-gray-800 pt-6">
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-4">Vehicle Information</p>
                  <div className="space-y-4">
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
      </div>
    </div>
  );
};

export default Registrations;
