
import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/Store';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { generateVehicleDescription } from '../../services/geminiService';
import { decodeVin } from '../../services/nhtsaService';
import { Vehicle, VehicleStatus } from '../../types';
import { Wand2, Loader2, Search, AlertTriangle, Save, Eye, Database, Cpu, Terminal, ArrowRight, Sheet, RefreshCw, Edit2, X, ImageIcon, Type, Activity, UploadCloud, Trash2, Star, Plus, ShieldAlert, DollarSign, Calendar, Filter, ArrowUpRight, Wrench, Truck, PaintBucket, FileText, Printer, LayoutDashboard, Car, LogOut, Menu } from 'lucide-react';
import { BillOfSaleModal } from '../../components/admin/BillOfSaleModal';

// Shared Admin Header Component
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
      <header className="bg-black/95 backdrop-blur-md border-b border-tj-gold/30 sticky top-0 z-50 shadow-lg">
        <div className="max-w-[1800px] mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo & Brand */}
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src="/GoldTripleJLogo.png"
                alt="Triple J"
                className="w-10 h-10 md:w-12 md:h-12 object-contain transition-transform group-hover:scale-110"
              />
              <div className="hidden sm:block">
                <p className="text-white font-display text-sm md:text-base tracking-wider leading-tight">TRIPLE J</p>
                <p className="text-tj-gold text-[8px] md:text-[9px] uppercase tracking-[0.2em]">Admin Portal</p>
              </div>
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

