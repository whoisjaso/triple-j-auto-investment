
import React, { useEffect, useState } from 'react';
import { useStore } from '../../context/Store';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { analyzeFinancialPerformance } from '../../services/geminiService';
import { Target, Globe, Radio, User, Phone, Mail, Clock, MessageSquare, FileText, Car, ArrowUpRight, TrendingUp, DollarSign, Activity, Wrench, Truck, PaintBucket, X, PieChart, ChevronRight, AlertTriangle, Hourglass, Calendar, LayoutDashboard, Database, LogOut, Menu } from 'lucide-react';
import Markdown from 'react-markdown';
import { BillOfSaleModal } from '../../components/admin/BillOfSaleModal';

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
  ];

  return (
    <>
      <header className="bg-black backdrop-blur-md border-b border-tj-gold/30 sticky top-0 z-[100] shadow-lg">
        <div className="max-w-[1800px] mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo Only - No Text */}
            <Link to="/" className="flex items-center group">
              <img
                src="/GoldTripleJLogo.png"
                alt="Triple J Auto Investment"
                className="w-12 h-12 md:w-14 md:h-14 object-contain transition-transform group-hover:scale-110 drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]"
              />
            </Link>

            {/* Desktop Navigation */}
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

              {/* Documents Button */}
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

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white hover:text-tj-gold transition-colors"
            >
              <Menu size={24} />
            </button>
          </div>

          {/* Mobile Navigation */}
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

      {/* Document Generator Modal */}
      <BillOfSaleModal
        isOpen={showDocModal}
        onClose={() => setShowDocModal(false)}
        vehicles={vehicles}
      />
    </>
  );
};

