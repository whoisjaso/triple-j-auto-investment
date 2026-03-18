import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont, PDFImage } from 'pdf-lib';
import { createClient } from '@/lib/supabase/server';
import { decodeCompletedLinkFromUrl, type CompletedLinkData } from './customerPortal';
import { type BillOfSaleData, calculateBillOfSale } from './billOfSale';
import { type ContractData, calculatePayment } from './finance';
import { type RentalData, calculateRentalTotal, calculateRentalDuration, generateRentalSchedule } from './rental';
import { type SignatureData, DEALER_NAME, DEALER_ADDRESS, DEALER_PHONE, DEALER_WEBSITE, DEALER_LICENSE } from './shared';

// ============================================================
// PDF Generator — Pure pdf-lib implementation (no Puppeteer)
//
// FLOW:
//   1. Fetch agreement from Supabase
//   2. Decode compressed completed_link data
//   3. Build PDF programmatically with pdf-lib
//   4. Return PDF buffer
// ============================================================

// Page dimensions (Letter size in points: 612 x 792)
const PW = 612;
const PH = 792;
const M = 25; // ~0.35in margin
const CW = PW - 2 * M; // content width

// Colors
const BLK = rgb(0.1, 0.1, 0.1);
const GRY = rgb(0.35, 0.35, 0.35);
const LGRY = rgb(0.55, 0.55, 0.55);
const GOLD = rgb(0.72, 0.61, 0.37);
const BGRY = rgb(0.95, 0.95, 0.95); // light background
const WHITE = rgb(1, 1, 1);
const RED = rgb(0.6, 0.1, 0.1);

function fmt(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function fmtDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T12:00:00');
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
  } catch { return dateStr; }
}

// ============================================================
// Drawing Context
// ============================================================
interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  serif: PDFFont;
  serifBold: PDFFont;
  serifItalic: PDFFont;
  mono: PDFFont;
}

interface Ctx {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  fonts: Fonts;
}

function newPage(ctx: Ctx): Ctx {
  const page = ctx.doc.addPage([PW, PH]);
  return { ...ctx, page, y: PH - M };
}

function ensureSpace(ctx: Ctx, needed: number): Ctx {
  if (ctx.y - needed < M + 20) return newPage(ctx);
  return ctx;
}

// ============================================================
// Text utilities
// ============================================================
function wrapText(text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] {
  if (!text) return [''];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, fontSize) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

function textWidth(text: string, font: PDFFont, size: number): number {
  return font.widthOfTextAtSize(text || '', size);
}

// ============================================================
// Drawing primitives
// ============================================================
function drawText(ctx: Ctx, text: string, x: number, opts: {
  font?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; maxWidth?: number;
} = {}): Ctx {
  const font = opts.font || ctx.fonts.regular;
  const size = opts.size || 9;
  const color = opts.color || BLK;
  const mw = opts.maxWidth || CW;

  const lines = wrapText(text || '', mw, font, size);
  const lineHeight = size * 1.4;

  for (const line of lines) {
    ctx = ensureSpace(ctx, lineHeight);
    ctx.page.drawText(line, { x: M + x, y: ctx.y, size, font, color });
    ctx.y -= lineHeight;
  }
  return ctx;
}

function drawCenteredText(ctx: Ctx, text: string, opts: {
  font?: PDFFont; size?: number; color?: ReturnType<typeof rgb>;
} = {}): Ctx {
  const font = opts.font || ctx.fonts.regular;
  const size = opts.size || 9;
  const color = opts.color || BLK;
  const w = textWidth(text, font, size);
  const x = (PW - w) / 2;
  ctx = ensureSpace(ctx, size * 1.4);
  ctx.page.drawText(text, { x, y: ctx.y, size, font, color });
  ctx.y -= size * 1.4;
  return ctx;
}

function drawLine(ctx: Ctx, x1: number, x2: number, opts: {
  color?: ReturnType<typeof rgb>; thickness?: number;
} = {}): Ctx {
  ctx.page.drawLine({
    start: { x: M + x1, y: ctx.y },
    end: { x: M + x2, y: ctx.y },
    thickness: opts.thickness || 0.5,
    color: opts.color || rgb(0.8, 0.8, 0.8),
  });
  return ctx;
}

function drawRect(ctx: Ctx, x: number, width: number, height: number, opts: {
  color?: ReturnType<typeof rgb>; borderColor?: ReturnType<typeof rgb>;
} = {}): void {
  ctx.page.drawRectangle({
    x: M + x,
    y: ctx.y - height,
    width,
    height,
    color: opts.color,
    borderColor: opts.borderColor,
    borderWidth: opts.borderColor ? 0.5 : 0,
  });
}

// ============================================================
// Composite drawing functions
// ============================================================
function drawHeader(ctx: Ctx, title: string, subtitle: string, copyLabel?: string): Ctx {
  // Copy label
  if (copyLabel) {
    ctx = drawCenteredText(ctx, `— ${copyLabel} —`, { font: ctx.fonts.bold, size: 7, color: LGRY });
    ctx.y -= 4;
  }

  // Company name
  ctx = drawCenteredText(ctx, DEALER_NAME.toUpperCase(), { font: ctx.fonts.serifBold, size: 16, color: GOLD });
  ctx.y -= 2;
  ctx = drawCenteredText(ctx, DEALER_ADDRESS, { font: ctx.fonts.regular, size: 7.5, color: GRY });
  ctx = drawCenteredText(ctx, `${DEALER_PHONE} | ${DEALER_WEBSITE}`, { font: ctx.fonts.regular, size: 7.5, color: GRY });
  ctx.y -= 8;

  // Document title
  ctx = drawCenteredText(ctx, title.toUpperCase(), { font: ctx.fonts.serifBold, size: 18, color: BLK });
  if (subtitle) {
    ctx = drawCenteredText(ctx, subtitle, { font: ctx.fonts.regular, size: 7.5, color: LGRY });
  }
  ctx.y -= 4;

  // Divider
  ctx = drawLine(ctx, 0, CW, { color: rgb(0.85, 0.85, 0.85), thickness: 1 });
  ctx.y -= 12;

  return ctx;
}

function drawSectionHeading(ctx: Ctx, text: string): Ctx {
  ctx = ensureSpace(ctx, 20);
  ctx.y -= 6;
  ctx.page.drawText(text.toUpperCase(), {
    x: M,
    y: ctx.y,
    size: 7,
    font: ctx.fonts.bold,
    color: LGRY,
  });
  ctx.y -= 14;
  return ctx;
}

function drawLabelValue(ctx: Ctx, label: string, value: string, x: number = 0, labelWidth: number = 120): Ctx {
  const size = 8.5;
  ctx.page.drawText(label, { x: M + x, y: ctx.y, size: 6.5, font: ctx.fonts.bold, color: LGRY });
  ctx.y -= 11;
  ctx.page.drawText(value || '—', { x: M + x, y: ctx.y, size, font: ctx.fonts.regular, color: BLK });
  ctx.y -= 14;
  return ctx;
}

function drawFieldRow(ctx: Ctx, fields: { label: string; value: string; width: number }[]): Ctx {
  ctx = ensureSpace(ctx, 28);
  let x = 0;
  // Labels
  for (const f of fields) {
    ctx.page.drawText(f.label.toUpperCase(), { x: M + x, y: ctx.y, size: 6, font: ctx.fonts.bold, color: LGRY });
    x += f.width;
  }
  ctx.y -= 11;
  // Values
  x = 0;
  for (const f of fields) {
    const val = f.value || '—';
    const truncated = textWidth(val, ctx.fonts.regular, 8.5) > f.width - 4
      ? val.substring(0, Math.floor(f.width / 4.5)) + '…'
      : val;
    ctx.page.drawText(truncated, { x: M + x, y: ctx.y, size: 8.5, font: ctx.fonts.regular, color: BLK });
    x += f.width;
  }
  ctx.y -= 14;
  return ctx;
}

function drawPartyInfo(ctx: Ctx, heading: string, name: string, address: string, phone: string, email: string, license?: string, x: number = 0, width: number = CW / 2 - 10): Ctx {
  ctx = ensureSpace(ctx, 80);
  const startY = ctx.y;

  ctx.page.drawText(heading.toUpperCase(), { x: M + x, y: ctx.y, size: 6.5, font: ctx.fonts.bold, color: LGRY });
  ctx.y -= 14;
  ctx.page.drawText(name || '—', { x: M + x, y: ctx.y, size: 12, font: ctx.fonts.serif, color: BLK });
  ctx.y -= 14;
  if (address) {
    ctx.page.drawText(address, { x: M + x, y: ctx.y, size: 8, font: ctx.fonts.regular, color: GRY });
    ctx.y -= 11;
  }
  if (phone) {
    ctx.page.drawText(phone, { x: M + x, y: ctx.y, size: 8, font: ctx.fonts.regular, color: GRY });
    ctx.y -= 11;
  }
  if (email) {
    ctx.page.drawText(email, { x: M + x, y: ctx.y, size: 8, font: ctx.fonts.regular, color: GRY });
    ctx.y -= 11;
  }
  if (license) {
    ctx.page.drawText(`DL# ${license}`, { x: M + x, y: ctx.y, size: 8, font: ctx.fonts.mono, color: GRY });
    ctx.y -= 11;
  }

  return ctx;
}

