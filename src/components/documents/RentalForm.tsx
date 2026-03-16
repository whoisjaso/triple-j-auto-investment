"use client";

import { useState } from 'react';
import { RentalData } from '@/lib/documents/rental';
import InputField from './InputField';
import AddressAutocomplete, { ParsedAddress } from './AddressAutocomplete';

interface Props {
  data: RentalData;
  onChange: (data: RentalData) => void;
}

export default function RentalForm({ data, onChange }: Props) {
  const [isDecoding, setIsDecoding] = useState(false);

  const decodeVin = async () => {
    if (!data.vehicleVin || data.vehicleVin.length < 11) return;
    setIsDecoding(true);
    try {
      const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvaluesextended/${data.vehicleVin}?format=json`);
      const result = await response.json();
      const vehicle = result.Results[0];
      if (vehicle) onChange({ ...data, vehicleYear: vehicle.ModelYear || data.vehicleYear, vehicleMake: vehicle.Make || data.vehicleMake, vehicleModel: vehicle.Model || data.vehicleModel });
    } catch (error) { console.error("VIN Decode failed", error); }
    finally { setIsDecoding(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: string | number = value;
    if (type === 'number') { if (value === '') { parsedValue = ''; } else { parsedValue = parseFloat(value); if ((parsedValue as number) < 0) parsedValue = 0; } }
    onChange({ ...data, [name]: parsedValue });
  };

  const selectClasses = "w-full px-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-lg focus:outline-none focus:border-tj-gold/50 focus:ring-1 focus:ring-tj-gold/30 transition-all text-sm text-white";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white/[0.02] border border-white/[0.06] p-6 rounded-2xl space-y-4">
        <h2 className="text-lg font-serif text-tj-cream border-b border-white/[0.06] pb-3 mb-4">Renter Details</h2>
        <InputField label="Full Name" name="renterName" value={data.renterName} onChange={handleChange} />
        <AddressAutocomplete label="Address" name="renterAddress" value={data.renterAddress} onChange={handleChange} onAddressSelect={(addr: ParsedAddress) => onChange({ ...data, renterAddress: `${addr.street}, ${addr.city}, ${addr.state} ${addr.zip}` })} />
        <InputField label="Driver's License #" name="renterLicense" uppercase value={data.renterLicense} onChange={handleChange} />
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Phone" name="renterPhone" value={data.renterPhone} onChange={handleChange} />
          <InputField label="Email" name="renterEmail" type="email" value={data.renterEmail} onChange={handleChange} />
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/[0.06] p-6 rounded-2xl space-y-4">
        <h2 className="text-lg font-serif text-tj-cream border-b border-white/[0.06] pb-3 mb-4">Additional Driver</h2>
        <InputField label="Full Name" name="coRenterName" value={data.coRenterName} onChange={handleChange} />
        <AddressAutocomplete label="Address" name="coRenterAddress" value={data.coRenterAddress} onChange={handleChange} onAddressSelect={(addr: ParsedAddress) => onChange({ ...data, coRenterAddress: `${addr.street}, ${addr.city}, ${addr.state} ${addr.zip}` })} />
        <InputField label="Driver's License #" name="coRenterLicense" uppercase value={data.coRenterLicense} onChange={handleChange} />
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Phone" name="coRenterPhone" value={data.coRenterPhone} onChange={handleChange} />
          <InputField label="Email" name="coRenterEmail" type="email" value={data.coRenterEmail} onChange={handleChange} />
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/[0.06] p-6 rounded-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-white/[0.06] pb-3 mb-4">
          <h2 className="text-lg font-serif text-tj-cream">Vehicle Information</h2>
          <button onClick={decodeVin} disabled={isDecoding || !data.vehicleVin} className="text-[10px] font-bold tracking-widest uppercase bg-tj-gold text-white px-3 py-1.5 rounded-full hover:bg-tj-gold/90 transition-all disabled:opacity-50">
            {isDecoding ? 'Decoding...' : 'VIN Decode'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InputField label="VIN" name="vehicleVin" uppercase value={data.vehicleVin} onChange={handleChange} />
          <InputField label="License Plate" name="vehiclePlate" uppercase value={data.vehiclePlate} onChange={handleChange} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Mileage Out" name="mileageOut" value={data.mileageOut} onChange={handleChange} />
          <InputField label="Mileage In" name="mileageIn" value={data.mileageIn} onChange={handleChange} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <InputField label="Year" name="vehicleYear" value={data.vehicleYear} onChange={handleChange} />
          <InputField label="Make" name="vehicleMake" value={data.vehicleMake} onChange={handleChange} />
          <InputField label="Model" name="vehicleModel" value={data.vehicleModel} onChange={handleChange} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-semibold tracking-widest uppercase text-white/50 mb-2">Fuel Level Out</label>
            <select name="fuelLevelOut" value={data.fuelLevelOut} onChange={handleChange} className={selectClasses}>
              <option value="Full">Full</option><option value="3/4">3/4</option><option value="1/2">1/2</option><option value="1/4">1/4</option><option value="Empty">Empty</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold tracking-widest uppercase text-white/50 mb-2">Fuel Level In</label>
            <select name="fuelLevelIn" value={data.fuelLevelIn} onChange={handleChange} className={selectClasses}>
              <option value="Full">Full</option><option value="3/4">3/4</option><option value="1/2">1/2</option><option value="1/4">1/4</option><option value="Empty">Empty</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/[0.06] p-6 rounded-2xl space-y-4">
        <h2 className="text-lg font-serif text-tj-cream border-b border-white/[0.06] pb-3 mb-4">Rental Terms</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-semibold tracking-widest uppercase text-white/50 mb-2">Rental Period</label>
            <select name="rentalPeriod" value={data.rentalPeriod} onChange={handleChange} className={selectClasses}>
              <option value="Daily">Daily</option><option value="Weekly">Weekly</option><option value="Monthly">Monthly</option>
            </select>
          </div>
          <InputField label={`Rate per ${data.rentalPeriod === 'Daily' ? 'Day' : data.rentalPeriod === 'Weekly' ? 'Week' : 'Month'} ($)`} name="rentalRate" type="number" min="0" value={data.rentalRate} onChange={handleChange} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Start Date" name="rentalStartDate" type="date" value={data.rentalStartDate} onChange={handleChange} />
          <InputField label="End Date" name="rentalEndDate" type="date" value={data.rentalEndDate} onChange={handleChange} />
        </div>
        <InputField label="Security Deposit ($)" name="securityDeposit" type="number" min="0" value={data.securityDeposit} onChange={handleChange} />
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Mileage Allowance (per period)" name="mileageAllowance" type="number" min="0" value={data.mileageAllowance} onChange={handleChange} />
          <InputField label="Excess Mileage ($/mile)" name="excessMileageCharge" type="number" step="0.01" min="0" value={data.excessMileageCharge} onChange={handleChange} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <InputField label="Insurance Fee ($/period)" name="insuranceFee" type="number" min="0" value={data.insuranceFee} onChange={handleChange} />
          <InputField label="Add'l Driver Fee ($/period)" name="additionalDriverFee" type="number" min="0" value={data.additionalDriverFee} onChange={handleChange} />
          <InputField label="Tax Rate (%)" name="tax" type="number" step="0.01" min="0" value={data.tax} onChange={handleChange} />
        </div>
        <InputField label="Total Due at Signing ($)" name="dueAtSigning" type="number" min="0" value={data.dueAtSigning} onChange={handleChange} />
      </div>
    </div>
  );
}
