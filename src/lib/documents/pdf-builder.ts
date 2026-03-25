import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';
import { DEALER_NAME, DEALER_ADDRESS, DEALER_PHONE, DEALER_WEBSITE, DEALER_LICENSE } from './shared';
import { calculateBillOfSale, formatCurrency as bosFmt } from './billOfSale';
import { calculatePayment, formatCurrency as finFmt } from './finance';
import { calculateRentalTotal, calculateRentalDuration } from './rental';
import type { CompletedLinkData } from './customerPortal';

// ============================================================
// PDF Builder — generates PDFs using pdf-lib (no browser needed)
//
// Replaces Puppeteer-based generation for Vercel compatibility.
// Works in any serverless environment (pure JS, no native deps).
//
//  ┌───────────────┐     ┌──────────────┐     ┌──────────┐
//  │ API Route     │────►│ buildPdf()   │────►│ pdf-lib  │
//  │ (serverless)  │     │ pure JS      │     │ Buffer   │
//  └───────────────┘     └──────────────┘     └──────────┘
// ============================================================

const GOLD = rgb(0.722, 0.608, 0.369); // #b89b5e
const BLACK = rgb(0.1, 0.1, 0.1);
const GRAY = rgb(0.4, 0.4, 0.4);
const LIGHT_GRAY = rgb(0.85, 0.85, 0.85);
const WHITE = rgb(1, 1, 1);

// Sanitize text for pdf-lib StandardFonts (WinAnsi / Latin-1 only).
// Replaces common Unicode chars with ASCII equivalents and strips the rest.
function sanitize(text: string): string {
  if (!text) return '';
  return String(text)
    // Smart quotes → straight
    .replace(/[\u2018\u2019\u201A]/g, "'")
    .replace(/[\u201C\u201D\u201E]/g, '"')
    // Dashes
    .replace(/[\u2013\u2014]/g, '-')
    // Ellipsis
    .replace(/\u2026/g, '...')
    // Bullets
    .replace(/\u2022/g, '*')
    // Non-breaking space
    .replace(/\u00A0/g, ' ')
    // Check/cross marks
    .replace(/[\u2713\u2714\u2611]/g, '[x]')
    .replace(/[\u2717\u2718\u2610]/g, '[ ]')
    // Strip any remaining non-Latin-1 (keep 0x20-0x7E and 0xA0-0xFF)
    .replace(/[^\x20-\x7E\xA0-\xFF\n\r\t]/g, '');
}

const PAGE_W = 612; // Letter width in points
const PAGE_H = 792; // Letter height in points
const MARGIN = 50;
const CONTENT_W = PAGE_W - 2 * MARGIN;

interface Ctx {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  font: PDFFont;
  fontBold: PDFFont;
  fontItalic: PDFFont;
}

function newPage(ctx: Ctx): void {
  ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H]);
  ctx.y = PAGE_H - MARGIN;
}

function ensureSpace(ctx: Ctx, needed: number): void {
  if (ctx.y - needed < MARGIN + 20) {
    newPage(ctx);
  }
}

function drawText(ctx: Ctx, text: string, opts: {
  x?: number; size?: number; color?: typeof BLACK; font?: PDFFont; maxWidth?: number;
} = {}): void {
  const { x = MARGIN, size = 10, color = BLACK, font = ctx.font, maxWidth } = opts;
  const safeText = sanitize(String(text || ''));
  if (!safeText) return;

  if (maxWidth) {
    // Simple word wrap
    const words = safeText.split(' ');
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      const w = font.widthOfTextAtSize(test, size);
      if (w > maxWidth && line) {
        ensureSpace(ctx, size + 4);
        ctx.page.drawText(line, { x, y: ctx.y, size, color, font });
        ctx.y -= size + 4;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) {
      ensureSpace(ctx, size + 4);
      ctx.page.drawText(line, { x, y: ctx.y, size, color, font });
      ctx.y -= size + 4;
    }
  } else {
    ensureSpace(ctx, size + 4);
    ctx.page.drawText(safeText, { x, y: ctx.y, size, color, font });
    ctx.y -= size + 4;
  }
}

