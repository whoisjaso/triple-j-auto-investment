
import React, { useState } from 'react';
import { decodeVin } from '../services/nhtsaService';
import { VinResult } from '../types';
import { Search, Fingerprint, Activity, ShieldAlert, Terminal, Check, Cpu, Globe, Database, AlertTriangle, Zap, ArrowRight, Gauge, Layers } from 'lucide-react';

const VinLookup = () => {
  const [vin, setVin] = useState('');
  const [vehicleDetails, setVehicleDetails] = useState({ make: '', model: '', year: '' });
  const [result, setResult] = useState<VinResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs(prev => [...prev, `> ${msg}`]);

  const validateInput = (value: string): string | null => {
    // Check for non-alphanumeric (VINs are strictly alphanumeric)
    if (/[^A-Z0-9]/.test(value)) {
      return 'ERROR: SYNTAX_INVALID (ALPHANUMERIC_ONLY)';
    }

    // Check for forbidden VIN characters (I, O, Q)
    // Note: I, O, Q are strictly forbidden in standard VINs to avoid confusion with 1, 0.
    const forbiddenMatch = value.match(/[IOQ]/);
    if (forbiddenMatch) {
      return `ERROR: ILLEGAL_CHARACTER '${forbiddenMatch[0]}' (I, O, Q PROHIBITED IN VIN)`;
    }

    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Auto-convert to uppercase and strip whitespace for better UX
    const val = e.target.value.toUpperCase().replace(/\s/g, '');
    setVin(val);
    
    // Immediate Validation Feedback
    if (val.length > 0) {
      const validationError = validateInput(val);
      if (validationError) {
        setError(validationError);
      } else {
        // Clear error if valid so far
        setError('');
      }
    } else {
      setError('');
    }
  };

  const handlePreFill = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Pre-flight checks
    const inputError = validateInput(vin);
    if (inputError) {
      setError(inputError);
      return;
    }

    // Specific Length Error
    if (vin.length !== 17) {
      setError(`ERROR: INVALID_SEQUENCE_LENGTH (CURRENT: ${vin.length} / REQUIRED: 17)`);
      return;
    }
    
    setLoading(true);
    setError('');
    setResult(null);
    setVehicleDetails({ make: '', model: '', year: '' });
    setLogs(['> INITIATING HANDSHAKE...', '> CONNECTING TO CENTRAL DATABASE...']);

    // Simulate "Thinking" time with logs for psychological weight
    await new Promise(r => setTimeout(r, 400));
    addLog('ACCESS GRANTED.');
    await new Promise(r => setTimeout(r, 400));
    addLog(`DECODING SEQUENCE FOR: ${vin}`);
    
    const data = await decodeVin(vin);
    
    if (data) {
      // Validation Update: Check ErrorCode. '0' indicates success.
      // Note: API ErrorText often starts with "0 - VIN decoded clean...", which is NOT an error.
      const hasError = data.ErrorCode && data.ErrorCode !== '0';
      // Fallback if ErrorCode is missing but ErrorText suggests failure
      const textError = !data.ErrorCode && data.ErrorText && !data.ErrorText.startsWith('0');

      if (hasError || textError) {
         const rawError = data.ErrorText || "UNKNOWN_ERROR";
         // Clean up verbose NHTSA errors
         const displayError = rawError.length > 50 ? "INVALID_VIN_RESPONSE_FROM_AGENCY" : rawError;
         setError("DATA INTEGRITY ERROR: " + displayError);
         addLog(`ERROR CODE: ${data.ErrorCode || 'ERR'} - ${displayError}`);
      } else {
         setResult(data);
         setVehicleDetails({
           make: data.Make || 'UNKNOWN',
           model: data.Model || 'UNKNOWN',
           year: data.ModelYear || 'UNKNOWN'
         });
         addLog('POWERTRAIN DATA EXTRACTED.');
         addLog('IDENTITY MATRIX POPULATED.');
         addLog('RENDERING OUTPUT...');
      }
    } else {
      setError('CONNECTION_RESET_BY_PEER');
      addLog('FATAL: API_CONNECTION_FAILED');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-24 relative overflow-hidden font-mono">
      {/* CRT Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_2px,3px_100%] pointer-events-none z-20"></div>
      
      <div className="max-w-6xl w-full relative z-10">
        
        {/* Terminal Header */}
        <div className="flex justify-between items-end mb-8 border-b border-tj-gold/30 pb-4">
          <div>
            <h1 className="text-2xl text-tj-gold tracking-widest mb-2 flex items-center gap-2">
              <Terminal size={24} />
              INTELLIGENCE_TERMINAL_V3.0
            </h1>
            <p className="text-gray-600 text-xs uppercase tracking-widest">Deep Layer Extraction • Sovereign Access Only</p>
          </div>
          <div className="text-right">
             <div className="text-green-500 text-xs animate-pulse">● UPLINK STABLE</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Input & Logs */}
          <div className="lg:col-span-1 space-y-8">
            <div className={`bg-tj-dark/50 border ${error ? 'border-red-500/50' : 'border-gray-800'} p-8 backdrop-blur relative overflow-hidden transition-colors duration-300`}>
               {/* Corner Accents */}
               <div className={`absolute top-0 left-0 w-2 h-2 ${error ? 'bg-red-500' : 'bg-tj-gold'}`}></div>
               <div className={`absolute top-0 right-0 w-2 h-2 ${error ? 'bg-red-500' : 'bg-tj-gold'}`}></div>

               <div className="flex flex-col gap-6">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className={`block text-[10px] uppercase tracking-[0.3em] ${error ? 'text-red-500' : 'text-tj-gold'}`}>Target Identifier (VIN)</label>
                    {vin.length > 0 && (
                      <span className={`text-[10px] ${vin.length === 17 ? 'text-green-500' : 'text-gray-600'}`}>
                        {vin.length}/17
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={vin}
                      onChange={handleInputChange}
                      onKeyDown={(e) => e.key === 'Enter' && handlePreFill()}
                      placeholder="ENTER VIN SEQUENCE"
                      maxLength={17}
                      className={`w-full bg-black border ${error ? 'border-red-500 text-red-500 focus:border-red-500' : 'border-gray-700 text-white focus:border-tj-gold'} px-4 py-3 pr-12 text-lg font-mono focus:outline-none tracking-[0.1em] placeholder-gray-800 transition-colors`}
                      spellCheck="false"
                    />
                    <button 
                      onClick={() => handlePreFill()}
                      disabled={loading || (!!error && vin.length > 0) || vin.length === 0}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-tj-gold hover:text-white disabled:text-gray-700 transition-colors p-2"
                      title="Quick Decode"
                    >
                      {loading ? <Activity className="animate-spin" size={18} /> : <Zap size={18} />}
                    </button>
                  </div>
                </div>

                {/* Auto-Populated Fields */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-[8px] uppercase tracking-widest text-gray-500 mb-1">Make</label>
                       <input 
                          type="text" 
                          readOnly 
                          value={vehicleDetails.make} 
                          placeholder="---"
                          className="w-full bg-black/50 border border-gray-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-tj-gold/50 transition-colors"
                       />
                     </div>
                     <div>
                       <label className="block text-[8px] uppercase tracking-widest text-gray-500 mb-1">Year</label>
                       <input 
                          type="text" 
                          readOnly 
                          value={vehicleDetails.year} 
                          placeholder="---"
                          className="w-full bg-black/50 border border-gray-800 px-3 py-2 text-xs text-tj-gold focus:outline-none focus:border-tj-gold/50 transition-colors"
                       />
                     </div>
                  </div>
                  <div>
                     <label className="block text-[8px] uppercase tracking-widest text-gray-500 mb-1">Model</label>
                     <input 
                        type="text" 
                        readOnly 
                        value={vehicleDetails.model} 
                        placeholder="WAITING FOR INPUT..."
                        className="w-full bg-black/50 border border-gray-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-tj-gold/50 transition-colors"
                     />
                  </div>
                </div>
                
                <button 
                  onClick={() => handlePreFill()}
                  disabled={loading || !!error || vin.length !== 17}
                  className={`mt-4 px-6 py-3 font-bold text-xs tracking-[0.3em] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group ${error ? 'bg-red-900/20 text-red-500 cursor-not-allowed' : 'bg-tj-gold text-black hover:bg-white'}`}
                >
                  {loading ? 'DECODING...' : 'RUN FULL ANALYSIS'}
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {error && (
                <div className="mt-6 p-3 border border-red-500/50 bg-red-900/20 text-red-500 flex items-start gap-3 font-mono text-xs animate-fade-in">
                  <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}
            </div>
            
            {/* System Logs */}
            <div className="bg-black border border-gray-800 p-6 h-[200px] font-mono text-xs overflow-y-auto scrollbar-none">
               <div className="mb-4 text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-2">Data Stream</div>
               <div className="space-y-2 text-green-500/80">
                  <div className="opacity-50">{'>'} INITIALIZING...</div>
                  {logs.map((log, i) => (
                    <div key={i} className="animate-fade-in">{log}</div>
                  ))}
                  {loading && <div className="animate-pulse">{'>'} PROCESSING BITSTREAM...</div>}
               </div>
            </div>
          </div>

          {/* Right Column: Intelligence Output */}
          <div className="lg:col-span-2">
            {!result ? (
              <div className="h-full flex items-center justify-center border border-gray-800 bg-white/5 opacity-50 min-h-[500px]">
                <div className="text-center">
                   <Database size={48} className="mx-auto text-gray-700 mb-4 animate-pulse" />
                   <p className="text-gray-600 tracking-widest text-xs">WAITING FOR TARGET DATA</p>
                </div>
              </div>
            ) : (
              <div className="animate-slide-up space-y-6">
                
                {/* Core Identity Matrix */}
                <div className="bg-tj-dark border border-tj-gold/30 p-8 relative overflow-hidden group hover:border-tj-gold/60 transition-colors shadow-[0_0_30px_rgba(0,0,0,0.3)]">
                  <div className="absolute right-0 top-0 p-4"><Fingerprint className="text-tj-gold opacity-10 w-24 h-24 -rotate-12" /></div>
                  
                  <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-8 relative z-10">
                    <h3 className="text-white text-sm uppercase tracking-[0.3em] flex items-center gap-3">
                      <Fingerprint size={16} className="text-tj-gold" />
                      Core Identity Matrix
                    </h3>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 animate-pulse rounded-full"></div>
                        <span className="text-[9px] text-green-500 uppercase tracking-widest">Verified</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-12 relative z-10">
                    <div>
                      <p className="text-gray-500 text-[9px] uppercase tracking-[0.2em] mb-2">Manufacturer (Make)</p>
                      <p className="text-white text-2xl tracking-widest font-display border-l-2 border-tj-gold pl-4">{result.Make || 'UNKNOWN'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[9px] uppercase tracking-[0.2em] mb-2">Model Designation</p>
                      <p className="text-white text-2xl tracking-widest font-display border-l-2 border-tj-gold pl-4">{result.Model || 'UNKNOWN'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[9px] uppercase tracking-[0.2em] mb-2">Production Cycle (Year)</p>
                      <p className="text-tj-gold text-2xl tracking-widest font-mono border-l-2 border-gray-700 pl-4">{result.ModelYear || 'UNKNOWN'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[9px] uppercase tracking-[0.2em] mb-2">Chassis Configuration</p>
                      <p className="text-white text-sm tracking-widest font-mono border-l-2 border-gray-700 pl-4 leading-relaxed flex items-center h-full uppercase">{result.BodyClass || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* New: Detailed Specifications (Deep Analysis) */}
                <div className="bg-black border border-gray-800 p-6 relative overflow-hidden">
                    <h3 className="text-white text-xs uppercase tracking-[0.3em] mb-6 border-b border-gray-800 pb-2 flex items-center gap-3 relative z-10">
                        <Layers size={14} className="text-tj-gold" /> Detailed Configuration
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                        <div>
                            <p className="text-gray-500 text-[9px] uppercase tracking-widest mb-1">Trim Level</p>
                            <p className="text-white text-xs font-mono border-l-2 border-tj-gold/50 pl-2">{result.Trim || 'Base'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-[9px] uppercase tracking-widest mb-1">Series</p>
                            <p className="text-white text-xs font-mono border-l-2 border-tj-gold/50 pl-2">{result.Series || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-[9px] uppercase tracking-widest mb-1">Transmission</p>
                            <p className="text-white text-xs font-mono border-l-2 border-tj-gold/50 pl-2">{result.TransmissionStyle || 'Standard'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-[9px] uppercase tracking-widest mb-1">Entry Points</p>
                            <p className="text-white text-xs font-mono border-l-2 border-tj-gold/50 pl-2">{result.Doors ? `${result.Doors} Doors` : 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* Powertrain & Performance Matrix */}
                <div className="bg-black border border-gray-800 p-8 group hover:border-gray-700 transition-colors relative overflow-hidden">
                   {/* Background grid */}
                   <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none"></div>
                   
                   <h3 className="text-white text-xs uppercase tracking-[0.3em] mb-8 border-b border-gray-800 pb-2 flex items-center gap-3 relative z-10">
                     <Cpu size={14} className="text-tj-gold" /> Powertrain & Performance Matrix
                   </h3>
                   
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-8 relative z-10">
                     <div className="bg-tj-dark/50 p-4 border border-white/5">
                        <p className="text-gray-500 text-[9px] uppercase tracking-widest mb-2 flex items-center gap-2"><Activity size={10}/> Cylinders</p>
                        <p className="text-white text-lg font-mono">{result.EngineCylinders || 'UNK'}</p>
                     </div>
                     <div className="bg-tj-dark/50 p-4 border border-white/5">
                        <p className="text-gray-500 text-[9px] uppercase tracking-widest mb-2 flex items-center gap-2"><Gauge size={10}/> Displacement</p>
                        <p className="text-white text-lg font-mono">{result.EngineHP ? `${result.EngineHP} HP` : 'N/A'}</p>
                     </div>
                     <div className="bg-tj-dark/50 p-4 border border-white/5">
                        <p className="text-gray-500 text-[9px] uppercase tracking-widest mb-2 flex items-center gap-2"><Zap size={10}/> Drivetrain</p>
                        <p className="text-tj-gold text-lg font-mono">{result.DriveType || 'N/A'}</p>
                     </div>
                     <div className="col-span-2 md:col-span-3 pt-4 border-t border-gray-900/50">
                        <p className="text-gray-500 text-[9px] uppercase tracking-widest mb-1">Fuel System Configuration</p>
                        <p className="text-white text-xs tracking-wider font-mono">{result.FuelType || 'Standard Combustion'}</p>
                     </div>
                   </div>
                </div>

                {/* Manufacturing Origin */}
                <div className="bg-gray-900 border border-gray-800 p-6 flex justify-between items-center">
                   <div>
                      <p className="text-gray-500 text-[10px] tracking-widest mb-1">ORIGIN POINT (PLANT)</p>
                      <div className="flex items-center gap-3">
                        <Globe size={16} className="text-blue-500" />
                        <span className="text-white tracking-wider uppercase">{result.PlantCountry || 'Global Asset'}</span>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-gray-500 text-[10px] tracking-widest mb-1">MFG ENTITY</p>
                      <span className="text-gray-300 text-xs uppercase">{result.Manufacturer || 'UNKNOWN'}</span>
                   </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VinLookup;
