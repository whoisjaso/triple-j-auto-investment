import React from 'react';
import { Shield, AlertTriangle, FileText, Scale } from 'lucide-react';

const Policies = () => {
  return (
    <div className="min-h-screen bg-black pt-40 pb-20 px-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16 border-b border-white/10 pb-12">
          <div className="inline-flex items-center gap-2 mb-6 text-tj-gold text-xs uppercase tracking-[0.4em]">
            <Shield size={16} />
            <span>Legal Framework</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-display text-white tracking-tight mb-6">
            POLICIES
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Our operational protocols. Read before purchase.
          </p>
        </div>

        {/* AS-IS Policy */}
        <section className="mb-16 bg-red-900/10 border border-red-900/30 p-12">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-red-900/20 border border-red-900/50 text-red-500">
              <AlertTriangle size={32} />
            </div>
            <div>
              <h2 className="text-white font-display text-3xl mb-2">AS-IS SALES POLICY</h2>
              <p className="text-red-500 text-xs uppercase tracking-widest">No Warranties • No Returns</p>
            </div>
          </div>
          <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed space-y-4">
            <p>
              <strong className="text-white">ALL VEHICLES ARE SOLD "AS-IS" WITH NO WARRANTIES, EXPRESSED OR IMPLIED.</strong>
              This means you are purchasing the vehicle in its current condition, with all existing faults, whether known or unknown.
            </p>
            <p>
              Triple J Auto Investment makes no guarantees regarding the mechanical, electrical, cosmetic, or operational condition of any vehicle.
              While we provide diagnostic disclosures where available, we do not warrant that such disclosures are exhaustive or complete.
            </p>
            <p className="font-bold text-white">
              By completing a purchase, you acknowledge that:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You have inspected the vehicle or waived your right to do so</li>
              <li>All post-sale repairs are your sole responsibility</li>
              <li>No refunds, exchanges, or returns are permitted</li>
              <li>You accept all risk of future malfunction or failure</li>
            </ul>
          </div>
        </section>

        {/* Payment Policy */}
        <section className="mb-16 bg-tj-dark border border-white/10 p-12">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-tj-gold/10 border border-tj-gold/30 text-tj-gold">
              <FileText size={32} />
            </div>
            <div>
              <h2 className="text-white font-display text-3xl mb-2">PAYMENT POLICY</h2>
              <p className="text-tj-gold text-xs uppercase tracking-widest">Accepted Methods</p>
            </div>
          </div>
          <div className="space-y-6 text-gray-300">
            <div>
              <h3 className="text-white font-bold mb-2">ACCEPTED PAYMENT METHODS</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Cash:</strong> Immediate release of vehicle</li>
                <li><strong>Cashier's Check:</strong> Verified same-day release</li>
                <li><strong>Wire Transfer:</strong> Release upon bank confirmation</li>
                <li><strong>Personal Check:</strong> 3-5 business day hold for clearance</li>
                <li><strong>Approved Financing:</strong> Release upon lender funding confirmation</li>
              </ul>
            </div>
            <div className="bg-black/50 border border-white/5 p-6">
              <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                <AlertTriangle size={16} className="text-tj-gold" />
                DEPOSIT POLICY
              </h3>
              <p className="text-sm">
                Non-refundable deposits may be required to hold a vehicle. Deposits are applied to final purchase price.
                If buyer fails to complete purchase within agreed timeframe, deposit is forfeited.
              </p>
            </div>
          </div>
        </section>

        {/* Title & Registration Policy */}
        <section className="mb-16 bg-tj-dark border border-white/10 p-12">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-tj-gold/10 border border-tj-gold/30 text-tj-gold">
              <Scale size={32} />
            </div>
            <div>
              <h2 className="text-white font-display text-3xl mb-2">TITLE & REGISTRATION POLICY</h2>
              <p className="text-tj-gold text-xs uppercase tracking-widest">Texas DMV Compliance</p>
            </div>
          </div>
          <div className="space-y-6 text-gray-300">
            <p>
              We submit all required paperwork to the Texas DMV within <strong className="text-white">48 hours</strong> of completed sale.
              Processing time is controlled by the state, not Triple J Auto Investment.
            </p>
            <div>
              <h3 className="text-white font-bold mb-2">BUYER RESPONSIBILITIES</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Obtain valid insurance coverage before taking possession</li>
                <li>Complete emissions testing if required by county</li>
                <li>Pay all applicable state and local taxes, title fees, and registration fees</li>
                <li>Provide valid government-issued ID and proof of residence</li>
              </ul>
            </div>
            <div className="bg-black/50 border border-white/5 p-6">
              <p className="text-sm">
                <strong className="text-white">OUT-OF-STATE BUYERS:</strong> You are responsible for understanding and complying with your state's registration requirements.
                We provide all necessary documentation but do not guarantee acceptance by your state's DMV.
              </p>
            </div>
          </div>
        </section>

        {/* Inspection & Test Drive Policy */}
        <section className="mb-16 bg-tj-dark border border-white/10 p-12">
          <h2 className="text-white font-display text-3xl mb-6">INSPECTION & TEST DRIVE POLICY</h2>
          <div className="space-y-6 text-gray-300">
            <div>
              <h3 className="text-white font-bold mb-2">PRE-PURCHASE INSPECTIONS</h3>
              <p>
                Buyers may arrange independent mechanical inspections at their own expense. Inspector must be licensed and insured.
                Inspections must be scheduled in advance and completed on our premises during business hours.
              </p>
            </div>
            <div>
              <h3 className="text-white font-bold mb-2">TEST DRIVES</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Valid driver's license required</li>
                <li>Proof of insurance may be required for high-value vehicles</li>
                <li>Routes are predetermined by Triple J staff</li>
                <li>Driver assumes all liability during test drive</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Privacy & Data Policy */}
        <section className="mb-16 bg-tj-dark border border-white/10 p-12">
          <h2 className="text-white font-display text-3xl mb-6">PRIVACY & DATA POLICY</h2>
          <div className="space-y-4 text-gray-300">
            <p>
              We collect personal information (name, phone, email, address) solely for transaction processing and legal compliance.
              We do not sell or share your data with third parties except as required for financing or title processing.
            </p>
            <p>
              Credit applications are submitted to lenders and subject to their privacy policies.
              We retain transaction records as required by Texas law.
            </p>
            <p className="text-sm text-gray-500">
              By providing your information, you consent to communication via phone, email, or SMS regarding your inquiry or purchase.
            </p>
          </div>
        </section>

        {/* Disclaimer */}
        <div className="bg-black border border-white/10 p-8 text-center">
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-4">Legal Disclaimer</p>
          <p className="text-gray-400 text-sm leading-relaxed max-w-3xl mx-auto">
            These policies are subject to change without notice. Current version governs all transactions.
            Triple J Auto Investment operates under Texas Dealer License <strong className="text-white">P171632</strong>.
            All disputes subject to binding arbitration in Harris County, Texas.
          </p>
        </div>

      </div>
    </div>
  );
};

export default Policies;
