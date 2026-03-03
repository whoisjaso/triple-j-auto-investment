import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Car, ClipboardCheck, Key, CreditCard, FileText, LogOut, Menu,
  MessageSquare, Mail, Phone, Check, X, Save, Eye, Send, ChevronDown, ChevronUp,
  RefreshCw, Search, Filter,
} from 'lucide-react';
import { useStore } from '../../context/Store';
import { BillOfSaleModal } from '../../components/admin/BillOfSaleModal';
import {
  getAllTemplates,
  updateTemplate,
  renderTemplate,
  getSentMessages,
} from '../../services/templateService';
import type { MessageTemplate, TemplateCategory, SentMessage } from '../../types';

// ================================================================
// ANIMATION VARIANTS
// ================================================================
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

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
    { path: '/admin/templates', label: 'Templates', icon: MessageSquare },
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

            <nav className="hidden md:flex items-center gap-2">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-5 py-2.5 text-[11px] uppercase tracking-widest font-bold transition-all border ${
                    location.pathname === item.path
                      ? 'bg-tj-gold text-black border-tj-gold'
                      : 'text-gray-400 hover:text-white border-transparent hover:border-white/20 hover:bg-white/[0.04]'
                  }`}
                >
                  <item.icon size={14} />
                  {item.label}
                </Link>
              ))}

              <button
                onClick={() => setShowDocModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 text-[11px] uppercase tracking-widest font-bold text-gray-400 hover:text-white border border-transparent hover:border-white/20 hover:bg-white/[0.04] transition-all"
              >
                <FileText size={14} />
                Documents
              </button>

              <div className="h-5 w-px bg-white/[0.08] mx-2" />

              <button
                onClick={() => { logout(); navigate('/'); }}
                className="flex items-center gap-2 px-4 py-2.5 text-[11px] uppercase tracking-widest font-bold text-red-400/70 hover:text-red-300 hover:bg-red-900/10 transition-all"
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
            <nav className="md:hidden border-t border-white/[0.06] py-4 space-y-2">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm uppercase tracking-widest font-bold transition-all ${
                    location.pathname === item.path
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
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm uppercase tracking-widest font-bold text-red-400/70 hover:text-red-300 hover:bg-red-900/10 transition-all"
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
// CONSTANTS
// ================================================================
const CATEGORIES: { key: TemplateCategory; label: string; icon: typeof MessageSquare }[] = [
  { key: 'lead_nurture', label: 'Lead Nurture', icon: MessageSquare },
  { key: 'registration', label: 'Registration', icon: ClipboardCheck },
  { key: 'rental', label: 'Rental', icon: Key },
  { key: 'owner', label: 'Owner', icon: Car },
  { key: 'system', label: 'System', icon: LayoutDashboard },
];

const CHANNEL_ICONS: Record<string, typeof MessageSquare> = {
  sms: MessageSquare,
  email: Mail,
  voice: Phone,
};

const SAMPLE_VARS: Record<string, string> = {
  customer_name: 'John Doe',
  vehicle_year: '2022',
  vehicle_make: 'Toyota',
  vehicle_model: 'Camry',
  vehicle_price: '15,999',
  vehicle_url: 'triplejautoinvestment.com/inventory/123',
  monthly_payment: '399',
  inquiry_count: '5',
  tracker_url: 'triplejautoinvestment.com/track/abc',
  portal_url: 'triplejautoinvestment.com/portal',
  missing_docs: 'Driver License, Proof of Insurance',
  stage_label: 'Submitted to DMV',
  stage_number: '3',
  start_date: '03/10/2026',
  end_date: '03/17/2026',
  return_date: '03/17/2026',
  booking_id: 'R-1042',
  daily_rate: '45',
  balance: '135.00',
};

// ================================================================
// TEMPLATE CARD
// ================================================================
interface TemplateCardProps {
  template: MessageTemplate;
  spanishVersion: MessageTemplate | null;
  onSave: (id: string, updates: { body?: string; subject?: string; isApproved?: boolean; autoSend?: boolean }) => Promise<void>;
  index: number;
}

const TemplateCard = ({ template, spanishVersion, onSave, index }: TemplateCardProps) => {
  const [enBody, setEnBody] = useState(template.body);
  const [esBody, setEsBody] = useState(spanishVersion?.body || '');
  const [enSubject, setEnSubject] = useState(template.subject || '');
  const [isApproved, setIsApproved] = useState(template.isApproved);
  const [autoSend, setAutoSend] = useState(template.autoSend);
  const [showPreview, setShowPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<SentMessage[]>([]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const ChannelIcon = CHANNEL_ICONS[template.channel] || MessageSquare;
  const preview = renderTemplate(enBody, SAMPLE_VARS);

  const handleSave = async () => {
    setSaving(true);
    await onSave(template.id, { body: enBody, subject: enSubject || undefined, isApproved, autoSend });
    if (spanishVersion && esBody !== spanishVersion.body) {
      await onSave(spanishVersion.id, { body: esBody });
    }
    setSaving(false);
    setDirty(false);
  };

  const loadHistory = async () => {
    if (!showHistory) {
      const msgs = await getSentMessages(undefined, undefined, 20);
      setHistory(msgs.filter(m => m.templateKey === template.templateKey));
    }
    setShowHistory(!showHistory);
  };

  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      className="bg-[#080808] border border-white/[0.06] hover:border-tj-gold/20 transition-all duration-500"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className={`p-2 ${template.channel === 'sms' ? 'bg-blue-500/10 text-blue-400' : template.channel === 'email' ? 'bg-purple-500/10 text-purple-400' : 'bg-green-500/10 text-green-400'}`}>
            <ChannelIcon size={16} />
          </div>
          <div>
            <p className="text-white text-sm font-mono">{template.templateKey}</p>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest">{template.channel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isApproved && (
            <span className="text-[10px] uppercase tracking-widest text-green-400 bg-green-500/10 px-2 py-1">
              Approved
            </span>
          )}
          {autoSend && (
            <span className="text-[10px] uppercase tracking-widest text-tj-gold bg-tj-gold/10 px-2 py-1">
              Auto-Send
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Subject (email only) */}
        {template.channel === 'email' && (
          <div>
            <label className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 block">Subject</label>
            <input
              type="text"
              value={enSubject}
              onChange={e => { setEnSubject(e.target.value); setDirty(true); }}
              className="w-full bg-black border border-white/[0.08] text-white text-sm px-3 py-2 focus:border-tj-gold/50 focus:outline-none transition-colors"
            />
          </div>
        )}

        {/* EN/ES Side-by-side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 block">English</label>
            <textarea
              value={enBody}
              onChange={e => { setEnBody(e.target.value); setDirty(true); }}
              rows={4}
              className="w-full bg-black border border-white/[0.08] text-white text-sm px-3 py-2 focus:border-tj-gold/50 focus:outline-none transition-colors resize-none font-mono"
            />
          </div>
          <div>
            <label className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 block">Spanish</label>
            <textarea
              value={esBody}
              onChange={e => { setEsBody(e.target.value); setDirty(true); }}
              rows={4}
              placeholder={spanishVersion ? '' : 'No Spanish version yet'}
              className="w-full bg-black border border-white/[0.08] text-white text-sm px-3 py-2 focus:border-tj-gold/50 focus:outline-none transition-colors resize-none font-mono"
            />
          </div>
        </div>

        {/* Variables */}
        {template.variables.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-gray-500 text-[10px] uppercase tracking-widest mr-1">Variables:</span>
            {template.variables.map(v => (
              <span key={v} className="text-[10px] font-mono bg-white/[0.04] text-gray-400 px-2 py-0.5 border border-white/[0.06]">
                {`{${v}}`}
              </span>
            ))}
          </div>
        )}

        {/* Preview */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-black border border-tj-gold/20 p-3">
                <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2">Preview (sample data)</p>
                <p className="text-white text-sm leading-relaxed">{preview}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/[0.06]">
          <label className="flex items-center gap-2 cursor-pointer group">
            <button
              onClick={() => { setIsApproved(!isApproved); setDirty(true); }}
              className={`w-5 h-5 border flex items-center justify-center transition-all ${
                isApproved ? 'bg-green-500/20 border-green-500 text-green-400' : 'border-white/20 text-transparent hover:border-white/40'
              }`}
            >
              <Check size={12} />
            </button>
            <span className="text-gray-400 text-xs group-hover:text-white transition-colors">Approved</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer group">
            <button
              onClick={() => { setAutoSend(!autoSend); setDirty(true); }}
              className={`w-5 h-5 border flex items-center justify-center transition-all ${
                autoSend ? 'bg-tj-gold/20 border-tj-gold text-tj-gold' : 'border-white/20 text-transparent hover:border-white/40'
              }`}
            >
              <Check size={12} />
            </button>
            <span className="text-gray-400 text-xs group-hover:text-white transition-colors">Auto-Send</span>
          </label>

          <div className="flex-1" />

          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs transition-colors"
          >
            <Eye size={14} />
            Preview
          </button>

          <button
            onClick={loadHistory}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs transition-colors"
          >
            {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            History
          </button>

          {dirty && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 bg-tj-gold text-black px-4 py-1.5 text-xs font-bold uppercase tracking-widest hover:bg-tj-gold/90 transition-colors disabled:opacity-50"
            >
              <Save size={14} />
              {saving ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>

        {/* Sent History */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="border border-white/[0.06] divide-y divide-white/[0.06]">
                {history.length === 0 ? (
                  <p className="text-gray-500 text-xs p-3 text-center">No messages sent yet</p>
                ) : (
                  history.map(msg => (
                    <div key={msg.id} className="flex items-center justify-between p-3 text-xs">
                      <span className="text-gray-500 font-mono">{new Date(msg.sentAt).toLocaleString()}</span>
                      <span className="text-gray-400">{msg.recipient}</span>
                      <span className={`uppercase tracking-widest text-[10px] px-2 py-0.5 ${
                        msg.status === 'delivered' ? 'text-green-400 bg-green-500/10' :
                        msg.status === 'failed' ? 'text-red-400 bg-red-500/10' :
                        'text-gray-400 bg-white/[0.04]'
                      }`}>
                        {msg.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ================================================================
// MAIN PAGE
// ================================================================
const Templates = () => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('lead_nurture');
  const [successMsg, setSuccessMsg] = useState('');

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    const data = await getAllTemplates();
    setTemplates(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const grouped = useMemo(() => {
    const enTemplates = templates.filter(t => t.language === 'en' && t.category === activeCategory);
    return enTemplates.map(t => ({
      template: t,
      spanishVersion: templates.find(s => s.templateKey === t.templateKey && s.language === 'es') || null,
    }));
  }, [templates, activeCategory]);

  const stats = useMemo(() => ({
    total: templates.filter(t => t.language === 'en').length,
    approved: templates.filter(t => t.language === 'en' && t.isApproved).length,
    autoSend: templates.filter(t => t.language === 'en' && t.autoSend).length,
    bilingual: new Set(
      templates.filter(t => t.language === 'es').map(t => t.templateKey)
    ).size,
  }), [templates]);

  const handleSave = async (id: string, updates: { body?: string; subject?: string; isApproved?: boolean; autoSend?: boolean }) => {
    const ok = await updateTemplate(id, updates);
    if (ok) {
      setSuccessMsg('Template saved');
      setTimeout(() => setSuccessMsg(''), 2000);
      await loadTemplates();
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <AdminHeader />

      {/* Success Toast */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-8 z-50 bg-green-500/10 border border-green-500/30 text-green-400 px-6 py-3 text-sm font-bold uppercase tracking-widest"
          >
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

        <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-8 relative">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-white text-2xl md:text-3xl font-bold tracking-tight">Message Templates</h1>
              <p className="text-gray-500 text-sm mt-1">Manage automated message templates across all channels</p>
            </div>
            <button
              onClick={loadTemplates}
              className="flex items-center gap-2 px-4 py-2 text-[11px] uppercase tracking-widest font-bold text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/20 transition-all"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Templates', value: stats.total },
              { label: 'Approved', value: stats.approved },
              { label: 'Auto-Send On', value: stats.autoSend },
              { label: 'Bilingual', value: stats.bilingual },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="bg-[#080808] border border-white/[0.06] hover:border-tj-gold/30 transition-all duration-500 hover:shadow-[0_0_30px_rgba(212,175,55,0.06)] p-4"
              >
                <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-white text-2xl font-mono">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex items-center gap-2 px-4 py-2 text-[11px] uppercase tracking-widest font-bold transition-all border ${
                  activeCategory === cat.key
                    ? 'bg-tj-gold text-black border-tj-gold'
                    : 'text-gray-400 hover:text-white border-white/[0.08] hover:border-white/20'
                }`}
              >
                <cat.icon size={14} />
                {cat.label}
              </button>
            ))}
          </div>

          {/* Template Cards */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw size={24} className="animate-spin text-tj-gold" />
            </div>
          ) : grouped.length === 0 ? (
            <div className="text-center py-20">
              <MessageSquare size={48} className="text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">No templates in this category</p>
            </div>
          ) : (
            <div className="space-y-4">
              {grouped.map((item, i) => (
                <TemplateCard
                  key={item.template.id}
                  template={item.template}
                  spanishVersion={item.spanishVersion}
                  onSave={handleSave}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Templates;
