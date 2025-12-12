import React, { useState } from 'react';
import { useStore } from '../context/Store';
import { useNavigate } from 'react-router-dom';
import { Key, Lock, ShieldAlert, Fingerprint } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'error' | 'recovery'>('idle');
  const { login, triggerRecovery } = useStore();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(email, password);
    
    if (success) {
      navigate('/admin/dashboard');
    } else {
      // Security Protocol: Failed Attempt
      setStatus('error');
      triggerRecovery(); // Simulate sending the email immediately on failure
    }
  };

  const handleForgot = () => {
    setStatus('recovery');
    triggerRecovery();
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-tj-gold/5 via-black to-black"></div>
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(212,175,55,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center mb-6">
            <img
              src="/GoldTripleJLogo.png"
              alt="Triple J Auto Investment"
              className="h-24 w-auto object-contain animate-pulse"
            />
          </div>
          <h2 className="font-display text-3xl text-white tracking-[0.3em] mb-2">RESTRICTED ACCESS</h2>
          <p className="text-[10px] uppercase tracking-widest text-gray-500">Triple J Sovereign Domain</p>
        </div>
        
        <div className="bg-tj-dark border border-tj-gold/20 p-10 relative overflow-hidden backdrop-blur-md shadow-[0_0_50px_rgba(0,0,0,0.8)]">
          {/* Corner Accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-tj-gold"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-tj-gold"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-tj-gold"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-tj-gold"></div>

          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            <div className="group">
              <label className="block text-[10px] uppercase tracking-[0.2em] text-tj-gold mb-3 flex items-center gap-2">
                <Fingerprint size={12} /> Identity Key (Email)
              </label>
              <div className="flex items-center border-b border-gray-800 group-focus-within:border-tj-gold transition-colors pb-2 bg-black/20 px-3">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-white font-mono text-sm focus:outline-none tracking-wider placeholder-gray-800 py-2"
                  placeholder="ENTER DESIGNATION"
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-[10px] uppercase tracking-[0.2em] text-tj-gold mb-3 flex items-center gap-2">
                <Key size={12} /> Access Cipher (Password)
              </label>
              <div className="flex items-center border-b border-gray-800 group-focus-within:border-tj-gold transition-colors pb-2 bg-black/20 px-3">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-white font-mono text-sm focus:outline-none tracking-wider placeholder-gray-800 py-2"
                  placeholder="ENTER SEQUENCE"
                />
              </div>
            </div>

            {status === 'error' && (
                <div className="bg-red-900/20 border border-red-500/50 p-4 flex items-start gap-3 animate-fade-in">
                    <ShieldAlert className="text-red-500 shrink-0" size={16} />
                    <div>
                        <p className="text-red-500 text-xs font-bold tracking-widest uppercase mb-1">Access Denied</p>
                        <p className="text-red-400 text-[10px] leading-relaxed">
                           Security breach detected. A verification protocol has been dispatched to the owner's secure channel ({email || 'Primary'}).
                        </p>
                    </div>
                </div>
            )}

            {status === 'recovery' && (
                <div className="bg-tj-gold/10 border border-tj-gold/50 p-4 flex items-start gap-3 animate-fade-in">
                    <ShieldAlert className="text-tj-gold shrink-0" size={16} />
                    <div>
                        <p className="text-tj-gold text-xs font-bold tracking-widest uppercase mb-1">Recovery Initiated</p>
                        <p className="text-gray-400 text-[10px] leading-relaxed">
                           Secure link transmission dispatched. Check your primary frequency.
                        </p>
                    </div>
                </div>
            )}

            <button className="w-full bg-white text-black font-bold py-4 text-xs uppercase tracking-[0.3em] hover:bg-tj-gold transition-colors duration-500 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              Authenticate
            </button>

            <div className="text-center">
                <button type="button" onClick={handleForgot} className="text-[9px] uppercase tracking-widest text-gray-600 hover:text-tj-gold transition-colors">
                    Lost Access Sequence?
                </button>
            </div>
          </form>
        </div>
        
        <p className="text-center text-[10px] uppercase text-gray-700 mt-8 tracking-widest">
          Secure connection established. <br/>Unauthorized attempts are logged.
        </p>
      </div>
    </div>
  );
};

export default Login;