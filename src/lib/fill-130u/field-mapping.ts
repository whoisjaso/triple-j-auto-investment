/**
 * 130-U PDF AcroForm Field Mapping
 *
 * Maps agreement + vehicle data to the exact AcroForm field IDs
 * discovered from the official TxDMV Form 130-U PDF.
 *
 * Field IDs verified via scripts/discover-130u-fields.mjs
 */

// ── Data shape pulled from agreement + vehicle tables ────────────────

export interface AgreementData {
  // Vehicle
  vin: string;
  year: string;
  make: string;
  model: string;
  body_style: string;
  major_color: string;
  minor_color?: string;
  odometer: string;
  odometer_brand?: 'A' | 'N' | 'X'; // Actual, Not Actual, Exceeds
  empty_weight?: string;
  carrying_capacity?: string;
  tx_plate_no?: string;

  // Buyer
  buyer_first_name: string;
  buyer_middle_name?: string;
  buyer_last_name: string;
  buyer_suffix?: string;
  buyer_address: string;
  buyer_city: string;
  buyer_state: string;
  buyer_zip: string;
  buyer_county: string;
  buyer_phone?: string;
  buyer_email?: string;
  buyer_dl_number?: string;
  buyer_dl_state?: string;

  // Co-buyer / additional applicant
  co_buyer_name?: string;

  // Sale
  sale_price: number;
  sale_date?: string;
  trade_in_amount?: number;
  trade_in_description?: string;
  rebate_amount?: number;
  applying_for: 'title_and_registration' | 'title_only' | 'registration_only';
  applicant_type: 'individual' | 'business';

  // Lien (BHPH deals)
  has_lien?: boolean;
  lien_date?: string;
  etitle_lienholder_id?: string;
}

// ── Dealer constants (hardcoded for Triple J) ────────────────────────

export const DEALER = {
  name: 'Triple J Auto Investment LLC',
  address: '8774 Almeda Genoa Rd',
  city: 'Houston',
  state: 'TX',
  zip: '77075',
  gdn: 'P171632',
  phone: '(832) 400-9760',
} as const;

const DEALER_PREVIOUS_OWNER = `${DEALER.name}, ${DEALER.city}, ${DEALER.state}`;

// ── Tax calculation ──────────────────────────────────────────────────

const TX_TAX_RATE = 0.0625; // 6.25%

function calcTax(data: AgreementData) {
  const tradeIn = data.trade_in_amount ?? 0;
  const rebate = data.rebate_amount ?? 0;
  const taxableAmount = Math.max(0, data.sale_price - tradeIn - rebate);
  const taxDue = Math.round(taxableAmount * TX_TAX_RATE * 100) / 100;
  return { taxableAmount, taxDue };
}

// ── Currency formatting ──────────────────────────────────────────────

function fmt(amount: number | undefined): string {
  if (amount === undefined || amount === null) return '';
  return amount.toFixed(2);
}

// ── Field mapping entry types ────────────────────────────────────────

interface TextFieldMapping {
  fieldId: string;
  type: 'text';
  getValue: (data: AgreementData) => string | undefined;
}

interface CheckboxFieldMapping {
  fieldId: string;
  type: 'checkbox';
  getValue: (data: AgreementData) => boolean;
}

export type FieldMapping = TextFieldMapping | CheckboxFieldMapping;

// ── Field mapping array ──────────────────────────────────────────────
// Field IDs are EXACT names from the 130-U PDF AcroForm

