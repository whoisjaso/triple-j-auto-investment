"use client";

import { useState } from 'react';
import { BillOfSaleData, calcTexasTax, reverseTTL, TEXAS_TITLE_FEE, DEFAULT_DOC_FEE, DEFAULT_REG_FEE } from '@/lib/documents/billOfSale';
import InputField from './InputField';
import AddressAutocomplete, { ParsedAddress } from './AddressAutocomplete';
import VehicleSelect, { VehicleOption } from './VehicleSelect';
import BuyerSelect, { BuyerOption } from './BuyerSelect';

interface Props {
  data: BillOfSaleData;
  onChange: (data: BillOfSaleData) => void;
}

export default function BillOfSaleForm({ data, onChange }: Props) {
  const [isDecoding, setIsDecoding] = useState(false);
  const [taxManualOverride, setTaxManualOverride] = useState(false);
  const [ttlMode, setTtlMode] = useState(false);
  const [selectedVehiclePrice, setSelectedVehiclePrice] = useState<number | null>(null);

  const decodeVin = async () => {
    if (!data.vehicleVin || data.vehicleVin.length < 11) return;
    setIsDecoding(true);
    try {
      const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvaluesextended/${data.vehicleVin}?format=json`);
      const result = await response.json();
      const v = result.Results[0];
      if (v) {
        onChange({ ...data, vehicleYear: v.ModelYear || data.vehicleYear, vehicleMake: v.Make || data.vehicleMake, vehicleModel: v.Model || data.vehicleModel, vehicleTrim: v.Trim || data.vehicleTrim, vehicleBodyStyle: v.BodyClass || data.vehicleBodyStyle });
      }
    } catch (error) { console.error("VIN Decode failed", error); }
    finally { setIsDecoding(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: string | number = value;
    if (type === 'number') {
      if (value === '') { parsedValue = ''; }
      else { parsedValue = parseFloat(value); if ((parsedValue as number) < 0) parsedValue = 0; }
    }

    // Tax override detection: if user edits tax directly, enable manual override
    if (name === 'tax') {
      setTaxManualOverride(true);
      onChange({ ...data, tax: parsedValue as number });
      return;
    }

    // Auto-calc tax when sale price changes (unless manually overridden)
    if (name === 'salePrice' && !taxManualOverride) {
      const price = typeof parsedValue === 'number' ? parsedValue : 0;
      onChange({ ...data, salePrice: parsedValue as number, tax: calcTexasTax(price) });
      return;
    }

    onChange({ ...data, [name]: parsedValue } as BillOfSaleData);
  };

  const handleVehicleSelect = (v: VehicleOption) => {
    setSelectedVehiclePrice(v.price);
    setTaxManualOverride(false);

    if (ttlMode) {
      // TTL mode: vehicle price IS the out-the-door price
      const { salePrice, tax } = reverseTTL(v.price);
      onChange({
        ...data,
        vehicleVin: v.vin,
        vehiclePlate: v.licensePlate,
        vehicleYear: String(v.year),
        vehicleMake: v.make,
        vehicleModel: v.model,
        vehicleTrim: v.trim,
        vehicleColor: v.exteriorColor,
        vehicleBodyStyle: v.bodyStyle,
        vehicleMileage: String(v.mileage),
        odometerReading: String(v.mileage),
        stockNumber: v.stockNumber,
        salePrice,
        tax,
        titleFee: TEXAS_TITLE_FEE,
        docFee: DEFAULT_DOC_FEE,
        registrationFee: DEFAULT_REG_FEE,
      });
    } else {
      // Normal mode: vehicle price IS the sale price
      onChange({
        ...data,
        vehicleVin: v.vin,
        vehiclePlate: v.licensePlate,
        vehicleYear: String(v.year),
        vehicleMake: v.make,
        vehicleModel: v.model,
        vehicleTrim: v.trim,
        vehicleColor: v.exteriorColor,
        vehicleBodyStyle: v.bodyStyle,
        vehicleMileage: String(v.mileage),
        odometerReading: String(v.mileage),
        stockNumber: v.stockNumber,
        salePrice: v.price,
        tax: calcTexasTax(v.price),
      });
    }
  };

  const handleBuyerSelect = (b: BuyerOption) => {
    onChange({
      ...data,
      buyerName: b.name,
      buyerPhone: b.phone,
      buyerEmail: b.email,
    });
  };

  const handleTtlToggle = () => {
    const next = !ttlMode;
    setTtlMode(next);
    setTaxManualOverride(false);

    if (next && selectedVehiclePrice) {
      // Switching TTL ON with a vehicle selected → reverse-calc
      const { salePrice, tax } = reverseTTL(selectedVehiclePrice);
      onChange({
        ...data,
        salePrice,
        tax,
        titleFee: TEXAS_TITLE_FEE,
        docFee: DEFAULT_DOC_FEE,
        registrationFee: DEFAULT_REG_FEE,
      });
    } else if (!next && selectedVehiclePrice) {
      // Switching TTL OFF → vehicle price is the sale price
      onChange({
        ...data,
        salePrice: selectedVehiclePrice,
        tax: calcTexasTax(selectedVehiclePrice),
      });
    }
  };

  const resetTaxOverride = () => {
    setTaxManualOverride(false);
    const price = data.salePrice || 0;
    onChange({ ...data, tax: calcTexasTax(price) });
  };

  const selectClasses = "w-full px-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-lg focus:outline-none focus:border-tj-gold/50 focus:ring-1 focus:ring-tj-gold/30 transition-all text-base text-white";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Buyer */}
      <div className="bg-white/[0.02] border border-white/[0.06] p-6 rounded-2xl space-y-4">
        <h2 className="text-lg font-serif text-tj-cream border-b border-white/[0.06] pb-3 mb-4">Buyer Details</h2>
        <BuyerSelect onSelect={handleBuyerSelect} />
        <InputField label="Full Name" name="buyerName" value={data.buyerName} onChange={handleChange} />
        <AddressAutocomplete label="Street Address" name="buyerAddress" value={data.buyerAddress} onChange={handleChange} onAddressSelect={(addr: ParsedAddress) => onChange({ ...data, buyerAddress: addr.street, buyerCity: addr.city, buyerState: addr.state, buyerZip: addr.zip })} />
        <div className="grid grid-cols-3 gap-3">
          <InputField label="City" name="buyerCity" value={data.buyerCity} onChange={handleChange} />
          <InputField label="State" name="buyerState" uppercase value={data.buyerState} onChange={handleChange} />
          <InputField label="Zip" name="buyerZip" value={data.buyerZip} onChange={handleChange} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Phone" name="buyerPhone" value={data.buyerPhone} onChange={handleChange} />
          <InputField label="Email" name="buyerEmail" type="email" value={data.buyerEmail} onChange={handleChange} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Driver's License #" name="buyerLicense" uppercase value={data.buyerLicense} onChange={handleChange} />
          <InputField label="DL State" name="buyerLicenseState" uppercase value={data.buyerLicenseState} onChange={handleChange} />
        </div>
      </div>

      {/* Co-Buyer */}
      <div className="bg-white/[0.02] border border-white/[0.06] p-6 rounded-2xl space-y-4">
        <h2 className="text-lg font-serif text-tj-cream border-b border-white/[0.06] pb-3 mb-4">Co-Buyer Details</h2>
        <InputField label="Full Name" name="coBuyerName" value={data.coBuyerName} onChange={handleChange} />
        <AddressAutocomplete label="Street Address" name="coBuyerAddress" value={data.coBuyerAddress} onChange={handleChange} onAddressSelect={(addr: ParsedAddress) => onChange({ ...data, coBuyerAddress: addr.street, coBuyerCity: addr.city, coBuyerState: addr.state, coBuyerZip: addr.zip })} />
        <div className="grid grid-cols-3 gap-3">
          <InputField label="City" name="coBuyerCity" value={data.coBuyerCity} onChange={handleChange} />
          <InputField label="State" name="coBuyerState" uppercase value={data.coBuyerState} onChange={handleChange} />
          <InputField label="Zip" name="coBuyerZip" value={data.coBuyerZip} onChange={handleChange} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Phone" name="coBuyerPhone" value={data.coBuyerPhone} onChange={handleChange} />
          <InputField label="Email" name="coBuyerEmail" type="email" value={data.coBuyerEmail} onChange={handleChange} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Driver's License #" name="coBuyerLicense" uppercase value={data.coBuyerLicense} onChange={handleChange} />
          <InputField label="DL State" name="coBuyerLicenseState" uppercase value={data.coBuyerLicenseState} onChange={handleChange} />
        </div>
      </div>

      {/* Vehicle */}
      <div className="bg-white/[0.02] border border-white/[0.06] p-6 rounded-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-white/[0.06] pb-3 mb-4">
          <h2 className="text-lg font-serif text-tj-cream">Vehicle Information</h2>
          <button onClick={decodeVin} disabled={isDecoding || !data.vehicleVin} className="text-[10px] font-bold tracking-widest uppercase bg-tj-gold text-white px-3 py-1.5 rounded-full hover:bg-tj-gold/90 transition-all disabled:opacity-50">
            {isDecoding ? 'Decoding...' : 'VIN Decode'}
          </button>
        </div>
        <VehicleSelect onSelect={handleVehicleSelect} />
        <div className="grid grid-cols-2 gap-3">
          <InputField label="VIN" name="vehicleVin" uppercase value={data.vehicleVin} onChange={handleChange} />
          <InputField label="License Plate" name="vehiclePlate" uppercase value={data.vehiclePlate} onChange={handleChange} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <InputField label="Year" name="vehicleYear" value={data.vehicleYear} onChange={handleChange} />
          <InputField label="Make" name="vehicleMake" value={data.vehicleMake} onChange={handleChange} />
          <InputField label="Model" name="vehicleModel" value={data.vehicleModel} onChange={handleChange} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <InputField label="Trim" name="vehicleTrim" value={data.vehicleTrim} onChange={handleChange} />
          <InputField label="Color" name="vehicleColor" value={data.vehicleColor} onChange={handleChange} />
          <InputField label="Body Style" name="vehicleBodyStyle" value={data.vehicleBodyStyle} onChange={handleChange} />
        </div>
        <InputField label="Mileage" name="vehicleMileage" value={data.vehicleMileage} onChange={handleChange} />
        <div className="border-t border-white/[0.06] pt-4 mt-2">
          <h3 className="text-[10px] font-bold tracking-widest uppercase text-white/40 mb-3">Odometer Disclosure</h3>
          <InputField label="Odometer Reading" name="odometerReading" value={data.odometerReading} onChange={handleChange} />
          <div className="mt-3">
            <label className="block text-[10px] font-semibold tracking-widest uppercase text-white/50 mb-2">Odometer Status</label>
            <select name="odometerStatus" value={data.odometerStatus} onChange={handleChange} className={selectClasses}>
              <option value="actual">Actual Mileage</option>
              <option value="exceeds">Exceeds Mechanical Limits</option>
              <option value="not_actual">Not Actual (Odometer Discrepancy)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pricing & Fees */}
      <div className="bg-white/[0.02] border border-white/[0.06] p-6 rounded-2xl space-y-4">
        <h2 className="text-lg font-serif text-tj-cream border-b border-white/[0.06] pb-3 mb-4">Sale Details</h2>

        {/* TTL Toggle */}
        <label className="flex items-center gap-3 px-4 py-3 bg-tj-gold/[0.06] border border-tj-gold/20 rounded-lg cursor-pointer hover:bg-tj-gold/10 transition-colors">
          <input
            type="checkbox"
            checked={ttlMode}
            onChange={handleTtlToggle}
            disabled={!selectedVehiclePrice}
            className="w-4 h-4 rounded border-white/20 text-tj-gold focus:ring-tj-gold/50 bg-white/[0.04] disabled:opacity-30"
          />
          <div>
            <span className="text-sm text-white font-medium">Price includes TTL</span>
            {!selectedVehiclePrice && (
              <span className="text-[10px] text-white/30 ml-2">(select a vehicle first)</span>
            )}
          </div>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <InputField label="Sale Date" name="saleDate" type="date" value={data.saleDate} onChange={handleChange} />
          <InputField label="Stock #" name="stockNumber" value={data.stockNumber} onChange={handleChange} />
        </div>
        <InputField label="Sale Price ($)" name="salePrice" type="number" min="0" value={data.salePrice} onChange={handleChange} />

        {/* Tax with auto-calc indicator */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold tracking-widest uppercase text-white/50">Sales Tax ($)</label>
              {!taxManualOverride ? (
                <span className="text-[9px] font-bold tracking-widest uppercase text-tj-gold/60 bg-tj-gold/10 px-2 py-0.5 rounded-full">AUTO 6.25%</span>
              ) : (
                <button
                  type="button"
                  onClick={resetTaxOverride}
                  className="text-[9px] font-bold tracking-widest uppercase text-white/40 hover:text-tj-gold transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  RESET AUTO
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
          <InputField label="Title Fee ($)" name="titleFee" type="number" min="0" value={data.titleFee} onChange={handleChange} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <InputField label="Doc Fee ($)" name="docFee" type="number" min="0" value={data.docFee} onChange={handleChange} />
          <InputField label="Registration ($)" name="registrationFee" type="number" min="0" value={data.registrationFee} onChange={handleChange} />
          <InputField label="Other Fees ($)" name="otherFees" type="number" min="0" value={data.otherFees} onChange={handleChange} />
        </div>
        {data.otherFees > 0 && <InputField label="Other Fees Description" name="otherFeesDescription" value={data.otherFeesDescription} onChange={handleChange} />}
        <div>
          <label className="block text-[10px] font-semibold tracking-widest uppercase text-white/50 mb-2">Payment Method</label>
          <select name="paymentMethod" value={data.paymentMethod} onChange={handleChange} className={selectClasses}>
            <option value="Cash">Cash</option>
            <option value="Certified Check">Certified Check</option>
            <option value="Cashier Check">Cashier&apos;s Check</option>
            <option value="Zelle">Zelle</option>
            <option value="CashApp">CashApp</option>
            <option value="Financing">Financing (See Installment Contract)</option>
            <option value="Other">Other</option>
          </select>
        </div>
        {data.paymentMethod === 'Other' && <InputField label="Specify Payment Method" name="paymentMethodOther" value={data.paymentMethodOther} onChange={handleChange} />}
      </div>

      {/* Trade-In */}
      <div className="bg-white/[0.02] border border-white/[0.06] p-6 rounded-2xl space-y-4">
        <h2 className="text-lg font-serif text-tj-cream border-b border-white/[0.06] pb-3 mb-4">Trade-In Vehicle</h2>
        <InputField label="Trade-In Description" name="tradeInDescription" value={data.tradeInDescription} onChange={handleChange} placeholder="e.g. 2018 Honda Civic LX" />
        <InputField label="Trade-In VIN" name="tradeInVin" uppercase value={data.tradeInVin} onChange={handleChange} />
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Trade-In Allowance ($)" name="tradeInAllowance" type="number" min="0" value={data.tradeInAllowance} onChange={handleChange} />
          <InputField label="Trade-In Payoff ($)" name="tradeInPayoff" type="number" min="0" value={data.tradeInPayoff} onChange={handleChange} />
        </div>
      </div>

      {/* Condition */}
      <div className="bg-white/[0.02] border border-white/[0.06] p-6 rounded-2xl space-y-4">
        <h2 className="text-lg font-serif text-tj-cream border-b border-white/[0.06] pb-3 mb-4">Vehicle Condition</h2>
        <div>
          <label className="block text-[10px] font-semibold tracking-widest uppercase text-white/50 mb-2">Sale Type</label>
          <select name="conditionType" value={data.conditionType} onChange={handleChange} className={selectClasses}>
            <option value="as_is">As-Is — No Dealer Warranty</option>
            <option value="warranty">With Warranty</option>
          </select>
        </div>
        {data.conditionType === 'warranty' && (
          <>
            <InputField label="Warranty Duration" name="warrantyDuration" value={data.warrantyDuration} onChange={handleChange} placeholder="e.g. 30 Days / 1,000 Miles" />
            <div>
              <label className="block text-[10px] font-semibold tracking-widest uppercase text-white/50 mb-2">Warranty Coverage</label>
              <textarea name="warrantyDescription" value={data.warrantyDescription} onChange={handleChange} rows={3} placeholder="Describe what the warranty covers..." className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-lg focus:outline-none focus:border-tj-gold/50 focus:ring-1 focus:ring-tj-gold/30 transition-all text-sm text-white placeholder:text-white/30 resize-none" />
            </div>
          </>
        )}
        {data.conditionType === 'as_is' && (
          <div className="border border-red-500/20 p-4 bg-red-500/5 rounded-lg">
            <p className="text-xs text-red-300/80 leading-relaxed">
              <strong>AS-IS DISCLAIMER:</strong> The vehicle will be sold with no dealer warranty. The buyer acknowledges that the dealer assumes no responsibility for any repairs.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