const Dashboard = () => {
  const { vehicles, leads, connectionError } = useStore();
  const [financialReport, setFinancialReport] = useState<string>("INITIALIZING FINANCIAL NEURAL NETWORK...");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Modal state for Deep Drill Down
  const [showProfitDetails, setShowProfitDetails] = useState(false);

  // --- FINANCIAL CALCULATIONS ---
  const soldVehicles = vehicles.filter(v => v.status === 'Sold');
  const availableVehicles = vehicles.filter(v => v.status === 'Available' || v.status === 'Pending');
  
  // 1. Revenue
  const totalRevenue = soldVehicles.reduce((sum, v) => sum + (v.soldPrice || v.price), 0);
  
  // 2. Cost Breakdown
  const totalAcquisition = soldVehicles.reduce((sum, v) => sum + (v.cost || 0), 0);
  const totalTowing = soldVehicles.reduce((sum, v) => sum + (v.costTowing || 0), 0);
  const totalMechanical = soldVehicles.reduce((sum, v) => sum + (v.costMechanical || 0), 0);
  const totalCosmetic = soldVehicles.reduce((sum, v) => sum + (v.costCosmetic || 0), 0);
  const totalOther = soldVehicles.reduce((sum, v) => sum + (v.costOther || 0), 0);
  
  const totalCost = totalAcquisition + totalTowing + totalMechanical + totalCosmetic + totalOther;
  
  // 3. Profit
  const netProfit = totalRevenue - totalCost;
  const marginPercent = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0.0";

  // 4. Inventory Aging (Optimization Logic)
  const calculateDaysOnMarket = (v: any) => {
    const start = new Date(v.dateAdded || v.date || new Date().getFullYear() + '-01-01');
    const end = v.status === 'Sold' && v.soldDate ? new Date(v.soldDate) : new Date();
    const diff = Math.max(0, end.getTime() - start.getTime());
    return Math.floor(diff / (1000 * 3600 * 24));
  };

  const avgDaysToSell = soldVehicles.length > 0 
    ? Math.round(soldVehicles.reduce((acc, v) => acc + calculateDaysOnMarket(v), 0) / soldVehicles.length) 
    : 0;

  // Identify Stale Assets (> 45 days)
  const staleAssets = availableVehicles.filter(v => calculateDaysOnMarket(v) > 45);

  // Sort sold vehicles by Net Profit (High to Low) for the ledger
  const sortedSoldVehicles = [...soldVehicles].sort((a, b) => {
     const costA = (a.cost || 0) + (a.costTowing || 0) + (a.costMechanical || 0) + (a.costCosmetic || 0) + (a.costOther || 0);
     const profitA = (a.soldPrice || a.price) - costA;
     
     const costB = (b.cost || 0) + (b.costTowing || 0) + (b.costMechanical || 0) + (b.costCosmetic || 0) + (b.costOther || 0);
     const profitB = (b.soldPrice || b.price) - costB;

     return profitB - profitA;
  });

  // --- AI AGENTIC ANALYSIS ---
  useEffect(() => {
    const runFinancialAnalysis = async () => {
       if (soldVehicles.length === 0) {
           setFinancialReport("INSUFFICIENT TRANSACTION DATA FOR PATTERN RECOGNITION.");
           return;
       }
       
       setIsAnalyzing(true);
       // Construct a granular JSON ledger for the AI to "Ultra-Think" on
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
    
    // Debounce analysis to avoid spamming API on small updates
    const timeoutId = setTimeout(() => {
        runFinancialAnalysis();
    }, 2000);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles]); 

  return (
    <>
      <AdminHeader />

      {/* Connection Error Banner */}
      {connectionError && (
        <div className="bg-red-900/90 border-b border-red-700 px-4 py-3 text-center">
          <p className="text-red-200 text-sm font-medium">
            <span className="font-bold">Connection Issue:</span> {connectionError}
          </p>
          <p className="text-red-300/70 text-xs mt-1">
            Some features may not work. Check your internet connection or contact support.
          </p>
        </div>
      )}

      <div className="min-h-screen bg-black p-4 md:p-8 lg:p-12 font-sans text-gray-100 relative">
      {/* DEEP DIVE MODAL (PROFIT LEDGER) */}
      {showProfitDetails && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
              <div className="w-full max-w-7xl bg-tj-dark border border-tj-gold shadow-[0_0_60px_rgba(212,175,55,0.2)] flex flex-col max-h-[90vh]">
                  <div className="p-8 border-b border-gray-800 flex justify-between items-center bg-black/50">
                      <div>
                          <h2 className="text-tj-gold font-display text-2xl tracking-widest mb-1">HIGH-FREQUENCY TRADING LEDGER</h2>
                          <p className="text-xs text-gray-500 uppercase tracking-[0.2em]">Granular Profit & Loss Analysis</p>
                      </div>
                      <button onClick={() => setShowProfitDetails(false)} className="text-gray-500 hover:text-white transition-colors">
                          <X size={24} />
                      </button>
                  </div>
                  
                  <div className="overflow-auto flex-grow">
                      <table className="w-full text-left border-collapse min-w-[600px]">
                          <thead className="bg-black text-gray-500 text-[9px] uppercase tracking-[0.2em] sticky top-0 z-10 shadow-md">
                              <tr>
                                  <th className="p-2 md:p-4 border-b border-gray-800">Asset</th>
                                  <th className="p-2 md:p-4 border-b border-gray-800">Days</th>
                                  <th className="p-2 md:p-4 border-b border-gray-800 text-right">Sold</th>
                                  <th className="p-2 md:p-4 border-b border-gray-800 text-right hidden sm:table-cell">Acq.</th>
                                  <th className="p-2 md:p-4 border-b border-gray-800 text-right hidden lg:table-cell">Tow</th>
                                  <th className="p-2 md:p-4 border-b border-gray-800 text-right hidden lg:table-cell">Mech</th>
                                  <th className="p-2 md:p-4 border-b border-gray-800 text-right hidden lg:table-cell">Cosm</th>
                                  <th className="p-2 md:p-4 border-b border-gray-800 text-right hidden lg:table-cell">Other</th>
                                  <th className="p-2 md:p-4 border-b border-gray-800 text-right">Cost</th>
                                  <th className="p-2 md:p-4 border-b border-gray-800 text-right bg-white/5">P/L</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800 text-xs font-mono">
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
                                      <tr key={v.id} className="hover:bg-white/5 transition-colors">
                                          <td className="p-2 md:p-4 text-white font-bold">
                                              <span className="text-[10px] md:text-xs">{v.year} {v.make} {v.model}</span>
                                              <span className="block text-[8px] md:text-[9px] font-normal text-gray-600 mt-1 truncate max-w-[120px] md:max-w-none">{v.vin}</span>
                                          </td>
                                          <td className="p-2 md:p-4 text-gray-400 text-[10px] md:text-xs">{days}d</td>
                                          <td className="p-2 md:p-4 text-right text-gray-300 text-[10px] md:text-xs">${(v.soldPrice || v.price).toLocaleString()}</td>
                                          <td className="p-2 md:p-4 text-right text-gray-500 hidden sm:table-cell">${acq.toLocaleString()}</td>
                                          <td className="p-2 md:p-4 text-right text-gray-500 hidden lg:table-cell">{tow > 0 ? `$${tow.toLocaleString()}` : '-'}</td>
                                          <td className="p-2 md:p-4 text-right text-gray-500 hidden lg:table-cell">{mech > 0 ? `$${mech.toLocaleString()}` : '-'}</td>
                                          <td className="p-2 md:p-4 text-right text-gray-500 hidden lg:table-cell">{cosm > 0 ? `$${cosm.toLocaleString()}` : '-'}</td>
                                          <td className="p-2 md:p-4 text-right text-gray-500 hidden lg:table-cell">{other > 0 ? `$${other.toLocaleString()}` : '-'}</td>
                                          <td className="p-2 md:p-4 text-right text-red-400/70 text-[10px] md:text-xs">${totalC.toLocaleString()}</td>
                                          <td className={`p-2 md:p-4 text-right font-bold text-[10px] md:text-sm border-l border-gray-800 ${profit >= 0 ? 'text-green-500 bg-green-900/10' : 'text-red-500 bg-red-900/10'}`}>
                                              {profit >= 0 ? '+' : ''}${profit.toLocaleString()}
                                              {profit < 0 && <AlertTriangle size={10} className="inline ml-1 mb-0.5" />}
                                          </td>
                                      </tr>
                                  );
                              })}
                          </tbody>
                          {/* TOTALS FOOTER */}
                          <tfoot className="bg-white/5 text-white font-bold text-[10px] md:text-xs border-t-2 border-tj-gold sticky bottom-0 z-10 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
                              <tr>
                                  <td className="p-2 md:p-4 uppercase tracking-widest text-tj-gold text-[9px] md:text-xs">Total</td>
                                  <td className="p-2 md:p-4 text-gray-500">-</td>
                                  <td className="p-2 md:p-4 text-right">${totalRevenue.toLocaleString()}</td>
                                  <td className="p-2 md:p-4 text-right hidden sm:table-cell">${totalAcquisition.toLocaleString()}</td>
                                  <td className="p-2 md:p-4 text-right text-gray-400 hidden lg:table-cell">${totalTowing.toLocaleString()}</td>
                                  <td className="p-2 md:p-4 text-right text-gray-400 hidden lg:table-cell">${totalMechanical.toLocaleString()}</td>
                                  <td className="p-2 md:p-4 text-right text-gray-400 hidden lg:table-cell">${totalCosmetic.toLocaleString()}</td>
                                  <td className="p-2 md:p-4 text-right text-gray-400 hidden lg:table-cell">${totalOther.toLocaleString()}</td>
                                  <td className="p-2 md:p-4 text-right text-red-400">${totalCost.toLocaleString()}</td>
                                  <td className={`p-2 md:p-4 text-right text-[10px] md:text-sm border-l border-gray-800 ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                      ${netProfit.toLocaleString()}
                                  </td>
                              </tr>
                          </tfoot>
                      </table>
                  </div>
                  <div className="p-6 bg-black/50 border-t border-gray-800 text-right">
                      <button onClick={() => setShowProfitDetails(false)} className="bg-tj-gold text-black font-bold text-xs px-8 py-3 uppercase tracking-widest hover:bg-white transition-colors">
                          Close Ledger
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div className="max-w-[1600px] mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b border-gray-800 pb-6">
          <div>
            <h1 className="font-display text-2xl text-white tracking-widest flex items-center gap-4">
                <Globe className="text-tj-gold animate-pulse" /> 
                SMART COMMAND DECK
            </h1>
            <p className="text-xs text-gray-500 font-mono mt-2">FINANCIAL INTELLIGENCE UNIT ACTIVE</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap items-center gap-4 md:gap-6">
             <div className="text-right">
                 <p className="text-[9px] uppercase tracking-widest text-gray-500">Net Yield (All-Time)</p>
                 <p className={`font-display text-lg md:text-xl tracking-widest ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${netProfit.toLocaleString()}
                 </p>
             </div>
             <div className="h-8 w-px bg-gray-800 hidden md:block"></div>
             <div className="text-right">
                 <p className="text-[9px] uppercase tracking-widest text-gray-500">Avg Profit Margin</p>
                 <p className="font-mono text-lg md:text-xl text-tj-gold">{marginPercent}%</p>
             </div>
             <div className="h-8 w-px bg-gray-800 hidden md:block"></div>
             <div className="text-right">
                 <p className="text-[9px] uppercase tracking-widest text-gray-500">Avg Turn Speed</p>
                 <p className="font-mono text-lg md:text-xl text-white">{avgDaysToSell} <span className="text-xs text-gray-500">Days</span></p>
             </div>
          </div>
        </header>

        {/* MAIN GRID: PROFIT vs INTELLIGENCE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            
            {/* LEFT: FINANCIAL SNAPSHOT */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* INTERACTIVE PROFIT CARD */}
                <button 
                    onClick={() => setShowProfitDetails(true)}
                    className="w-full text-left bg-tj-dark border border-tj-gold/20 p-10 relative overflow-hidden group hover:border-tj-gold transition-all duration-500 hover:shadow-[0_0_30px_rgba(212,175,55,0.1)]"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-50 transition-opacity duration-500">
                        <DollarSign size={80} className="text-green-900 group-hover:text-green-500 transition-colors" />
                    </div>
                    <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0 flex items-center gap-2 text-tj-gold text-xs uppercase tracking-widest font-bold">
                        View Drill-Down Ledger <ChevronRight size={14} />
                    </div>
                    
                    <p className="text-gray-500 text-[10px] uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                        Total Net Profit Generated <PieChart size={12} />
                    </p>
                    <h2 className="text-6xl font-display text-white tracking-tight mb-4 group-hover:text-tj-gold transition-colors">${netProfit.toLocaleString()}</h2>
                    <div className="flex items-center gap-4 text-xs font-mono text-gray-400">
                        <span>Gross Revenue: ${totalRevenue.toLocaleString()}</span>
                        <span className="text-gray-600">|</span>
                        <span>Total Expenses: ${totalCost.toLocaleString()}</span>
                    </div>
                </button>

                {/* EXPENSE BREAKDOWN ROW */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-black border border-gray-800 p-6 flex flex-col justify-between hover:border-red-900/50 transition-colors group">
                        <div className="flex items-center gap-3 mb-4 text-gray-500 group-hover:text-white transition-colors">
                            <Truck size={16} />
                            <span className="text-[10px] uppercase tracking-widest">Logistics</span>
                        </div>
                        <p className="text-xl text-white font-mono">${totalTowing.toLocaleString()}</p>
                    </div>

                    <div className="bg-black border border-gray-800 p-6 flex flex-col justify-between hover:border-red-900/50 transition-colors group">
                        <div className="flex items-center gap-3 mb-4 text-gray-500 group-hover:text-white transition-colors">
                            <Wrench size={16} />
                            <span className="text-[10px] uppercase tracking-widest">Mechanical</span>
                        </div>
                        <p className="text-xl text-white font-mono">${totalMechanical.toLocaleString()}</p>
                    </div>

                    <div className="bg-black border border-gray-800 p-6 flex flex-col justify-between hover:border-red-900/50 transition-colors group">
                        <div className="flex items-center gap-3 mb-4 text-gray-500 group-hover:text-white transition-colors">
                            <PaintBucket size={16} />
                            <span className="text-[10px] uppercase tracking-widest">Cosmetic</span>
                        </div>
                        <p className="text-xl text-white font-mono">${totalCosmetic.toLocaleString()}</p>
                    </div>
                     <div className="bg-black border border-gray-800 p-6 flex flex-col justify-between hover:border-red-900/50 transition-colors group">
                        <div className="flex items-center gap-3 mb-4 text-gray-500 group-hover:text-white transition-colors">
                            <FileText size={16} />
                            <span className="text-[10px] uppercase tracking-widest">Other Fees</span>
                        </div>
                        <p className="text-xl text-white font-mono">${totalOther.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* RIGHT: INVENTORY VELOCITY & AI ADVISOR */}
            <div className="lg:col-span-1 flex flex-col gap-6">
                 {/* Inventory Aging / Stale Assets */}
                 <div className="bg-black border border-white/10 p-6 relative overflow-hidden">
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[10px] uppercase tracking-widest text-white flex items-center gap-2">
                           <Hourglass size={14} className="text-tj-gold" /> Velocity Watchlist
                        </h3>
                        <span className="text-[9px] text-gray-500">ASSETS {'>'} 45 DAYS</span>
                     </div>
                     
                     <div className="space-y-3 h-[150px] sm:h-[180px] md:h-[200px] overflow-y-auto custom-scrollbar">
                         {staleAssets.length === 0 ? (
                             <div className="flex flex-col items-center justify-center h-full text-center text-gray-600">
                                 <Activity size={24} className="mb-2 text-green-500" />
                                 <p className="text-[10px] uppercase">All Assets Moving Efficiently</p>
                             </div>
                         ) : (
                             staleAssets.map(v => (
                                 <div key={v.id} className="flex justify-between items-center p-3 bg-red-900/10 border border-red-900/30">
                                     <div>
                                         <div className="text-white text-xs font-bold">{v.year} {v.model}</div>
                                         <div className="text-[9px] text-red-400 font-mono">${v.price.toLocaleString()}</div>
                                     </div>
                                     <div className="text-right">
                                         <div className="text-tj-gold font-mono text-lg">{calculateDaysOnMarket(v)}</div>
                                         <div className="text-[8px] text-gray-500 uppercase">Days Old</div>
                                     </div>
                                 </div>
                             ))
                         )}
                     </div>
                 </div>

                 {/* AI Output */}
                 <div className="bg-black border border-tj-gold/30 p-1 relative flex-grow min-h-[300px]">
                    <div className="absolute top-0 left-0 bg-tj-gold text-black text-[10px] font-bold px-2 py-1 uppercase tracking-widest z-20">
                        CFO AI Protocol
                    </div>
                    
                    <div className="bg-gradient-to-b from-gray-900 to-black p-8 mt-6 h-full overflow-y-auto custom-scrollbar relative">
                        <div className="flex items-center gap-3 mb-6 text-tj-gold border-b border-gray-800 pb-4">
                            {isAnalyzing ? <Radio size={18} className="animate-spin" /> : <Target size={18} />}
                            <span className="text-xs uppercase tracking-widest">{isAnalyzing ? 'Running Forensic Audit...' : 'Forensic Output'}</span>
                        </div>
                        
                        <div className="prose prose-invert prose-p:text-xs prose-p:font-mono prose-p:text-gray-400 prose-headings:text-[10px] prose-headings:uppercase prose-headings:tracking-[0.2em] prose-headings:text-white prose-headings:border-l-2 prose-headings:border-tj-gold prose-headings:pl-3 prose-headings:mb-2 prose-strong:text-tj-gold">
                            <Markdown>{financialReport}</Markdown>
                        </div>
                    </div>
                 </div>
            </div>
        </div>

        {/* LEADS INBOX */}
        <div className="bg-tj-dark border border-gray-800 overflow-hidden">
            <div className="bg-black p-6 border-b border-gray-800 flex justify-between items-center">
                <h3 className="text-white font-display tracking-widest flex items-center gap-3">
                    <MessageSquare size={18} className="text-tj-gold" />
                    INTERCEPTED SIGNALS (CLIENT INTEREST)
                </h3>
                <span className="text-[10px] uppercase tracking-widest text-gray-600">{leads.length} RECORDS FOUND</span>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-black/50 text-gray-500 text-[9px] uppercase tracking-[0.2em]">
                        <tr>
                            <th className="p-3 md:p-6 font-medium">Status</th>
                            <th className="p-3 md:p-6 font-medium">Identity</th>
                            <th className="p-3 md:p-6 font-medium hidden sm:table-cell">Contact</th>
                            <th className="p-3 md:p-6 font-medium hidden md:table-cell">Target Asset</th>
                            <th className="p-3 md:p-6 font-medium hidden lg:table-cell">Time Logged</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 text-sm">
                        {leads.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-12 text-center text-gray-600 font-mono text-xs">
                                    NO ACTIVE SIGNALS DETECTED. LISTENING...
                                </td>
                            </tr>
                        ) : (
                            leads.slice().reverse().map((lead) => (
                                <tr key={lead.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-3 md:p-6">
                                        <span className="px-2 py-1 border border-green-900 text-green-500 text-[9px] uppercase tracking-widest bg-green-900/10">
                                            {lead.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-3 md:p-6 text-white font-bold">
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-800 rounded-full flex items-center justify-center text-tj-gold shrink-0">
                                                <User size={12} />
                                            </div>
                                            <span className="text-xs md:text-sm">{lead.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-3 md:p-6 hidden sm:table-cell">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-gray-300 text-xs">
                                                <Mail size={12} className="text-gray-600" /> {lead.email}
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-300 text-xs">
                                                <Phone size={12} className="text-gray-600" /> {lead.phone}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3 md:p-6 text-tj-gold font-mono text-xs hidden md:table-cell">
                                        {lead.interest}
                                    </td>
                                    <td className="p-3 md:p-6 text-gray-500 text-xs font-mono hidden lg:table-cell">
                                        <div className="flex items-center gap-2">
                                            <Clock size={12} />
                                            {new Date(lead.date).toLocaleDateString()} <br/>
                                            {new Date(lead.date).toLocaleTimeString()}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Dashboard;