// Utility: Compress and resize image to avoid LocalStorage limits (approx 5MB total)
const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 800; // Lowered resolution for CRM capability
        const MAX_HEIGHT = 600;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Compress to JPEG with 0.5 quality (Aggressive compression)
            resolve(canvas.toDataURL('image/jpeg', 0.5)); 
        } else {
            resolve(e.target?.result as string); // Fallback
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

const AdminInventory = () => {
  const { vehicles, addVehicle, updateVehicle, removeVehicle, syncWithGoogleSheets, lastSync, resetToDefault, connectionError } = useStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDecoding, setIsDecoding] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLog, setSyncLog] = useState<string[]>([]);
  const [vinError, setVinError] = useState<string | null>(null);
  
  // Search & Sorting State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<VehicleStatus | 'All'>('All');
  const [sortBy, setSortBy] = useState<'year' | 'make' | 'profit' | 'price' | 'status'>('make');

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);

  // Bill of Sale Modal State
  const [showBOSModal, setShowBOSModal] = useState(false);
  const [bosVehicle, setBosVehicle] = useState<Vehicle | null>(null);

  const handleOpenBOS = (vehicle?: Vehicle) => {
    setBosVehicle(vehicle || null);
    setShowBOSModal(true);
  };
  
  const [newCar, setNewCar] = useState<Partial<Vehicle>>({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    price: 0,
    cost: 0, // Default cost
    costTowing: 0,
    costMechanical: 0,
    costCosmetic: 0,
    costOther: 0,
    soldPrice: 0,
    soldDate: '',
    dateAdded: new Date().toISOString().split('T')[0],
    mileage: 0,
    vin: '',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=2070&auto=format&fit=crop', // Default luxury placeholder
    gallery: [],
    diagnostics: [],
    status: VehicleStatus.AVAILABLE,
    registrationStatus: 'Pending'
  });

  // Temp state for diagnostics text area
  const [diagText, setDiagText] = useState('');

  // Drag & Drop State
  const [isDragging, setIsDragging] = useState(false);

  // Preview State for gallery interactions
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);

  useEffect(() => {
    if (newCar.diagnostics) {
        setDiagText(newCar.diagnostics.join('\n'));
    } else {
        setDiagText('');
    }
  }, [newCar.id]); // Reset when ID changes (new car or edit switch)

  const validateVin = (value: string): string | null => {
    if (/[^A-Z0-9]/.test(value)) return 'ALPHANUMERIC_ONLY';
    const forbiddenMatch = value.match(/[IOQ]/);
    if (forbiddenMatch) return `ILLEGAL_CHARACTER '${forbiddenMatch[0]}'`;
    if (value.length !== 17) return `INVALID_LENGTH (${value.length}/17)`;
    return null;
  };

  const executeDecoding = async (vin: string) => {
    setIsDecoding(true);
    setVinError(null);
    
    try {
      const data = await decodeVin(vin);
      if (data) {
         const hasError = data.ErrorCode && data.ErrorCode !== '0';
         const textError = !data.ErrorCode && data.ErrorText && !data.ErrorText.startsWith('0') && !data.ErrorText.toLowerCase().includes('decoded');

        if (hasError || textError) {
           const errorText = data.ErrorText || "Unknown error";
           setVinError(errorText.length > 30 ? "INVALID_VIN_RESPONSE" : errorText);
        } else {
           const modelStrComponents = [data.Model];
           if (data.Series && data.Series !== data.Model && !data.Model?.includes(data.Series)) {
              modelStrComponents.push(data.Series);
           }
           if (data.Trim && !data.Model?.includes(data.Trim)) {
              modelStrComponents.push(data.Trim);
           }
           const modelStr = modelStrComponents.filter(Boolean).join(' ');
           
           let parsedYear = newCar.year || new Date().getFullYear();
           if (data.ModelYear) {
             const y = parseInt(data.ModelYear);
             if (!isNaN(y)) parsedYear = y;
           }

           setNewCar(prev => {
               return {
                  ...prev,
                  make: data.Make || prev.make || '',
                  model: modelStr,
                  year: parsedYear,
               };
           });
           
           // We do NOT auto-generate here anymore because we might want to enter diagnostics first
        }
      } else {
        setVinError("CONNECTION_FAILED");
      }
    } catch (error) {
      setVinError("SYSTEM_FAILURE");
    } finally {
      setIsDecoding(false);
    }
  };

  const handleVinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/\s/g, '');
    setNewCar(prev => ({ ...prev, vin: val }));
    
    if (val.length === 17) {
        const err = validateVin(val);
        setVinError(err);
        if (!err && !isDecoding) {
          executeDecoding(val);
        }
    } else {
        setVinError(null);
    }
  };

  const handleManualDecode = () => {
    if (!newCar.vin) return;
    const err = validateVin(newCar.vin);
    if (err) {
      setVinError(err);
      return;
    }
    executeDecoding(newCar.vin);
  };

  // --- UNIFIED IMAGE HANDLING (FB Marketplace Style) ---
  
  // Helper to get all images in a flat array
  const allImages = [newCar.imageUrl, ...(newCar.gallery || [])].filter(url => url && url.length > 0);

  const processFiles = async (files: FileList) => {
    const promises = Array.from(files).map((file: File) => resizeImage(file));

    Promise.all(promises).then(base64Images => {
      setNewCar(prev => {
        // Filter out the default placeholder if we are adding real photos
        let currentImages = [prev.imageUrl, ...(prev.gallery || [])].filter(Boolean);
        const isPlaceholder = currentImages.length === 1 && currentImages[0].includes('unsplash');
        
        if (isPlaceholder) {
            currentImages = [];
        }

        const combined = [...currentImages, ...base64Images];
        
        return {
          ...prev,
          imageUrl: combined[0] || '',
          gallery: combined.slice(1)
        };
      });
    });
  };

  const handleUnifiedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset value to allow re-upload of same file if needed
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (index: number) => {
    setNewCar(prev => {
        const currentImages = [prev.imageUrl, ...(prev.gallery || [])].filter(Boolean);
        const newImages = currentImages.filter((_, i) => i !== index);
        
        // If we removed everything, revert to placeholder
        if (newImages.length === 0) {
            return {
                ...prev,
                imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=2070&auto=format&fit=crop',
                gallery: []
            };
        }

        return {
            ...prev,
            imageUrl: newImages[0],
            gallery: newImages.slice(1)
        };
    });
  };

  const setAsCover = (index: number) => {
    if (index === 0) return;
    setNewCar(prev => {
        const currentImages = [prev.imageUrl, ...(prev.gallery || [])].filter(Boolean);
        const target = currentImages[index];
        const remaining = currentImages.filter((_, i) => i !== index);
        const newImages = [target, ...remaining];
        
        return {
            ...prev,
            imageUrl: newImages[0],
            gallery: newImages.slice(1)
        };
    });
  };

  // --- END IMAGE HANDLING ---

  const handleGenerateDesc = async () => {
    if (!newCar.make || !newCar.model) return;
    setIsGenerating(true);
    
    // Parse current diagnostics from the text area to pass to AI
    const currentDiagnostics = diagText.split('\n').map(s => s.trim()).filter(Boolean);
    
    const desc = await generateVehicleDescription(
      newCar.make!, 
      newCar.model!, 
      newCar.year || 2024,
      currentDiagnostics
    );
    setNewCar(prev => ({ ...prev, description: desc }));
    setIsGenerating(false);
  };

  const handleEdit = (v: Vehicle) => {
    setEditingId(v.id);
    setNewCar(v);
    setDiagText((v.diagnostics || []).join('\n'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewCar({
      make: '', model: '', year: new Date().getFullYear(), price: 0, mileage: 0, vin: '', description: '', 
      cost: 0, costTowing: 0, costMechanical: 0, costCosmetic: 0, costOther: 0, soldPrice: 0, soldDate: '',
      dateAdded: new Date().toISOString().split('T')[0],
      imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=2070&auto=format&fit=crop',
      gallery: [],
      diagnostics: [],
      status: VehicleStatus.AVAILABLE,
      registrationStatus: 'Pending'
    });
    setDiagText('');
    setVinError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCar.make || !newCar.vin) return;
    
    const processedDiagnostics = diagText.split('\n').map(s => s.trim()).filter(Boolean);

    // Auto-set sold date if status is Sold but no date provided
    let finalSoldDate = newCar.soldDate;
    if (newCar.status === VehicleStatus.SOLD && !finalSoldDate) {
        finalSoldDate = new Date().toISOString().split('T')[0];
    }

    // Auto-set sold price if Sold but no price provided (assume list price)
    let finalSoldPrice = newCar.soldPrice;
    if (newCar.status === VehicleStatus.SOLD && (!finalSoldPrice || finalSoldPrice === 0)) {
        finalSoldPrice = newCar.price;
    }

    const vehiclePayload = {
        ...newCar,
        soldDate: finalSoldDate,
        soldPrice: finalSoldPrice,
        diagnostics: processedDiagnostics
    };
    
    try {
      if (editingId) {
        // Check if vehicle exists before updating
        const existingVehicle = vehicles.find(v => v.id === editingId);
        if (!existingVehicle) {
          alert('Error: Vehicle not found. It may have been deleted.');
          handleCancelEdit();
          return;
        }
        
        await updateVehicle(editingId, vehiclePayload);
        handleCancelEdit(); // Reset form only on success
      } else {
        await addVehicle({
          id: Math.random().toString(36).substr(2, 9),
          ...vehiclePayload as Vehicle
        });
        handleCancelEdit(); // Reset form only on success
      }
    } catch (error) {
      // Error is already handled in updateVehicle/addVehicle, but we don't reset the form
      console.error('Error in handleSubmit:', error);
      // Don't call handleCancelEdit() on error so user can fix and retry
    }
  };

  const handleSheetSync = async () => {
    if(confirm("WARNING: This will overwrite your local edits with data from Google Sheets. Are you sure?")) {
        setIsSyncing(true);
        setSyncLog(['> FORCED SYNC INITIATED...', '> REQUESTING PACKET...']);
        
        const result = await syncWithGoogleSheets();
        
        setSyncLog(prev => [...prev, `> ${result}`, '> SYSTEM SYNCHRONIZED.']);
        setTimeout(() => {
          setIsSyncing(false);
          setSyncLog([]);
        }, 2000);
    }
  };

  // Images for Preview
  const previewImages = [newCar.imageUrl, ...(newCar.gallery || [])].filter(Boolean);

  // Sort & Filter Logic
  const filteredVehicles = vehicles.filter(v => {
     const q = searchQuery.toLowerCase();
     const matchesSearch = (
         v.make.toLowerCase().includes(q) ||
         v.model.toLowerCase().includes(q) ||
         v.vin.toLowerCase().includes(q) ||
         v.year.toString().includes(q)
     );
     const matchesStatus = filterStatus === 'All' || v.status === filterStatus;
     return matchesSearch && matchesStatus;
  });

  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
      const totalCostA = (a.cost || 0) + (a.costTowing || 0) + (a.costMechanical || 0) + (a.costCosmetic || 0) + (a.costOther || 0);
      const totalCostB = (b.cost || 0) + (b.costTowing || 0) + (b.costMechanical || 0) + (b.costCosmetic || 0) + (b.costOther || 0);
      const profitA = (a.soldPrice || a.price) - totalCostA;
      const profitB = (b.soldPrice || b.price) - totalCostB;

      if (sortBy === 'make') return a.make.localeCompare(b.make);
      if (sortBy === 'year') return b.year - a.year;
      if (sortBy === 'price') return b.price - a.price;
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      if (sortBy === 'profit') return profitB - profitA;
      return 0;
  });

  const calculateTotalCost = () => {
      return (newCar.cost || 0) + (newCar.costTowing || 0) + (newCar.costMechanical || 0) + (newCar.costCosmetic || 0) + (newCar.costOther || 0);
  };
  
  const calculateProjectedProfit = () => {
      return (newCar.price || 0) - calculateTotalCost();
  };

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

      <div className="min-h-screen bg-black p-4 md:p-8 lg:p-12 font-sans relative">
      {/* Sync Overlay */}
      {isSyncing && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center">
           <div className="w-full max-w-2xl p-12 border border-tj-gold/30 bg-black relative">
              <div className="flex items-center gap-4 mb-8 text-tj-gold animate-pulse">
                <RefreshCw className="animate-spin" />
                <span className="font-display tracking-widest text-xl">SYNCHRONIZING COMMAND LEDGER</span>
              </div>
              <div className="font-mono text-xs text-green-500 space-y-2 h-64 overflow-y-auto">
                {syncLog.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
                <div className="w-2 h-4 bg-green-500 animate-pulse inline-block"></div>
              </div>
           </div>
        </div>
      )}

      <div className="max-w-[1800px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-white/10 pb-6">
           <div>
             <p className="text-tj-gold text-[10px] uppercase tracking-[0.4em] mb-2">Internal Operations</p>
             <h1 className="text-4xl font-display text-white tracking-widest">ASSET COMMISSIONING</h1>
           </div>
           <div className="flex flex-col items-end gap-2">
             <div className="flex items-center gap-6">
                <button 
                    onClick={resetToDefault}
                    className="text-[9px] uppercase tracking-widest text-red-900 hover:text-red-500 transition-colors mr-4"
                >
                  Hard Reset Data
                </button>

                <button
                    onClick={() => handleOpenBOS()}
                    className="flex items-center gap-2 text-xs uppercase tracking-widest text-black bg-tj-gold hover:bg-white px-6 py-3 border border-tj-gold transition-all group"
                >
                <Printer size={14} />
                Generate Docs
                </button>
                <button
                    onClick={handleSheetSync}
                    className="flex items-center gap-2 text-xs uppercase tracking-widest text-white bg-green-900/30 hover:bg-green-900/50 px-6 py-3 border border-green-900 hover:border-green-500 transition-all group"
                >
                <Sheet size={14} className="text-green-500 group-hover:animate-pulse" />
                Import from Sheet
                </button>
                <div className="flex flex-col items-end gap-1 text-xs font-mono pl-6 border-l border-white/10">
                    <div className="flex items-center gap-2 text-tj-gold">
                        <Database size={12} />
                        <span>LOCAL DATABASE ACTIVE</span>
                    </div>
                    <span className="text-gray-600 text-[10px]">
                        STATUS: CRM MODE
                    </span>
                </div>
             </div>
           </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
          
          {/* LEFT: INPUT TERMINAL */}
          <div className="xl:col-span-7 space-y-8">
            <div className={`bg-tj-dark border transition-colors relative p-8 md:p-12 ${editingId ? 'border-tj-gold shadow-[0_0_30px_rgba(212,175,55,0.1)]' : 'border-white/10'}`}>
              
              {editingId && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-tj-gold text-black px-6 py-1 text-[10px] font-bold uppercase tracking-widest shadow-lg flex items-center gap-2">
                  <Edit2 size={12} /> EDITING MODE: {newCar.vin}
                </div>
              )}

              {/* Decorative Corners */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-tj-gold"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-tj-gold"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-tj-gold"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-tj-gold"></div>

              <div className="flex items-center justify-between mb-8 border-b border-gray-800 pb-4">
                 <div className="flex items-center gap-3">
                   <Terminal size={18} className="text-tj-gold" />
                   <h2 className="text-white text-sm uppercase tracking-[0.2em]">{editingId ? `Modifying Asset: ${newCar.make} ${newCar.model}` : 'New Asset Intake'}</h2>
                 </div>
                 {editingId && (
                   <button onClick={handleCancelEdit} className="text-[9px] uppercase tracking-widest text-red-500 hover:text-red-400 flex items-center gap-1">
                     <X size={10} /> Cancel Edit
                   </button>
                 )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* VIN SECTION */}
                <div className="bg-black/50 p-6 border border-gray-800">
                   <div className="flex justify-between items-center mb-4">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-tj-gold">Unique Identifier (VIN)</label>
                      {vinError && <span className="text-[9px] text-red-500 font-bold tracking-widest flex items-center gap-1"><AlertTriangle size={10}/> {vinError}</span>}
                      {isDecoding && <span className="text-[9px] text-tj-gold font-bold tracking-widest animate-pulse">DECODING & GENERATING PROFILE...</span>}
                   </div>
                   <div className="flex gap-2">
                     <input 
                        type="text" 
                        name="vin"
                        required
                        maxLength={17}
                        value={newCar.vin}
                        onChange={handleVinChange}
                        placeholder="ENTER 17-DIGIT SEQUENCE"
                        className={`flex-1 bg-black border ${vinError ? 'border-red-900 text-red-500' : 'border-gray-700 text-white focus:border-tj-gold'} px-4 py-3 font-mono text-sm tracking-[0.1em] outline-none transition-colors`}
                     />
                     <button 
                        type="button"
                        onClick={handleManualDecode}
                        disabled={isDecoding || !newCar.vin || newCar.vin.length !== 17}
                        className="bg-tj-gold/10 text-tj-gold border border-tj-gold/30 px-6 hover:bg-tj-gold hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase text-[10px] tracking-widest font-bold flex items-center gap-2"
                     >
                        {isDecoding ? <Loader2 className="animate-spin" size={14} /> : <Search size={14} />}
                        Decode
                     </button>
                   </div>
                </div>

                {/* CORE SPECS */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="group">
                    <label className="block text-[9px] uppercase tracking-widest text-gray-500 mb-2 group-focus-within:text-white transition-colors">Manufacturer</label>
                    <input 
                      required
                      type="text" 
                      value={newCar.make}
                      onChange={e => setNewCar({...newCar, make: e.target.value})}
                      className="w-full bg-black border border-gray-800 p-4 text-white text-sm focus:border-tj-gold outline-none transition-colors placeholder-gray-800"
                      placeholder="AUTO-DETECTED"
                    />
                  </div>
                  <div className="group">
                    <label className="block text-[9px] uppercase tracking-widest text-gray-500 mb-2 group-focus-within:text-white transition-colors">Model Designation</label>
                    <input 
                      required
                      type="text" 
                      value={newCar.model}
                      onChange={e => setNewCar({...newCar, model: e.target.value})}
                      className="w-full bg-black border border-gray-800 p-4 text-white text-sm focus:border-tj-gold outline-none transition-colors placeholder-gray-800"
                      placeholder="AUTO-DETECTED"
                    />
                  </div>
                  <div className="group">
                    <label className="block text-[9px] uppercase tracking-widest text-gray-500 mb-2 group-focus-within:text-white transition-colors">Production Year</label>
                    <input 
                      required
                      type="number" 
                      value={newCar.year}
                      onChange={e => setNewCar({...newCar, year: parseInt(e.target.value)})}
                      className="w-full bg-black border border-gray-800 p-4 text-white text-sm focus:border-tj-gold outline-none transition-colors"
                    />
                  </div>
                  <div className="group">
                    <label className="block text-[9px] uppercase tracking-widest text-gray-500 mb-2 group-focus-within:text-white transition-colors">Odometer (Provenance)</label>
                    <input 
                      required
                      type="number" 
                      value={newCar.mileage}
                      onChange={e => setNewCar({...newCar, mileage: parseInt(e.target.value)})}
                      className="w-full bg-black border border-gray-800 p-4 text-white text-sm focus:border-tj-gold outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* FINANCIALS & STATUS - ENHANCED */}
                <div className="bg-white/5 p-6 border border-white/10">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xs uppercase tracking-[0.2em] text-white flex items-center gap-2">
                          <DollarSign size={12} /> Live Margin Calculator
                      </h3>
                      <div className="text-right">
                          <span className="text-[9px] uppercase tracking-widest text-gray-500 block">Projected Profit</span>
                          <span className={`text-lg font-mono border-b border-white/20 ${calculateProjectedProfit() >= 0 ? 'text-green-500' : 'text-red-500'}`}>${calculateProjectedProfit().toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Expense Matrix */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                        <div className="group relative">
                            <label className="block text-[8px] uppercase tracking-widest text-gray-500 mb-2">Acquisition (Buy)</label>
                            <input 
                                required
                                type="number" 
                                value={newCar.cost}
                                onChange={e => setNewCar({...newCar, cost: parseInt(e.target.value)})}
                                className="w-full bg-black border border-gray-800 p-3 text-white text-xs focus:border-red-500 outline-none transition-colors"
                            />
                        </div>
                        <div className="group relative">
                            <label className="block text-[8px] uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-1"><Truck size={10}/> Towing</label>
                            <input 
                                type="number" 
                                value={newCar.costTowing}
                                onChange={e => setNewCar({...newCar, costTowing: parseInt(e.target.value)})}
                                className="w-full bg-black border border-gray-800 p-3 text-white text-xs focus:border-red-500 outline-none transition-colors"
                            />
                        </div>
                        <div className="group relative">
                            <label className="block text-[8px] uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-1"><Wrench size={10}/> Mechanical</label>
                            <input 
                                type="number" 
                                value={newCar.costMechanical}
                                onChange={e => setNewCar({...newCar, costMechanical: parseInt(e.target.value)})}
                                className="w-full bg-black border border-gray-800 p-3 text-white text-xs focus:border-red-500 outline-none transition-colors"
                            />
                        </div>
                        <div className="group relative">
                            <label className="block text-[8px] uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-1"><PaintBucket size={10}/> Cosmetic</label>
                            <input 
                                type="number" 
                                value={newCar.costCosmetic}
                                onChange={e => setNewCar({...newCar, costCosmetic: parseInt(e.target.value)})}
                                className="w-full bg-black border border-gray-800 p-3 text-white text-xs focus:border-red-500 outline-none transition-colors"
                            />
                        </div>
                        <div className="group relative">
                            <label className="block text-[8px] uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-1"><FileText size={10}/> Other / Fees</label>
                            <input 
                                type="number" 
                                value={newCar.costOther}
                                onChange={e => setNewCar({...newCar, costOther: parseInt(e.target.value)})}
                                className="w-full bg-black border border-gray-800 p-3 text-white text-xs focus:border-red-500 outline-none transition-colors"
                            />
                        </div>
                    </div>

                    <div className="h-px w-full bg-white/10 mb-6"></div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="group">
                            <label className="block text-[9px] uppercase tracking-widest text-tj-gold mb-2 group-focus-within:text-white transition-colors font-bold">Listing Price (Ask)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                <input 
                                    required
                                    type="number" 
                                    value={newCar.price}
                                    onChange={e => setNewCar({...newCar, price: parseInt(e.target.value)})}
                                    className="w-full bg-black border border-gray-800 p-4 pl-8 text-white text-sm focus:border-tj-gold outline-none transition-colors"
                                />
                            </div>
                        </div>
                        <div className="group">
                            <label className="block text-[9px] uppercase tracking-widest text-gray-500 mb-2 group-focus-within:text-white transition-colors">Allocation Status</label>
                            <select 
                                value={newCar.status}
                                onChange={e => setNewCar({...newCar, status: e.target.value as VehicleStatus})}
                                className="w-full bg-black border border-gray-800 p-4 text-white text-sm focus:border-tj-gold outline-none transition-colors appearance-none"
                            >
                                {Object.values(VehicleStatus).map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                         <div className="group">
                            <label className="block text-[9px] uppercase tracking-widest text-gray-500 mb-2 group-focus-within:text-white transition-colors">Intake Date</label>
                            <input 
                                type="date"
                                value={newCar.dateAdded}
                                onChange={e => setNewCar({...newCar, dateAdded: e.target.value})}
                                className="w-full bg-black border border-gray-800 p-4 text-white text-sm focus:border-tj-gold outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Sales Data (Only visible if SOLD or PENDING) */}
                    {newCar.status === VehicleStatus.SOLD && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-white/10">
                            <div className="group">
                                <label className="block text-[9px] uppercase tracking-widest text-green-500 mb-2 group-focus-within:text-white transition-colors font-bold">Final Sale Price</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                    <input 
                                        type="number" 
                                        value={newCar.soldPrice || ''}
                                        onChange={e => setNewCar({...newCar, soldPrice: parseInt(e.target.value)})}
                                        placeholder={newCar.price?.toString()}
                                        className="w-full bg-black border border-gray-800 p-4 pl-8 text-white text-sm focus:border-green-500 outline-none transition-colors"
                                    />
                                </div>
                            </div>
                            <div className="group">
                                <label className="block text-[9px] uppercase tracking-widest text-green-500 mb-2 group-focus-within:text-white transition-colors font-bold">Sold Date</label>
                                <div className="relative">
                                    <input 
                                        type="date" 
                                        value={newCar.soldDate || ''}
                                        onChange={e => setNewCar({...newCar, soldDate: e.target.value})}
                                        className="w-full bg-black border border-gray-800 p-4 text-white text-sm focus:border-green-500 outline-none transition-colors"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* VISUALS & NARRATIVE SECTION */}
                <div className="bg-gradient-to-b from-gray-900 to-black p-6 border border-gray-800 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-2">
                      <Cpu size={16} className="text-tj-gold opacity-20" />
                   </div>
                   <h3 className="text-white text-xs uppercase tracking-[0.3em] mb-6 border-b border-gray-800 pb-2 flex items-center gap-2">
                     <Wand2 size={12} className="text-tj-gold" /> Visuals & Narrative
                   </h3>

                   <div className="space-y-6">
                      
                      {/* UNIFIED IMAGE UPLOAD (Facebook Style) */}
                      <div className="group">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-[9px] uppercase tracking-widest text-tj-gold flex items-center gap-2">
                                <ImageIcon size={14} /> Vehicle Gallery
                            </label>
                            <span className="text-[9px] text-gray-500">{allImages.length} Photos Selected</span>
                        </div>

                        {/* Grid Container */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            
                            {/* 1. Upload Button (Drag & Drop Target) */}
                            <label 
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`relative aspect-[4/3] cursor-pointer bg-white/5 border border-dashed transition-all flex flex-col items-center justify-center gap-2 group overflow-hidden ${isDragging ? 'border-tj-gold bg-tj-gold/10' : 'border-gray-700 hover:border-tj-gold hover:bg-white/10'}`}
                            >
                                <input type="file" accept="image/*" multiple onChange={handleUnifiedUpload} className="hidden" />
                                <div className={`p-3 rounded-full transition-colors border ${isDragging ? 'bg-tj-gold text-black border-tj-gold' : 'bg-black text-gray-400 border-gray-800 group-hover:bg-tj-gold group-hover:text-black group-hover:border-tj-gold'}`}>
                                    {isDragging ? <UploadCloud size={20} className="animate-bounce" /> : <Plus size={20} />}
                                </div>
                                <span className={`text-[9px] uppercase tracking-widest transition-colors text-center ${isDragging ? 'text-tj-gold' : 'text-gray-500 group-hover:text-white'}`}>
                                    {isDragging ? 'Drop Files Here' : 'Add Photos'}
                                </span>
                            </label>

                            {/* 2. Image Cards */}
                            {allImages.map((img, idx) => (
                                <div key={idx} className={`relative group aspect-[4/3] bg-gray-900 border ${idx === 0 ? 'border-tj-gold' : 'border-gray-800'} overflow-hidden`}>
                                    <img src={img} alt={`View ${idx}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                    
                                    {/* Badges & Controls */}
                                    {idx === 0 && (
                                        <div className="absolute top-2 left-2 bg-tj-gold text-black text-[8px] font-bold px-2 py-1 uppercase tracking-widest z-10 shadow-md">
                                            Cover Photo
                                        </div>
                                    )}

                                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2 p-2 backdrop-blur-sm">
                                        {idx !== 0 && (
                                            <button 
                                                type="button"
                                                onClick={() => setAsCover(idx)}
                                                className="text-[8px] uppercase tracking-widest text-white bg-tj-gold/20 hover:bg-tj-gold hover:text-black border border-tj-gold px-3 py-1.5 w-full transition-colors font-bold"
                                            >
                                                Make Cover
                                            </button>
                                        )}
                                        <button 
                                            type="button"
                                            onClick={() => removeImage(idx)}
                                            className="text-[8px] uppercase tracking-widest text-white bg-red-900/30 hover:bg-red-600 border border-red-900 hover:border-red-600 px-3 py-1.5 w-full transition-colors flex items-center justify-center gap-1"
                                        >
                                            <Trash2 size={10} /> Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="group">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-[9px] uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                    <Type size={12} /> Psychological Caption
                                </label>
                                <button 
                                type="button"
                                onClick={handleGenerateDesc}
                                disabled={isGenerating || !newCar.make}
                                className="text-[9px] uppercase tracking-widest text-tj-gold hover:text-white flex items-center gap-2 disabled:opacity-30 transition-colors"
                                >
                                {isGenerating ? <Loader2 className="animate-spin" size={12} /> : <Wand2 size={12} />}
                                Auto-Generate Script
                                </button>
                            </div>
                            <textarea 
                                value={newCar.description}
                                onChange={e => setNewCar({...newCar, description: e.target.value})}
                                className="w-full bg-black border border-gray-700 p-4 text-gray-300 text-sm leading-relaxed focus:border-tj-gold outline-none transition-colors min-h-[150px] font-serif italic"
                                placeholder="Waiting for psychological profile generation..."
                            />
                        </div>
                        
                        {/* DIAGNOSTICS SECTION */}
                        <div className="group">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-[9px] uppercase tracking-widest text-red-400 flex items-center gap-2">
                                    <ShieldAlert size={12} /> Diagnostics / Known Issues
                                </label>
                                <span className="text-[8px] text-gray-500">ENTER 1 ISSUE PER LINE</span>
                            </div>
                            <textarea 
                                value={diagText}
                                onChange={e => setDiagText(e.target.value)}
                                className="w-full bg-black border border-red-900/50 p-4 text-gray-300 text-sm leading-relaxed focus:border-red-500 outline-none transition-colors min-h-[150px] font-mono"
                                placeholder="e.g. Minor scratch on rear bumper&#10;AC Knob loose&#10;Front tires 60% life"
                            />
                        </div>
                      </div>
                   </div>
                </div>

                <button 
                  type="submit" 
                  className={`w-full font-bold py-4 text-xs uppercase tracking-[0.3em] transition-all duration-300 flex items-center justify-center gap-2 mt-8 group ${editingId ? 'bg-tj-gold text-black hover:bg-white' : 'bg-white text-black hover:bg-tj-gold'}`}
                >
                  <Save size={16} />
                  <span>{editingId ? 'Save Asset Modifications' : 'Commission Asset'}</span>
                  <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT: LIVE SIMULATION */}
          <div className="xl:col-span-5 space-y-8">
            <div className="sticky top-32">
              <div className="flex items-center gap-2 mb-6 text-gray-500">
                 <Eye size={16} />
                 <span className="text-[10px] uppercase tracking-widest">Live Simulation Preview</span>
              </div>

              {/* Exact Card Replica */}
              <div className="bg-black border border-white/10 group hover:bg-tj-dark transition-colors duration-500 relative">
                 {/* Status Strip */}
                 <div className="absolute top-0 left-0 w-full flex justify-between items-center z-20 p-6 pointer-events-none">
                    <div className={`px-3 py-1 text-[8px] font-bold uppercase tracking-[0.2em] border ${newCar.status === 'Available' ? 'border-tj-gold text-tj-gold bg-black/80' : 'border-gray-700 text-gray-500 bg-black/80'}`}>
                      {newCar.status === 'Available' ? '• AVAILABLE' : `• ${newCar.status?.toUpperCase()}`}
                    </div>
                 </div>

                 {/* Image Area */}
                 <div className="relative aspect-[4/3] overflow-hidden border-b border-white/5">
                    {/* SOLD OVERLAY */}
                    {newCar.status === VehicleStatus.SOLD && (
                        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                        <div className="transform -rotate-12 bg-tj-gold border-y-4 border-white shadow-[0_0_50px_rgba(0,0,0,0.8)] w-[120%] flex justify-center py-3">
                            <span className="font-display font-black text-4xl tracking-[0.3em] text-black uppercase drop-shadow-md">
                                SOLD
                            </span>
                        </div>
                        </div>
                    )}

                    <img 
                        src={previewImages[activePreviewIndex] || newCar.imageUrl} 
                        alt="Preview" 
                        className={`w-full h-full object-cover transition-all duration-1000 ${newCar.status === VehicleStatus.SOLD ? 'grayscale opacity-40' : 'opacity-60 group-hover:opacity-100'}`}
                    />

                    {/* Carousel Dots if multiple */}
                    {previewImages.length > 1 && (
                        <div className="absolute bottom-4 left-0 w-full flex justify-center gap-1 z-20">
                            {previewImages.map((_, i) => (
                                <button 
                                key={i}
                                onClick={() => setActivePreviewIndex(i)}
                                className={`h-1 rounded-full transition-all ${i === activePreviewIndex ? 'bg-tj-gold w-4' : 'bg-white/50 w-1'}`}
                                />
                            ))}
                        </div>
                    )}
                 </div>

                 {/* Content */}
                 <div className="p-8 relative">
                    <div className="mb-6">
                        <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] uppercase tracking-ultra text-gray-500 mb-2">{newCar.make || 'MAKE'}</p>
                            <h3 className="font-display text-3xl text-white mb-2 leading-none">
                                {newCar.model || 'MODEL'}
                            </h3>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-mono text-gray-600 block">{newCar.year || 'YEAR'}</span>
                            <span className="text-[10px] font-mono text-gray-600 block">{(newCar.mileage || 0).toLocaleString()} Miles</span>
                        </div>
                        </div>
                    </div>

                    <div className="h-px w-12 bg-tj-gold/50 mb-6"></div>

                    <p className="font-serif text-gray-400 italic leading-loose mb-8 text-sm line-clamp-3">
                        "{newCar.description || 'Psychological profile pending...'}"
                    </p>

                    <div className="flex items-end justify-between mt-auto border-t border-white/5 pt-6">
                        <div>
                            <p className="text-[8px] uppercase tracking-widest text-gray-600 mb-1">Capital Requirement</p>
                            <div className="flex items-baseline gap-2">
                            <p className="font-display text-xl text-white tracking-wider">
                                ${(newCar.price || 0).toLocaleString()}
                            </p>
                            <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest">(AS-IS)</span>
                            </div>
                        </div>

                        <button className="flex items-center gap-3 bg-tj-gold text-black px-4 py-3 text-[10px] font-bold uppercase tracking-[0.25em]">
                            <span>Express Interest</span>
                            <ArrowRight size={14} />
                        </button>
                    </div>
                 </div>
              </div>
            </div>
          </div>

        </div>

        {/* CRM DATA TABLE (REPLACED THE OLD GRID) */}
        <div className="mt-24 border-t border-white/10 pt-12">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
               <div>
                    <h3 className="text-white text-sm uppercase tracking-[0.2em] flex items-center gap-3 mb-2">
                            <Database size={16} className="text-tj-gold" />
                            Active Asset Database
                    </h3>
                    <p className="text-gray-500 text-[10px] uppercase tracking-widest">
                        {filteredVehicles.length} Units Active | Mini-CRM Mode
                    </p>
               </div>
               
               <div className="flex flex-col xl:flex-row gap-4 w-full md:w-auto items-end xl:items-center">
                    {/* Status Filter */}
                    <div className="relative w-full md:w-auto">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                            className="bg-black border border-gray-700 text-white text-[10px] uppercase tracking-widest py-3 pl-10 pr-8 w-full md:w-48 focus:border-tj-gold outline-none appearance-none cursor-pointer hover:bg-white/5 transition-colors"
                        >
                            <option value="All">All Statuses</option>
                            {Object.values(VehicleStatus).map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full md:w-auto flex-grow md:flex-grow-0">
                        <input 
                            type="text" 
                            placeholder="SEARCH VIN, MAKE..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-black border border-gray-700 text-white text-[10px] uppercase tracking-widest py-3 pl-10 pr-4 w-full md:w-64 focus:border-tj-gold outline-none transition-colors"
                        />
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    </div>

                    {/* Sort Buttons */}
                    <div className="flex items-center gap-px bg-gray-800 border border-gray-800 p-px overflow-x-auto max-w-full">
                        {[
                            { id: 'make', label: 'Make' },
                            { id: 'year', label: 'Year' },
                            { id: 'price', label: 'Price' },
                            { id: 'status', label: 'Status' },
                            { id: 'profit', label: 'Profit' }
                        ].map((opt) => (
                            <button 
                                key={opt.id}
                                onClick={() => setSortBy(opt.id as any)}
                                className={`px-4 py-3 text-[9px] uppercase tracking-widest transition-all whitespace-nowrap flex-shrink-0 ${sortBy === opt.id ? 'bg-tj-gold text-black font-bold' : 'bg-black text-gray-400 hover:text-white hover:bg-white/10'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
               </div>
           </div>

           {/* TABLE STRUCTURE */}
           <div className="bg-tj-dark border border-gray-800 overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead className="bg-black text-gray-500 text-[9px] uppercase tracking-[0.2em]">
                 <tr>
                    <th className="p-4 font-medium border-b border-gray-800">Asset Identity</th>
                    <th className="p-4 font-medium border-b border-gray-800">VIN / Stock #</th>
                    <th className="p-4 font-medium border-b border-gray-800">Financial Ledger (Acq + Fees = Total)</th>
                    <th className="p-4 font-medium border-b border-gray-800">Status</th>
                    <th className="p-4 font-medium border-b border-gray-800 text-right">Command</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-800 text-sm">
                 {sortedVehicles.map(v => {
                     const acq = v.cost || 0;
                     const fees = (v.costTowing || 0) + (v.costMechanical || 0) + (v.costCosmetic || 0) + (v.costOther || 0);
                     const totalCost = acq + fees;
                     const profit = (v.soldPrice || v.price) - totalCost;
                     const isSold = v.status === VehicleStatus.SOLD;

                     return (
                        <tr key={v.id} className="hover:bg-white/5 transition-colors group">
                            <td className="p-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-12 bg-gray-900 border border-gray-700 overflow-hidden relative">
                                        <img src={v.imageUrl} className={`w-full h-full object-cover ${isSold ? 'grayscale opacity-50' : ''}`} alt="Thumb" />
                                    </div>
                                    <div>
                                        <div className="text-white font-bold text-xs">{v.year} {v.make}</div>
                                        <div className="text-gray-500 text-[10px] uppercase tracking-wider">{v.model}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="p-4">
                                <div className="font-mono text-xs text-gray-400">{v.vin}</div>
                            </td>
                            <td className="p-4">
                                <div className="space-y-1 font-mono text-[10px]">
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <span className="w-12">BASIS:</span> 
                                        <span>${acq.toLocaleString()} + ${fees.toLocaleString()} (Fees)</span>
                                    </div>
                                    <div className="flex items-center gap-2 border-t border-gray-800 pt-1 mt-1">
                                        <span className="text-white w-12">TOTAL:</span> 
                                        <span className="text-red-400">${totalCost.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2 font-bold">
                                        <span className="text-gray-400 w-12">{isSold ? 'NET:' : 'PROJ:'}</span> 
                                        <span className={profit >= 0 ? 'text-green-500' : 'text-red-500'}>${profit.toLocaleString()}</span>
                                    </div>
                                </div>
                            </td>
                            <td className="p-4">
                                <span className={`px-2 py-1 text-[9px] uppercase tracking-widest border ${
                                    v.status === VehicleStatus.AVAILABLE ? 'border-green-500 text-green-500' :
                                    v.status === VehicleStatus.SOLD ? 'bg-green-900 text-green-400 border-green-900' :
                                    'border-yellow-500 text-yellow-500'
                                }`}>
                                    {v.status}
                                </span>
                                {v.soldDate && (
                                    <div className="text-[9px] text-gray-600 mt-1 font-mono">
                                        {new Date(v.soldDate).toLocaleDateString()}
                                    </div>
                                )}
                            </td>
                            <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => handleOpenBOS(v)}
                                        className="bg-tj-gold/10 hover:bg-tj-gold hover:text-black text-tj-gold border border-tj-gold/30 px-3 py-2 text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"
                                        title="Generate Documents"
                                    >
                                        <Printer size={12} /> Docs
                                    </button>
                                    <button
                                        onClick={() => handleEdit(v)}
                                        className="bg-white/5 hover:bg-tj-gold hover:text-black text-white border border-white/10 px-4 py-2 text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"
                                    >
                                        <Edit2 size={12} /> Edit
                                    </button>
                                    <button
                                        onClick={() => {
                                            if(window.confirm('Permanently delete this asset record?')) removeVehicle(v.id);
                                        }}
                                        className="bg-red-900/10 hover:bg-red-900/50 text-red-500 border border-red-900/30 px-3 py-2 transition-all"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                     );
                 })}
               </tbody>
             </table>
           </div>
        </div>
      </div>

      {/* Bill of Sale Modal */}
      <BillOfSaleModal
        isOpen={showBOSModal}
        onClose={() => {
          setShowBOSModal(false);
          setBosVehicle(null);
        }}
        vehicles={vehicles}
        preSelectedVehicle={bosVehicle}
      />
    </div>
    </>
  );
};

export default AdminInventory;