export const FIELD_MAPPINGS: FieldMapping[] = [
  // ═══════════════════════════════════════════════════════════════════
  // APPLICATION TYPE CHECKBOXES
  // ═══════════════════════════════════════════════════════════════════
  {
    fieldId: 'Title  Registration',
    type: 'checkbox',
    getValue: (d) => d.applying_for === 'title_and_registration',
  },
  {
    fieldId: 'Title Only',
    type: 'checkbox',
    getValue: (d) => d.applying_for === 'title_only',
  },
  {
    fieldId: 'Registration Purposes Only',
    type: 'checkbox',
    getValue: (d) => d.applying_for === 'registration_only',
  },

  // ═══════════════════════════════════════════════════════════════════
  // VEHICLE DESCRIPTION (Fields 1-12)
  // ═══════════════════════════════════════════════════════════════════
  {
    fieldId: '1 Vehicle Identification Number',
    type: 'text',
    getValue: (d) => d.vin,
  },
  {
    fieldId: '2 Year',
    type: 'text',
    getValue: (d) => d.year,
  },
  {
    fieldId: '3 Make',
    type: 'text',
    getValue: (d) => d.make,
  },
  {
    fieldId: '4 Body Style',
    type: 'text',
    getValue: (d) => d.body_style,
  },
  {
    fieldId: '5 Model',
    type: 'text',
    getValue: (d) => d.model,
  },
  {
    fieldId: '6 Major Color',
    type: 'text',
    getValue: (d) => d.major_color,
  },
  {
    fieldId: '7 Minor Color',
    type: 'text',
    getValue: (d) => d.minor_color,
  },
  {
    fieldId: '8 Texas License Plate No',
    type: 'text',
    getValue: (d) => d.tx_plate_no,
  },
  {
    fieldId: '9 Odometer Reading no tenths',
    type: 'text',
    getValue: (d) => d.odometer,
  },
  {
    fieldId: '11 Empty Weight',
    type: 'text',
    getValue: (d) => d.empty_weight,
  },
  {
    fieldId: '12 Carrying Capacity if any',
    type: 'text',
    getValue: (d) => d.carrying_capacity,
  },

  // Odometer brand checkboxes
  {
    fieldId: 'Not Actual',
    type: 'checkbox',
    getValue: (d) => d.odometer_brand === 'N',
  },
  {
    fieldId: 'Exceeds Mechanical Limits',
    type: 'checkbox',
    getValue: (d) => d.odometer_brand === 'X',
  },

  // ═══════════════════════════════════════════════════════════════════
  // APPLICANT TYPE (Field 13)
  // ═══════════════════════════════════════════════════════════════════
  {
    fieldId: 'Individual',
    type: 'checkbox',
    getValue: (d) => d.applicant_type === 'individual',
  },
  {
    fieldId: 'Business',
    type: 'checkbox',
    getValue: (d) => d.applicant_type === 'business',
  },

  // ═══════════════════════════════════════════════════════════════════
  // APPLICANT ID (Fields 14-15)
  // ═══════════════════════════════════════════════════════════════════
  {
    fieldId: '14 Applicant Photo ID Number or FEINEIN',
    type: 'text',
    getValue: (d) => d.buyer_dl_number,
  },
  {
    fieldId: 'U.S. Driver License/ID Card',
    type: 'checkbox',
    getValue: (d) => !!d.buyer_dl_number,
  },
  {
    fieldId: 'State of ID/DL',
    type: 'text',
    getValue: (d) => d.buyer_dl_state,
  },

  // ═══════════════════════════════════════════════════════════════════
  // APPLICANT INFO (Fields 16-19)
  // Name parts are padded to align under their respective column headers
  // ═══════════════════════════════════════════════════════════════════
  {
    fieldId: '16 Applicant First Name or Entity Name Middle Name Last Name Suffix if any',
    type: 'text',
    getValue: (d) => {
      const first = (d.buyer_first_name || '').padEnd(30);
      const middle = (d.buyer_middle_name || '').padEnd(22);
      const last = d.buyer_last_name || '';
      const suffix = d.buyer_suffix || '';
      return `${first}${middle}${last}${suffix ? '  ' + suffix : ''}`.trimEnd();
    },
  },
  {
    fieldId: '17 Additional Applicant First Name if applicable Middle Name Last Name Suffix if any',
    type: 'text',
    getValue: (d) => d.co_buyer_name,
  },
  {
    fieldId: '18 Applicant Mailing Address City State Zip',
    type: 'text',
    getValue: (d) =>
      `${d.buyer_address}, ${d.buyer_city}, ${d.buyer_state} ${d.buyer_zip}`,
  },
  {
    fieldId: '19 Applicant County of Residence',
    type: 'text',
    getValue: (d) => d.buyer_county,
  },

  // ═══════════════════════════════════════════════════════════════════
  // PREVIOUS OWNER (Field 20) & DEALER GDN (Field 21)
  // ═══════════════════════════════════════════════════════════════════
  {
    fieldId: '20 Previous Owner Name or Entity Name City State',
    type: 'text',
    getValue: () => DEALER_PREVIOUS_OWNER,
  },
  {
    fieldId: '21 Dealer GDN if applicable',
    type: 'text',
    getValue: () => DEALER.gdn,
  },

  // ═══════════════════════════════════════════════════════════════════
  // CONTACT INFO (Fields 25-26)
  // ═══════════════════════════════════════════════════════════════════
  {
    fieldId: '25 Applicant Phone Number optional',
    type: 'text',
    getValue: (d) => d.buyer_phone,
  },
  {
    fieldId: '26 Email optional',
    type: 'text',
    getValue: (d) => d.buyer_email,
  },
  {
    fieldId: 'Yes Provide Email in 26',
    type: 'checkbox',
    getValue: (d) => !!d.buyer_email,
  },

  // LIEN INFO (Fields 30-34) — left blank for manual entry at tax office
  // SECTION 35 (Motor Vehicle Tax Statement) — left blank for tax office

  // ═══════════════════════════════════════════════════════════════════
  // TRADE-IN (Field 36)
  // ═══════════════════════════════════════════════════════════════════
  {
    fieldId: 'Trade-in (if any)',
    type: 'checkbox',
    getValue: (d) => (d.trade_in_amount ?? 0) > 0,
  },
  {
    fieldId: '36 TradeIn if any Year Make Vehicle Identification Number',
    type: 'text',
    getValue: (d) => d.trade_in_description,
  },

  // ═══════════════════════════════════════════════════════════════════
  // SALES AND USE TAX COMPUTATION (Field 38)
  // ═══════════════════════════════════════════════════════════════════
  {
    fieldId: 'Rebate Amount',
    type: 'text',
    getValue: (d) => d.rebate_amount ? fmt(d.rebate_amount) : undefined,
  },
  {
    fieldId: 'Sales Price Minus Rebate Amount',
    type: 'text',
    getValue: (d) => fmt(d.sale_price - (d.rebate_amount ?? 0)),
  },
  {
    fieldId: 'Trade In Amount',
    type: 'text',
    getValue: (d) => d.trade_in_amount ? fmt(d.trade_in_amount) : undefined,
  },
  {
    fieldId: 'Taxable Amount',
    type: 'text',
    getValue: (d) => fmt(calcTax(d).taxableAmount),
  },
  {
    fieldId: '6.25% Tax on Taxable Amount',
    type: 'text',
    getValue: (d) => fmt(calcTax(d).taxDue),
  },
  {
    fieldId: 'Amount of Tax and Penalty Due',
    type: 'text',
    getValue: (d) => fmt(calcTax(d).taxDue),
  },

  // ═══════════════════════════════════════════════════════════════════
  // SELLER / APPLICANT SIGNATURE NAMES + DATES
  // ═══════════════════════════════════════════════════════════════════
  {
    fieldId: 'Seller  Name',
    type: 'text',
    getValue: () => DEALER.name,
  },
  {
    fieldId: 'Date',
    type: 'text',
    getValue: (d) => d.sale_date || new Date().toLocaleDateString('en-US'),
  },
  {
    fieldId: 'Applicant Owner',
    type: 'text',
    getValue: (d) => {
      const parts = [d.buyer_first_name, d.buyer_middle_name, d.buyer_last_name].filter(Boolean);
      return parts.join(' ');
    },
  },
  {
    fieldId: 'Date_2',
    type: 'text',
    getValue: (d) => d.sale_date || new Date().toLocaleDateString('en-US'),
  },
  {
    fieldId: 'Additional Applicant',
    type: 'text',
    getValue: (d) => d.co_buyer_name,
  },
  {
    fieldId: 'Date_3',
    type: 'text',
    getValue: (d) => d.co_buyer_name ? (d.sale_date || new Date().toLocaleDateString('en-US')) : undefined,
  },
];