function drawTwoParties(ctx: Ctx, left: { heading: string; name: string; address: string; phone: string; email: string; license?: string }, right: { heading: string; name: string; address: string; phone: string; email: string; license?: string }): Ctx {
  const colW = CW / 2 - 10;
  const savedY = ctx.y;

  // Draw left
  ctx = drawPartyInfo(ctx, left.heading, left.name, left.address, left.phone, left.email, left.license, 0, colW);
  const leftEndY = ctx.y;

  // Draw right (reset Y to same starting point)
  ctx.y = savedY;
  ctx = drawPartyInfo(ctx, right.heading, right.name, right.address, right.phone, right.email, right.license, CW / 2 + 10, colW);
  const rightEndY = ctx.y;

  ctx.y = Math.min(leftEndY, rightEndY);
  ctx.y -= 6;
  return ctx;
}

function drawSimpleTable(ctx: Ctx, headers: string[], rows: string[][], colWidths: number[]): Ctx {
  const headerSize = 7;
  const cellSize = 8;
  const rowH = 18;
  const headerH = 16;

  ctx = ensureSpace(ctx, headerH + rowH * rows.length + 10);

  // Header background
  drawRect(ctx, 0, CW, headerH, { color: BGRY });

  // Header text
  let x = 0;
  for (let i = 0; i < headers.length; i++) {
    ctx.page.drawText(headers[i].toUpperCase(), {
      x: M + x + 4,
      y: ctx.y - 11,
      size: headerSize,
      font: ctx.fonts.bold,
      color: GRY,
    });
    x += colWidths[i];
  }
  ctx.y -= headerH;

  // Divider
  ctx = drawLine(ctx, 0, CW, { color: rgb(0.8, 0.8, 0.8) });

  // Rows
  for (const row of rows) {
    ctx = ensureSpace(ctx, rowH);
    x = 0;
    for (let i = 0; i < row.length; i++) {
      const val = row[i] || '';
      const isVin = headers[i]?.toLowerCase().includes('vin');
      const font = isVin ? ctx.fonts.mono : ctx.fonts.regular;
      const displayVal = textWidth(val, font, cellSize) > colWidths[i] - 8
        ? val.substring(0, Math.floor((colWidths[i] - 8) / 4)) + '…'
        : val;
      ctx.page.drawText(displayVal, {
        x: M + x + 4,
        y: ctx.y - 12,
        size: cellSize,
        font,
        color: BLK,
      });
      x += colWidths[i];
    }
    ctx.y -= rowH;
    ctx = drawLine(ctx, 0, CW, { color: rgb(0.9, 0.9, 0.9) });
  }

  ctx.y -= 8;
  return ctx;
}

function drawSummaryBoxes(ctx: Ctx, boxes: { title: string; desc: string; value: string }[]): Ctx {
  const boxW = (CW - (boxes.length - 1) * 6) / boxes.length;
  const boxH = 65;

  ctx = ensureSpace(ctx, boxH + 10);

  for (let i = 0; i < boxes.length; i++) {
    const bx = i * (boxW + 6);
    drawRect(ctx, bx, boxW, boxH, { color: BGRY });

    // Title
    ctx.page.drawText(boxes[i].title.toUpperCase(), {
      x: M + bx + 6,
      y: ctx.y - 12,
      size: 6.5,
      font: ctx.fonts.bold,
      color: BLK,
    });

    // Description
    const descLines = wrapText(boxes[i].desc, boxW - 12, ctx.fonts.regular, 6);
    let dy = 22;
    for (const line of descLines.slice(0, 2)) {
      ctx.page.drawText(line, {
        x: M + bx + 6,
        y: ctx.y - dy,
        size: 6,
        font: ctx.fonts.regular,
        color: LGRY,
      });
      dy += 8;
    }

    // Value
    ctx.page.drawText(boxes[i].value, {
      x: M + bx + 6,
      y: ctx.y - boxH + 8,
      size: 14,
      font: ctx.fonts.serifBold,
      color: BLK,
    });
  }

  ctx.y -= boxH + 8;
  return ctx;
}

function drawItemLine(ctx: Ctx, label: string, value: string, opts: {
  indent?: boolean; bold?: boolean; large?: boolean; color?: ReturnType<typeof rgb>;
  topBorder?: boolean; bottomBorder?: boolean;
} = {}): Ctx {
  const size = opts.large ? 11 : 8.5;
  const font = opts.bold ? ctx.fonts.bold : ctx.fonts.regular;
  const color = opts.color || BLK;
  const indent = opts.indent ? 16 : 0;
  const lineH = opts.large ? 18 : 14;

  ctx = ensureSpace(ctx, lineH + 4);

  if (opts.topBorder) {
    ctx = drawLine(ctx, 0, CW / 2 - 10, { color: rgb(0.8, 0.8, 0.8) });
    ctx.y -= 4;
  }

  ctx.page.drawText(label, { x: M + indent, y: ctx.y, size, font, color });
  const valW = textWidth(value, opts.bold ? ctx.fonts.serifBold : ctx.fonts.regular, size);
  ctx.page.drawText(value, {
    x: M + CW / 2 - 10 - valW,
    y: ctx.y,
    size,
    font: opts.bold ? ctx.fonts.serifBold : ctx.fonts.regular,
    color: opts.color || BLK,
  });
  ctx.y -= lineH;

  if (opts.bottomBorder) {
    ctx = drawLine(ctx, 0, CW / 2 - 10, { color: rgb(0.8, 0.8, 0.8) });
    ctx.y -= 4;
  }

  return ctx;
}

function drawTextBlock(ctx: Ctx, text: string, opts: {
  size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; maxWidth?: number; lineHeight?: number;
} = {}): Ctx {
  const size = opts.size || 7;
  const font = opts.font || ctx.fonts.regular;
  const color = opts.color || GRY;
  const mw = opts.maxWidth || CW;
  const lh = opts.lineHeight || size * 1.5;

  const lines = wrapText(text, mw, font, size);
  for (const line of lines) {
    ctx = ensureSpace(ctx, lh);
    ctx.page.drawText(line, { x: M, y: ctx.y, size, font, color });
    ctx.y -= lh;
  }
  return ctx;
}

function drawBoldLeadTextBlock(ctx: Ctx, boldPart: string, restPart: string, opts: {
  size?: number; maxWidth?: number;
} = {}): Ctx {
  const size = opts.size || 7;
  const mw = opts.maxWidth || CW;
  const lh = size * 1.5;

  // Combine and wrap the full text, but render boldPart in bold
  const fullText = `${boldPart} ${restPart}`;
  const lines = wrapText(fullText, mw, ctx.fonts.regular, size);

  let boldCharsRemaining = boldPart.length;

  for (const line of lines) {
    ctx = ensureSpace(ctx, lh);

    if (boldCharsRemaining > 0) {
      // This line may contain some bold text
      const boldEndInLine = Math.min(boldCharsRemaining, line.length);
      const boldText = line.substring(0, boldEndInLine);
      const normalText = line.substring(boldEndInLine);

      if (boldText) {
        ctx.page.drawText(boldText, { x: M, y: ctx.y, size, font: ctx.fonts.bold, color: GRY });
      }
      if (normalText) {
        const boldWidth = textWidth(boldText, ctx.fonts.bold, size);
        ctx.page.drawText(normalText, { x: M + boldWidth, y: ctx.y, size, font: ctx.fonts.regular, color: GRY });
      }
      boldCharsRemaining -= boldEndInLine;
      // Account for space between words
      if (boldCharsRemaining > 0) boldCharsRemaining--;
    } else {
      ctx.page.drawText(line, { x: M, y: ctx.y, size, font: ctx.fonts.regular, color: GRY });
    }

    ctx.y -= lh;
  }

  return ctx;
}

async function drawSignatureLine(ctx: Ctx, label: string, sigDataUrl?: string, sigDate?: string, printedName?: string): Promise<Ctx> {
  ctx = ensureSpace(ctx, 60);

  const lineY = ctx.y - 35;

  // Try to embed signature image
  if (sigDataUrl && sigDataUrl.startsWith('data:image/')) {
    try {
      const base64 = sigDataUrl.split(',')[1];
      if (base64) {
        const bytes = Uint8Array.from(Buffer.from(base64, 'base64'));
        let img: PDFImage;
        if (sigDataUrl.includes('image/png')) {
          img = await ctx.doc.embedPng(bytes);
        } else {
          img = await ctx.doc.embedJpg(bytes);
        }
        const scale = Math.min(150 / img.width, 28 / img.height);
        ctx.page.drawImage(img, {
          x: M + 4,
          y: lineY + 2,
          width: img.width * scale,
          height: img.height * scale,
        });
      }
    } catch (e) {
      // Signature image failed to embed — skip silently
    }
  }

  // Signature line
  ctx.page.drawLine({
    start: { x: M, y: lineY },
    end: { x: M + CW / 2 - 20, y: lineY },
    thickness: 0.75,
    color: rgb(0.6, 0.6, 0.6),
  });

  // Date on right side of line
  if (sigDate) {
    const dateStr = fmtDate(sigDate) || sigDate;
    const dateW = textWidth(dateStr, ctx.fonts.regular, 7);
    ctx.page.drawText(dateStr, {
      x: M + CW / 2 - 20 - dateW - 2,
      y: lineY + 3,
      size: 7,
      font: ctx.fonts.regular,
      color: LGRY,
    });
  }

  // Label below line
  ctx.page.drawText(label.toUpperCase(), {
    x: M,
    y: lineY - 10,
    size: 6,
    font: ctx.fonts.bold,
    color: LGRY,
  });

  // Printed name
  if (printedName) {
    ctx.page.drawText(printedName, {
      x: M,
      y: lineY - 19,
      size: 7,
      font: ctx.fonts.regular,
      color: GRY,
    });
  }

  ctx.y = lineY - 28;
  return ctx;
}

