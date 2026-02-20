
import React, { useEffect, useState } from 'react';
import { useStore } from '../../context/Store';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { analyzeFinancialPerformance } from '../../services/geminiService';
import { Target, Globe, Radio, User, Phone, Mail, Clock, MessageSquare, FileText, Car, TrendingUp, DollarSign, Activity, Wrench, Truck, PaintBucket, X, PieChart, ChevronRight, ChevronDown, AlertTriangle, Hourglass, LayoutDashboard, LogOut, Menu, ClipboardCheck, Key, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Markdown from 'react-markdown';
import { BillOfSaleModal } from '../../components/admin/BillOfSaleModal';
import { AdminBehaviorPanel } from '../../components/admin/AdminBehaviorPanel';

// Admin Navigation Header Component
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

            {/* Desktop Navigation */}
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

// Animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

const Dashboard = () => {
  const { vehicles, leads, connectionError } = useStore();
  const [financialReport, setFinancialReport] = useState<string>("Initializing financial analysis...");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showProfitDetails, setShowProfitDetails] = useState(false);
  const [showBehavior, setShowBehavior] = useState(false);

  // --- FINANCIAL CALCULATIONS ---
  const soldVehicles = vehicles.filter(v => v.status === 'Sold');
  const availableVehicles = vehicles.filter(v => v.status === 'Available' || v.status === 'Pending');

  const totalRevenue = soldVehicles.reduce((sum, v) => sum + (v.soldPrice || v.price), 0);
  const totalAcquisition = soldVehicles.reduce((sum, v) => sum + (v.cost || 0), 0);
  const totalTowing = soldVehicles.reduce((sum, v) => sum + (v.costTowing || 0), 0);
  const totalMechanical = soldVehicles.reduce((sum, v) => sum + (v.costMechanical || 0), 0);
  const totalCosmetic = soldVehicles.reduce((sum, v) => sum + (v.costCosmetic || 0), 0);
  const totalOther = soldVehicles.reduce((sum, v) => sum + (v.costOther || 0), 0);
  const totalCost = totalAcquisition + totalTowing + totalMechanical + totalCosmetic + totalOther;
  const netProfit = totalRevenue - totalCost;
  const marginPercent = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0.0";

  const calculateDaysOnMarket = (v: any) => {
    const start = new Date(v.dateAdded || v.date || new Date().getFullYear() + '-01-01');
    const end = v.status === 'Sold' && v.soldDate ? new Date(v.soldDate) : new Date();
    const diff = Math.max(0, end.getTime() - start.getTime());
    return Math.floor(diff / (1000 * 3600 * 24));
  };

  const avgDaysToSell = soldVehicles.length > 0
    ? Math.round(soldVehicles.reduce((acc, v) => acc + calculateDaysOnMarket(v), 0) / soldVehicles.length)
    : 0;

  const staleAssets = availableVehicles.filter(v => calculateDaysOnMarket(v) > 45);

  const sortedSoldVehicles = [...soldVehicles].sort((a, b) => {
    const costA = (a.cost || 0) + (a.costTowing || 0) + (a.costMechanical || 0) + (a.costCosmetic || 0) + (a.costOther || 0);
    const profitA = (a.soldPrice || a.price) - costA;
    const costB = (b.cost || 0) + (b.costTowing || 0) + (b.costMechanical || 0) + (b.costCosmetic || 0) + (b.costOther || 0);
    const profitB = (b.soldPrice || b.price) - costB;
    return profitB - profitA;
  });

  // --- AI ANALYSIS ---
  useEffect(() => {
    const runFinancialAnalysis = async () => {
      if (soldVehicles.length === 0) {
        setFinancialReport("Insufficient transaction data for analysis.");
        return;
      }

      setIsAnalyzing(true);
      const ledgerData = soldVehicles.map(v => {
        const totalC = (v.cost || 0) + (v.costTowing || 0) + (v.costMechanical || 0) + (v.costCosmetic || 0) + (v.costOther || 0);
        const profit = (v.soldPrice || v.price) - totalC;
        return {
          vehicle: `${v.year} ${v.make} ${v.model}`,
          daysHeld: calculateDaysOnMarket(v),
          vin: v.vin,
          acquisition: v.cost || 0,
          towing: v.costTowing || 0,
          mechanical: v.costMechanical || 0,
          cosmetic: v.costCosmetic || 0,
          other: v.costOther || 0,
          soldPrice: v.soldPrice || v.price,
          netProfit: profit
        };
      });

      const report = await analyzeFinancialPerformance(JSON.stringify(ledgerData, null, 2));
      setFinancialReport(report);
      setIsAnalyzing(false);
    };

    const timeoutId = setTimeout(() => { runFinancialAnalysis(); }, 2000);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles]);

  return (
    <>
      <AdminHeader />

      {connectionError && (
        <div className="bg-red-950/60 border-b border-red-900/30 px-4 py-3 text-center">
          <p className="text-red-300 text-xs font-medium">
            <span className="font-bold">Connection Issue:</span> {connectionError}
          </p>
          <p className="text-red-400/50 text-[10px] mt-1">Some features may be unavailable.</p>
        </div>
      )}

      <div className="min-h-screen bg-black relative">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

        {/* PROFIT LEDGER MODAL */}
        <AnimatePresence>
          {showProfitDetails && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 md:p-6"
            >
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 30, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="w-full max-w-7xl bg-[#060606] border border-white/[0.08] flex flex-col max-h-[90vh] shadow-[0_0_80px_rgba(0,0,0,0.8)]"
              >
                <div className="p-6 md:p-8 border-b border-white/[0.06] flex justify-between items-center shrink-0">
                  <div>
                    <h2 className="text-white font-display text-xl md:text-2xl tracking-wider mb-1">Profit & Loss Ledger</h2>
                    <p className="text-[9px] text-gray-600 uppercase tracking-[0.2em]">Granular breakdown per vehicle</p>
                  </div>
                  <button onClick={() => setShowProfitDetails(false)} className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-white bg-white/[0.04] border border-white/[0.06] hover:border-white/20 transition-all">
                    <X size={16} />
                  </button>
                </div>

                <div className="overflow-auto flex-grow">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead className="bg-black text-gray-600 text-[8px] uppercase tracking-[0.2em] sticky top-0 z-10">
                      <tr>
                        <th className="p-3 md:p-4 border-b border-white/[0.06]">Asset</th>
                        <th className="p-3 md:p-4 border-b border-white/[0.06]">Days</th>
                        <th className="p-3 md:p-4 border-b border-white/[0.06] text-right">Sold</th>
                        <th className="p-3 md:p-4 border-b border-white/[0.06] text-right hidden sm:table-cell">Acq.</th>
                        <th className="p-3 md:p-4 border-b border-white/[0.06] text-right hidden lg:table-cell">Tow</th>
                        <th className="p-3 md:p-4 border-b border-white/[0.06] text-right hidden lg:table-cell">Mech</th>
                        <th className="p-3 md:p-4 border-b border-white/[0.06] text-right hidden lg:table-cell">Cosm</th>
                        <th className="p-3 md:p-4 border-b border-white/[0.06] text-right hidden lg:table-cell">Other</th>
                        <th className="p-3 md:p-4 border-b border-white/[0.06] text-right">Cost</th>
                        <th className="p-3 md:p-4 border-b border-white/[0.06] text-right bg-white/[0.02]">P/L</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03] text-xs font-mono">
                      {sortedSoldVehicles.map(v => {
                        const acq = v.cost || 0;
                        const tow = v.costTowing || 0;
                        const mech = v.costMechanical || 0;
                        const cosm = v.costCosmetic || 0;
                        const other = v.costOther || 0;
                        const totalC = acq + tow + mech + cosm + other;
                        const profit = (v.soldPrice || v.price) - totalC;
                        const days = calculateDaysOnMarket(v);

                        return (
                          <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-3 md:p-4 text-white">
                              <span className="text-[10px] md:text-xs font-bold">{v.year} {v.make} {v.model}</span>
                              <span className="block text-[8px] md:text-[9px] font-normal text-gray-700 mt-0.5 truncate max-w-[120px] md:max-w-none">{v.vin}</span>
                            </td>
                            <td className="p-3 md:p-4 text-gray-500 text-[10px] md:text-xs">{days}d</td>
                            <td className="p-3 md:p-4 text-right text-gray-300 text-[10px] md:text-xs">${(v.soldPrice || v.price).toLocaleString()}</td>
                            <td className="p-3 md:p-4 text-right text-gray-600 hidden sm:table-cell">${acq.toLocaleString()}</td>
                            <td className="p-3 md:p-4 text-right text-gray-600 hidden lg:table-cell">{tow > 0 ? `$${tow.toLocaleString()}` : '—'}</td>
                            <td className="p-3 md:p-4 text-right text-gray-600 hidden lg:table-cell">{mech > 0 ? `$${mech.toLocaleString()}` : '—'}</td>
                            <td className="p-3 md:p-4 text-right text-gray-600 hidden lg:table-cell">{cosm > 0 ? `$${cosm.toLocaleString()}` : '—'}</td>
                            <td className="p-3 md:p-4 text-right text-gray-600 hidden lg:table-cell">{other > 0 ? `$${other.toLocaleString()}` : '—'}</td>
                            <td className="p-3 md:p-4 text-right text-red-400/60 text-[10px] md:text-xs">${totalC.toLocaleString()}</td>
                            <td className={`p-3 md:p-4 text-right font-bold text-[10px] md:text-sm border-l border-white/[0.04] ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {profit >= 0 ? '+' : ''}${profit.toLocaleString()}
                              {profit < 0 && <AlertTriangle size={10} className="inline ml-1 mb-0.5" />}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-white/[0.02] text-white font-bold text-[10px] md:text-xs border-t-2 border-tj-gold/40 sticky bottom-0 z-10">
                      <tr>
                        <td className="p-3 md:p-4 uppercase tracking-widest text-tj-gold text-[9px] md:text-xs">Total</td>
                        <td className="p-3 md:p-4 text-gray-600">—</td>
                        <td className="p-3 md:p-4 text-right">${totalRevenue.toLocaleString()}</td>
                        <td className="p-3 md:p-4 text-right hidden sm:table-cell">${totalAcquisition.toLocaleString()}</td>
                        <td className="p-3 md:p-4 text-right text-gray-500 hidden lg:table-cell">${totalTowing.toLocaleString()}</td>
                        <td className="p-3 md:p-4 text-right text-gray-500 hidden lg:table-cell">${totalMechanical.toLocaleString()}</td>
                        <td className="p-3 md:p-4 text-right text-gray-500 hidden lg:table-cell">${totalCosmetic.toLocaleString()}</td>
                        <td className="p-3 md:p-4 text-right text-gray-500 hidden lg:table-cell">${totalOther.toLocaleString()}</td>
                        <td className="p-3 md:p-4 text-right text-red-400">${totalCost.toLocaleString()}</td>
                        <td className={`p-3 md:p-4 text-right text-[10px] md:text-sm border-l border-white/[0.04] ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          ${netProfit.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className="p-5 border-t border-white/[0.06] text-right shrink-0">
                  <button onClick={() => setShowProfitDetails(false)} className="bg-tj-gold text-black font-bold text-[10px] px-8 py-3 uppercase tracking-[0.2em] hover:bg-white transition-colors">
                    Close Ledger
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-[1600px] mx-auto p-4 md:p-8 lg:p-12 relative z-10">

          {/* HEADER */}
          <motion.header
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 pb-6 border-b border-white/[0.06]"
          >
            <div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-tj-gold animate-pulse" />
                <h1 className="text-tj-gold uppercase tracking-[0.4em] text-[10px] font-bold">Financial Intelligence</h1>
              </div>
            </div>
            <div className="mt-6 md:mt-0 flex flex-wrap items-end gap-6 md:gap-8">
              <div className="text-right">
                <p className="text-[9px] uppercase tracking-[0.2em] text-gray-600 mb-1">Net Yield</p>
                <p className={`font-display text-xl md:text-2xl tracking-wider ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  ${netProfit.toLocaleString()}
                </p>
              </div>
              <div className="h-8 w-px bg-white/[0.06] hidden md:block" />
              <div className="text-right">
                <p className="text-[9px] uppercase tracking-[0.2em] text-gray-600 mb-1">Margin</p>
                <p className="font-mono text-xl md:text-2xl text-tj-gold">{marginPercent}%</p>
              </div>
              <div className="h-8 w-px bg-white/[0.06] hidden md:block" />
              <div className="text-right">
                <p className="text-[9px] uppercase tracking-[0.2em] text-gray-600 mb-1">Avg Turn</p>
                <p className="font-mono text-xl md:text-2xl text-white">{avgDaysToSell} <span className="text-xs text-gray-600">days</span></p>
              </div>
            </div>
          </motion.header>

          {/* MAIN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">

            {/* LEFT: FINANCIAL SNAPSHOT */}
            <div className="lg:col-span-2 space-y-4">

              {/* PROFIT CARD */}
              <motion.button
                custom={0}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                onClick={() => setShowProfitDetails(true)}
                className="w-full text-left bg-[#080808] border border-white/[0.06] p-8 md:p-10 relative overflow-hidden group hover:border-tj-gold/30 transition-all duration-500"
              >
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                  <DollarSign size={80} className="text-green-900 group-hover:text-green-600 transition-colors" />
                </div>
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0 flex items-center gap-2 text-tj-gold text-[10px] uppercase tracking-[0.2em] font-bold">
                  View Full Ledger <ChevronRight size={14} />
                </div>

                <p className="text-gray-600 text-[9px] uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                  <PieChart size={11} /> Total Net Profit
                </p>
                <h2 className="text-5xl md:text-6xl font-display text-white tracking-tight mb-5 group-hover:text-tj-gold transition-colors duration-500">${netProfit.toLocaleString()}</h2>
                <div className="flex items-center gap-4 text-xs font-mono text-gray-600">
                  <span>Revenue: <span className="text-gray-400">${totalRevenue.toLocaleString()}</span></span>
                  <span className="text-gray-800">|</span>
                  <span>Expenses: <span className="text-gray-400">${totalCost.toLocaleString()}</span></span>
                </div>
              </motion.button>

              {/* EXPENSE CARDS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
                {[
                  { icon: Truck, label: 'Logistics', value: totalTowing },
                  { icon: Wrench, label: 'Mechanical', value: totalMechanical },
                  { icon: PaintBucket, label: 'Cosmetic', value: totalCosmetic },
                  { icon: FileText, label: 'Other', value: totalOther },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    custom={i + 1}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                    className="bg-[#080808] border border-white/[0.04] p-5 group hover:border-white/[0.1] transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <item.icon size={13} className="text-gray-700 group-hover:text-tj-gold transition-colors" />
                      <span className="text-[9px] uppercase tracking-[0.2em] text-gray-600">{item.label}</span>
                    </div>
                    <p className="text-lg text-white font-mono">${item.value.toLocaleString()}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* RIGHT: WATCHLIST & AI */}
            <div className="lg:col-span-1 flex flex-col gap-4">

              {/* Velocity Watchlist */}
              <motion.div
                custom={2}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="bg-[#080808] border border-white/[0.06] p-5 relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[9px] uppercase tracking-[0.2em] text-white flex items-center gap-2 font-bold">
                    <Hourglass size={12} className="text-tj-gold" /> Velocity Watchlist
                  </h3>
                  <span className="text-[8px] text-gray-700 uppercase tracking-widest">&gt; 45 Days</span>
                </div>

                <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                  {staleAssets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-gray-700">
                      <Activity size={20} className="mb-2 text-green-500/60" />
                      <p className="text-[9px] uppercase tracking-widest">All assets moving</p>
                    </div>
                  ) : (
                    staleAssets.map(v => (
                      <div key={v.id} className="flex justify-between items-center p-3 bg-red-950/10 border border-red-900/20">
                        <div>
                          <div className="text-white text-xs font-bold">{v.year} {v.model}</div>
                          <div className="text-[9px] text-red-400/70 font-mono">${v.price.toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-tj-gold font-mono text-lg leading-none">{calculateDaysOnMarket(v)}</div>
                          <div className="text-[7px] text-gray-600 uppercase tracking-widest">days</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>

              {/* AI Advisor */}
              <motion.div
                custom={3}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="bg-[#080808] border border-tj-gold/20 relative flex-grow min-h-[280px] flex flex-col"
              >
                <div className="flex items-center justify-between p-4 border-b border-white/[0.06] shrink-0">
                  <div className="flex items-center gap-2">
                    {isAnalyzing ? <Radio size={13} className="text-tj-gold animate-spin" /> : <Target size={13} className="text-tj-gold" />}
                    <span className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-bold">
                      {isAnalyzing ? 'Analyzing...' : 'AI Financial Advisor'}
                    </span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </div>

                <div className="flex-grow p-5 overflow-y-auto custom-scrollbar">
                  <div className="prose prose-invert prose-p:text-[11px] prose-p:font-mono prose-p:text-gray-500 prose-p:leading-relaxed prose-headings:text-[9px] prose-headings:uppercase prose-headings:tracking-[0.2em] prose-headings:text-white prose-headings:border-l-2 prose-headings:border-tj-gold prose-headings:pl-3 prose-headings:mb-2 prose-strong:text-tj-gold prose-ul:text-[11px] prose-ul:text-gray-500 prose-li:text-gray-500">
                    <Markdown>{financialReport}</Markdown>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* BEHAVIOR INTELLIGENCE (collapsible) */}
          <motion.div
            custom={3.5}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="bg-[#080808] border border-white/[0.06] overflow-hidden mb-10"
          >
            <button
              onClick={() => setShowBehavior(!showBehavior)}
              className="w-full p-5 md:p-6 flex justify-between items-center hover:bg-white/[0.02] transition-colors"
            >
              <h3 className="text-white font-display text-lg tracking-wider flex items-center gap-3">
                <Activity size={16} className="text-tj-gold" />
                Behavior Intelligence
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-[9px] uppercase tracking-[0.2em] text-gray-600 font-mono">
                  {showBehavior ? 'Collapse' : 'Expand'}
                </span>
                {showBehavior
                  ? <ChevronDown size={16} className="text-gray-400" />
                  : <ChevronRight size={16} className="text-gray-400" />
                }
              </div>
            </button>
            {showBehavior && (
              <div className="p-5 md:p-6 border-t border-white/[0.06]">
                <AdminBehaviorPanel />
              </div>
            )}
          </motion.div>

          {/* LEADS TABLE */}
          <motion.div
            custom={4}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="bg-[#080808] border border-white/[0.06] overflow-hidden"
          >
            <div className="p-5 md:p-6 border-b border-white/[0.06] flex justify-between items-center">
              <h3 className="text-white font-display text-lg tracking-wider flex items-center gap-3">
                <MessageSquare size={16} className="text-tj-gold" />
                Client Inquiries
              </h3>
              <span className="text-[9px] uppercase tracking-[0.2em] text-gray-600 font-mono">{leads.length} records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-black/40 text-gray-600 text-[8px] uppercase tracking-[0.2em]">
                  <tr>
                    <th className="p-3 md:p-5 font-medium">Status</th>
                    <th className="p-3 md:p-5 font-medium">Client</th>
                    <th className="p-3 md:p-5 font-medium hidden sm:table-cell">Contact</th>
                    <th className="p-3 md:p-5 font-medium hidden md:table-cell">Interest</th>
                    <th className="p-3 md:p-5 font-medium hidden lg:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03] text-sm">
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-gray-700 text-xs">
                        No inquiries yet. They will appear here as customers submit interest.
                      </td>
                    </tr>
                  ) : (
                    leads.slice().reverse().map((lead) => (
                      <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3 md:p-5">
                          <span className="px-2 py-1 border border-green-900/40 text-green-500/80 text-[8px] uppercase tracking-widest bg-green-950/20">
                            {lead.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 md:p-5 text-white">
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-7 h-7 bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-tj-gold shrink-0">
                              <User size={12} />
                            </div>
                            <span className="text-xs font-bold">{lead.name}</span>
                          </div>
                        </td>
                        <td className="p-3 md:p-5 hidden sm:table-cell">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-gray-400 text-xs">
                              <Mail size={11} className="text-gray-700" /> {lead.email}
                            </div>
                            <div className="flex items-center gap-2 text-gray-400 text-xs">
                              <Phone size={11} className="text-gray-700" /> {lead.phone}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 md:p-5 text-tj-gold/70 font-mono text-[11px] hidden md:table-cell max-w-[300px] truncate">
                          {lead.interest}
                        </td>
                        <td className="p-3 md:p-5 text-gray-600 text-[11px] font-mono hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <Clock size={11} className="text-gray-700" />
                            <div>
                              {new Date(lead.date).toLocaleDateString()}
                              <span className="block text-[9px] text-gray-700">{new Date(lead.date).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
