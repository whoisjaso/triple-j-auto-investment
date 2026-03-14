/* eslint-disable @next/next/no-img-element */
import { ContractData, calculatePayment, formatCurrency } from '@/lib/documents/finance';
import { addWeeks, addMonths, format } from 'date-fns';
import { SignatureData, DEALER_LICENSE } from '@/lib/documents/shared';
import SignatureLinePreview from '@/components/documents/SignatureLinePreview';

interface Props {
  data: ContractData;
  signatures: SignatureData;
}

export default function ContractPreview({ data, signatures }: Props) {
  const totalCashPrice = data.cashPrice + data.tax + data.titleFee + data.docFee;
  const amountFinanced = Math.max(0, totalCashPrice - data.downPayment);
  const paymentAmount = calculatePayment(amountFinanced, data.apr, data.numberOfPayments, data.paymentFrequency);
  const totalOfPayments = paymentAmount * data.numberOfPayments;
  const financeCharge = totalOfPayments - amountFinanced;

  const generateSchedule = () => {
    if (!data.firstPaymentDate || data.numberOfPayments <= 0 || paymentAmount <= 0) return [];

    const schedule = [];
    let currentDate = new Date(data.firstPaymentDate);
    currentDate = new Date(currentDate.getTime() + currentDate.getTimezoneOffset() * 60000);

    for (let i = 1; i <= data.numberOfPayments; i++) {
      schedule.push({
        paymentNumber: i,
        date: format(currentDate, 'MM/dd/yyyy'),
        amount: paymentAmount,
      });

      if (data.paymentFrequency === 'Weekly') {
        currentDate = addWeeks(currentDate, 1);
      } else if (data.paymentFrequency === 'Bi-weekly') {
        currentDate = addWeeks(currentDate, 2);
      } else if (data.paymentFrequency === 'Monthly') {
        currentDate = addMonths(currentDate, 1);
      }
    }
    return schedule;
  };

  const schedule = generateSchedule();
  const estimatedCompletionDate = schedule.length > 0 ? schedule[schedule.length - 1].date : 'N/A';

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
              <h1 className="text-4xl font-serif font-bold uppercase tracking-widest mb-2 text-[#1a1a1a]">Retail Installment Contract</h1>
              <p className="text-xs tracking-widest uppercase text-[#1a1a1a]/60 font-semibold">Security Agreement &amp; Disclosure Statement</p>
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
            <h3 className="text-[10px] font-bold tracking-widest uppercase text-[#1a1a1a]/50 mb-4">Buyer Information</h3>
            <p className="font-serif text-xl mb-1 min-h-[1.75rem]">{data.buyerName}</p>
            <p className="text-sm text-[#1a1a1a]/80 min-h-[1.25rem]">{data.buyerAddress}</p>
            <p className="text-sm text-[#1a1a1a]/80 min-h-[1.25rem]">{data.buyerPhone}</p>
            <p className="text-sm text-[#1a1a1a]/80 min-h-[1.25rem]">{data.buyerEmail}</p>
          </div>
          <div className="border border-[#1a1a1a]/10 p-6 rounded-sm bg-[#f5f2ed]/30">
            <h3 className="text-[10px] font-bold tracking-widest uppercase text-[#1a1a1a]/50 mb-4">Co-Buyer Information</h3>
            <p className="font-serif text-xl mb-1 min-h-[1.75rem]">{data.coBuyerName}</p>
            <p className="text-sm text-[#1a1a1a]/80 min-h-[1.25rem]">{data.coBuyerAddress}</p>
            <p className="text-sm text-[#1a1a1a]/80 min-h-[1.25rem]">{data.coBuyerPhone}</p>
            <p className="text-sm text-[#1a1a1a]/80 min-h-[1.25rem]">{data.coBuyerEmail}</p>
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
                <th className="p-3 text-left font-semibold">Mileage</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#1a1a1a]/10">
                <td className="p-3">{data.vehicleYear}</td>
                <td className="p-3">{data.vehicleMake}</td>
                <td className="p-3">{data.vehicleModel}</td>
                <td className="p-3 uppercase font-mono text-xs">{data.vehicleVin}</td>
                <td className="p-3 uppercase font-mono text-xs">{data.vehiclePlate}</td>
                <td className="p-3">{data.vehicleMileage}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Truth in Lending */}
        <div className="mb-10 print-section">
          <h3 className="text-[10px] font-bold tracking-widest uppercase text-[#1a1a1a]/50 mb-2">Truth In Lending Disclosures</h3>
          <div className="grid grid-cols-4 border-2 border-[#1a1a1a] divide-x-2 divide-[#1a1a1a]">
            <div className="p-4 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-1">Annual Percentage Rate</div>
                <div className="text-[10px] text-[#1a1a1a]/60 leading-tight">The cost of your credit as a yearly rate.</div>
              </div>
              <div className="text-2xl font-serif font-bold mt-6">{data.apr.toFixed(2)}%</div>
            </div>
            <div className="p-4 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-1">Finance Charge</div>
                <div className="text-[10px] text-[#1a1a1a]/60 leading-tight">The dollar amount the credit will cost you.</div>
              </div>
              <div className="text-2xl font-serif font-bold mt-6">{formatCurrency(financeCharge)}</div>
            </div>
            <div className="p-4 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-1">Amount Financed</div>
                <div className="text-[10px] text-[#1a1a1a]/60 leading-tight">The amount of credit provided to you or on your behalf.</div>
              </div>
              <div className="text-2xl font-serif font-bold mt-6">{formatCurrency(amountFinanced)}</div>
            </div>
            <div className="p-4 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-1">Total of Payments</div>
                <div className="text-[10px] text-[#1a1a1a]/60 leading-tight">The amount you will have paid after you have made all payments as scheduled.</div>
              </div>
              <div className="text-2xl font-serif font-bold mt-6">{formatCurrency(totalOfPayments)}</div>
            </div>
          </div>
        </div>

        {/* Payment Schedule Summary */}
        <div className="mb-10 print-section">
          <h3 className="text-[10px] font-bold tracking-widest uppercase text-[#1a1a1a]/50 mb-2">Payment Schedule</h3>
          <table className="w-full text-sm border-collapse border border-[#1a1a1a]/20">
            <thead>
              <tr className="bg-[#f5f2ed]/50 border-b border-[#1a1a1a]/20">
                <th className="p-3 text-left font-semibold">Number of Payments</th>
                <th className="p-3 text-left font-semibold">Amount of Payments</th>
                <th className="p-3 text-left font-semibold">When Payments Are Due</th>
                <th className="p-3 text-left font-semibold">Est. Completion Date</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-3">{data.numberOfPayments}</td>
                <td className="p-3 font-bold">{formatCurrency(paymentAmount)}</td>
                <td className="p-3">{data.paymentFrequency} beginning {data.firstPaymentDate ? format(new Date(data.firstPaymentDate + 'T12:00:00'), 'MM/dd/yyyy') : ''}</td>
                <td className="p-3 font-bold text-[#b89b5e]">{estimatedCompletionDate}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Itemization & Important Clauses */}
        <div className="grid grid-cols-2 gap-12 mb-12 print-section">
          <div>
            <h3 className="text-[10px] font-bold tracking-widest uppercase text-[#1a1a1a]/50 mb-4">Itemization of Amount Financed</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>1. Cash Price of Vehicle</span>
                <span>{formatCurrency(data.cashPrice)}</span>
              </div>
              <div className="flex justify-between text-[#1a1a1a]/70">
                <span>&nbsp;&nbsp;&nbsp;a. Sales Tax</span>
                <span>{formatCurrency(data.tax)}</span>
              </div>
              <div className="flex justify-between text-[#1a1a1a]/70">
                <span>&nbsp;&nbsp;&nbsp;b. Title &amp; Registration Fees</span>
                <span>{formatCurrency(data.titleFee)}</span>
              </div>
              <div className="flex justify-between text-[#1a1a1a]/70">
                <span>&nbsp;&nbsp;&nbsp;c. Documentary Fee</span>
                <span>{formatCurrency(data.docFee)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-[#1a1a1a]/10 pt-2">
                <span>2. Total Cash Price</span>
                <span>{formatCurrency(totalCashPrice)}</span>
              </div>
              <div className="flex justify-between border-b border-[#1a1a1a]/20 pb-3">
                <span>3. Down Payment</span>
                <span className="text-red-700">- {formatCurrency(data.downPayment)}</span>
              </div>
              <div className="flex justify-between font-bold pt-1 text-lg font-serif">
                <span>4. Amount Financed (2 minus 3)</span>
                <span>{formatCurrency(amountFinanced)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="border-2 border-[#1a1a1a] p-5 bg-[#f5f2ed]/20">
              <h3 className="font-serif font-bold text-lg uppercase tracking-widest mb-2 text-center">As Is - No Dealer Warranty</h3>
              <p className="text-xs text-justify leading-relaxed">
                <strong>THE VEHICLE IS SOLD AS IS.</strong> The dealer assumes no responsibility for any repairs regardless of any oral statements about the vehicle. All implied warranties, including any implied warranties of merchantability and fitness for a particular purpose, are expressly disclaimed.
              </p>
            </div>
            <div className="border border-red-900/20 p-5 bg-red-50/50">
              <h3 className="font-serif font-bold text-lg uppercase tracking-widest mb-2 text-center text-red-900">No Refund Policy</h3>
              <p className="text-xs text-justify leading-relaxed text-red-900/80">
                <strong>ALL SALES ARE FINAL.</strong> The Buyer acknowledges that no refunds, returns, or exchanges will be accepted under any circumstances. The down payment and any subsequent payments are strictly non-refundable.
              </p>
            </div>
          </div>
        </div>

        {/* Total Due at Signing */}
        {data.dueAtSigning > 0 && (
          <div className="mb-10 print-section">
            <div className="border-2 border-[#b89b5e] bg-[#f5f2ed]/40 p-6 text-center">
              <h3 className="text-[10px] font-bold tracking-widest uppercase text-[#1a1a1a]/50 mb-2">Total Due at Signing</h3>
              <p className="text-4xl font-serif font-bold text-[#b89b5e]">{formatCurrency(data.dueAtSigning)}</p>
              <p className="text-xs text-[#1a1a1a]/60 mt-2">Amount due before vehicle delivery (includes down payment, fees, and any other charges due at time of sale)</p>
            </div>
          </div>
        )}

        {/* Texas Mandatory Buyer Notice */}
        <div className="mb-8 border-2 border-[#1a1a1a] p-5 bg-yellow-50/50 print-section">
          <p className="text-xs font-bold text-center uppercase tracking-wider leading-relaxed">
            NOTICE TO THE BUYER — DO NOT SIGN THIS CONTRACT BEFORE YOU READ IT OR IF IT CONTAINS ANY BLANK SPACES. YOU ARE ENTITLED TO A COPY OF THE CONTRACT YOU SIGN. UNDER THE LAW YOU HAVE THE RIGHT TO PAY OFF IN ADVANCE THE FULL AMOUNT DUE AND UNDER CERTAIN CONDITIONS MAY OBTAIN A PARTIAL REFUND OF THE FINANCE CHARGE. KEEP THIS CONTRACT TO PROTECT YOUR LEGAL RIGHTS.
          </p>
        </div>

        {/* GPS Tracking Device Disclosure & Consent */}
        <div className="mb-8 border-2 border-red-900/40 p-5 bg-red-50/30 print-section">
          <h3 className="font-serif font-bold text-sm uppercase tracking-widest mb-3 text-center text-red-900">GPS Tracking &amp; Starter Interrupt Device — Disclosure, Consent &amp; Agreement</h3>
          <div className="text-[10px] text-justify leading-relaxed space-y-2 text-red-900/80">
            <p><strong>DISCLOSURE:</strong> Buyer acknowledges that a Global Positioning System (GPS) electronic tracking device and/or starter interrupt device has been or will be installed in the Vehicle described above. This device is capable of: (a) identifying, monitoring, and recording the geographic location of the Vehicle; and (b) remotely disabling the Vehicle&apos;s ignition/starter system.</p>
            <p><strong>PURPOSE:</strong> The GPS device is installed for the purposes of: (a) protecting Seller/Holder&apos;s security interest in the Vehicle; (b) locating the Vehicle in the event of default or repossession; and (c) theft recovery.</p>
            <p><strong>CONSENT:</strong> Pursuant to Texas Penal Code Section 16.06, Buyer hereby provides express written consent to the installation, maintenance, and use of the GPS tracking device and/or starter interrupt device on the Vehicle for the duration of this Retail Installment Contract.</p>
            <p><strong>STARTER INTERRUPT:</strong> Buyer understands that if payments become past due, the starter interrupt device may prevent the Vehicle from restarting after the engine is turned off. The starter interrupt will NOT disable a Vehicle while it is in motion. Buyer will be provided with an emergency override code for safety situations.</p>
            <p><strong>TAMPERING PROHIBITED:</strong> Buyer agrees not to alter, disconnect, remove, damage, or tamper with the GPS device or starter interrupt device. Any tampering constitutes a default under this Contract and Buyer shall be liable for the cost of replacement plus any resulting damages.</p>
            <p><strong>DEVICE OWNERSHIP:</strong> The GPS device remains the property of Seller/Holder until this Contract is paid in full, at which time Buyer may request removal of the device at no charge.</p>
            <p><strong>NO ADDITIONAL CHARGE:</strong> There is no separate charge to Buyer for the GPS device. The cost of the device is not included in the Amount Financed, Finance Charge, or any other charge disclosed in this Contract.</p>
          </div>
        </div>

        {/* Comprehensive Terms */}
        <div className="mb-10 text-[10.5px] text-justify space-y-2.5 text-[#1a1a1a]/70 columns-2 gap-8">
          <p><strong>1. PROMISE TO PAY:</strong> Buyer promises to pay Holder the principal amount of {formatCurrency(amountFinanced)} plus interest at the Annual Percentage Rate of {data.apr.toFixed(2)}% until paid in full. Buyer will make payments according to the Payment Schedule above. Buyer&apos;s obligation to make payments is absolute and unconditional and shall not be subject to any set-off, counterclaim, or defense.</p>

          <p><strong>2. SECURITY INTEREST:</strong> Buyer grants Holder a purchase money security interest in the Vehicle described above and all accessions, accessories, and proceeds thereof. This security interest secures payment of all amounts owed under this Contract. Holder may file a financing statement (UCC-1) to perfect its security interest.</p>

          <p><strong>3. LATE CHARGES:</strong> If any installment payment remains unpaid for more than fifteen (15) days after its scheduled due date, Holder may collect a delinquency charge of five percent (5%) of the unpaid installment amount. Only one delinquency charge may be collected on any single installment regardless of how long the payment remains unpaid, in accordance with Texas Finance Code Section 348.107.</p>

          <p><strong>4. RETURNED PAYMENTS:</strong> A fee of $30.00 shall be assessed for any check, electronic payment, or other instrument returned or dishonored for any reason, including insufficient funds. Following a returned payment, Holder may require all future payments be made by cash, money order, or certified funds.</p>

          <p><strong>5. DEFAULT:</strong> Buyer shall be in default if: (a) Buyer fails to make any payment when due; (b) Buyer fails to maintain required insurance coverage; (c) Buyer violates any term of this Contract; (d) Buyer provides false or misleading information; (e) Buyer abandons the Vehicle; (f) Buyer tampers with or removes the GPS/starter interrupt device; (g) Buyer sells, transfers, or encumbers the Vehicle without Holder&apos;s written consent; (h) Buyer makes unauthorized modifications to the Vehicle; or (i) Holder believes in good faith that the prospect of Buyer&apos;s payment or performance is impaired.</p>

          <p><strong>6. ACCELERATION:</strong> Upon default, Holder may declare the entire unpaid balance of this Contract immediately due and payable. Upon acceleration, Buyer shall be entitled to a refund of the unearned portion of the finance charge as provided by Texas Finance Code Sections 348.120 or 348.121, as applicable.</p>

          <p><strong>7. RIGHT TO CURE:</strong> Upon default, Holder may, at its sole discretion, provide Buyer written notice of default and a period of not less than ten (10) days to cure such default. Holder is not required by Texas law to provide notice before exercising remedies, but may elect to do so. If Buyer fails to cure the default within the cure period (if any is provided), Holder may exercise all remedies available under this Contract and applicable law.</p>

          <p><strong>8. REPOSSESSION:</strong> Upon default or acceleration, Holder may take possession of the Vehicle wherever it may be found, without notice or demand, using peaceful means and without breach of the peace, as permitted by Chapter 9, Texas Business and Commerce Code, and Texas Finance Code Chapter 348. Buyer shall not hide, conceal, or refuse to surrender the Vehicle. Holder shall not enter any closed or locked structure to repossess the Vehicle and shall not use or threaten force. After repossession, Holder shall provide notice as required by law before disposing of the Vehicle. Buyer shall have the right to redeem the Vehicle before sale by paying the full unpaid balance plus all repossession costs, storage fees, and other lawful charges.</p>

          <p><strong>9. DEFICIENCY BALANCE:</strong> If the Vehicle is sold after repossession and the proceeds of the sale, after deducting all costs of repossession, storage, repair, and sale, are less than the unpaid balance owed under this Contract, Buyer shall remain liable for the deficiency balance. Holder shall send written notice to Buyer of the sale and any deficiency balance as required by applicable law.</p>

          <p><strong>10. PERSONAL PROPERTY AFTER REPOSSESSION:</strong> Any personal property found in the Vehicle after repossession will be handled in accordance with Texas Finance Code Section 348.407. Holder shall notify Buyer within fifteen (15) days of discovering personal property; Buyer has thirty-one (31) days to claim it.</p>

          <p><strong>11. INSURANCE:</strong> Buyer agrees to maintain at all times during the term of this Contract: (a) comprehensive and collision insurance on the Vehicle with Holder named as lienholder/loss payee; and (b) liability insurance meeting or exceeding Texas minimum requirements ($30,000 bodily injury per person, $60,000 bodily injury per accident, $25,000 property damage). Buyer shall provide proof of insurance prior to delivery and within five (5) days of any policy renewal or change. If Buyer fails to maintain insurance, Holder may purchase force-placed insurance at Buyer&apos;s expense or declare Buyer in default.</p>

          <p><strong>12. PREPAYMENT:</strong> Buyer may prepay this Contract in full at any time before the final installment is due without penalty. If Buyer prepays in full, Buyer is entitled to a refund credit of the unearned portion of the finance charge as computed under Texas Finance Code Section 348.120 or 348.121. Partial prepayments will be applied in accordance with this Contract and will not change the scheduled payment amounts or due dates unless Holder agrees in writing.</p>

          <p><strong>13. UNAUTHORIZED MODIFICATIONS:</strong> Buyer shall not make or permit any material alterations or modifications to the Vehicle without Holder&apos;s prior written consent, including but not limited to: engine or transmission modifications, suspension changes, aftermarket wheels or tires that differ from manufacturer specifications, exhaust modifications, body modifications, or removal of emissions equipment. Any unauthorized modification constitutes a default.</p>

          <p><strong>14. NO COOLING-OFF PERIOD:</strong> THERE IS NO COOLING-OFF PERIOD FOR THIS SALE. Under Texas law, once Buyer signs this Contract, Buyer is legally bound by its terms. Buyer does not have a right to return the Vehicle or cancel this Contract based on a change of mind, buyer&apos;s remorse, or dissatisfaction with the Vehicle. This sale is FINAL upon execution.</p>

          <p><strong>15. VEHICLE CONDITION ACKNOWLEDGMENT:</strong> Buyer acknowledges that: (a) Buyer has inspected the Vehicle or has had the opportunity to have the Vehicle inspected by an independent mechanic; (b) Buyer is purchasing the Vehicle based on Buyer&apos;s own inspection and judgment, not in reliance upon any oral representations by Seller; (c) the Vehicle is a used motor vehicle and may have undiscoverable defects; (d) ALL REPRESENTATIONS REGARDING THE VEHICLE ARE CONTAINED IN THIS CONTRACT. NO ORAL REPRESENTATIONS OR WARRANTIES HAVE BEEN MADE THAT ARE NOT CONTAINED HEREIN.</p>

          <p><strong>16. DOCUMENTARY FEE:</strong> A DOCUMENTARY FEE IS NOT AN OFFICIAL FEE. A DOCUMENTARY FEE IS NOT REQUIRED BY LAW BUT MAY BE CHARGED TO BUYERS FOR HANDLING DOCUMENTS RELATING TO THE SALE. A DOCUMENTARY FEE MAY NOT EXCEED A REASONABLE AMOUNT AGREED TO BY THE PARTIES.</p>

          <p><strong>17. PAYMENT RECORDS:</strong> Holder&apos;s records of payments received shall be presumed accurate unless Buyer provides written evidence demonstrating otherwise. Buyer shall retain all payment receipts. Payment disputes must be raised in writing within sixty (60) days of the disputed payment.</p>

          <p><strong>18. TOLL VIOLATIONS &amp; CITATIONS:</strong> Buyer is solely responsible for all toll charges, parking tickets, traffic citations, red-light camera violations, and any fines or penalties incurred during the term of this Contract. If Holder receives any such citation as the registered owner/lienholder, Buyer shall reimburse Holder for all costs incurred.</p>

          <p><strong>19. ATTORNEY FEES &amp; COLLECTION COSTS:</strong> If Holder refers this Contract to an attorney for collection or enforcement, Buyer agrees to pay reasonable attorney&apos;s fees and all costs of collection, to the extent permitted by Texas law.</p>

          <p><strong>20. GOVERNING LAW &amp; JURISDICTION:</strong> This Contract shall be governed by and construed in accordance with the laws of the State of Texas. Any dispute arising out of or related to this Contract shall be subject to the exclusive jurisdiction of the state and federal courts located in Harris County, Texas.</p>

          <p><strong>21. DISPUTE RESOLUTION:</strong> Prior to initiating any legal proceeding, the parties agree to attempt in good faith to resolve any dispute through informal negotiation for a period of thirty (30) days. If Buyer is a covered borrower under the Military Lending Act (10 U.S.C. 987), mandatory arbitration shall not apply.</p>

          <p><strong>22. ENTIRE AGREEMENT:</strong> This Contract, together with all addenda, riders, and disclosures signed by the parties (including the GPS Disclosure, FTC Buyers Guide, and Odometer Disclosure), constitutes the entire agreement between Buyer and Seller regarding the purchase and financing of the Vehicle. No modification shall be valid unless in writing and signed by both parties.</p>

          <p><strong>23. SEVERABILITY:</strong> If any provision of this Contract is found to be invalid, illegal, or unenforceable, such finding shall not affect the validity of the remaining provisions, which shall continue in full force and effect.</p>

          <p><strong>24. WAIVER:</strong> Holder&apos;s failure to enforce any term of this Contract shall not constitute a waiver of Holder&apos;s right to enforce that term or any other term at any time. Acceptance of late payments or partial payments shall not constitute a waiver of Holder&apos;s right to demand timely payment in full.</p>
        </div>

        {/* ECOA Notice */}
        <div className="mb-8 border border-[#1a1a1a]/20 p-4 text-[9px] text-[#1a1a1a]/50 text-justify leading-relaxed print-section">
          <strong>EQUAL CREDIT OPPORTUNITY ACT NOTICE:</strong> The Federal Equal Credit Opportunity Act prohibits creditors from discriminating against credit applicants on the basis of race, color, religion, national origin, sex, marital status, age (provided the applicant has the capacity to enter into a binding contract), because all or part of the applicant&apos;s income derives from any public assistance program, or because the applicant has in good faith exercised any right under the Consumer Credit Protection Act. The federal agency that administers compliance with this law is: Consumer Financial Protection Bureau, 1700 G Street NW, Washington, DC 20552, (855) 411-2372.
        </div>

        {/* Customer ID Photo */}
        {signatures.buyerIdPhoto && (
          <div className="mb-10 border border-[#1a1a1a]/10 p-4 rounded-sm bg-[#f5f2ed]/20 flex items-center space-x-6">
            <img src={signatures.buyerIdPhoto} alt="Customer ID" className="h-28 object-contain rounded border border-[#1a1a1a]/10" />
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase text-[#1a1a1a]/50">Customer ID on File</p>
              <p className="text-sm font-medium mt-1">{data.buyerName}</p>
            </div>
          </div>
        )}

        {/* Signatures */}
        <div className="space-y-12 bg-[#f5f2ed]/30 p-8 border border-[#1a1a1a]/10 print-signatures">
          <div className="text-sm font-bold mb-8 text-center font-serif text-lg">
            By signing below, you agree to the terms of this contract. You acknowledge that you have read it completely before signing.
          </div>

          <div className="grid grid-cols-2 gap-16">
            <SignatureLinePreview label="Buyer Signature" signatureImage={signatures.buyerSignature} signatureDate={signatures.buyerSignatureDate} printedName={data.buyerName} />
            <SignatureLinePreview label="Co-Buyer Signature" signatureImage={signatures.coBuyerSignature} signatureDate={signatures.coBuyerSignatureDate} printedName={data.coBuyerName} />
          </div>

          <div className="grid grid-cols-2 gap-16 mt-8">
            <SignatureLinePreview label={`Triple J Auto Representative — DL# ${DEALER_LICENSE}`} signatureImage={signatures.dealerSignature} signatureDate={signatures.dealerSignatureDate} />
          </div>
        </div>

        {/* Full Payment Schedule (Page Break for Print) */}
        {schedule.length > 0 && (
          <div className="mt-20 pt-12 border-t-2 border-[#1a1a1a] print-page-break">
            <h3 className="text-2xl font-serif font-bold mb-8 text-center uppercase tracking-widest">Amortization Schedule</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-4 text-sm">
              {schedule.map((payment) => (
                <div key={payment.paymentNumber} className="border-b border-[#1a1a1a]/10 pb-2 flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[#1a1a1a]/40 uppercase tracking-wider">Payment {payment.paymentNumber}</span>
                    <span className="font-medium">{payment.date}</span>
                  </div>
                  <span className="font-bold font-serif">{formatCurrency(payment.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