function drawLine(ctx: Ctx): void {
  ensureSpace(ctx, 10);
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y },
    end: { x: PAGE_W - MARGIN, y: ctx.y },
    thickness: 0.5,
    color: LIGHT_GRAY,
  });
  ctx.y -= 10;
}

function drawSectionHeader(ctx: Ctx, title: string): void {
  ctx.y -= 6;
  ensureSpace(ctx, 24);
  // Background bar
  ctx.page.drawRectangle({
    x: MARGIN,
    y: ctx.y - 4,
    width: CONTENT_W,
    height: 18,
    color: rgb(0.95, 0.95, 0.95),
  });
  ctx.page.drawText(sanitize(title.toUpperCase()), {
    x: MARGIN + 8,
    y: ctx.y,
    size: 9,
    font: ctx.fontBold,
    color: GRAY,
  });
  ctx.y -= 22;
}

function drawField(ctx: Ctx, label: string, value: string | number | undefined | null, opts: {
  halfWidth?: boolean; xOffset?: number;
} = {}): void {
  const { halfWidth = false, xOffset = 0 } = opts;
  const x = MARGIN + xOffset;
  const maxW = halfWidth ? CONTENT_W / 2 - 10 : CONTENT_W;
  const val = value != null && value !== '' ? sanitize(String(value)) : '-';

  ensureSpace(ctx, 24);
  ctx.page.drawText(sanitize(label), { x, y: ctx.y, size: 7, color: GRAY, font: ctx.font });
  ctx.y -= 11;
  ctx.page.drawText(val, { x, y: ctx.y, size: 10, color: BLACK, font: ctx.fontBold, maxWidth: maxW });
  ctx.y -= 14;
}

function drawFieldRow(ctx: Ctx, fields: [string, string | number | undefined | null][]): void {
  const colW = CONTENT_W / fields.length;
  const startY = ctx.y;
  ensureSpace(ctx, 26);

  for (let i = 0; i < fields.length; i++) {
    const [label, value] = fields[i];
    const x = MARGIN + i * colW;
    const val = value != null && value !== '' ? sanitize(String(value)) : '-';
    ctx.page.drawText(sanitize(label), { x, y: startY, size: 7, color: GRAY, font: ctx.font });
    ctx.page.drawText(val, { x, y: startY - 11, size: 10, color: BLACK, font: ctx.fontBold, maxWidth: colW - 10 });
  }
  ctx.y = startY - 26;
}

async function embedSignature(ctx: Ctx, dataUrl: string, x: number, maxW: number, maxH: number): Promise<void> {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) return;
  try {
    const base64 = dataUrl.split(',')[1];
    if (!base64) return;
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const isPng = dataUrl.includes('image/png');
    const img = isPng
      ? await ctx.doc.embedPng(bytes)
      : await ctx.doc.embedJpg(bytes);

    const scale = Math.min(maxW / img.width, maxH / img.height, 1);
    const w = img.width * scale;
    const h = img.height * scale;
    ensureSpace(ctx, h + 4);
    ctx.page.drawImage(img, { x, y: ctx.y - h, width: w, height: h });
    ctx.y -= h + 4;
  } catch (e) {
    // Signature embedding failed — skip silently, doc is still valid
    console.warn('[pdf-builder] Signature embed failed:', e);
  }
}