async function drawTwoSignatures(ctx: Ctx, left: { label: string; sig?: string; date?: string; name?: string }, right: { label: string; sig?: string; date?: string; name?: string }): Promise<Ctx> {
  ctx = ensureSpace(ctx, 60);
  const savedY = ctx.y;
  const halfW = CW / 2 - 10;
  const lineY = ctx.y - 35;

  // Left signature
  if (left.sig && left.sig.startsWith('data:image/')) {
    try {
      const base64 = left.sig.split(',')[1];
      if (base64) {
        const bytes = Uint8Array.from(Buffer.from(base64, 'base64'));
        const img = left.sig.includes('image/png')
          ? await ctx.doc.embedPng(bytes)
          : await ctx.doc.embedJpg(bytes);
        const scale = Math.min(130 / img.width, 26 / img.height);
        ctx.page.drawImage(img, { x: M + 4, y: lineY + 2, width: img.width * scale, height: img.height * scale });
      }
    } catch {}
  }

  ctx.page.drawLine({ start: { x: M, y: lineY }, end: { x: M + halfW - 10, y: lineY }, thickness: 0.75, color: rgb(0.6, 0.6, 0.6) });
  if (left.date) {
    const ds = fmtDate(left.date) || left.date;
    ctx.page.drawText(ds, { x: M + halfW - 10 - textWidth(ds, ctx.fonts.regular, 7) - 2, y: lineY + 3, size: 7, font: ctx.fonts.regular, color: LGRY });
  }
  ctx.page.drawText(left.label.toUpperCase(), { x: M, y: lineY - 10, size: 6, font: ctx.fonts.bold, color: LGRY });
  if (left.name) ctx.page.drawText(left.name, { x: M, y: lineY - 19, size: 7, font: ctx.fonts.regular, color: GRY });

  // Right signature
  const rx = M + CW / 2 + 10;
  if (right.sig && right.sig.startsWith('data:image/')) {
    try {
      const base64 = right.sig.split(',')[1];
      if (base64) {
        const bytes = Uint8Array.from(Buffer.from(base64, 'base64'));
        const img = right.sig.includes('image/png')
          ? await ctx.doc.embedPng(bytes)
          : await ctx.doc.embedJpg(bytes);
        const scale = Math.min(130 / img.width, 26 / img.height);
        ctx.page.drawImage(img, { x: rx + 4, y: lineY + 2, width: img.width * scale, height: img.height * scale });
      }
    } catch {}
  }

  ctx.page.drawLine({ start: { x: rx, y: lineY }, end: { x: rx + halfW - 10, y: lineY }, thickness: 0.75, color: rgb(0.6, 0.6, 0.6) });
  if (right.date) {
    const ds = fmtDate(right.date) || right.date;
    ctx.page.drawText(ds, { x: rx + halfW - 10 - textWidth(ds, ctx.fonts.regular, 7) - 2, y: lineY + 3, size: 7, font: ctx.fonts.regular, color: LGRY });
  }
  ctx.page.drawText(right.label.toUpperCase(), { x: rx, y: lineY - 10, size: 6, font: ctx.fonts.bold, color: LGRY });
  if (right.name) ctx.page.drawText(right.name, { x: rx, y: lineY - 19, size: 7, font: ctx.fonts.regular, color: GRY });

  ctx.y = lineY - 28;
  return ctx;
}

async function drawIdPhoto(ctx: Ctx, photoDataUrl: string, name: string): Promise<Ctx> {
  if (!photoDataUrl || !photoDataUrl.startsWith('data:image/')) return ctx;

  ctx = ensureSpace(ctx, 80);

  try {
    const base64 = photoDataUrl.split(',')[1];
    if (!base64) return ctx;
    const bytes = Uint8Array.from(Buffer.from(base64, 'base64'));
    const img = photoDataUrl.includes('image/png')
      ? await ctx.doc.embedPng(bytes)
      : await ctx.doc.embedJpg(bytes);
    const maxH = 65;
    const maxW = 90;
    const scale = Math.min(maxW / img.width, maxH / img.height);
    ctx.page.drawImage(img, { x: M, y: ctx.y - img.height * scale, width: img.width * scale, height: img.height * scale });

    ctx.page.drawText('CUSTOMER ID ON FILE', { x: M + maxW + 12, y: ctx.y - 10, size: 6.5, font: ctx.fonts.bold, color: LGRY });
    ctx.page.drawText(name || '', { x: M + maxW + 12, y: ctx.y - 22, size: 9, font: ctx.fonts.regular, color: BLK });

    ctx.y -= Math.max(maxH, img.height * scale) + 12;
  } catch {
    // Photo failed to embed — skip
  }

  return ctx;
}

