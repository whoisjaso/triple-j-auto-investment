"use client";

import { Form130UData } from '@/lib/documents/form130U';
import InputField from './InputField';
import AddressAutocomplete, { ParsedAddress } from './AddressAutocomplete';

interface Props {
  data: Form130UData;
  onChange: (data: Form130UData) => void;
  onPrefill: () => void;
}

export default function Form130UForm({ data, onChange, onPrefill }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: string | number | boolean = value;
    if (type === 'number') { parsedValue = value === '' ? 0 : parseFloat(value); if (typeof parsedValue === 'number' && parsedValue < 0) parsedValue = 0; }
    else if (type === 'checkbox') parsedValue = (e.target as HTMLInputElement).checked;
    onChange({ ...data, [name]: parsedValue });
  };

  const selectClasses = "w-full px-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-lg focus:outline-none focus:border-tj-gold/50 focus:ring-1 focus:ring-tj-gold/30 transition-all text-sm text-white";

  return (
    <div className="space-y-6">
      {/* Pre-fill Banner */}
      <div className="bg-tj-gold/10 border border-tj-gold/30 p-5 rounded-2xl flex items-center justify-between">
        <div>
          <h2 className="text-base font-serif font-semibold text-tj-cream">Auto-Fill from Bill of Sale</h2>
          <p className="text-xs text-white/50 mt-1">Pull vehicle, buyer, and sale data from your Bill of Sale to pre-fill this 130-U form.</p>
        </div>
        <button onClick={onPrefill} className="px-5 py-2.5 bg-tj-gold text-white rounded-full text-xs font-bold tracking-widest uppercase hover:bg-tj-gold/90 transition-all shadow-lg whitespace-nowrap">
          Pre-Fill from Bill of Sale
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Application Type */}
        <div className="bg-white/[0.02] border border-white/[0.06] p-6 rounded-2xl space-y-4">
          <h2 className="text-lg font-serif text-tj-cream border-b border-white/[0.06] pb-3 mb-4">Application Type</h2>
          <div>
            <label className="block text-[10px] font-semibold tracking-widest uppercase text-white/50 mb-2">Applying For</label>
            <select name="applicationType" value={data.applicationType} onChange={handleChange} className={selectClasses}>
              <option value="titleAndRegistration">Title and Registration</option>
              <option value="titleOnly">Title Only</option>
              <option value="registrationOnly">Registration Purposes Only</option>
              <option value="nontitle">Nontitle Registration</option>
            </select>
          </div>
          <InputField label="Sale Date" name="saleDate" type="date" value={data.saleDate} onChange={handleChange} />
          <div>
            <label className="block text-[10px] font-semibold tracking-widest uppercase text-white/50 mb-2">Remarks / Notes</label>
            <textarea name="remarks" value={data.remarks} onChange={handleChange} rows={2} className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-lg focus:outline-none focus:border-tj-gold/50 focus:ring-1 focus:ring-tj-gold/30 transition-all text-sm text-white placeholder:text-white/30 resize-none" />
          </div>
        </div>

        {/* Vehicle Description */}
        <div className="bg-white/[0.02] border border-white/[0.06] p-6 rounded-2xl space-y-4">
          <h2 className="text-lg font-serif text-tj-cream border-b border-white/[0.06] pb-3 mb-4">Vehicle Description</h2>
          <InputField label="1. VIN" name="vin" uppercase value={data.vin} onChange={handleChange} />
          <div className="grid grid-cols-3 gap-3">
            <InputField label="2. Year" name="year" value={data.year} onChange={handleChange} />
            <InputField label="3. Make" name="make" value={data.make} onChange={handleChange} />
            <InputField label="4. Body Style" name="bodyStyle" value={data.bodyStyle} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <InputField label="5. Model" name="model" value={data.model} onChange={handleChange} />
            <InputField label="6. Major Color" name="majorColor" value={data.majorColor} onChange={handleChange} />
            <InputField label="7. Minor Color" name="minorColor" value={data.minorColor} onChange={handleChange} />
          </div>
          <InputField label="8. License Plate No." name="licensePlateNo" uppercase value={data.licensePlateNo} onChange={handleChange} />
          <div className="grid grid-cols-2 gap-3">
            <InputField label="9. Odometer Reading" name="odometerReading" value={data.odometerReading} onChange={handleChange} />
            <div>
              <label className="block text-[10px] font-semibold tracking-widest uppercase text-white/50 mb-2">10. Odometer Brand</label>
              <select name="odometerBrand" value={data.odometerBrand} onChange={handleChange} className={selectClasses}>
                <option value="A">A — Actual Mileage</option>
                <option value="N">N — Not Actual</option>
                <option value="X">X — Exceeds Limits</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="11. Empty Weight (lbs)" name="emptyWeight" value={data.emptyWeight} onChange={handleChange} />
            <InputField label="12. Carrying Capacity (lbs)" name="carryingCapacity" value={data.carryingCapacity} onChange={handleChange} />
          </div>
        </div>

        {/* Applicant/Owner */}
        <div className="bg-white/[0.02] border border-white/[0.06] p-6 rounded-2xl space-y-4">
          <h2 className="text-lg font-serif text-tj-cream border-b border-white/[0.06] pb-3 mb-4">Applicant / Owner</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold tracking-widest uppercase text-white/50 mb-2">14. Applicant Type</label>
              <select name="applicantType" value={data.applicantType} onChange={handleChange} className={selectClasses}>
                <option value="Individual">Individual</option>
                <option value="Business">Business</option>
                <option value="Government">Government</option>
                <option value="Trust">Trust</option>
                <option value="Non-Profit">Non-Profit</option>
              </select>
            </div>
            <InputField label="14. ID / FEIN Number" name="applicantIdNumber" uppercase value={data.applicantIdNumber} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="15. ID Type" name="applicantIdType" value={data.applicantIdType} onChange={handleChange} placeholder="DL, Passport, etc." />
            <InputField label="15. ID State" name="applicantIdState" uppercase value={data.applicantIdState} onChange={handleChange} />
          </div>
          {data.applicantType === 'Individual' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <InputField label="16. First Name" name="applicantFirstName" value={data.applicantFirstName} onChange={handleChange} />
                <InputField label="Middle Name" name="applicantMiddleName" value={data.applicantMiddleName} onChange={handleChange} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Last Name" name="applicantLastName" value={data.applicantLastName} onChange={handleChange} />
                <InputField label="Suffix" name="applicantSuffix" value={data.applicantSuffix} onChange={handleChange} placeholder="Jr., Sr., III" />
              </div>
            </>
          ) : (
            <InputField label="16. Entity Name" name="applicantEntityName" value={data.applicantEntityName} onChange={handleChange} />
          )}
          <InputField label="17. Co-Applicant Name" name="coApplicantName" value={data.coApplicantName} onChange={handleChange} />
          <AddressAutocomplete label="18. Mailing Address" name="mailingAddress" value={data.mailingAddress} onChange={handleChange} onAddressSelect={(addr: ParsedAddress) => onChange({ ...data, mailingAddress: addr.street, mailingCity: addr.city, mailingState: addr.state, mailingZip: addr.zip, countyOfResidence: addr.county })} />
          <div className="grid grid-cols-3 gap-3">
            <InputField label="City" name="mailingCity" value={data.mailingCity} onChange={handleChange} />
            <InputField label="State" name="mailingState" uppercase value={data.mailingState} onChange={handleChange} />
            <InputField label="Zip" name="mailingZip" value={data.mailingZip} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <InputField label="19. County" name="countyOfResidence" value={data.countyOfResidence} onChange={handleChange} />
            <InputField label="20. DOB" name="applicantDob" type="date" value={data.applicantDob} onChange={handleChange} />
            <InputField label="21. Phone" name="applicantPhone" value={data.applicantPhone} onChange={handleChange} />
          </div>
          <InputField label="Email" name="applicantEmail" type="email" value={data.applicantEmail} onChange={handleChange} />
        </div>

        {/* Previous Owner + Lienholder */}
        <div className="bg-white/[0.02] border border-white/[0.06] p-6 rounded-2xl space-y-4">
          <h2 className="text-lg font-serif text-tj-cream border-b border-white/[0.06] pb-3 mb-4">Previous Owner / Seller</h2>
          <InputField label="22. Previous Owner Name" name="previousOwnerName" value={data.previousOwnerName} onChange={handleChange} />
          <div className="grid grid-cols-2 gap-3">
            <InputField label="City" name="previousOwnerCity" value={data.previousOwnerCity} onChange={handleChange} />
            <InputField label="State" name="previousOwnerState" uppercase value={data.previousOwnerState} onChange={handleChange} />
          </div>

          <div className="border-t border-white/[0.06] pt-4 mt-2">
            <h3 className="text-base font-serif text-tj-cream mb-3">Vehicle Location</h3>
            <label className="flex items-center space-x-3 mb-4 cursor-pointer">
              <input type="checkbox" name="vehicleLocationSameAsMailing" checked={data.vehicleLocationSameAsMailing} onChange={handleChange} className="w-4 h-4 accent-tj-gold" />
              <span className="text-sm text-white/60">Same as mailing address</span>
            </label>
            {!data.vehicleLocationSameAsMailing && (
              <>
                <AddressAutocomplete label="23. Vehicle Location" name="vehicleLocationAddress" value={data.vehicleLocationAddress} onChange={handleChange} onAddressSelect={(addr: ParsedAddress) => onChange({ ...data, vehicleLocationAddress: addr.street, vehicleLocationCity: addr.city, vehicleLocationState: addr.state, vehicleLocationZip: addr.zip, vehicleLocationCounty: addr.county })} />
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <InputField label="City" name="vehicleLocationCity" value={data.vehicleLocationCity} onChange={handleChange} />
                  <InputField label="State" name="vehicleLocationState" uppercase value={data.vehicleLocationState} onChange={handleChange} />
                  <InputField label="Zip" name="vehicleLocationZip" value={data.vehicleLocationZip} onChange={handleChange} />
                </div>
                <div className="mt-3"><InputField label="County" name="vehicleLocationCounty" value={data.vehicleLocationCounty} onChange={handleChange} /></div>
              </>
            )}
          </div>

          <div className="border-t border-white/[0.06] pt-4 mt-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-serif text-tj-cream">34. First Lienholder</h3>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" name="hasLien" checked={data.hasLien} onChange={handleChange} className="w-4 h-4 accent-tj-gold" />
                <span className="text-sm text-white/60">Vehicle has a lien</span>
              </label>
            </div>
            {data.hasLien ? (
              <>
                <InputField label="Lienholder Name" name="lienholderName" value={data.lienholderName} onChange={handleChange} />
                <div className="mt-3"><AddressAutocomplete label="Address" name="lienholderAddress" value={data.lienholderAddress} onChange={handleChange} onAddressSelect={(addr: ParsedAddress) => onChange({ ...data, lienholderAddress: addr.street, lienholderCity: addr.city, lienholderState: addr.state, lienholderZip: addr.zip })} /></div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <InputField label="City" name="lienholderCity" value={data.lienholderCity} onChange={handleChange} />
                  <InputField label="State" name="lienholderState" uppercase value={data.lienholderState} onChange={handleChange} />
                  <InputField label="Zip" name="lienholderZip" value={data.lienholderZip} onChange={handleChange} />
                </div>
              </>
            ) : (
              <p className="text-sm text-white/40 italic">No lien — &quot;NONE&quot; will be printed on the form.</p>
            )}
          </div>
        </div>

        {/* Tax Statement */}
        <div className="md:col-span-2 bg-white/[0.02] border border-white/[0.06] p-6 rounded-2xl space-y-4">
          <h2 className="text-lg font-serif text-tj-cream border-b border-white/[0.06] pb-3 mb-4">Motor Vehicle Tax Statement</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <InputField label="(a) Sales Price ($)" name="salesPrice" type="number" min="0" value={data.salesPrice} onChange={handleChange} />
            <InputField label="(b) Trade-In ($)" name="tradeInAllowance" type="number" min="0" value={data.tradeInAllowance} onChange={handleChange} />
            <InputField label="(d) Tax Rate (%)" name="taxRate" type="number" step="0.01" min="0" value={data.taxRate} onChange={handleChange} />
            <InputField label="Rebate ($)" name="rebateOrIncentive" type="number" min="0" value={data.rebateOrIncentive} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Trade-In Description" name="tradeInDescription" value={data.tradeInDescription} onChange={handleChange} placeholder="e.g. 2018 Honda Civic LX" />
            <InputField label="Trade-In VIN" name="tradeInVin" uppercase value={data.tradeInVin} onChange={handleChange} />
          </div>
        </div>
      </div>
    </div>
  );
}