function drawDocHeader(ctx: Ctx, title: string, subtitle: string, copyLabel?: string): void {
  // Copy label
  if (copyLabel) {
    const copyStr = `-- ${copyLabel} --`;
    ctx.page.drawText(copyStr, {
      x: PAGE_W / 2 - ctx.font.widthOfTextAtSize(copyStr, 8) / 2,
      y: ctx.y,
      size: 8,
      color: GRAY,
      font: ctx.fontBold,
    });
    ctx.y -= 16;
  }

  // Dealer name
  ctx.page.drawText(DEALER_NAME, {
    x: MARGIN,
    y: ctx.y,
    size: 16,
    color: GOLD,
    font: ctx.fontBold,
  });
  ctx.y -= 14;
  ctx.page.drawText(`${DEALER_ADDRESS} | ${DEALER_PHONE} | ${DEALER_WEBSITE}`, {
    x: MARGIN,
    y: ctx.y,
    size: 8,
    color: GRAY,
    font: ctx.font,
  });
  ctx.y -= 8;
  ctx.page.drawText(`Dealer License: ${DEALER_LICENSE}`, {
    x: MARGIN,
    y: ctx.y,
    size: 7,
    color: GRAY,
    font: ctx.font,
  });
  ctx.y -= 18;

  // Title
  drawLine(ctx);
  ctx.page.drawText(sanitize(title.toUpperCase()), {
    x: MARGIN,
    y: ctx.y,
    size: 18,
    color: BLACK,
    font: ctx.fontBold,
  });
  ctx.y -= 14;
  ctx.page.drawText(sanitize(subtitle), {
    x: MARGIN,
    y: ctx.y,
    size: 9,
    color: GRAY,
    font: ctx.fontItalic,
  });
  ctx.y -= 16;
  drawLine(ctx);
}

function fmt(n: number | string | undefined | null): string {
  const num = typeof n === 'string' ? parseFloat(n) : (n ?? 0);
  if (isNaN(num)) return '$0.00';
  return bosFmt(num);
}

function str(v: unknown): string {
  if (v == null) return '';
  return String(v);
}