// ============================================================
// BILL OF SALE PDF
// ============================================================
async function buildBillOfSale(ctx: Ctx, data: BillOfSaleData, sigs: SignatureData, ack: Record<string, boolean>, copyLabel: string): Promise<Ctx> {
  const calc = calculateBillOfSale(data);

  // Page 1: Header + Parties + Vehicle
  ctx = drawHeader(ctx, 'Bill of Sale', 'Vehicle Purchase Agreement & Transfer of Ownership', copyLabel);

  // Date & Stock
  if (data.saleDate || data.stockNumber) {
    const parts: string[] = [];
    if (data.saleDate) parts.push(`Date: ${fmtDate(data.saleDate)}`);
    if (data.stockNumber) parts.push(`Stock #: ${data.stockNumber}`);
    ctx = drawCenteredText(ctx, parts.join('    |    '), { font: ctx.fonts.regular, size: 7.5, color: GRY });
    ctx.y -= 6;
  }

  // Seller
  ctx = drawSectionHeading(ctx, 'Seller (Dealer)');
  ctx.page.drawText(DEALER_NAME, { x: M, y: ctx.y, size: 10, font: ctx.fonts.serifBold, color: BLK });
  ctx.y -= 12;
  ctx.page.drawText(`${DEALER_ADDRESS}  |  ${DEALER_PHONE}  |  Texas Dealer License: ${DEALER_LICENSE}`, { x: M, y: ctx.y, size: 7.5, font: ctx.fonts.regular, color: GRY });
  ctx.y -= 16;

  // Buyer / Co-Buyer
  const buyerAddr = [data.buyerAddress, data.buyerCity, data.buyerState, data.buyerZip].filter(Boolean).join(', ');
  const coBuyerAddr = [data.coBuyerAddress, data.coBuyerCity, data.coBuyerState, data.coBuyerZip].filter(Boolean).join(', ');
  ctx = drawTwoParties(ctx,
    { heading: 'Buyer Information', name: data.buyerName, address: buyerAddr, phone: data.buyerPhone, email: data.buyerEmail, license: data.buyerLicense ? `${data.buyerLicense}${data.buyerLicenseState ? ' — ' + data.buyerLicenseState : ''}` : undefined },
    { heading: 'Co-Buyer Information', name: data.coBuyerName, address: coBuyerAddr, phone: data.coBuyerPhone, email: data.coBuyerEmail, license: data.coBuyerLicense ? `${data.coBuyerLicense}${data.coBuyerLicenseState ? ' — ' + data.coBuyerLicenseState : ''}` : undefined },
  );

  // Vehicle
  ctx = drawSectionHeading(ctx, 'Vehicle Description');
  ctx = drawSimpleTable(ctx,
    ['Year', 'Make', 'Model', 'Trim', 'Color', 'Body', 'Mileage'],
    [[data.vehicleYear, data.vehicleMake, data.vehicleModel, data.vehicleTrim, data.vehicleColor, data.vehicleBodyStyle, data.vehicleMileage]],
    [55, 80, 80, 70, 65, 65, CW - 415],
  );
  ctx = drawFieldRow(ctx, [
    { label: 'VIN', value: (data.vehicleVin || '').toUpperCase(), width: CW / 2 },
    { label: 'License Plate', value: (data.vehiclePlate || '').toUpperCase(), width: CW / 2 },
  ]);

  // Page 2: Financial Details
  ctx = newPage(ctx);
  ctx = drawSectionHeading(ctx, 'Sale Summary');
  ctx = drawSummaryBoxes(ctx, [
    { title: 'Vehicle Price', desc: 'Agreed purchase price.', value: fmt(data.salePrice) },
    { title: 'Net Trade-In', desc: 'Trade-in credit after payoff.', value: fmt(calc.netTradeIn) },
    { title: 'Fees & Tax', desc: 'Taxes, title, registration, fees.', value: fmt(calc.feesSubtotal) },
    { title: 'Total Due', desc: 'Total amount due from buyer.', value: fmt(calc.totalDue) },
  ]);

  ctx = drawSectionHeading(ctx, 'Itemization of Sale Price');
  ctx = drawItemLine(ctx, '1. Vehicle Sale Price', fmt(data.salePrice));
  if (data.tradeInAllowance > 0 || data.tradeInPayoff > 0) {
    ctx = drawItemLine(ctx, 'a. Trade-In Allowance', `- ${fmt(data.tradeInAllowance)}`, { indent: true, color: RED });
    ctx = drawItemLine(ctx, 'b. Trade-In Payoff Owed', `+ ${fmt(data.tradeInPayoff)}`, { indent: true });
    ctx = drawItemLine(ctx, 'c. Net Trade-In Credit', `- ${fmt(calc.netTradeIn)}`, { indent: true, color: RED });
  }
  ctx = drawItemLine(ctx, '2. Balance After Trade', fmt(calc.balanceAfterTrade), { bold: true, topBorder: true });
  ctx = drawItemLine(ctx, 'a. Sales Tax', fmt(data.tax), { indent: true });
  ctx = drawItemLine(ctx, 'b. Title Fee', fmt(data.titleFee), { indent: true });
  ctx = drawItemLine(ctx, 'c. Documentary Fee', fmt(data.docFee), { indent: true });
  ctx = drawItemLine(ctx, 'd. Registration Fee', fmt(data.registrationFee), { indent: true });
  if (data.otherFees > 0) {
    ctx = drawItemLine(ctx, `e. ${data.otherFeesDescription || 'Other Fees'}`, fmt(data.otherFees), { indent: true });
  }
  ctx = drawItemLine(ctx, '3. Total Amount Due', fmt(calc.totalDue), { bold: true, large: true, topBorder: true });

  const paymentDisplay = data.paymentMethod === 'Other' ? data.paymentMethodOther : data.paymentMethod;
  ctx = drawItemLine(ctx, 'Payment Method', paymentDisplay || '', { indent: false });

  ctx.y -= 8;

  // Condition
  if (data.conditionType === 'as_is') {
    ctx = drawSectionHeading(ctx, 'As Is — No Dealer Warranty');
    ctx = drawTextBlock(ctx, 'THE VEHICLE IS SOLD "AS IS." The seller, Triple J Auto Investment LLC, hereby disclaims all warranties, either express or implied, including any implied warranties of merchantability and fitness for a particular purpose. The buyer has inspected the vehicle and accepts it in its present condition. The seller assumes no responsibility for any repairs regardless of any oral statements about the vehicle.', { size: 7.5 });
  } else {
    ctx = drawSectionHeading(ctx, 'Limited Warranty');
    ctx = drawTextBlock(ctx, `WARRANTY PERIOD: ${data.warrantyDuration || '_______________'}`, { size: 7.5, font: ctx.fonts.bold });
    ctx = drawTextBlock(ctx, `COVERAGE: ${data.warrantyDescription || 'As described in separate warranty document.'}`, { size: 7.5 });
  }

  ctx.y -= 4;
  ctx = drawSectionHeading(ctx, 'No Refund Policy');
  ctx = drawTextBlock(ctx, 'ALL SALES ARE FINAL. The Buyer acknowledges that no refunds, returns, or exchanges will be accepted under any circumstances. All payments made are strictly non-refundable. The Buyer waives any right to rescind this transaction after signing.', { size: 7.5, color: RED });

  // Trade-in details
  if (data.tradeInDescription || data.tradeInVin) {
    ctx.y -= 6;
    ctx = drawSectionHeading(ctx, 'Trade-In Vehicle');
    ctx = drawFieldRow(ctx, [
      { label: 'Description', value: data.tradeInDescription, width: CW / 3 },
      { label: 'VIN', value: data.tradeInVin, width: CW / 3 },
      { label: 'Allowance / Payoff', value: `${fmt(data.tradeInAllowance)} / ${fmt(data.tradeInPayoff)}`, width: CW / 3 },
    ]);
  }

  // Odometer
  ctx.y -= 4;
  ctx = drawSectionHeading(ctx, 'Federal Odometer Disclosure Statement');
  const odometerLabel = data.odometerStatus === 'actual' ? 'reflects the actual mileage of the vehicle'
    : data.odometerStatus === 'exceeds' ? "exceeds the odometer's mechanical limits"
    : 'IS NOT the actual mileage. ODOMETER DISCREPANCY.';
  ctx = drawTextBlock(ctx, `In accordance with federal law (49 U.S.C. § 32705), the seller hereby discloses that the odometer of the vehicle reads ${data.odometerReading || '___________'} miles, and to the best of the seller's knowledge, said odometer reading ${odometerLabel}.`, { size: 7.5 });
  ctx = drawFieldRow(ctx, [
    { label: 'Odometer Reading', value: data.odometerReading || '—', width: CW / 3 },
    { label: 'Status', value: data.odometerStatus === 'actual' ? 'Actual Mileage' : data.odometerStatus === 'exceeds' ? 'Exceeds Mechanical Limits' : 'NOT ACTUAL', width: CW / 3 },
    { label: 'Vehicle', value: `${data.vehicleYear} ${data.vehicleMake} ${data.vehicleModel}`, width: CW / 3 },
  ]);

  // Page 3: Terms + Signatures
  ctx = newPage(ctx);
  ctx = drawSectionHeading(ctx, 'Terms & Conditions');
  const bosTerms = [
    ['TRANSFER OF TITLE:', 'The Seller agrees to transfer title and all rights of ownership of the above-described vehicle to the Buyer upon receipt of full payment. The Seller warrants that they hold clear title to the vehicle, free of all liens and encumbrances, except as otherwise noted herein.'],
    ['REPRESENTATIONS:', 'The Buyer acknowledges that they have had the opportunity to inspect the vehicle and have accepted it in its current condition. The Buyer has not relied on any representations made by the Seller other than those expressly set forth in this Bill of Sale.'],
    ['GOVERNING LAW:', 'This Bill of Sale shall be governed by and construed in accordance with the laws of the State of Texas. Any disputes arising under this agreement shall be resolved in Harris County, Texas.'],
    ['RISK OF LOSS:', 'Risk of loss and damage to the vehicle transfers to the Buyer upon execution of this Bill of Sale and delivery of the vehicle. The Buyer is responsible for obtaining insurance coverage effective immediately upon taking possession.'],
    ['ENTIRE AGREEMENT:', 'This Bill of Sale constitutes the entire agreement between the parties. No modifications shall be binding unless made in writing and signed by both parties. This agreement is binding upon the heirs, executors, administrators, and assigns of both parties.'],
  ];
  for (const [title, body] of bosTerms) {
    ctx = drawBoldLeadTextBlock(ctx, title, body, { size: 7 });
    ctx.y -= 3;
  }

  // Customer ID Photo
  ctx.y -= 8;
  ctx = await drawIdPhoto(ctx, sigs.buyerIdPhoto, data.buyerName);

  // Signatures
  ctx.y -= 6;
  ctx = drawCenteredText(ctx, 'By signing below, all parties acknowledge and agree to the terms set forth in this Bill of Sale.', { font: ctx.fonts.serifBold, size: 8, color: BLK });
  ctx.y -= 8;

  ctx = await drawTwoSignatures(ctx,
    { label: 'Buyer Signature', sig: sigs.buyerSignature, date: sigs.buyerSignatureDate, name: data.buyerName },
    { label: 'Co-Buyer Signature', sig: sigs.coBuyerSignature, date: sigs.coBuyerSignatureDate, name: data.coBuyerName },
  );
  ctx.y -= 8;
  ctx = await drawTwoSignatures(ctx,
    { label: `Seller — Triple J Auto — DL# ${DEALER_LICENSE}`, sig: sigs.dealerSignature, date: sigs.dealerSignatureDate },
    { label: 'Witness / Notary' },
  );

  // Page 4: Buyer Acknowledgment
  ctx = newPage(ctx);
  ctx = drawCenteredText(ctx, 'BUYER ACKNOWLEDGMENT', { font: ctx.fonts.serifBold, size: 14, color: BLK });
  ctx = drawCenteredText(ctx, 'Retain this copy for your records', { size: 7, color: LGRY });
  ctx.y -= 12;

  // Summary box
  ctx = drawFieldRow(ctx, [
    { label: 'Buyer', value: data.buyerName, width: CW / 2 },
    { label: 'Date of Sale', value: fmtDate(data.saleDate), width: CW / 2 },
  ]);
  ctx = drawFieldRow(ctx, [
    { label: 'Vehicle', value: `${data.vehicleYear} ${data.vehicleMake} ${data.vehicleModel} ${data.vehicleTrim}`, width: CW / 3 },
    { label: 'VIN', value: data.vehicleVin, width: CW / 3 },
    { label: 'Odometer', value: `${data.odometerReading} mi`, width: CW / 3 },
  ]);
  ctx = drawFieldRow(ctx, [
    { label: 'Sale Price', value: fmt(data.salePrice), width: CW / 3 },
    { label: 'Fees & Tax', value: fmt(calc.feesSubtotal), width: CW / 3 },
    { label: 'Total Paid', value: fmt(calc.totalDue), width: CW / 3 },
  ]);

  ctx.y -= 8;
  ctx.page.drawText('I, the undersigned Buyer, acknowledge:', { x: M, y: ctx.y, size: 8, font: ctx.fonts.bold, color: BLK });
  ctx.y -= 14;

  const ackItems = [
    { key: 'inspected', text: 'I have inspected the vehicle and accept it in its present condition.' },
    { key: 'asIs', text: `I understand this vehicle is sold ${data.conditionType === 'as_is' ? '"AS IS" with NO dealer warranty' : 'with a LIMITED WARRANTY as described'}.` },
    { key: 'receivedCopy', text: 'I have received a copy of this Bill of Sale for my records.' },
    { key: 'allSalesFinal', text: 'I understand ALL SALES ARE FINAL — no refunds, returns, or exchanges.' },
    { key: 'odometerInformed', text: 'I have been informed of the odometer reading and its accuracy status.' },
    { key: 'responsibility', text: 'I accept full responsibility for the vehicle upon delivery, including insurance and registration.' },
  ];
  if (data.paymentMethod === 'Financing') {
    ackItems.push({ key: 'financingSeparate', text: 'I understand this purchase is financed under a separate Retail Installment Contract.' });
  }

  for (const item of ackItems) {
    ctx = ensureSpace(ctx, 14);
    const checked = ack?.[item.key] ? '\u2611' : '\u2610';
    // Use a simple [X] or [ ] since standard fonts don't have checkbox glyphs
    const checkStr = ack?.[item.key] ? '[X]' : '[ ]';
    ctx.page.drawText(checkStr, { x: M + 8, y: ctx.y, size: 8, font: ctx.fonts.mono, color: BLK });
    const textLines = wrapText(item.text, CW - 40, ctx.fonts.regular, 7.5);
    for (const line of textLines) {
      ctx.page.drawText(line, { x: M + 30, y: ctx.y, size: 7.5, font: ctx.fonts.regular, color: GRY });
      ctx.y -= 11;
    }
    ctx.y -= 3;
  }

  // Acknowledgment signatures
  ctx.y -= 8;
  ctx = await drawTwoSignatures(ctx,
    { label: 'Buyer Acknowledgment', sig: sigs.buyerSignature, date: sigs.buyerSignatureDate },
    { label: 'Dealer Copy', sig: sigs.dealerSignature, date: sigs.dealerSignatureDate },
  );

  return ctx;
}

