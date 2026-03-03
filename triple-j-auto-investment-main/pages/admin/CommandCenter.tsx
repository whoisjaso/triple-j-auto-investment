/**
 * CommandCenter — Unified admin hub
 * Zone 1: Prioritized Action Queue
 * Zone 2: Quick Stats + Pipeline Health
 * Zone 3: Customer Communications Feed
 * Zone 4: Quick Action Buttons
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../../context/Store';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Car, ClipboardCheck, Key, CreditCard, FileText,
  LogOut, Menu, Zap, AlertTriangle, ArrowUp, ArrowRight,
  CheckCircle, Info, RefreshCw, MessageSquare, Plus, Calendar,
  TrendingUp, DollarSign, Users, Loader2, ChevronDown, ChevronUp,
  Send
} from 'lucide-react';
import { BillOfSaleModal } from '../../components/admin/BillOfSaleModal';
import { computeActionQueue, computeQuickStats } from '../../services/actionQueueService';
import { getPipelineStats } from '../../services/followUpService';
import { getRecentCommunications } from '../../services/templateService';
import type { ActionItem, ActionPriority, SentMessage } from '../../types';

// ================================================================
// ADMIN HEADER (duplicated per admin page pattern)
// ================================================================
const AdminHeader = () => {
  const { logout, vehicles } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [showDocModal, setShowDocModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/admin/command-center', label: 'Command Center', icon: Zap },
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/inventory', label: 'Inventory', icon: Car },
    { path: '/admin/registrations', label: 'Registrations', icon: ClipboardCheck },
    { path: '/admin/rentals', label: 'Rentals', icon: Key },
    { path: '/admin/plates', label: 'Plates', icon: CreditCard },
  ];

  return (
    <>
      <header className="bg-black/95 backdrop-blur-xl border-b border-white/[0.06] sticky top-0 z-[100]">
        <div className="max-w-[1800px] mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link to="/" className="flex items-center group">
              <img
                src="/GoldTripleJLogo.png"
                alt="Triple J Auto Investment"
                className="w-12 h-12 md:w-14 md:h-14 object-contain transition-transform group-hover:scale-110 drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]"
              />
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2.5 text-[10px] uppercase tracking-[0.15em] font-bold transition-all ${location.pathname === item.path
                      ? 'bg-tj-gold text-black'
                      : 'text-gray-500 hover:text-white hover:bg-white/[0.04]'
                    }`}
                >
                  <item.icon size={13} />
                  {item.label}
                </Link>
              ))}

              <button
                onClick={() => setShowDocModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 text-[10px] uppercase tracking-[0.15em] font-bold text-gray-500 hover:text-white hover:bg-white/[0.04] transition-all"
              >
                <FileText size={13} />
                Documents
              </button>

              <div className="h-5 w-px bg-white/[0.08] mx-2" />

              <button
                onClick={() => { logout(); navigate('/'); }}
                className="flex items-center gap-2 px-4 py-2.5 text-[10px] uppercase tracking-[0.15em] font-bold text-red-400/70 hover:text-red-300 hover:bg-red-900/10 transition-all"
              >
                <LogOut size={13} />
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
            <nav className="md:hidden border-t border-white/[0.06] py-3 space-y-1">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm uppercase tracking-widest font-bold transition-all ${location.pathname === item.path
                      ? 'bg-tj-gold/10 text-tj-gold border-l-2 border-tj-gold'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              ))}

              <button
                onClick={() => { setShowDocModal(true); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm uppercase tracking-widest font-bold text-gray-400 hover:text-white hover:bg-white/[0.04] transition-all"
              >
                <FileText size={18} />
                Documents
              </button>

              <div className="border-t border-white/[0.06] mt-2 pt-2">
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm uppercase tracking-widest font-bold text-red-400 hover:bg-red-900/10 transition-all"
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
// PRIORITY CONFIG
// ================================================================
const PRIORITY_CONFIG: Record<ActionPriority, { color: string; bg: string; border: string; icon: React.ReactNode; label: string }> = {
  urgent: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: <AlertTriangle size={14} />, label: 'URGENT' },
  high: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: <ArrowUp size={14} />, label: 'HIGH' },
  medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: <ArrowRight size={14} />, label: 'MEDIUM' },
  low: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: <CheckCircle size={14} />, label: 'LOW' },
  info: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: <Info size={14} />, label: 'INFO' },
};

// ================================================================
// ACTION ITEM COMPONENT
// ================================================================
const ActionCard = ({ item }: { item: ActionItem }) => {
  const config = PRIORITY_CONFIG[item.priority];

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-3 border ${config.border} ${config.bg} transition-all hover:bg-white/[0.04]`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`${config.color}`}>{config.icon}</span>
            <span className={`text-[10px] uppercase tracking-widest font-bold ${config.color}`}>
              {config.label}
            </span>
            <span className="text-[10px] text-gray-600 uppercase tracking-widest">
              {item.category}
            </span>
          </div>
          <p className="text-white text-sm font-medium truncate">{item.title}</p>
          <p className="text-gray-500 text-xs mt-0.5 truncate">{item.description}</p>
        </div>
        <Link
          to={getActionLink(item)}
          className="shrink-0 px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold bg-white/[0.06] text-tj-gold hover:bg-tj-gold hover:text-black transition-all"
        >
          {item.actionLabel}
        </Link>
      </div>
    </motion.div>
  );
};

function getActionLink(item: ActionItem): string {
  switch (item.entityType) {
    case 'rental': return '/admin/rentals';
    case 'lead': return '/admin/dashboard';
    case 'registration': return '/admin/registrations';
    case 'vehicle': return '/admin/inventory';
    case 'plate': return '/admin/plates';
    default: return '/admin/command-center';
  }
}

// ================================================================
// STATS TYPES
// ================================================================
type QuickStats = Awaited<ReturnType<typeof computeQuickStats>>;
type PipelineStats = Awaited<ReturnType<typeof getPipelineStats>>;

// ================================================================
// MAIN COMPONENT
// ================================================================
const CommandCenter = () => {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [pipeline, setPipeline] = useState<PipelineStats | null>(null);
  const [comms, setComms] = useState<SentMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [expandedPriority, setExpandedPriority] = useState<Record<string, boolean>>({
    urgent: true, high: true, medium: false, low: false, info: false,
  });

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [actionData, statsData, pipelineData, commsData] = await Promise.all([
      computeActionQueue(),
      computeQuickStats(),
      getPipelineStats(),
      getRecentCommunications(20),
    ]);
    setActions(actionData);
    setStats(statsData);
    setPipeline(pipelineData);
    setComms(commsData);
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
    // Auto-refresh every 60 seconds
    const interval = setInterval(loadAll, 60000);
    return () => clearInterval(interval);
  }, [loadAll]);

  // Group actions by priority
  const grouped = actions.reduce<Record<ActionPriority, ActionItem[]>>((acc, item) => {
    acc[item.priority] = acc[item.priority] || [];
    acc[item.priority].push(item);
    return acc;
  }, { urgent: [], high: [], medium: [], low: [], info: [] });

  const totalActions = actions.length;
  const urgentCount = grouped.urgent.length;

  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
  };

  return (
    <div className="min-h-screen bg-black">
      <AdminHeader />

      <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-6">
        {/* Title bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-xl md:text-2xl font-display tracking-wide flex items-center gap-3">
              <Zap size={20} className="text-tj-gold" />
              Command Center
            </h1>
            <p className="text-gray-600 text-xs mt-1">
              {totalActions} action{totalActions !== 1 ? 's' : ''} pending
              {urgentCount > 0 && <span className="text-red-400 ml-2">{urgentCount} urgent</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-600 text-[10px] uppercase tracking-widest">
              {lastRefresh.toLocaleTimeString()}
            </span>
            <button
              onClick={loadAll}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-tj-gold transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {loading && !stats ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-tj-gold" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ============================================ */}
            {/* ZONE 1: ACTION QUEUE (left, 2 cols on lg) */}
            {/* ============================================ */}
            <motion.div
              className="lg:col-span-2 space-y-3"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={0}
            >
              <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 flex items-center gap-2">
                <Zap size={12} />
                Action Queue
              </h2>

              {totalActions === 0 ? (
                <div className="p-8 border border-white/[0.06] text-center">
                  <CheckCircle size={24} className="text-green-400 mx-auto mb-2" />
                  <p className="text-green-400 text-sm font-bold">All Clear</p>
                  <p className="text-gray-600 text-xs">No pending actions right now.</p>
                </div>
              ) : (
                (['urgent', 'high', 'medium', 'low', 'info'] as ActionPriority[]).map(priority => {
                  const items = grouped[priority];
                  if (items.length === 0) return null;
                  const config = PRIORITY_CONFIG[priority];
                  const isExpanded = expandedPriority[priority];

                  return (
                    <div key={priority}>
                      <button
                        onClick={() => setExpandedPriority(prev => ({ ...prev, [priority]: !prev[priority] }))}
                        className={`w-full flex items-center justify-between px-3 py-2 ${config.bg} border ${config.border} transition-all hover:bg-white/[0.04]`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={config.color}>{config.icon}</span>
                          <span className={`text-[10px] uppercase tracking-widest font-bold ${config.color}`}>
                            {config.label} ({items.length})
                          </span>
                        </div>
                        {isExpanded ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
                      </button>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="space-y-1 mt-1 overflow-hidden"
                          >
                            {items.map(item => (
                              <ActionCard key={item.id} item={item} />
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </motion.div>

            {/* ============================================ */}
            {/* ZONE 2: QUICK STATS + PIPELINE (right col) */}
            {/* ============================================ */}
            <motion.div
              className="space-y-4"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={1}
            >
              {/* Quick Stats */}
              <div className="border border-white/[0.06] p-4 space-y-3">
                <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 flex items-center gap-2">
                  <TrendingUp size={12} />
                  Quick Stats
                </h2>

                {stats && (
                  <div className="space-y-3">
                    <StatRow
                      icon={<Car size={14} />}
                      label="Vehicles"
                      value={`${stats.vehicles.available} avail / ${stats.vehicles.pending} pending / ${stats.vehicles.soldThisMonth} sold`}
                    />
                    <StatRow
                      icon={<DollarSign size={14} />}
                      label="Revenue"
                      value={`$${(stats.revenue.thisMonth / 1000).toFixed(1)}k / $${(stats.revenue.profit / 1000).toFixed(1)}k / ${stats.revenue.margin}%`}
                    />
                    <StatRow
                      icon={<TrendingUp size={14} />}
                      label="Costs"
                      value={`$${(stats.costs.mechanical / 1000).toFixed(1)}k mech / $${(stats.costs.cosmetic / 1000).toFixed(1)}k cos / $${(stats.costs.towing / 1000).toFixed(1)}k tow`}
                    />
                    <StatRow
                      icon={<Users size={14} />}
                      label="Leads"
                      value={`${stats.leads.newThisWeek} new / ${stats.leads.contacted} contacted / ${stats.leads.qualified} qualified`}
                    />
                    <StatRow
                      icon={<ClipboardCheck size={14} />}
                      label="Registrations"
                      value={`${stats.registrations.inProgress} in progress / ${stats.registrations.readyForDelivery} ready`}
                    />
                    <StatRow
                      icon={<Key size={14} />}
                      label="Rentals"
                      value={`${stats.rentals.active} active / $${(stats.rentals.revenueThisMonth / 1000).toFixed(1)}k rev`}
                    />
                  </div>
                )}
              </div>

              {/* Pipeline Health */}
              <div className="border border-white/[0.06] p-4 space-y-3">
                <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 flex items-center gap-2">
                  <Users size={12} />
                  Pipeline Health
                </h2>

                {pipeline && (
                  <div className="grid grid-cols-2 gap-2">
                    <PipelineBadge label="Nurturing" count={pipeline.inNurture} color="text-blue-400" bg="bg-blue-500/10" />
                    <PipelineBadge label="Engaged" count={pipeline.engaged} color="text-green-400" bg="bg-green-500/10" />
                    <PipelineBadge label="Scheduled" count={pipeline.scheduled} color="text-tj-gold" bg="bg-tj-gold/10" />
                    <PipelineBadge label="Cold" count={pipeline.cold} color="text-gray-400" bg="bg-white/[0.04]" />
                  </div>
                )}
              </div>
            </motion.div>

            {/* ============================================ */}
            {/* ZONE 3: COMMS FEED (full width) */}
            {/* ============================================ */}
            <motion.div
              className="lg:col-span-3 border border-white/[0.06] p-4"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={2}
            >
              <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 flex items-center gap-2 mb-3">
                <MessageSquare size={12} />
                Customer Communications
              </h2>

              {comms.length === 0 ? (
                <p className="text-gray-600 text-xs text-center py-4">No recent communications.</p>
              ) : (
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {comms.map(msg => (
                    <div
                      key={msg.id}
                      className="flex items-start gap-3 p-2 hover:bg-white/[0.02] transition-colors"
                    >
                      <Send size={12} className="text-gray-600 mt-1 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs truncate">
                          {msg.channel.toUpperCase()} to {msg.recipient || 'customer'}
                          {msg.subject && <span className="text-gray-500"> — {msg.subject}</span>}
                        </p>
                        <p className="text-gray-600 text-[10px]">
                          {formatTimeAgo(msg.sentAt || msg.createdAt)}
                          <span className={`ml-2 uppercase tracking-widest ${
                            msg.status === 'delivered' ? 'text-green-400' :
                            msg.status === 'failed' ? 'text-red-400' :
                            'text-gray-500'
                          }`}>
                            {msg.status}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* ============================================ */}
            {/* ZONE 4: QUICK ACTIONS (full width) */}
            {/* ============================================ */}
            <motion.div
              className="lg:col-span-3 flex flex-wrap gap-2"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={3}
            >
              <QuickActionBtn to="/admin/inventory" icon={<Plus size={14} />} label="New Vehicle" />
              <QuickActionBtn to="/admin/registrations" icon={<ClipboardCheck size={14} />} label="New Registration" />
              <QuickActionBtn to="/admin/rentals" icon={<Key size={14} />} label="New Rental" />
              <QuickActionBtn to="/admin/dashboard" icon={<Users size={14} />} label="All Leads" />
              <QuickActionBtn to="/admin/templates" icon={<MessageSquare size={14} />} label="Templates" />
              <QuickActionBtn to="/admin/plates" icon={<CreditCard size={14} />} label="Plates" />
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

// ================================================================
// SUB-COMPONENTS
// ================================================================

const StatRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-3">
    <span className="text-gray-600">{icon}</span>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] uppercase tracking-widest text-gray-600">{label}</p>
      <p className="text-white text-xs truncate">{value}</p>
    </div>
  </div>
);

const PipelineBadge = ({ label, count, color, bg }: { label: string; count: number; color: string; bg: string }) => (
  <div className={`p-2 ${bg} text-center`}>
    <p className={`text-lg font-bold ${color}`}>{count}</p>
    <p className="text-[10px] uppercase tracking-widest text-gray-500">{label}</p>
  </div>
);

const QuickActionBtn = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => (
  <Link
    to={to}
    className="flex items-center gap-2 px-4 py-2.5 border border-white/[0.08] text-[10px] uppercase tracking-widest font-bold text-gray-400 hover:text-tj-gold hover:border-tj-gold/30 hover:bg-tj-gold/5 transition-all"
  >
    {icon}
    {label}
  </Link>
);

function formatTimeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hr ago`;
  if (diffDay === 1) return 'yesterday';
  return `${diffDay}d ago`;
}

export default CommandCenter;