// ============================================================
// Bill of Sale PDF
// ============================================================
async function buildBillOfSale(ctx: Ctx, data: Record<string, unknown>, copyLabel?: string): Promise<void> {
  drawDocHeader(ctx, 'Bill of Sale', 'Vehicle Purchase Agreement & Transfer of Ownership', copyLabel);

  // Sale info
  drawSectionHeader(ctx, 'Sale Information');
  drawFieldRow(ctx, [
    ['Sale Date', str(data.saleDate)],
    ['Stock #', str(data.stockNumber)],
    ['Payment Method', data.paymentMethod === 'Other' ? str(data.paymentMethodOther) : str(data.paymentMethod)],
  ]);

  // Buyer
  drawSectionHeader(ctx, 'Buyer');
  drawFieldRow(ctx, [
    ['Name', str(data.buyerName)],
    ['Phone', str(data.buyerPhone)],
    ['Email', str(data.buyerEmail)],
  ]);
  const buyerAddr = [data.buyerAddress, data.buyerCity, data.buyerState, data.buyerZip].filter(Boolean).join(', ');
  if (buyerAddr) {
    drawFieldRow(ctx, [
      ['Address', buyerAddr],
      ['DL #', str(data.buyerLicense)],
      ['DL State', str(data.buyerLicenseState)],
    ]);
  }

  // Co-Buyer
  if (data.coBuyerName) {
    drawSectionHeader(ctx, 'Co-Buyer');
    drawFieldRow(ctx, [
      ['Name', str(data.coBuyerName)],
      ['Phone', str(data.coBuyerPhone)],
      ['Email', str(data.coBuyerEmail)],
    ]);
  }

  // Vehicle
  drawSectionHeader(ctx, 'Vehicle');
  drawFieldRow(ctx, [
    ['Year', str(data.vehicleYear)],
    ['Make', str(data.vehicleMake)],
    ['Model', str(data.vehicleModel)],
    ['Trim', str(data.vehicleTrim)],
  ]);
  drawFieldRow(ctx, [
    ['VIN', str(data.vehicleVin)],
    ['Color', str(data.vehicleColor)],
    ['Body Style', str(data.vehicleBodyStyle)],
  ]);
  drawFieldRow(ctx, [
    ['Plate #', str(data.vehiclePlate)],
    ['Mileage', str(data.vehicleMileage)],
    ['Odometer', str(data.odometerReading)],
  ]);

  // Odometer disclosure
  const odometerStatus = str(data.odometerStatus);
  const odometerLabel =
    odometerStatus === 'actual' ? 'reflects the actual mileage of the vehicle' :
    odometerStatus === 'exceeds' ? "exceeds the odometer's mechanical limits" :
    'IS NOT the actual mileage. ODOMETER DISCREPANCY.';
  drawText(ctx, `Odometer Disclosure: The odometer reading ${odometerLabel}.`, {
    size: 8, color: GRAY, font: ctx.fontItalic, maxWidth: CONTENT_W,
  });
  ctx.y -= 4;

  // Financial
  drawSectionHeader(ctx, 'Sale Details');
  const salePrice = Number(data.salePrice) || 0;
  const tradeIn = Number(data.tradeInAllowance) || 0;
  const tradePayoff = Number(data.tradeInPayoff) || 0;
  const tax = Number(data.tax) || 0;
  const titleFee = Number(data.titleFee) || 0;
  const docFee = Number(data.docFee) || 0;
  const regFee = Number(data.registrationFee) || 0;
  const otherFees = Number(data.otherFees) || 0;

  const calc = calculateBillOfSale({
    salePrice, tradeInAllowance: tradeIn, tradeInPayoff: tradePayoff,
    tax, titleFee, docFee, registrationFee: regFee, otherFees,
  } as never);

  drawFieldRow(ctx, [
    ['Sale Price', fmt(salePrice)],
    ['Trade-In Allowance', fmt(tradeIn)],
    ['Trade-In Payoff', fmt(tradePayoff)],
  ]);
  drawFieldRow(ctx, [
    ['Sales Tax (6.25%)', fmt(tax)],
    ['Title Fee', fmt(titleFee)],
    ['Doc Fee', fmt(docFee)],
  ]);
  drawFieldRow(ctx, [
    ['Registration Fee', fmt(regFee)],
    ['Other Fees', fmt(otherFees)],
    ['', ''],
  ]);

  if (data.otherFeesDescription) {
    drawText(ctx, `Other fees: ${str(data.otherFeesDescription)}`, { size: 8, color: GRAY });
  }

  // Total
  ctx.y -= 4;
  ensureSpace(ctx, 28);
  ctx.page.drawRectangle({
    x: MARGIN,
    y: ctx.y - 6,
    width: CONTENT_W,
    height: 22,
    color: rgb(0.96, 0.94, 0.88),
  });
  ctx.page.drawText('TOTAL DUE:', {
    x: MARGIN + 8,
    y: ctx.y,
    size: 11,
    font: ctx.fontBold,
    color: BLACK,
  });
  const totalStr = fmt(calc.totalDue);
  const totalW = ctx.fontBold.widthOfTextAtSize(totalStr, 14);
  ctx.page.drawText(totalStr, {
    x: PAGE_W - MARGIN - totalW - 8,
    y: ctx.y - 1,
    size: 14,
    font: ctx.fontBold,
    color: GOLD,
  });
  ctx.y -= 30;

  // Condition
  drawSectionHeader(ctx, 'Vehicle Condition');
  const condType = str(data.conditionType);
  if (condType === 'as_is') {
    drawText(ctx, 'AS-IS - NO WARRANTY', { size: 11, font: ctx.fontBold });
    drawText(ctx, 'This vehicle is sold "AS IS" without any warranties, express or implied. The buyer acknowledges that they accept full responsibility for any and all repairs.', {
      size: 8, color: GRAY, maxWidth: CONTENT_W,
    });
  } else {
    drawText(ctx, 'LIMITED WARRANTY', { size: 11, font: ctx.fontBold });
    if (data.warrantyDuration) drawField(ctx, 'Duration', str(data.warrantyDuration));
    if (data.warrantyDescription) drawField(ctx, 'Coverage', str(data.warrantyDescription));
  }

  // Trade-in
  if (data.tradeInDescription) {
    drawSectionHeader(ctx, 'Trade-In Vehicle');
    drawFieldRow(ctx, [
      ['Description', str(data.tradeInDescription)],
      ['VIN', str(data.tradeInVin)],
    ]);
  }
}