// ============================================================
// FINANCING CONTRACT PDF
// ============================================================
async function buildFinancing(ctx: Ctx, data: ContractData, sigs: SignatureData, copyLabel: string): Promise<Ctx> {
  const totalCashPrice = data.cashPrice + data.tax + data.titleFee + data.docFee;
  const amountFinanced = Math.max(0, totalCashPrice - data.downPayment);
  const paymentAmount = calculatePayment(amountFinanced, data.apr, data.numberOfPayments, data.paymentFrequency);
  const totalOfPayments = paymentAmount * data.numberOfPayments;
  const financeCharge = totalOfPayments - amountFinanced;

  // Generate schedule
  const schedule: { num: number; date: string; amount: number }[] = [];
  if (data.firstPaymentDate && data.numberOfPayments > 0 && paymentAmount > 0) {
    let cd = new Date(data.firstPaymentDate + 'T12:00:00');
    for (let i = 1; i <= data.numberOfPayments; i++) {
      schedule.push({ num: i, date: fmtDate(cd.toISOString().split('T')[0]), amount: paymentAmount });
      if (data.paymentFrequency === 'Weekly') cd.setDate(cd.getDate() + 7);
      else if (data.paymentFrequency === 'Bi-weekly') cd.setDate(cd.getDate() + 14);
      else cd.setMonth(cd.getMonth() + 1);
    }
  }
  const estCompletion = schedule.length > 0 ? schedule[schedule.length - 1].date : 'N/A';

  // Page 1
  ctx = drawHeader(ctx, 'Retail Installment Contract', 'Security Agreement & Disclosure Statement', copyLabel);

  ctx = drawTwoParties(ctx,
    { heading: 'Buyer Information', name: data.buyerName, address: data.buyerAddress, phone: data.buyerPhone, email: data.buyerEmail },
    { heading: 'Co-Buyer Information', name: data.coBuyerName, address: data.coBuyerAddress, phone: data.coBuyerPhone, email: data.coBuyerEmail },
  );

  ctx = drawSectionHeading(ctx, 'Vehicle Description');
  ctx = drawSimpleTable(ctx,
    ['Year', 'Make', 'Model', 'VIN', 'Plate', 'Mileage'],
    [[data.vehicleYear, data.vehicleMake, data.vehicleModel, (data.vehicleVin || '').toUpperCase(), (data.vehiclePlate || '').toUpperCase(), data.vehicleMileage]],
    [55, 80, 80, 150, 70, CW - 435],
  );

  ctx = drawSectionHeading(ctx, 'Truth In Lending Disclosures');
  ctx = drawSummaryBoxes(ctx, [
    { title: 'Annual Percentage Rate', desc: 'The cost of your credit as a yearly rate.', value: `${data.apr.toFixed(2)}%` },
    { title: 'Finance Charge', desc: 'The dollar amount the credit will cost.', value: fmt(financeCharge) },
    { title: 'Amount Financed', desc: 'Credit provided to you or on your behalf.', value: fmt(amountFinanced) },
    { title: 'Total of Payments', desc: 'Amount paid after all scheduled payments.', value: fmt(totalOfPayments) },
  ]);

  ctx = drawSectionHeading(ctx, 'Payment Schedule');
  ctx = drawSimpleTable(ctx,
    ['# Payments', 'Amount', 'When Due', 'Est. Completion'],
    [[String(data.numberOfPayments), fmt(paymentAmount), `${data.paymentFrequency} beginning ${data.firstPaymentDate ? fmtDate(data.firstPaymentDate) : ''}`, estCompletion]],
    [CW / 4, CW / 4, CW / 4, CW / 4],
  );

  // Page 2: Itemization + Disclosures
  ctx = newPage(ctx);
  ctx = drawSectionHeading(ctx, 'Itemization of Amount Financed');
  ctx = drawItemLine(ctx, '1. Cash Price of Vehicle', fmt(data.cashPrice));
  ctx = drawItemLine(ctx, 'a. Sales Tax', fmt(data.tax), { indent: true });
  ctx = drawItemLine(ctx, 'b. Title & Registration Fees', fmt(data.titleFee), { indent: true });
  ctx = drawItemLine(ctx, 'c. Documentary Fee', fmt(data.docFee), { indent: true });
  ctx = drawItemLine(ctx, '2. Total Cash Price', fmt(totalCashPrice), { bold: true, topBorder: true });
  ctx = drawItemLine(ctx, '3. Down Payment', `- ${fmt(data.downPayment)}`, { color: RED, bottomBorder: true });
  ctx = drawItemLine(ctx, '4. Amount Financed', fmt(amountFinanced), { bold: true, large: true });

  ctx.y -= 8;
  ctx = drawSectionHeading(ctx, 'As Is — No Dealer Warranty');
  ctx = drawTextBlock(ctx, 'THE VEHICLE IS SOLD AS IS. The dealer assumes no responsibility for any repairs regardless of any oral statements about the vehicle. All implied warranties are expressly disclaimed.', { size: 7.5 });

  ctx.y -= 4;
  ctx = drawSectionHeading(ctx, 'No Refund Policy');
  ctx = drawTextBlock(ctx, 'ALL SALES ARE FINAL. The Buyer acknowledges that no refunds, returns, or exchanges will be accepted under any circumstances. The down payment and any subsequent payments are strictly non-refundable.', { size: 7.5, color: RED });

  if (data.dueAtSigning > 0) {
    ctx.y -= 8;
    ctx = drawSectionHeading(ctx, 'Total Due at Signing');
    ctx = drawCenteredText(ctx, fmt(data.dueAtSigning), { font: ctx.fonts.serifBold, size: 20, color: GOLD });
    ctx = drawCenteredText(ctx, 'Amount due before vehicle delivery', { size: 7, color: LGRY });
    ctx.y -= 6;
  }

  // Texas Notice
  ctx.y -= 6;
  ctx = drawSectionHeading(ctx, 'Notice to the Buyer');
  ctx = drawTextBlock(ctx, 'DO NOT SIGN THIS CONTRACT BEFORE YOU READ IT OR IF IT CONTAINS ANY BLANK SPACES. YOU ARE ENTITLED TO A COPY OF THE CONTRACT YOU SIGN. UNDER THE LAW YOU HAVE THE RIGHT TO PAY OFF IN ADVANCE THE FULL AMOUNT DUE AND UNDER CERTAIN CONDITIONS MAY OBTAIN A PARTIAL REFUND OF THE FINANCE CHARGE.', { size: 7, font: ctx.fonts.bold });

  // GPS Disclosure
  ctx.y -= 6;
  ctx = drawSectionHeading(ctx, 'GPS Tracking & Starter Interrupt Device — Disclosure');
  const gpsTerms = [
    ['DISCLOSURE:', 'Buyer acknowledges that a GPS tracking device and/or starter interrupt device has been or will be installed in the Vehicle.'],
    ['PURPOSE:', 'The device is installed for protecting the security interest, locating the Vehicle in case of default, and theft recovery.'],
    ['CONSENT:', 'Buyer hereby provides express written consent pursuant to Texas Penal Code Section 16.06 for the installation and use of such device.'],
    ['STARTER INTERRUPT:', 'If payments become past due, the starter interrupt may prevent the Vehicle from restarting. It will NOT disable the Vehicle while in motion.'],
    ['TAMPERING PROHIBITED:', 'Buyer agrees not to alter, disconnect, remove, damage, or tamper with the GPS/starter interrupt device.'],
    ['DEVICE OWNERSHIP:', 'The device remains property of Seller until this Contract is paid in full.'],
    ['NO ADDITIONAL CHARGE:', 'There is no separate charge to Buyer for the GPS device.'],
  ];
  for (const [title, body] of gpsTerms) {
    ctx = drawBoldLeadTextBlock(ctx, title, body, { size: 6.5 });
    ctx.y -= 2;
  }

  // Page 3: Terms
  ctx = newPage(ctx);
  ctx = drawSectionHeading(ctx, 'Terms & Conditions');
  const financingTerms = [
    ['1. PROMISE TO PAY:', `Buyer promises to pay Holder the principal amount of ${fmt(amountFinanced)} plus interest at ${data.apr.toFixed(2)}% APR until paid in full.`],
    ['2. SECURITY INTEREST:', 'Buyer grants Holder a purchase money security interest in the Vehicle and all accessions, accessories, and proceeds thereof.'],
    ['3. LATE CHARGES:', 'If any payment remains unpaid for more than 15 days after its due date, a delinquency charge of 5% of the unpaid installment may be collected.'],
    ['4. RETURNED PAYMENTS:', 'A fee of $30.00 shall be assessed for any returned or dishonored payment.'],
    ['5. DEFAULT:', 'Buyer shall be in default if: (a) fails to make payment; (b) fails to maintain insurance; (c) violates any term; (d) provides false info; (e) abandons Vehicle; (f) tampers with GPS device; (g) sells Vehicle without consent.'],
    ['6. ACCELERATION:', 'Upon default, Holder may declare entire unpaid balance immediately due and payable.'],
    ['7. RIGHT TO CURE:', 'Holder may provide Buyer not less than 10 days written notice to cure default.'],
    ['8. REPOSSESSION:', 'Upon default, Holder may take possession of Vehicle wherever found, using peaceful means.'],
    ['9. DEFICIENCY BALANCE:', 'After repossession sale, Buyer remains liable for any deficiency balance.'],
    ['10. PERSONAL PROPERTY:', 'Personal property in Vehicle after repossession handled per Texas Finance Code Section 348.407.'],
    ['11. INSURANCE:', 'Buyer shall maintain comprehensive/collision and liability insurance with Holder named as lienholder.'],
    ['12. PREPAYMENT:', 'Buyer may prepay in full at any time without penalty.'],
    ['13. UNAUTHORIZED MODIFICATIONS:', 'No material alterations without Holder written consent.'],
    ['14. NO COOLING-OFF PERIOD:', 'THERE IS NO COOLING-OFF PERIOD. Once signed, Buyer is legally bound. Sale is FINAL.'],
    ['15. VEHICLE CONDITION:', 'Buyer has inspected or had opportunity to inspect. No oral representations not contained herein.'],
    ['16. DOCUMENTARY FEE:', 'A documentary fee is not an official fee and is not required by law.'],
    ['17. PAYMENT RECORDS:', "Holder's records of payments shall be presumed accurate unless Buyer provides written evidence."],
    ['18. TOLL VIOLATIONS:', 'Buyer is solely responsible for all tolls, parking tickets, and traffic citations.'],
    ['19. ATTORNEY FEES:', 'Buyer agrees to pay reasonable attorney fees and collection costs.'],
    ['20. GOVERNING LAW:', 'Governed by Texas law. Exclusive jurisdiction in Harris County, Texas.'],
    ['21. DISPUTE RESOLUTION:', 'Parties agree to attempt informal resolution for 30 days prior to legal proceedings.'],
    ['22. ENTIRE AGREEMENT:', 'This Contract and all addenda constitute the entire agreement.'],
    ['23. SEVERABILITY:', 'Invalid provisions shall not affect remaining provisions.'],
    ['24. WAIVER:', "Holder's failure to enforce any term is not a waiver of that right."],
  ];
  for (const [title, body] of financingTerms) {
    ctx = drawBoldLeadTextBlock(ctx, title, body, { size: 6.5 });
    ctx.y -= 2;
  }

  // Page 4: ECOA + Signatures + Schedule
  ctx = newPage(ctx);

  // ECOA
  ctx = drawTextBlock(ctx, 'EQUAL CREDIT OPPORTUNITY ACT NOTICE: The Federal ECOA prohibits creditors from discriminating against credit applicants on the basis of race, color, religion, national origin, sex, marital status, or age. Consumer Financial Protection Bureau: (855) 411-2372.', { size: 6, color: LGRY });
  ctx.y -= 8;

  // ID Photo
  ctx = await drawIdPhoto(ctx, sigs.buyerIdPhoto, data.buyerName);

  // Signatures
  ctx = drawCenteredText(ctx, 'By signing below, you agree to the terms of this contract.', { font: ctx.fonts.serifBold, size: 8, color: BLK });
  ctx.y -= 8;

  ctx = await drawTwoSignatures(ctx,
    { label: 'Buyer Signature', sig: sigs.buyerSignature, date: sigs.buyerSignatureDate, name: data.buyerName },
    { label: 'Co-Buyer Signature', sig: sigs.coBuyerSignature, date: sigs.coBuyerSignatureDate, name: data.coBuyerName },
  );
  ctx.y -= 8;
  ctx = await drawSignatureLine(ctx, `Triple J Auto Representative — DL# ${DEALER_LICENSE}`, sigs.dealerSignature, sigs.dealerSignatureDate);

  // Amortization Schedule
  if (schedule.length > 0) {
    ctx.y -= 12;
    ctx = ensureSpace(ctx, 40);
    ctx = drawCenteredText(ctx, 'AMORTIZATION SCHEDULE', { font: ctx.fonts.serifBold, size: 12, color: BLK });
    ctx.y -= 6;

    for (let i = 0; i < schedule.length; i += 4) {
      ctx = ensureSpace(ctx, 18);
      for (let j = 0; j < 4 && i + j < schedule.length; j++) {
        const s = schedule[i + j];
        const colX = j * (CW / 4);
        ctx.page.drawText(`#${s.num}`, { x: M + colX, y: ctx.y, size: 6, font: ctx.fonts.bold, color: LGRY });
        ctx.page.drawText(s.date, { x: M + colX + 20, y: ctx.y, size: 7, font: ctx.fonts.regular, color: BLK });
        ctx.page.drawText(fmt(s.amount), { x: M + colX + 85, y: ctx.y, size: 7, font: ctx.fonts.serifBold, color: BLK });
      }
      ctx.y -= 14;
    }
  }

  return ctx;
}

