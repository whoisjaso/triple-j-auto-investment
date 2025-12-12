import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Search, FileText, Truck, Wrench, CreditCard, ArrowRight, CheckCircle } from 'lucide-react';

const Services = () => {
  return (
    <div className="min-h-screen bg-black pt-40 pb-20 px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-20 border-b border-white/10 pb-12">
          <div className="inline-flex items-center gap-2 mb-6 text-tj-gold text-xs uppercase tracking-[0.4em]">
            <Shield size={16} />
            <span>Service Protocols</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-display text-white tracking-tight mb-6">
            WHAT WE PROVIDE
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Beyond vehicles. We deliver clarity, confidence, and dominion over your asset acquisition process.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">

          {/* Service 1 */}
          <div className="bg-tj-dark border border-white/10 p-10 hover:border-tj-gold/50 transition-all duration-500 group">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-4 bg-black border border-tj-gold/30 text-tj-gold group-hover:bg-tj-gold group-hover:text-black transition-all">
                <Search size={32} />
              </div>
              <div>
                <h3 className="text-white font-display text-2xl mb-2">VIN Intelligence</h3>
                <p className="text-tj-gold text-xs uppercase tracking-widest">DEEP DATA ANALYSIS</p>
              </div>
            </div>
            <p className="text-gray-400 leading-relaxed mb-6">
              Military-grade vehicle history verification. We decode VINs through NHTSA databases and cross-reference title records to ensure you receive unfiltered truth about your prospective asset.
            </p>
            <Link to="/vin" className="text-tj-gold text-xs uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2">
              Access Intelligence <ArrowRight size={12} />
            </Link>
          </div>

          {/* Service 2 */}
          <div className="bg-tj-dark border border-white/10 p-10 hover:border-tj-gold/50 transition-all duration-500 group">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-4 bg-black border border-tj-gold/30 text-tj-gold group-hover:bg-tj-gold group-hover:text-black transition-all">
                <Shield size={32} />
              </div>
              <div>
                <h3 className="text-white font-display text-2xl mb-2">AS-IS Transparency</h3>
                <p className="text-tj-gold text-xs uppercase tracking-widest">RADICAL HONESTY</p>
              </div>
            </div>
            <p className="text-gray-400 leading-relaxed mb-6">
              Every vehicle is sold AS-IS. We do not hide flaws. We document them. Our diagnostic reports reveal mechanical, cosmetic, and operational reality—without apology or embellishment.
            </p>
            <Link to="/inventory" className="text-tj-gold text-xs uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2">
              View Assets <ArrowRight size={12} />
            </Link>
          </div>

          {/* Service 3 */}
          <div className="bg-tj-dark border border-white/10 p-10 hover:border-tj-gold/50 transition-all duration-500 group">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-4 bg-black border border-tj-gold/30 text-tj-gold group-hover:bg-tj-gold group-hover:text-black transition-all">
                <Truck size={32} />
              </div>
              <div>
                <h3 className="text-white font-display text-2xl mb-2">Logistics Coordination</h3>
                <p className="text-tj-gold text-xs uppercase tracking-widest">TRANSPORT SOLUTIONS</p>
              </div>
            </div>
            <p className="text-gray-400 leading-relaxed mb-6">
              We facilitate secure transport arrangements for out-of-state buyers. Your asset arrives protected, insured, and intact. Shipping is structured, not chaotic.
            </p>
            <Link to="/contact" className="text-tj-gold text-xs uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2">
              Inquire <ArrowRight size={12} />
            </Link>
          </div>

          {/* Service 4 */}
          <div className="bg-tj-dark border border-white/10 p-10 hover:border-tj-gold/50 transition-all duration-500 group">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-4 bg-black border border-tj-gold/30 text-tj-gold group-hover:bg-tj-gold group-hover:text-black transition-all">
                <FileText size={32} />
              </div>
              <div>
                <h3 className="text-white font-display text-2xl mb-2">Title Processing</h3>
                <p className="text-tj-gold text-xs uppercase tracking-widest">REGISTRATION WORKFLOW</p>
              </div>
            </div>
            <p className="text-gray-400 leading-relaxed mb-6">
              Texas DMV compliance is mandatory. We ensure all documentation is prepared correctly for seamless title transfer. No delays. No bureaucratic friction.
            </p>
            <div className="text-gray-600 text-xs uppercase tracking-widest">
              Included with purchase
            </div>
          </div>

          {/* Service 5 */}
          <div className="bg-tj-dark border border-white/10 p-10 hover:border-tj-gold/50 transition-all duration-500 group">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-4 bg-black border border-tj-gold/30 text-tj-gold group-hover:bg-tj-gold group-hover:text-black transition-all">
                <CreditCard size={32} />
              </div>
              <div>
                <h3 className="text-white font-display text-2xl mb-2">Financing Options</h3>
                <p className="text-tj-gold text-xs uppercase tracking-widest">CAPITAL STRATEGIES</p>
              </div>
            </div>
            <p className="text-gray-400 leading-relaxed mb-6">
              We partner with strategic lenders who specialize in high-value asset financing. Rates and terms vary by credit profile. Pre-approval available.
            </p>
            <Link to="/finance" className="text-tj-gold text-xs uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2">
              Explore Financing <ArrowRight size={12} />
            </Link>
          </div>

          {/* Service 6 */}
          <div className="bg-tj-dark border border-white/10 p-10 hover:border-tj-gold/50 transition-all duration-500 group">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-4 bg-black border border-tj-gold/30 text-tj-gold group-hover:bg-tj-gold group-hover:text-black transition-all">
                <Wrench size={32} />
              </div>
              <div>
                <h3 className="text-white font-display text-2xl mb-2">Trade-In Assessment</h3>
                <p className="text-tj-gold text-xs uppercase tracking-widest">ASSET VALUATION</p>
              </div>
            </div>
            <p className="text-gray-400 leading-relaxed mb-6">
              Considering a trade? We provide fair market valuations based on real-time auction data and regional demand. No inflated appraisals. Only truth.
            </p>
            <Link to="/contact" className="text-tj-gold text-xs uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2">
              Request Valuation <ArrowRight size={12} />
            </Link>
          </div>

        </div>

        {/* What We Don't Do */}
        <div className="bg-red-900/10 border border-red-900/30 p-12">
          <h2 className="text-white font-display text-3xl mb-8 flex items-center gap-3">
            <span className="text-red-500">⚠</span> WHAT WE DON'T DO
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-400">
            <div className="flex items-start gap-3">
              <span className="text-red-500 text-2xl">×</span>
              <div>
                <h4 className="text-white font-bold mb-1">No Warranties or Guarantees</h4>
                <p className="text-sm">All sales are AS-IS. We do not provide warranties, implied or express. You purchase based on disclosed condition.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-red-500 text-2xl">×</span>
              <div>
                <h4 className="text-white font-bold mb-1">No Post-Sale Modifications</h4>
                <p className="text-sm">We do not perform mechanical work, detailing, or customization after purchase. Vehicles are delivered as inspected.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-red-500 text-2xl">×</span>
              <div>
                <h4 className="text-white font-bold mb-1">No Returns or Refunds</h4>
                <p className="text-sm">All sales are final. Inspect thoroughly before commitment. Due diligence is your responsibility.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-red-500 text-2xl">×</span>
              <div>
                <h4 className="text-white font-bold mb-1">No Pressure Tactics</h4>
                <p className="text-sm">We do not upsell, manipulate, or coerce. You make decisions from clarity, not emotion.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Services;
