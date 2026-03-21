"use client";

import { useState } from 'react';
import { ContractData } from '@/lib/documents/finance';
import { calcTexasTax } from '@/lib/documents/billOfSale';
import InputField from './InputField';
import AddressAutocomplete, { ParsedAddress } from './AddressAutocomplete';
import VehicleSelect, { VehicleOption } from './VehicleSelect';
import BuyerSelect, { BuyerOption } from './BuyerSelect';

interface Props {
  data: ContractData;
  onChange: (data: ContractData) => void;
}

export default function ContractForm({ data, onChange }: Props) {
  const [isDecoding, setIsDecoding] = useState(false);
  const [taxManualOverride, setTaxManualOverride] = useState(false);

  const decodeVin = async () => {
    if (!data.vehicleVin || data.vehicleVin.length < 11) return;
    setIsDecoding(true);
    try {
      const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvaluesextended/${data.vehicleVin}?format=json`);
      const result = await response.json();
      const vehicle = result.Results[0];
      if (vehicle) {
        onChange({ ...data, vehicleYear: vehicle.ModelYear || data.vehicleYear, vehicleMake: vehicle.Make || data.vehicleMake, vehicleModel: vehicle.Model || data.vehicleModel });
      }
    } catch (error) { console.error("VIN Decode failed", error); }
    finally { setIsDecoding(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: string | number = value;
    if (type === 'number') {
      if (value === '') { parsedValue = ''; }
      else { parsedValue = parseFloat(value); if (name === 'numberOfPayments' && (parsedValue as number) < 1) parsedValue = 1; else if ((parsedValue as number) < 0) parsedValue = 0; }
    }

    // Tax override detection
    if (name === 'tax') {
      setTaxManualOverride(true);
      onChange({ ...data, tax: parsedValue as number });
      return;
    }

    // Auto-calc tax when cash price changes
    if (name === 'cashPrice' && !taxManualOverride) {
      const price = typeof parsedValue === 'number' ? parsedValue : 0;
      onChange({ ...data, cashPrice: parsedValue as number, tax: calcTexasTax(price) });
      return;
    }

    onChange({ ...data, [name]: parsedValue } as ContractData);
  };

  const handleVehicleSelect = (v: VehicleOption) => {
    setTaxManualOverride(false);
    onChange({
      ...data,
      vehicleVin: v.vin,
      vehiclePlate: v.licensePlate,
      vehicleYear: String(v.year),
      vehicleMake: v.make,
      vehicleModel: v.model,
      vehicleMileage: String(v.mileage),
      cashPrice: v.price,
      tax: calcTexasTax(v.price),
    });
  };

  const handleBuyerSelect = (b: BuyerOption) => {
    onChange({
      ...data,
      buyerName: b.name,
      buyerPhone: b.phone,
      buyerEmail: b.email,
    });
  };

  const resetTaxOverride = () => {
    setTaxManualOverride(false);
    const price = data.cashPrice || 0;
    onChange({ ...data, tax: calcTexasTax(price) });
  };

  const selectClasses = "w-full px-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-lg focus:outline-none focus:border-tj-gold/50 focus:ring-1 focus:ring-tj-gold/30 transition-all text-base text-white";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white/[0.02] border border-white/[0.06] p-6 rounded-2xl space-y-4">
        <h2 className="text-lg font-serif text-tj-cream border-b border-white/[0.06] pb-3 mb-4">Buyer Details</h2>
        <BuyerSelect onSelect={handleBuyerSelect} />
        <InputField label="Full Name" name="buyerName" value={data.buyerName} onChange={handleChange} />
        <AddressAutocomplete label="Address" name="buyerAddress" value={data.buyerAddress} onChange={handleChange} onAddressSelect={(addr: ParsedAddress) => onChange({ ...data, buyerAddress: `${addr.street}, ${addr.city}, ${addr.state} ${addr.zip}` })} />
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Phone" name="buyerPhone" value={data.buyerPhone} onChange={handleChange} />
          <InputField label="Email" name="buyerEmail" type="email" value={data.buyerEmail} onChange={handleChange} />
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/[0.06] p-6 rounded-2xl space-y-4">
        <h2 className="text-lg font-serif text-tj-cream border-b border-white/[0.06] pb-3 mb-4">Co-Buyer Details</h2>
        <InputField label="Full Name" name="coBuyerName" value={data.coBuyerName} onChange={handleChange} />
        <AddressAutocomplete label="Address" name="coBuyerAddress" value={data.coBuyerAddress} onChange={handleChange} onAddressSelect={(addr: ParsedAddress) => onChange({ ...data, coBuyerAddress: `${addr.street}, ${addr.city}, ${addr.state} ${addr.zip}` })} />
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Phone" name="coBuyerPhone" value={data.coBuyerPhone} onChange={handleChange} />
          <InputField label="Email" name="coBuyerEmail" type="email" value={data.coBuyerEmail} onChange={handleChange} />
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/[0.06] p-6 rounded-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-white/[0.06] pb-3 mb-4">
          <h2 className="text-lg font-serif text-tj-cream">Vehicle Information</h2>
          <button onClick={decodeVin} disabled={isDecoding || !data.vehicleVin} className="text-[10px] font-bold tracking-widest uppercase bg-tj-gold text-white px-3 py-1.5 rounded-full hover:bg-tj-gold/90 transition-all disabled:opacity-50">
            {isDecoding ? 'Decoding...' : 'VIN Decode'}
          </button>
        </div>
        <VehicleSelect onSelect={handleVehicleSelect} />
        <div className="grid grid-cols-3 gap-3">
          <InputField label="VIN" name="vehicleVin" uppercase value={data.vehicleVin} onChange={handleChange} />
          <InputField label="License Plate" name="vehiclePlate" uppercase value={data.vehiclePlate} onChange={handleChange} />
          <InputField label="Mileage" name="vehicleMileage" value={data.vehicleMileage} onChange={handleChange} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <InputField label="Year" name="vehicleYear" value={data.vehicleYear} onChange={handleChange} />
          <InputField label="Make" name="vehicleMake" value={data.vehicleMake} onChange={handleChange} />
          <InputField label="Model" name="vehicleModel" value={data.vehicleModel} onChange={handleChange} />
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/[0.06] p-6 rounded-2xl space-y-4">
        <h2 className="text-lg font-serif text-tj-cream border-b border-white/[0.06] pb-3 mb-4">Financials</h2>
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Cash Price ($)" name="cashPrice" type="number" min="0" value={data.cashPrice} onChange={handleChange} />
          <InputField label="Down Payment ($)" name="downPayment" type="number" min="0" value={data.downPayment} onChange={handleChange} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {/* Tax with auto-calc indicator */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold tracking-widest uppercase text-white/50">Tax ($)</label>
              {!taxManualOverride ? (
                <span className="text-[9px] font-bold tracking-widest uppercase text-tj-gold/60 bg-tj-gold/10 px-1.5 py-0.5 rounded-full">AUTO</span>
              ) : (
                <button
                  type="button"
                  onClick={resetTaxOverride}
                  className="text-[9px] font-bold tracking-widest uppercase text-white/40 hover:text-tj-gold transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  RESET
                </button>
              )}
            </div>
            <input
              type="number"
              name="tax"
              value={data.tax ?? ''}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-lg focus:outline-none focus:border-tj-gold/50 focus:ring-1 focus:ring-tj-gold/30 transition-all text-base text-white placeholder:text-white/30"
            />
          </div>
          <InputField label="Title/Reg Fee ($)" name="titleFee" type="number" min="0" value={data.titleFee} onChange={handleChange} />
          <InputField label="Doc Fee ($)" name="docFee" type="number" min="0" value={data.docFee} onChange={handleChange} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InputField label="APR (%)" name="apr" type="number" step="0.01" min="0" value={data.apr} onChange={handleChange} />
          <InputField label="No. of Payments" name="numberOfPayments" type="number" min="1" value={data.numberOfPayments} onChange={handleChange} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-semibold tracking-widest uppercase text-white/50 mb-2">Frequency</label>
            <select name="paymentFrequency" value={data.paymentFrequency} onChange={handleChange} className={selectClasses}>
              <option value="Weekly">Weekly</option>
              <option value="Bi-weekly">Bi-weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </div>
          <InputField label="First Payment" name="firstPaymentDate" type="date" value={data.firstPaymentDate} onChange={handleChange} />
        </div>
        <InputField label="Total Due at Signing ($)" name="dueAtSigning" type="number" min="0" value={data.dueAtSigning} onChange={handleChange} />
      </div>
    </div>
  );
}
