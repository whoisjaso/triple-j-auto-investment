/* eslint-disable @next/next/no-img-element */
import { RentalData, calculateRentalTotal, calculateRentalDuration, generateRentalSchedule, formatCurrency } from '@/lib/documents/rental';
import { format } from 'date-fns';
import { SignatureData, DEALER_LICENSE } from '@/lib/documents/shared';
import SignatureLinePreview from '@/components/documents/SignatureLinePreview';

interface Props {
  data: RentalData;
  signatures: SignatureData;
}

export default function RentalPreview({ data, signatures }: Props) {
  const totals = calculateRentalTotal(data);
  const duration = calculateRentalDuration(data.rentalStartDate, data.rentalEndDate, data.rentalPeriod);
  const schedule = generateRentalSchedule(data);
  const periodLabel = data.rentalPeriod === 'Daily' ? 'Day(s)' : data.rentalPeriod === 'Weekly' ? 'Week(s)' : 'Month(s)';
  const periodSingular = data.rentalPeriod === 'Daily' ? 'day' : data.rentalPeriod === 'Weekly' ? 'week' : 'month';
  const perPeriodAmount = schedule.length > 0 ? schedule[0].amountDue : 0;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return format(new Date(dateStr + 'T12:00:00'), 'MM/dd/yyyy');
  };

  return (
    <div className="bg-white p-10 md:p-16 text-[#1a1a1a] font-sans max-w-5xl mx-auto relative print-doc">
      {/* Watermark / Background Logo */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none overflow-hidden print-no-watermark">
        <div className="font-serif font-bold text-[400px] leading-none">JJJ</div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex justify-between items-end border-b-2 border-[#1a1a1a] pb-8 mb-10 print-section">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 border-2 border-[#b89b5e] p-1 rounded-full overflow-hidden flex items-center justify-center bg-white">
              <img
                src="/GoldTripleJLogo.webp"
                alt="Triple J Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-4xl font-serif font-bold uppercase tracking-widest mb-2 text-[#1a1a1a]">Vehicle Rental Agreement</h1>
              <p className="text-xs tracking-widest uppercase text-[#1a1a1a]/60 font-semibold">Rental Contract &amp; Terms of Use</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-serif font-semibold text-[#b89b5e]">Triple J Auto Investment LLC</h2>
            <p className="text-xs text-[#1a1a1a]/70 mt-1">8774 Almeda Genoa Road, Houston, Texas 77075</p>
            <p className="text-xs text-[#1a1a1a]/70">(281) 253-3602 | thetriplejauto.com</p>
          </div>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-12 mb-10 print-section">
          <div className="border border-[#1a1a1a]/10 p-6 rounded-sm bg-[#f5f2ed]/30">
            <h3 className="text-[10px] font-bold tracking-widest uppercase text-[#1a1a1a]/50 mb-4">Renter Information</h3>
            <p className="font-serif text-xl mb-1 min-h-[1.75rem]">{data.renterName}</p>
            <p className="text-sm text-[#1a1a1a]/80 min-h-[1.25rem]">{data.renterAddress}</p>
            <p className="text-sm text-[#1a1a1a]/80 min-h-[1.25rem]">{data.renterPhone}</p>
            <p className="text-sm text-[#1a1a1a]/80 min-h-[1.25rem]">{data.renterEmail}</p>
            <p className="text-sm text-[#1a1a1a]/80 min-h-[1.25rem] mt-2 font-mono uppercase">DL# {data.renterLicense}</p>
          </div>
          <div className="border border-[#1a1a1a]/10 p-6 rounded-sm bg-[#f5f2ed]/30">
            <h3 className="text-[10px] font-bold tracking-widest uppercase text-[#1a1a1a]/50 mb-4">Additional Driver</h3>
            <p className="font-serif text-xl mb-1 min-h-[1.75rem]">{data.coRenterName}</p>
            <p className="text-sm text-[#1a1a1a]/80 min-h-[1.25rem]">{data.coRenterAddress}</p>
            <p className="text-sm text-[#1a1a1a]/80 min-h-[1.25rem]">{data.coRenterPhone}</p>
            <p className="text-sm text-[#1a1a1a]/80 min-h-[1.25rem]">{data.coRenterEmail}</p>
            <p className="text-sm text-[#1a1a1a]/80 min-h-[1.25rem] mt-2 font-mono uppercase">DL# {data.coRenterLicense}</p>
          </div>
        </div>

        {/* Vehicle */}
        <div className="mb-10 print-section">
          <h3 className="text-[10px] font-bold tracking-widest uppercase text-[#1a1a1a]/50 mb-2">Vehicle Description</h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-y border-[#1a1a1a]/20 bg-[#f5f2ed]/50">
                <th className="p-3 text-left font-semibold">Year</th>
                <th className="p-3 text-left font-semibold">Make</th>
                <th className="p-3 text-left font-semibold">Model</th>
                <th className="p-3 text-left font-semibold">VIN</th>
                <th className="p-3 text-left font-semibold">Plate</th>
                <th className="p-3 text-left font-semibold">Mi. Out</th>
                <th className="p-3 text-left font-semibold">Mi. In</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#1a1a1a]/10">
                <td className="p-3">{data.vehicleYear}</td>
                <td className="p-3">{data.vehicleMake}</td>
                <td className="p-3">{data.vehicleModel}</td>
                <td className="p-3 uppercase font-mono text-xs">{data.vehicleVin}</td>
                <td className="p-3 uppercase font-mono text-xs">{data.vehiclePlate}</td>
                <td className="p-3">{data.mileageOut}</td>
                <td className="p-3">{data.mileageIn}</td>
              </tr>
            </tbody>
          </table>
          <div className="grid grid-cols-2 gap-8 mt-4">
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-[#1a1a1a]/50 font-semibold text-[10px] tracking-widest uppercase">Fuel Out:</span>
              <span className="font-medium">{data.fuelLevelOut}</span>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-[#1a1a1a]/50 font-semibold text-[10px] tracking-widest uppercase">Fuel In:</span>
              <span className="font-medium">{data.fuelLevelIn}</span>
            </div>
          </div>
        </div>

        {/* Rental Summary Boxes (mirrors Truth in Lending) */}
        <div className="mb-10 print-section">
          <h3 className="text-[10px] font-bold tracking-widest uppercase text-[#1a1a1a]/50 mb-2">Rental Summary</h3>
          <div className="grid grid-cols-4 border-2 border-[#1a1a1a] divide-x-2 divide-[#1a1a1a]">
            <div className="p-4 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-1">Rental Period</div>
                <div className="text-[10px] text-[#1a1a1a]/60 leading-tight">Duration of the rental agreement.</div>
              </div>
              <div className="text-2xl font-serif font-bold mt-6">{duration} {periodLabel}</div>
            </div>
            <div className="p-4 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-1">Base Rental</div>
                <div className="text-[10px] text-[#1a1a1a]/60 leading-tight">Total rental charges before fees and tax.</div>
              </div>
              <div className="text-2xl font-serif font-bold mt-6">{formatCurrency(totals.baseRental)}</div>
            </div>
            <div className="p-4 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-1">Security Deposit</div>
                <div className="text-[10px] text-[#1a1a1a]/60 leading-tight">Refundable deposit held for the rental term.</div>
              </div>
              <div className="text-2xl font-serif font-bold mt-6">{formatCurrency(data.securityDeposit)}</div>
            </div>
            <div className="p-4 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-1">Total Due at Signing</div>
                <div className="text-[10px] text-[#1a1a1a]/60 leading-tight">Amount due before vehicle pickup.</div>
              </div>
              <div className="text-2xl font-serif font-bold mt-6">{formatCurrency(data.dueAtSigning > 0 ? data.dueAtSigning : totals.totalDue)}</div>
            </div>
          </div>
        </div>

        {/* Payment Schedule Summary (mirrors Payment Schedule in Financing) */}
        <div className="mb-10 print-section">
          <h3 className="text-[10px] font-bold tracking-widest uppercase text-[#1a1a1a]/50 mb-2">Payment Schedule</h3>
          <table className="w-full text-sm border-collapse border border-[#1a1a1a]/20">
            <thead>
              <tr className="bg-[#f5f2ed]/50 border-b border-[#1a1a1a]/20">
                <th className="p-3 text-left font-semibold">Number of Payments</th>
                <th className="p-3 text-left font-semibold">Amount per {periodSingular}</th>
                <th className="p-3 text-left font-semibold">When Payments Are Due</th>
                <th className="p-3 text-left font-semibold">Pickup Date</th>
                <th className="p-3 text-left font-semibold">Return Date</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-3">{duration}</td>
                <td className="p-3 font-bold">{formatCurrency(perPeriodAmount)}</td>
                <td className="p-3">{data.rentalPeriod} beginning {formatDate(data.rentalStartDate)}</td>
                <td className="p-3">{formatDate(data.rentalStartDate)}</td>
                <td className="p-3 font-bold text-[#b89b5e]">{formatDate(data.rentalEndDate)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Itemization & Policies (mirrors Itemization & Important Clauses) */}
        <div className="grid grid-cols-2 gap-12 mb-12 print-section">
          <div>
            <h3 className="text-[10px] font-bold tracking-widest uppercase text-[#1a1a1a]/50 mb-4">Itemization of Charges</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>1. Base Rental ({duration} {periodLabel} @ {formatCurrency(data.rentalRate)})</span>
                <span>{formatCurrency(totals.baseRental)}</span>
              </div>
              <div className="flex justify-between text-[#1a1a1a]/70">
                <span>&nbsp;&nbsp;&nbsp;a. Insurance Fee</span>
                <span>{formatCurrency(totals.insuranceTotal)}</span>
              </div>
              <div className="flex justify-between text-[#1a1a1a]/70">
                <span>&nbsp;&nbsp;&nbsp;b. Additional Driver Fee</span>
                <span>{formatCurrency(totals.additionalDriverTotal)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-[#1a1a1a]/10 pt-2">
                <span>2. Subtotal</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#1a1a1a]/70">
                <span>&nbsp;&nbsp;&nbsp;Sales Tax ({data.tax}%)</span>
                <span>{formatCurrency(totals.taxAmount)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-[#1a1a1a]/10 pt-2">
                <span>3. Total Rental Charges</span>
                <span>{formatCurrency(totals.grandTotal)}</span>
              </div>
              <div className="flex justify-between border-b border-[#1a1a1a]/20 pb-3">
                <span>4. Security Deposit (Refundable)</span>
                <span>{formatCurrency(data.securityDeposit)}</span>
              </div>
              <div className="flex justify-between font-bold pt-1 text-lg font-serif">
                <span>5. Total Due at Signing</span>
                <span>{formatCurrency(data.dueAtSigning > 0 ? data.dueAtSigning : totals.totalDue)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="border-2 border-[#1a1a1a] p-5 bg-[#f5f2ed]/20">
              <h3 className="font-serif font-bold text-lg uppercase tracking-widest mb-2 text-center">Vehicle Condition</h3>
              <p className="text-xs text-justify leading-relaxed">
                <strong>THE VEHICLE IS PROVIDED IN ITS CURRENT CONDITION.</strong> The renter acknowledges inspecting the vehicle prior to rental and accepts its current condition. Any pre-existing damage has been documented on a separate vehicle condition report signed by both parties at the time of pickup.
              </p>
            </div>
            <div className="border border-red-900/20 p-5 bg-red-50/50">
              <h3 className="font-serif font-bold text-lg uppercase tracking-widest mb-2 text-center text-red-900">Mileage Policy</h3>
              <p className="text-xs text-justify leading-relaxed text-red-900/80">
                <strong>MILEAGE ALLOWANCE:</strong> {data.mileageAllowance > 0 ? `${data.mileageAllowance} miles per ${data.rentalPeriod === 'Daily' ? 'day' : data.rentalPeriod === 'Weekly' ? 'week' : 'month'}` : 'Unlimited'}. {data.excessMileageCharge > 0 ? `Excess mileage will be charged at ${formatCurrency(data.excessMileageCharge)} per mile.` : ''} The renter is responsible for all fuel consumed during the rental period. Vehicle must be returned with the same fuel level as at pickup.
              </p>
            </div>
          </div>
        </div>

        {/* GPS Tracking Device Disclosure & Consent */}
        <div className="mb-8 border-2 border-red-900/40 p-5 bg-red-50/30 print-section">
          <h3 className="font-serif font-bold text-sm uppercase tracking-widest mb-3 text-center text-red-900">GPS Tracking Device — Disclosure &amp; Consent</h3>
          <div className="text-[10px] text-justify leading-relaxed space-y-2 text-red-900/80">
            <p><strong>DISCLOSURE:</strong> Renter acknowledges and consents that the Vehicle is equipped with a Global Positioning System (GPS) electronic tracking device capable of identifying, monitoring, and recording the location of the Vehicle. This device is installed for the purposes of vehicle security, theft recovery, and enforcement of the terms of this Rental Agreement.</p>
            <p><strong>CONSENT:</strong> By signing this Agreement, Renter provides express written consent pursuant to Texas Penal Code Section 16.06 for the installation and use of such device during the rental period.</p>
            <p><strong>TAMPERING PROHIBITED:</strong> Renter agrees not to tamper with, disable, remove, or damage the GPS device. Any tampering with or removal of the GPS device shall constitute a material breach of this Agreement and Renter shall be liable for the cost of replacement plus any resulting damages.</p>
          </div>
        </div>

        {/* Comprehensive Terms */}
        <div className="mb-10 text-[10.5px] text-justify space-y-2.5 text-[#1a1a1a]/70 columns-2 gap-8">
          <p><strong>1. RENTAL AGREEMENT:</strong> Renter agrees to rent the Vehicle described above from Triple J Auto Investment LLC (&ldquo;Owner&rdquo;) for the period of {formatDate(data.rentalStartDate)} through {formatDate(data.rentalEndDate)} at the rate of {formatCurrency(data.rentalRate)} per {data.rentalPeriod === 'Daily' ? 'day' : data.rentalPeriod === 'Weekly' ? 'week' : 'month'}. The Vehicle is and remains the property of Owner at all times during the rental period.</p>

          <p><strong>2. AUTHORIZED DRIVERS:</strong> Only the Renter and any additional authorized drivers listed in this Agreement may operate the Vehicle. All drivers must possess a valid, unrestricted driver&apos;s license issued by a U.S. state. Unauthorized use by any person voids all coverage and constitutes a material breach. Renter is responsible for the actions of all authorized drivers.</p>

          <p><strong>3. INSURANCE:</strong> Renter represents and warrants that Renter maintains, at minimum, automobile liability insurance meeting Texas mandatory minimum requirements ($30,000 bodily injury per person, $60,000 bodily injury per accident, $25,000 property damage) and comprehensive and collision coverage on the Vehicle during the entire rental period. Renter shall provide proof of insurance prior to taking possession. If Renter&apos;s insurance does not provide primary coverage for the rental Vehicle, Renter is personally liable for all damages, losses, and liabilities arising from the use and operation of the Vehicle.</p>

          <p><strong>4. VEHICLE CONDITION:</strong> At the time of delivery, Owner and Renter shall jointly inspect the Vehicle and document its condition on the attached Vehicle Condition Report, including all existing damage, scratches, dents, mechanical condition, tire condition, and mileage. Renter acknowledges receiving the Vehicle in the condition described. Upon return, the Vehicle shall be inspected and any new damage not reflected on the original report shall be the sole responsibility of the Renter. If Renter is not present at the return inspection, Owner&apos;s determination of damage shall be presumed accurate absent clear and convincing evidence to the contrary.</p>

          <p><strong>5. PROHIBITED USE:</strong> The Vehicle shall NOT be used for any of the following purposes, and any such use shall constitute a material breach: (a) by any unauthorized person; (b) by any person under the influence of alcohol, drugs, or any intoxicant; (c) for any illegal purpose, including transporting controlled substances; (d) for commercial purposes, ride-sharing (Uber, Lyft, etc.), delivery services, or hire unless expressly authorized in writing; (e) on unpaved roads, off-road, racing, speed contests, or any competition; (f) to tow or push any vehicle, trailer, or object; (g) outside the State of Texas without prior written consent; (h) by any person who does not possess a valid driver&apos;s license; (i) in a reckless or negligent manner; (j) while overloaded beyond manufacturer&apos;s recommended capacity; (k) in violation of any traffic law.</p>

          <p><strong>6. LATE RETURN:</strong> If the Vehicle is not returned by 5:00 PM on the agreed return date, additional charges will be assessed at the applicable daily rate of {formatCurrency(data.rentalRate / (data.rentalPeriod === 'Daily' ? 1 : data.rentalPeriod === 'Weekly' ? 7 : 30))} plus a late fee of $50.00 per day. Failure to return the Vehicle within forty-eight (48) hours of the agreed return date may be reported to law enforcement as unauthorized use of a motor vehicle.</p>

          <p><strong>7. LATE PAYMENT:</strong> If any rental payment is not received by 5:00 PM on the due date, a late fee of $25.00 per day shall be assessed until payment is received. A fee of $30.00 shall be assessed for any check, electronic payment, or other instrument returned or dishonored for any reason. Following a returned payment, Owner may require all future payments be made by cash, money order, or certified funds.</p>

          <p><strong>8. ACCIDENT &amp; THEFT REPORTING:</strong> In the event of any accident, collision, theft, vandalism, or damage to the Vehicle, Renter must: (a) immediately contact local law enforcement and obtain a police report; (b) notify Owner within twenty-four (24) hours by phone at (281) 253-3602 and in writing within forty-eight (48) hours; (c) not admit fault or liability to any third party; (d) cooperate fully with Owner, Owner&apos;s insurance carrier, and law enforcement in any investigation; (e) provide copies of the police report and all related documentation. Failure to comply with these reporting requirements may result in Renter&apos;s assumption of full liability for all damages and losses.</p>

          <p><strong>9. TOWING &amp; IMPOUND:</strong> If the Vehicle is towed, impounded, or seized by any governmental authority due to Renter&apos;s actions, negligence, or violation of law, Renter shall be solely responsible for all towing fees, impound fees, storage fees, administrative charges, and any fines or penalties. Renter shall notify Owner immediately. Owner reserves the right to recover the Vehicle from any impound facility, and Renter shall reimburse Owner for all costs incurred within five (5) days of demand.</p>

          <p><strong>10. TOLL VIOLATIONS &amp; CITATIONS:</strong> Renter is solely responsible for all toll charges, parking tickets, traffic citations, red-light camera violations, and any other fines or penalties incurred during the rental period. If Owner receives any such citation as the registered owner, Renter shall pay such amount plus an administrative fee of $25.00 per occurrence.</p>

          <p><strong>11. MAINTENANCE:</strong> Renter shall maintain the Vehicle in good operating condition, including maintaining proper fluid levels, proper tire pressure, and not operating the Vehicle with any warning lights illuminated. Renter shall not make any mechanical repairs or modifications without Owner&apos;s prior written consent. If routine maintenance is needed during the rental period (e.g., oil change), Renter shall contact Owner to coordinate service.</p>

          <p><strong>12. SMOKING &amp; PET POLICY:</strong> Smoking of any kind (including cigarettes, cigars, e-cigarettes, and vaping devices) is strictly PROHIBITED in the Vehicle. Pets are NOT permitted in the Vehicle unless expressly authorized in writing by Owner. If evidence of smoking or unauthorized pet use is discovered, Renter shall be charged a cleaning/restoration fee of $300.00 in addition to any actual repair or restoration costs.</p>

          <p><strong>13. KEY REPLACEMENT:</strong> Renter is responsible for all keys, key fobs, and remote devices provided with the Vehicle. Lost, stolen, or damaged keys must be reported immediately. Renter shall be charged the actual cost of key replacement, reprogramming, and any related locksmith services.</p>

          <p><strong>14. VEHICLE BREAKDOWN:</strong> If the Vehicle experiences a mechanical breakdown due to no fault of the Renter, Renter shall immediately notify Owner. Owner will, at its option, arrange for repair or provide a substitute vehicle. Renter shall NOT attempt repairs or have repairs performed by any third party without Owner&apos;s prior written consent. If the breakdown is caused by Renter&apos;s misuse or neglect, all repair costs, towing costs, and related expenses shall be Renter&apos;s responsibility.</p>

          <p><strong>15. OWNER&apos;S RIGHT TO RECOVER VEHICLE:</strong> The Vehicle is and remains the property of Owner at all times. If Renter defaults under this Agreement, Owner may immediately terminate this Agreement and take possession of the Vehicle without prior notice or demand, wherever the Vehicle may be found, without liability for trespass or damages, provided Owner does not breach the peace. If the Vehicle is not returned within twenty-four (24) hours of demand, Owner may report the Vehicle as stolen to law enforcement.</p>

          <p><strong>16. RIGHT TO INSPECT:</strong> Owner reserves the right to inspect the Vehicle at any reasonable time during the rental period upon twenty-four (24) hours&apos; notice. Owner may inspect the Vehicle without notice if Owner has a reasonable belief that the Vehicle is being used in violation of this Agreement or is at risk of damage or loss.</p>

          <p><strong>17. EARLY TERMINATION &amp; DEFAULT:</strong> Renter may terminate this Agreement early by returning the Vehicle and paying all amounts owed through the date of return. Renter shall be in default if: (a) Renter fails to pay any amount when due; (b) Renter violates any term of this Agreement; (c) Renter fails to maintain required insurance; (d) Renter provides false information; (e) Renter abandons the Vehicle; (f) Renter is arrested while operating the Vehicle. Upon default, Owner may terminate this Agreement immediately, take possession of the Vehicle, and Renter shall be liable for all unpaid rental charges, damage, and costs of recovery.</p>

          <p><strong>18. PERSONAL PROPERTY:</strong> Owner assumes no responsibility for loss of or damage to any personal property left in or on the Vehicle. Renter should remove all personal belongings before returning the Vehicle. Personal property not claimed within thirty (30) days of return may be disposed of at Owner&apos;s discretion.</p>

          <p><strong>19. INDEMNIFICATION:</strong> Renter agrees to indemnify, defend, and hold harmless Owner, its owners, officers, employees, and agents from and against any and all claims, demands, losses, damages, liabilities, costs, and expenses (including reasonable attorney&apos;s fees) arising out of or related to: (a) Renter&apos;s use, operation, or possession of the Vehicle; (b) any accident, injury, or damage involving the Vehicle during the rental period; (c) any violation of law by Renter; (d) any breach of this Agreement. THIS INDEMNIFICATION INCLUDES CLAIMS ARISING FROM RENTER&apos;S OWN NEGLIGENCE BUT DOES NOT APPLY TO CLAIMS ARISING SOLELY FROM OWNER&apos;S GROSS NEGLIGENCE OR WILLFUL MISCONDUCT.</p>

          <p><strong>20. GOVERNING LAW &amp; JURISDICTION:</strong> This Agreement shall be governed by and construed in accordance with the laws of the State of Texas. Any dispute shall be subject to the exclusive jurisdiction of the state and federal courts located in Harris County, Texas.</p>

          <p><strong>21. ENTIRE AGREEMENT:</strong> This Agreement, together with all addenda and disclosures signed by the parties (including the GPS Disclosure and Vehicle Condition Report), constitutes the entire agreement. No modification shall be valid unless in writing and signed by both parties.</p>

          <p><strong>22. SEVERABILITY:</strong> If any provision of this Agreement is found invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect.</p>

          <p><strong>23. WAIVER:</strong> Owner&apos;s failure to enforce any term at any time shall not constitute a waiver of Owner&apos;s right to enforce that term or any other term. Acceptance of late payments shall not constitute a modification of this Agreement.</p>

          <p><strong>24. SECURITY DEPOSIT:</strong> The security deposit of {formatCurrency(data.securityDeposit)} shall be held by Owner for the duration of the rental period. The deposit will be refunded within fourteen (14) days of Vehicle return, less any deductions for: (a) unpaid rental charges or fees; (b) damage to the Vehicle beyond normal wear and tear; (c) excessive cleaning required; (d) missing keys, accessories, or equipment; (e) fuel replacement to restore tank to delivery level; (f) toll violations or traffic citations received after return. Owner will provide an itemized statement of any deductions.</p>
        </div>

        {/* Customer ID Photo */}
        {signatures.buyerIdPhoto && (
          <div className="mb-10 border border-[#1a1a1a]/10 p-4 rounded-sm bg-[#f5f2ed]/20 flex items-center space-x-6">
            <img src={signatures.buyerIdPhoto} alt="Customer ID" className="h-28 object-contain rounded border border-[#1a1a1a]/10" />
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase text-[#1a1a1a]/50">Customer ID on File</p>
              <p className="text-sm font-medium mt-1">{data.renterName}</p>
            </div>
          </div>
        )}

        {/* Signatures */}
        <div className="space-y-12 bg-[#f5f2ed]/30 p-8 border border-[#1a1a1a]/10 print-signatures">
          <div className="text-sm font-bold mb-8 text-center font-serif text-lg">
            By signing below, you agree to the terms of this rental agreement. You acknowledge that you have read it completely before signing.
          </div>

          <div className="grid grid-cols-2 gap-16">
            <SignatureLinePreview label="Renter Signature" signatureImage={signatures.buyerSignature} signatureDate={signatures.buyerSignatureDate} printedName={data.renterName} />
            <SignatureLinePreview label="Additional Driver Signature" signatureImage={signatures.coBuyerSignature} signatureDate={signatures.coBuyerSignatureDate} printedName={data.coRenterName} />
          </div>

          <div className="grid grid-cols-2 gap-16 mt-8">
            <SignatureLinePreview label={`Triple J Auto Representative — DL# ${DEALER_LICENSE}`} signatureImage={signatures.dealerSignature} signatureDate={signatures.dealerSignatureDate} />
          </div>
        </div>

        {/* Full Payment Tracking Schedule (Page Break for Print) */}
        {schedule.length > 0 && (
          <div className="mt-20 pt-12 border-t-2 border-[#1a1a1a] print-page-break">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-serif font-bold uppercase tracking-widest">Payment Tracking Schedule</h3>
              <p className="text-xs text-[#1a1a1a]/60 mt-2 tracking-wider uppercase">
                {data.renterName && <span className="font-semibold">{data.renterName}</span>}
                {data.renterName && ' — '}
                {data.vehicleYear} {data.vehicleMake} {data.vehicleModel}
                {data.vehicleVin && <span className="font-mono ml-2">({data.vehicleVin})</span>}
              </p>
              <p className="text-xs text-[#1a1a1a]/50 mt-1">
                {formatCurrency(perPeriodAmount)} / {periodSingular} &bull; {duration} payments &bull; {formatDate(data.rentalStartDate)} &ndash; {formatDate(data.rentalEndDate)}
              </p>
            </div>

            <table className="w-full text-sm border-collapse border-2 border-[#1a1a1a]">
              <thead>
                <tr className="bg-[#1a1a1a] text-white">
                  <th className="p-3 text-left font-semibold text-[10px] tracking-wider uppercase w-10">#</th>
                  <th className="p-3 text-left font-semibold text-[10px] tracking-wider uppercase">Due Date</th>
                  <th className="p-3 text-right font-semibold text-[10px] tracking-wider uppercase">Rental</th>
                  <th className="p-3 text-right font-semibold text-[10px] tracking-wider uppercase">Ins. + Fees</th>
                  <th className="p-3 text-right font-semibold text-[10px] tracking-wider uppercase">Tax</th>
                  <th className="p-3 text-right font-semibold text-[10px] tracking-wider uppercase">Amount Due</th>
                  <th className="p-3 text-right font-semibold text-[10px] tracking-wider uppercase">Balance</th>
                  <th className="p-3 text-center font-semibold text-[10px] tracking-wider uppercase" style={{ minWidth: '100px' }}>Date Paid</th>
                  <th className="p-3 text-center font-semibold text-[10px] tracking-wider uppercase" style={{ minWidth: '80px' }}>Method</th>
                  <th className="p-3 text-center font-semibold text-[10px] tracking-wider uppercase" style={{ minWidth: '60px' }}>Initials</th>
                </tr>
              </thead>
              <tbody>
                {/* First row: Security deposit due at signing */}
                <tr className="border-b border-[#1a1a1a]/20 bg-[#b89b5e]/5">
                  <td className="p-3 font-bold text-[#b89b5e]">—</td>
                  <td className="p-3 font-medium">{formatDate(data.rentalStartDate)}</td>
                  <td className="p-3 text-right text-[#1a1a1a]/50">—</td>
                  <td className="p-3 text-right text-[#1a1a1a]/50">—</td>
                  <td className="p-3 text-right text-[#1a1a1a]/50">—</td>
                  <td className="p-3 text-right font-bold">{formatCurrency(data.securityDeposit)}</td>
                  <td className="p-3 text-right text-[#1a1a1a]/50 text-[10px] uppercase tracking-wider">Deposit</td>
                  <td className="p-3 border-b border-dashed border-[#1a1a1a]/30"></td>
                  <td className="p-3 border-b border-dashed border-[#1a1a1a]/30"></td>
                  <td className="p-3 border-b border-dashed border-[#1a1a1a]/30"></td>
                </tr>
                {schedule.map((payment, idx) => (
                  <tr key={payment.paymentNumber} className={`border-b border-[#1a1a1a]/10 ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f5f2ed]/20'}`}>
                    <td className="p-3 font-bold text-[#1a1a1a]/40">{payment.paymentNumber}</td>
                    <td className="p-3 font-medium">{formatDate(payment.dueDate)}</td>
                    <td className="p-3 text-right">{formatCurrency(payment.rental)}</td>
                    <td className="p-3 text-right">{formatCurrency(payment.insurance + payment.additionalDriver)}</td>
                    <td className="p-3 text-right">{formatCurrency(payment.tax)}</td>
                    <td className="p-3 text-right font-bold font-serif">{formatCurrency(payment.amountDue)}</td>
                    <td className="p-3 text-right font-serif">{formatCurrency(payment.balanceAfter)}</td>
                    <td className="p-3 border-b border-dashed border-[#1a1a1a]/30"></td>
                    <td className="p-3 border-b border-dashed border-[#1a1a1a]/30"></td>
                    <td className="p-3 border-b border-dashed border-[#1a1a1a]/30"></td>
                  </tr>
                ))}
                {/* Totals row */}
                <tr className="bg-[#1a1a1a] text-white font-bold">
                  <td className="p-3" colSpan={5}>
                    <span className="text-[10px] tracking-widest uppercase">Total</span>
                  </td>
                  <td className="p-3 text-right font-serif">{formatCurrency(totals.grandTotal)}</td>
                  <td className="p-3 text-right font-serif">{formatCurrency(0)}</td>
                  <td className="p-3" colSpan={3}></td>
                </tr>
              </tbody>
            </table>

            {/* Legend / Notes */}
            <div className="mt-6 grid grid-cols-2 gap-8 text-[10px] text-[#1a1a1a]/60">
              <div>
                <p className="font-bold uppercase tracking-widest mb-1">Payment Methods</p>
                <p>Cash / Check / Zelle / CashApp / Card / Other</p>
              </div>
              <div>
                <p className="font-bold uppercase tracking-widest mb-1">Notes</p>
                <p>Late payments are subject to a $50.00 late fee per occurrence. Security deposit of {formatCurrency(data.securityDeposit)} is refundable upon vehicle return in satisfactory condition.</p>
              </div>
            </div>

            {/* Owner & Renter copy acknowledgment */}
            <div className="mt-10 grid grid-cols-2 gap-16">
              <div className="border border-[#1a1a1a]/10 p-6 bg-[#f5f2ed]/20">
                <h4 className="text-[10px] font-bold tracking-widest uppercase text-[#1a1a1a]/50 mb-4">Owner Copy</h4>
                <div className="border-b border-[#1a1a1a] h-8 mb-2"></div>
                <div className="flex justify-between text-[10px] uppercase tracking-widest font-semibold">
                  <span>Triple J Representative</span>
                  <span>Date</span>
                </div>
              </div>
              <div className="border border-[#1a1a1a]/10 p-6 bg-[#f5f2ed]/20">
                <h4 className="text-[10px] font-bold tracking-widest uppercase text-[#1a1a1a]/50 mb-4">Renter Copy</h4>
                <div className="border-b border-[#1a1a1a] h-8 mb-2"></div>
                <div className="flex justify-between text-[10px] uppercase tracking-widest font-semibold">
                  <span>Renter Signature</span>
                  <span>Date</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