// ============================================================
// Financing Agreement PDF
// ============================================================
async function buildFinancing(ctx: Ctx, data: Record<string, unknown>, copyLabel?: string): Promise<void> {
  drawDocHeader(ctx, 'Financing Agreement', 'Buy Here Pay Here - Retail Installment Contract', copyLabel);

  // Buyer
  drawSectionHeader(ctx, 'Buyer');
  drawFieldRow(ctx, [
    ['Name', str(data.buyerName)],
    ['Phone', str(data.buyerPhone)],
    ['Email', str(data.buyerEmail)],
  ]);
  if (data.buyerAddress) drawField(ctx, 'Address', str(data.buyerAddress));

  if (data.coBuyerName) {
    drawSectionHeader(ctx, 'Co-Buyer');
    drawFieldRow(ctx, [
      ['Name', str(data.coBuyerName)],
      ['Phone', str(data.coBuyerPhone)],
    ]);
  }

  // Vehicle
  drawSectionHeader(ctx, 'Vehicle');
  drawFieldRow(ctx, [
    ['Year', str(data.vehicleYear)],
    ['Make', str(data.vehicleMake)],
    ['Model', str(data.vehicleModel)],
  ]);
  drawFieldRow(ctx, [
    ['VIN', str(data.vehicleVin)],
    ['Plate', str(data.vehiclePlate)],
    ['Mileage', str(data.vehicleMileage)],
  ]);

  // Finance terms
  drawSectionHeader(ctx, 'Finance Terms');
  const cashPrice = Number(data.cashPrice) || 0;
  const downPayment = Number(data.downPayment) || 0;
  const tax = Number(data.tax) || 0;
  const titleFee = Number(data.titleFee) || 0;
  const docFee = Number(data.docFee) || 0;
  const apr = Number(data.apr) || 0;
  const numPayments = Number(data.numberOfPayments) || 0;
  const freq = str(data.paymentFrequency) as 'Weekly' | 'Bi-weekly' | 'Monthly';
  const principal = cashPrice - downPayment + tax + titleFee + docFee;
  const payment = calculatePayment(principal, apr, numPayments, freq);

  drawFieldRow(ctx, [
    ['Cash Price', fmt(cashPrice)],
    ['Down Payment', fmt(downPayment)],
    ['Sales Tax', fmt(tax)],
  ]);
  drawFieldRow(ctx, [
    ['Title Fee', fmt(titleFee)],
    ['Doc Fee', fmt(docFee)],
    ['Amount Financed', fmt(principal)],
  ]);
  drawFieldRow(ctx, [
    ['APR', `${apr}%`],
    ['# Payments', String(numPayments)],
    ['Frequency', str(data.paymentFrequency)],
  ]);
  drawFieldRow(ctx, [
    ['Payment Amount', fmt(payment)],
    ['First Payment', str(data.firstPaymentDate)],
    ['Due at Signing', fmt(Number(data.dueAtSigning) || 0)],
  ]);

  // Total
  const totalOfPayments = payment * numPayments;
  ctx.y -= 4;
  ensureSpace(ctx, 28);
  ctx.page.drawRectangle({
    x: MARGIN, y: ctx.y - 6, width: CONTENT_W, height: 22,
    color: rgb(0.96, 0.94, 0.88),
  });
  ctx.page.drawText('TOTAL OF PAYMENTS:', {
    x: MARGIN + 8, y: ctx.y, size: 11, font: ctx.fontBold, color: BLACK,
  });
  const totalStr = fmt(totalOfPayments);
  const totalW = ctx.fontBold.widthOfTextAtSize(totalStr, 14);
  ctx.page.drawText(totalStr, {
    x: PAGE_W - MARGIN - totalW - 8, y: ctx.y - 1, size: 14, font: ctx.fontBold, color: GOLD,
  });
  ctx.y -= 30;
}