// ============================================================
// RENTAL AGREEMENT PDF
// ============================================================
async function buildRental(ctx: Ctx, data: RentalData, sigs: SignatureData, copyLabel: string): Promise<Ctx> {
  const totals = calculateRentalTotal(data);
  const duration = calculateRentalDuration(data.rentalStartDate, data.rentalEndDate, data.rentalPeriod);
  const schedule = generateRentalSchedule(data);
  const periodLabel = data.rentalPeriod === 'Daily' ? 'Day(s)' : data.rentalPeriod === 'Weekly' ? 'Week(s)' : 'Month(s)';
  const periodSingular = data.rentalPeriod === 'Daily' ? 'day' : data.rentalPeriod === 'Weekly' ? 'week' : 'month';
  const perPeriodAmount = schedule.length > 0 ? schedule[0].amountDue : 0;

  // Page 1
  ctx = drawHeader(ctx, 'Vehicle Rental Agreement', 'Rental Contract & Terms of Use', copyLabel);

  ctx = drawTwoParties(ctx,
    { heading: 'Renter Information', name: data.renterName, address: data.renterAddress, phone: data.renterPhone, email: data.renterEmail, license: data.renterLicense },
    { heading: 'Additional Driver', name: data.coRenterName, address: data.coRenterAddress, phone: data.coRenterPhone, email: data.coRenterEmail, license: data.coRenterLicense },
  );

  ctx = drawSectionHeading(ctx, 'Vehicle Description');
  ctx = drawSimpleTable(ctx,
    ['Year', 'Make', 'Model', 'VIN', 'Plate', 'Mi. Out', 'Mi. In'],
    [[data.vehicleYear, data.vehicleMake, data.vehicleModel, (data.vehicleVin || '').toUpperCase(), (data.vehiclePlate || '').toUpperCase(), data.mileageOut, data.mileageIn]],
    [50, 70, 70, 140, 60, 55, CW - 445],
  );
  ctx = drawFieldRow(ctx, [
    { label: 'Fuel Out', value: data.fuelLevelOut, width: CW / 2 },
    { label: 'Fuel In', value: data.fuelLevelIn, width: CW / 2 },
  ]);

  ctx = drawSectionHeading(ctx, 'Rental Summary');
  ctx = drawSummaryBoxes(ctx, [
    { title: 'Rental Period', desc: 'Duration of the rental.', value: `${duration} ${periodLabel}` },
    { title: 'Base Rental', desc: 'Total rental charges before fees.', value: fmt(totals.baseRental) },
    { title: 'Security Deposit', desc: 'Refundable deposit.', value: fmt(data.securityDeposit) },
    { title: 'Total Due at Signing', desc: 'Amount due before pickup.', value: fmt(data.dueAtSigning > 0 ? data.dueAtSigning : totals.totalDue) },
  ]);

  ctx = drawSectionHeading(ctx, 'Payment Schedule');
  ctx = drawSimpleTable(ctx,
    ['# Payments', `Amount/${periodSingular}`, 'When Due', 'Pickup', 'Return'],
    [[String(duration), fmt(perPeriodAmount), `${data.rentalPeriod} from ${fmtDate(data.rentalStartDate)}`, fmtDate(data.rentalStartDate), fmtDate(data.rentalEndDate)]],
    [CW / 5, CW / 5, CW / 5, CW / 5, CW / 5],
  );

  // Page 2: Itemization + Policies
  ctx = newPage(ctx);
  ctx = drawSectionHeading(ctx, 'Itemization of Charges');
  ctx = drawItemLine(ctx, `1. Base Rental (${duration} ${periodLabel} @ ${fmt(data.rentalRate)})`, fmt(totals.baseRental));
  ctx = drawItemLine(ctx, 'a. Insurance Fee', fmt(totals.insuranceTotal), { indent: true });
  ctx = drawItemLine(ctx, 'b. Additional Driver Fee', fmt(totals.additionalDriverTotal), { indent: true });
  ctx = drawItemLine(ctx, '2. Subtotal', fmt(totals.subtotal), { bold: true, topBorder: true });
  ctx = drawItemLine(ctx, `Sales Tax (${data.tax}%)`, fmt(totals.taxAmount), { indent: true });
  ctx = drawItemLine(ctx, '3. Total Rental Charges', fmt(totals.grandTotal), { bold: true, topBorder: true });
  ctx = drawItemLine(ctx, '4. Security Deposit (Refundable)', fmt(data.securityDeposit), { bottomBorder: true });
  ctx = drawItemLine(ctx, '5. Total Due at Signing', fmt(data.dueAtSigning > 0 ? data.dueAtSigning : totals.totalDue), { bold: true, large: true });

  ctx.y -= 8;
  ctx = drawSectionHeading(ctx, 'Vehicle Condition');
  ctx = drawTextBlock(ctx, 'THE VEHICLE IS PROVIDED IN ITS CURRENT CONDITION. The renter acknowledges inspecting the vehicle prior to rental and accepts its current condition. Any pre-existing damage has been documented on a separate vehicle condition report signed by both parties at the time of pickup.', { size: 7.5 });

  ctx.y -= 4;
  ctx = drawSectionHeading(ctx, 'Mileage Policy');
  ctx = drawTextBlock(ctx, `MILEAGE ALLOWANCE: ${data.mileageAllowance > 0 ? `${data.mileageAllowance} miles per ${periodSingular}` : 'Unlimited'}. ${data.excessMileageCharge > 0 ? `Excess mileage charged at ${fmt(data.excessMileageCharge)} per mile.` : ''} The renter is responsible for all fuel consumed. Vehicle must be returned with the same fuel level as at pickup.`, { size: 7.5, color: RED });

  ctx.y -= 4;
  ctx = drawSectionHeading(ctx, 'GPS Tracking Device — Disclosure & Consent');
  const rentalGps = [
    ['DISCLOSURE:', 'Renter acknowledges the Vehicle is equipped with a GPS tracking device for security, theft recovery, and enforcement of this Agreement.'],
    ['CONSENT:', 'By signing, Renter provides express written consent pursuant to Texas Penal Code Section 16.06.'],
    ['TAMPERING PROHIBITED:', 'Renter agrees not to tamper with, disable, remove, or damage the GPS device. Tampering is a material breach.'],
  ];
  for (const [title, body] of rentalGps) {
    ctx = drawBoldLeadTextBlock(ctx, title, body, { size: 6.5 });
    ctx.y -= 2;
  }

  // Page 3: Terms
  ctx = newPage(ctx);
  ctx = drawSectionHeading(ctx, 'Terms & Conditions');
  const rentalTerms = [
    ['1. RENTAL AGREEMENT:', `Renter agrees to rent the Vehicle from ${DEALER_NAME} for ${fmtDate(data.rentalStartDate)} through ${fmtDate(data.rentalEndDate)} at ${fmt(data.rentalRate)} per ${periodSingular}.`],
    ['2. AUTHORIZED DRIVERS:', 'Only the Renter and authorized additional drivers may operate the Vehicle. All must possess a valid, unrestricted U.S. driver\'s license.'],
    ['3. INSURANCE:', 'Renter must maintain automobile liability insurance meeting Texas minimums ($30K/$60K/$25K) and comprehensive/collision coverage during the entire rental period.'],
    ['4. VEHICLE CONDITION:', 'Owner and Renter shall jointly inspect and document the Vehicle\'s condition. New damage upon return is Renter\'s responsibility.'],
    ['5. PROHIBITED USE:', 'Vehicle shall NOT be used: (a) by unauthorized persons; (b) under influence of alcohol/drugs; (c) for illegal purposes; (d) commercially/ride-sharing; (e) off-road/racing; (f) towing; (g) outside Texas without consent; (h) recklessly.'],
    ['6. LATE RETURN:', `Vehicle not returned by 5:00 PM on return date incurs daily rate plus $50/day late fee. Failure to return within 48 hours may be reported to law enforcement.`],
    ['7. LATE PAYMENT:', 'Unpaid rent incurs $25/day late fee. Returned payments: $30 fee. Future payments may be required in cash/certified funds.'],
    ['8. ACCIDENT & THEFT:', 'Report to police immediately. Notify Owner within 24 hours by phone, 48 hours in writing. Do not admit fault.'],
    ['9. TOWING & IMPOUND:', 'Renter is solely responsible for all towing, impound, and storage fees.'],
    ['10. TOLL VIOLATIONS:', 'Renter is responsible for all tolls, parking tickets, and citations plus $25 admin fee per occurrence.'],
    ['11. MAINTENANCE:', 'Renter shall maintain proper fluid levels, tire pressure, and not operate with warning lights.'],
    ['12. SMOKING & PET POLICY:', 'Smoking and pets are PROHIBITED. $300 cleaning/restoration fee if evidence is discovered.'],
    ['13. KEY REPLACEMENT:', 'Lost/damaged keys: actual cost of replacement, reprogramming, and locksmith services.'],
    ['14. VEHICLE BREAKDOWN:', 'Notify Owner immediately. Do NOT have repairs done without Owner\'s consent.'],
    ['15. RIGHT TO RECOVER:', 'Owner may immediately terminate and take possession upon default without prior notice.'],
    ['16. RIGHT TO INSPECT:', 'Owner may inspect Vehicle with 24 hours notice, or without notice if breach is suspected.'],
    ['17. EARLY TERMINATION:', 'Renter may terminate by returning Vehicle and paying all amounts owed through return date.'],
    ['18. PERSONAL PROPERTY:', 'Owner assumes no responsibility for personal property left in Vehicle.'],
    ['19. INDEMNIFICATION:', 'Renter shall indemnify and hold harmless Owner from all claims arising from use of Vehicle.'],
    ['20. GOVERNING LAW:', 'Texas law. Exclusive jurisdiction: Harris County, Texas.'],
    ['21. ENTIRE AGREEMENT:', 'This Agreement and all addenda constitute the entire agreement.'],
    ['22. SEVERABILITY:', 'Invalid provisions shall not affect remaining provisions.'],
    ['23. WAIVER:', 'Owner\'s failure to enforce any term is not a waiver.'],
    ['24. SECURITY DEPOSIT:', `The deposit of ${fmt(data.securityDeposit)} will be refunded within 14 days of return, less deductions for damages, unpaid charges, excessive cleaning, missing keys, fuel replacement, or citations.`],
  ];
  for (const [title, body] of rentalTerms) {
    ctx = drawBoldLeadTextBlock(ctx, title, body, { size: 6.5 });
    ctx.y -= 2;
  }

  // Page 4: ID + Signatures
  ctx = newPage(ctx);

  ctx = await drawIdPhoto(ctx, sigs.buyerIdPhoto, data.renterName);

  ctx = drawCenteredText(ctx, 'By signing below, you agree to the terms of this rental agreement.', { font: ctx.fonts.serifBold, size: 8, color: BLK });
  ctx.y -= 8;

  ctx = await drawTwoSignatures(ctx,
    { label: 'Renter Signature', sig: sigs.buyerSignature, date: sigs.buyerSignatureDate, name: data.renterName },
    { label: 'Additional Driver Signature', sig: sigs.coBuyerSignature, date: sigs.coBuyerSignatureDate, name: data.coRenterName },
  );
  ctx.y -= 8;
  ctx = await drawSignatureLine(ctx, `Triple J Auto Representative — DL# ${DEALER_LICENSE}`, sigs.dealerSignature, sigs.dealerSignatureDate);

  // Payment Tracking Schedule
  if (schedule.length > 0) {
    ctx.y -= 12;
    ctx = ensureSpace(ctx, 40);
    ctx = drawCenteredText(ctx, 'PAYMENT TRACKING SCHEDULE', { font: ctx.fonts.serifBold, size: 12, color: BLK });
    ctx = drawCenteredText(ctx, `${data.renterName || ''} — ${data.vehicleYear} ${data.vehicleMake} ${data.vehicleModel}`, { size: 7, color: LGRY });
    ctx = drawCenteredText(ctx, `${fmt(perPeriodAmount)} / ${periodSingular} • ${duration} payments • ${fmtDate(data.rentalStartDate)} – ${fmtDate(data.rentalEndDate)}`, { size: 7, color: LGRY });
    ctx.y -= 8;

    // Table header
    const cols = [30, 70, 60, 60, 45, 60, 60, 65, 55, CW - 505 > 0 ? CW - 505 : 40];
    const hdrs = ['#', 'Due Date', 'Rental', 'Ins+Fees', 'Tax', 'Due', 'Balance', 'Date Paid', 'Method', 'Init.'];
    const hdrH = 14;
    ctx = ensureSpace(ctx, hdrH + 14 * (schedule.length + 2));

    // Header bg
    drawRect(ctx, 0, CW, hdrH, { color: rgb(0.1, 0.1, 0.1) });
    let hx = 0;
    for (let i = 0; i < hdrs.length; i++) {
      ctx.page.drawText(hdrs[i], { x: M + hx + 2, y: ctx.y - 10, size: 5.5, font: ctx.fonts.bold, color: WHITE });
      hx += cols[i];
    }
    ctx.y -= hdrH;

    // Security deposit row
    ctx = ensureSpace(ctx, 14);
    drawRect(ctx, 0, CW, 13, { color: rgb(0.97, 0.95, 0.9) });
    ctx.page.drawText('—', { x: M + 2, y: ctx.y - 10, size: 7, font: ctx.fonts.bold, color: GOLD });
    ctx.page.drawText(fmtDate(data.rentalStartDate), { x: M + cols[0] + 2, y: ctx.y - 10, size: 7, font: ctx.fonts.regular, color: BLK });
    ctx.page.drawText(fmt(data.securityDeposit), { x: M + cols[0] + cols[1] + cols[2] + cols[3] + cols[4] + 2, y: ctx.y - 10, size: 7, font: ctx.fonts.bold, color: BLK });
    ctx.page.drawText('Deposit', { x: M + cols[0] + cols[1] + cols[2] + cols[3] + cols[4] + cols[5] + 2, y: ctx.y - 10, size: 6, font: ctx.fonts.regular, color: LGRY });
    ctx.y -= 13;

    // Payment rows
    for (let idx = 0; idx < schedule.length; idx++) {
      ctx = ensureSpace(ctx, 13);
      const p = schedule[idx];
      if (idx % 2 === 1) drawRect(ctx, 0, CW, 13, { color: rgb(0.98, 0.97, 0.96) });

      let cx = 0;
      const vals = [
        String(p.paymentNumber),
        fmtDate(p.dueDate),
        fmt(p.rental),
        fmt(p.insurance + p.additionalDriver),
        fmt(p.tax),
        fmt(p.amountDue),
        fmt(p.balanceAfter),
      ];
      for (let i = 0; i < vals.length; i++) {
        ctx.page.drawText(vals[i], { x: M + cx + 2, y: ctx.y - 10, size: 6.5, font: i === 5 ? ctx.fonts.bold : ctx.fonts.regular, color: BLK });
        cx += cols[i];
      }
      // Empty cells for date paid, method, initials (with dashed lines)
      for (let i = 7; i < 10; i++) {
        ctx.page.drawLine({
          start: { x: M + cx + 2, y: ctx.y - 11 },
          end: { x: M + cx + cols[i] - 4, y: ctx.y - 11 },
          thickness: 0.3,
          color: rgb(0.7, 0.7, 0.7),
          dashArray: [2, 2],
        });
        cx += cols[i];
      }
      ctx.y -= 13;
    }

    // Totals row
    ctx = ensureSpace(ctx, 14);
    drawRect(ctx, 0, CW, 14, { color: rgb(0.1, 0.1, 0.1) });
    ctx.page.drawText('TOTAL', { x: M + 2, y: ctx.y - 10, size: 6, font: ctx.fonts.bold, color: WHITE });
    let tx = cols[0] + cols[1] + cols[2] + cols[3] + cols[4];
    ctx.page.drawText(fmt(totals.grandTotal), { x: M + tx + 2, y: ctx.y - 10, size: 7, font: ctx.fonts.bold, color: WHITE });
    tx += cols[5];
    ctx.page.drawText(fmt(0), { x: M + tx + 2, y: ctx.y - 10, size: 7, font: ctx.fonts.bold, color: WHITE });
    ctx.y -= 14;

    // Legend
    ctx.y -= 8;
    ctx.page.drawText('PAYMENT METHODS: Cash / Check / Zelle / CashApp / Card / Other', { x: M, y: ctx.y, size: 6, font: ctx.fonts.regular, color: LGRY });
    ctx.y -= 10;
    ctx.page.drawText(`Late payments: $50 late fee. Security deposit of ${fmt(data.securityDeposit)} refundable upon satisfactory return.`, { x: M, y: ctx.y, size: 6, font: ctx.fonts.regular, color: LGRY });
    ctx.y -= 14;

    // Owner/Renter copy acknowledgment
    ctx = await drawTwoSignatures(ctx,
      { label: 'Triple J Representative (Owner Copy)' },
      { label: 'Renter Signature (Renter Copy)' },
    );
  }

  return ctx;
}

