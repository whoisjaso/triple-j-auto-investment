import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home, ArrowLeft, Search } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6 relative overflow-hidden">

      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(212,175,55,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.05),transparent_60%)]"></div>

      {/* Decorative Frame */}
      <div className="absolute inset-8 border border-tj-gold/10 pointer-events-none hidden md:block">
        <div className="absolute top-0 left-0 w-32 h-32 border-t border-l border-tj-gold/30"></div>
        <div className="absolute top-0 right-0 w-32 h-32 border-t border-r border-tj-gold/30"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 border-b border-l border-tj-gold/30"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 border-b border-r border-tj-gold/30"></div>
      </div>

      <div className="max-w-4xl w-full relative z-10">

        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-6 border border-red-900/30 rounded-full mb-8 bg-black/50 backdrop-blur-sm">
            <AlertTriangle size={48} className="text-red-500" />
          </div>

          <h1 className="font-display text-9xl md:text-[12rem] leading-none tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-300 to-gray-600">
            404
          </h1>

          <h2 className="text-2xl md:text-4xl font-display text-white tracking-widest mb-4">
            SIGNAL NOT FOUND
          </h2>

          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-12">
            The requested resource does not exist in our system. The path may be incorrect, or the asset has been relocated.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <Link
            to="/"
            className="bg-tj-dark border border-white/10 hover:border-tj-gold p-8 transition-all group flex flex-col items-center text-center"
          >
            <Home className="text-tj-gold mb-4 group-hover:scale-110 transition-transform" size={32} />
            <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-2">Return Home</h3>
            <p className="text-gray-500 text-xs">Main Command Center</p>
          </Link>

          <Link
            to="/inventory"
            className="bg-tj-dark border border-white/10 hover:border-tj-gold p-8 transition-all group flex flex-col items-center text-center"
          >
            <Search className="text-tj-gold mb-4 group-hover:scale-110 transition-transform" size={32} />
            <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-2">View Inventory</h3>
            <p className="text-gray-500 text-xs">Browse Assets</p>
          </Link>

          <Link
            to="/contact"
            className="bg-tj-dark border border-white/10 hover:border-tj-gold p-8 transition-all group flex flex-col items-center text-center"
          >
            <ArrowLeft className="text-tj-gold mb-4 group-hover:scale-110 transition-transform" size={32} />
            <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-2">Contact Us</h3>
            <p className="text-gray-500 text-xs">Initiate Communication</p>
          </Link>
        </div>

        <div className="bg-black/50 border border-white/10 p-6 backdrop-blur-md">
          <p className="text-center text-xs uppercase tracking-widest text-gray-600">
            Error Code: 404 | Resource Not Found | <Link to="/" className="text-tj-gold hover:text-white transition-colors">Return to Base</Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default NotFound;