// ============================================================
// Rental Agreement PDF
// ============================================================
async function buildRental(ctx: Ctx, data: Record<string, unknown>, copyLabel?: string): Promise<void> {
  drawDocHeader(ctx, 'Rental Agreement', 'Vehicle Rental Contract', copyLabel);

  drawSectionHeader(ctx, 'Renter');
  drawFieldRow(ctx, [
    ['Name', str(data.renterName)],
    ['Phone', str(data.renterPhone)],
    ['Email', str(data.renterEmail)],
  ]);
  if (data.renterAddress) drawField(ctx, 'Address', str(data.renterAddress));
  if (data.renterLicense) drawField(ctx, 'Driver License', str(data.renterLicense));

  if (data.coRenterName) {
    drawSectionHeader(ctx, 'Co-Renter');
    drawFieldRow(ctx, [
      ['Name', str(data.coRenterName)],
      ['Phone', str(data.coRenterPhone)],
    ]);
  }

  drawSectionHeader(ctx, 'Vehicle');
  drawFieldRow(ctx, [
    ['Year', str(data.vehicleYear)],
    ['Make', str(data.vehicleMake)],
    ['Model', str(data.vehicleModel)],
  ]);
  drawFieldRow(ctx, [
    ['VIN', str(data.vehicleVin)],
    ['Plate', str(data.vehiclePlate)],
  ]);
  drawFieldRow(ctx, [
    ['Mileage Out', str(data.mileageOut)],
    ['Mileage In', str(data.mileageIn)],
    ['Fuel Out', str(data.fuelLevelOut)],
    ['Fuel In', str(data.fuelLevelIn)],
  ]);

  drawSectionHeader(ctx, 'Rental Terms');
  const rate = Number(data.rentalRate) || 0;
  const period = str(data.rentalPeriod) as 'Daily' | 'Weekly' | 'Monthly';
  const duration = calculateRentalDuration(str(data.rentalStartDate), str(data.rentalEndDate), period);
  const secDep = Number(data.securityDeposit) || 0;
  const mileAllow = Number(data.mileageAllowance) || 0;
  const excessChg = Number(data.excessMileageCharge) || 0;
  const insFee = Number(data.insuranceFee) || 0;
  const addlDriver = Number(data.additionalDriverFee) || 0;
  const taxRate = Number(data.tax) || 0;

  drawFieldRow(ctx, [
    ['Rate', `${fmt(rate)} / ${period}`],
    ['Start', str(data.rentalStartDate)],
    ['End', str(data.rentalEndDate)],
  ]);
  drawFieldRow(ctx, [
    ['Duration', `${duration} ${period.toLowerCase()} period(s)`],
    ['Security Deposit', fmt(secDep)],
    ['Mileage Allowance', mileAllow ? `${mileAllow} mi` : 'Unlimited'],
  ]);
  if (excessChg) drawField(ctx, 'Excess Mileage Charge', `${fmt(excessChg)}/mile`);

  const calc = calculateRentalTotal({
    rentalRate: rate, rentalPeriod: period,
    rentalStartDate: str(data.rentalStartDate), rentalEndDate: str(data.rentalEndDate),
    securityDeposit: secDep, mileageAllowance: mileAllow, excessMileageCharge: excessChg,
    insuranceFee: insFee, additionalDriverFee: addlDriver, tax: taxRate,
  } as never);

  ctx.y -= 4;
  ensureSpace(ctx, 28);
  ctx.page.drawRectangle({
    x: MARGIN, y: ctx.y - 6, width: CONTENT_W, height: 22,
    color: rgb(0.96, 0.94, 0.88),
  });
  ctx.page.drawText('TOTAL DUE:', {
    x: MARGIN + 8, y: ctx.y, size: 11, font: ctx.fontBold, color: BLACK,
  });
  const totalStr = fmt(calc.totalDue);
  const totalW = ctx.fontBold.widthOfTextAtSize(totalStr, 14);
  ctx.page.drawText(totalStr, {
    x: PAGE_W - MARGIN - totalW - 8, y: ctx.y - 1, size: 14, font: ctx.fontBold, color: GOLD,
  });
  ctx.y -= 30;
}