// ============================================================
// MAIN ENTRY POINT
// ============================================================
export interface GeneratePdfOptions {
  agreementId: string;
  copyLabel: string;
}

export async function generatePdf({ agreementId, copyLabel }: GeneratePdfOptions): Promise<Buffer> {
  // 1. Fetch agreement from Supabase
  const supabase = await createClient();
  const { data: agreement, error } = await supabase
    .from('document_agreements')
    .select('completed_link, document_type, acknowledgments')
    .eq('id', agreementId)
    .single();

  if (error || !agreement?.completed_link) {
    throw new Error(`Agreement not found or missing completed_link: ${error?.message || 'no data'}`);
  }

  // 2. Decode compressed document data
  const decoded = decodeCompletedLinkFromUrl(agreement.completed_link);
  if (!decoded) {
    throw new Error('Failed to decode completed_link data');
  }

  const docData = { ...decoded.dd, ...decoded.cd } as Record<string, unknown>;
  const signatures: SignatureData = {
    dealerSignature: decoded.ds || '',
    dealerSignatureDate: decoded.dsd || '',
    buyerSignature: decoded.bs || '',
    buyerSignatureDate: decoded.bsd || '',
    coBuyerSignature: decoded.cs || '',
    coBuyerSignatureDate: decoded.csd || '',
    buyerIdPhoto: decoded.bi || '',
  };
  const ack = (decoded.ack || agreement.acknowledgments || {}) as Record<string, boolean>;

  // 3. Create PDF document
  const doc = await PDFDocument.create();
  const fonts: Fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
    serif: await doc.embedFont(StandardFonts.TimesRoman),
    serifBold: await doc.embedFont(StandardFonts.TimesRomanBold),
    serifItalic: await doc.embedFont(StandardFonts.TimesRomanItalic),
    mono: await doc.embedFont(StandardFonts.Courier),
  };

  const firstPage = doc.addPage([PW, PH]);
  let ctx: Ctx = { doc, page: firstPage, y: PH - M, fonts };

  // 4. Route to appropriate document type builder
  switch (decoded.s) {
    case 'billOfSale':
      ctx = await buildBillOfSale(ctx, docData as unknown as BillOfSaleData, signatures, ack, copyLabel);
      break;
    case 'financing':
      ctx = await buildFinancing(ctx, docData as unknown as ContractData, signatures, copyLabel);
      break;
    case 'rental':
      ctx = await buildRental(ctx, docData as unknown as RentalData, signatures, copyLabel);
      break;
    default:
      throw new Error(`Unsupported document type: ${decoded.s}`);
  }

  // 5. Serialize to buffer
  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}