// ============================================================
// Signatures section (shared across all doc types)
// ============================================================
async function drawSignatures(
  ctx: Ctx,
  decoded: CompletedLinkData,
): Promise<void> {
  drawSectionHeader(ctx, 'Signatures');

  // Buyer
  if (decoded.bs) {
    drawText(ctx, 'Buyer Signature:', { size: 8, color: GRAY });
    await embedSignature(ctx, decoded.bs, MARGIN, 200, 60);
    if (decoded.bsd) drawText(ctx, `Date: ${decoded.bsd}`, { size: 8, color: GRAY });
    ctx.y -= 6;
  }

  // Co-Buyer
  if (decoded.cs) {
    drawText(ctx, 'Co-Buyer Signature:', { size: 8, color: GRAY });
    await embedSignature(ctx, decoded.cs, MARGIN, 200, 60);
    if (decoded.csd) drawText(ctx, `Date: ${decoded.csd}`, { size: 8, color: GRAY });
    ctx.y -= 6;
  }

  // Dealer
  if (decoded.ds) {
    drawText(ctx, 'Dealer Signature:', { size: 8, color: GRAY });
    await embedSignature(ctx, decoded.ds, MARGIN, 200, 60);
    if (decoded.dsd) drawText(ctx, `Date: ${decoded.dsd}`, { size: 8, color: GRAY });
    ctx.y -= 6;
  }

  // Acknowledgments
  if (decoded.ack && Object.keys(decoded.ack).length > 0) {
    drawSectionHeader(ctx, 'Buyer Acknowledgments');
    const ackLabels: Record<string, string> = {
      inspected: 'Vehicle Inspected',
      asIs: 'As-Is Condition Understood',
      receivedCopy: 'Copy of Agreement Received',
      allSalesFinal: 'All Sales Final',
      odometerInformed: 'Odometer Disclosure Informed',
      responsibility: 'Responsibility Accepted',
      financingSeparate: 'Financing Terms Separate',
    };
    for (const [key, val] of Object.entries(decoded.ack)) {
      const label = ackLabels[key] || key;
      const check = val ? '[X]' : '[ ]';
      drawText(ctx, `${check}  ${label}`, { size: 9 });
    }
  }
}

// ============================================================
// Main entry point
// ============================================================
export async function buildPdfFromAgreement(
  decoded: CompletedLinkData,
  copyLabel?: string,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);

  const page = doc.addPage([PAGE_W, PAGE_H]);
  const ctx: Ctx = { doc, page, y: PAGE_H - MARGIN, font, fontBold, fontItalic };

  // Merge dealer data + customer data
  const allData: Record<string, unknown> = { ...decoded.dd, ...decoded.cd };

  switch (decoded.s) {
    case 'billOfSale':
      await buildBillOfSale(ctx, allData, copyLabel);
      break;
    case 'financing':
      await buildFinancing(ctx, allData, copyLabel);
      break;
    case 'rental':
      await buildRental(ctx, allData, copyLabel);
      break;
    default:
      drawText(ctx, `Document type: ${decoded.s}`, { size: 14, font: fontBold });
      drawText(ctx, 'PDF preview not available for this document type.', { size: 10 });
  }

  // Signatures
  await drawSignatures(ctx, decoded);

  // Footer on every page
  const pages = doc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const footerText = `${DEALER_NAME} - Page ${i + 1} of ${pages.length}`;
    const footerW = font.widthOfTextAtSize(footerText, 7);
    p.drawText(footerText, {
      x: PAGE_W / 2 - footerW / 2,
      y: 20,
      size: 7,
      color: LIGHT_GRAY,
      font,
    });
  }

  return doc.save();
}
