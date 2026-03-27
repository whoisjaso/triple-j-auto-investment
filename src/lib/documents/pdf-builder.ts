import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';
import { DEALER_NAME, DEALER_ADDRESS, DEALER_PHONE, DEALER_WEBSITE, DEALER_LICENSE } from './shared';
import { calculateBillOfSale, formatCurrency as bosFmt } from './billOfSale';
import { calculatePayment, formatCurrency as finFmt } from './finance';
import { calculateRentalTotal, calculateRentalDuration, generateRentalSchedule } from './rental';
import type { CompletedLinkData } from './customerPortal';

// ============================================================
// PDF Builder — generates PDFs matching the HTML preview exactly
//
// Uses pdf-lib (pure JS, serverless-safe, works on Vercel).
// Layout mirrors BillOfSalePreview, ContractPreview, RentalPreview.
//
//  ┌───────────────┐     ┌──────────────┐     ┌──────────┐
//  │ API Route     │────►│ buildPdf()   │────►│ pdf-lib  │
//  │ (serverless)  │     │ pure JS      │     │ Buffer   │
//  └───────────────┘     └──────────────┘     └──────────┘
// ============================================================

// ── Colors (matching HTML #hex values) ──
const GOLD = rgb(0.722, 0.608, 0.369);       // #b89b5e
const BLACK = rgb(0.102, 0.102, 0.102);       // #1a1a1a
const DARK_TEXT = rgb(0.102, 0.102, 0.102);
const GRAY_TEXT = rgb(0.102, 0.102, 0.102);   // 80% opacity simulated
const GRAY_LABEL = rgb(0.4, 0.4, 0.4);       // #1a1a1a/50
const LIGHT_BG = rgb(0.973, 0.973, 0.973);   // #f8f8f8
const BORDER_GRAY = rgb(0.867, 0.867, 0.867);// #ddd
const THIN_BORDER = rgb(0.9, 0.9, 0.9);      // #e5e5e5
const WHITE = rgb(1, 1, 1);
const RED_TEXT = rgb(0.6, 0.05, 0.05);        // red-900 approx
const RED_BG = rgb(0.99, 0.95, 0.95);        // red-50/30
const WARM_BG = rgb(0.96, 0.949, 0.929);     // #f5f2ed/40
const GOLD_BG = rgb(0.973, 0.965, 0.949);    // #b89b5e/5
const YELLOW_BG = rgb(0.99, 0.98, 0.95);     // yellow-50/50

// ── Page dimensions (US Letter) ──
const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 50;
const CONTENT_W = PAGE_W - 2 * MARGIN;
const COL_2 = CONTENT_W / 2;
const COL_4 = CONTENT_W / 4;

// Sanitize text for pdf-lib StandardFonts (WinAnsi / Latin-1 only)
function sanitize(text: string): string {
  if (!text) return '';
  return String(text)
    .replace(/[\u2018\u2019\u201A]/g, "'")
    .replace(/[\u201C\u201D\u201E]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u2022/g, '*')
    .replace(/\u00A0/g, ' ')
    .replace(/[\u2713\u2714\u2611]/g, '[x]')
    .replace(/[\u2717\u2718\u2610]/g, '[ ]')
    .replace(/[^\x20-\x7E\xA0-\xFF\n\r\t]/g, '');
}

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
  if (ctx.y - needed < MARGIN + 30) {
    newPage(ctx);
  }
}

// ── Helper: draw text with optional word wrap ──
function drawText(ctx: Ctx, text: string, opts: {
  x?: number; size?: number; color?: typeof BLACK; font?: PDFFont;
  maxWidth?: number; lineHeight?: number;
} = {}): void {
  const { x = MARGIN, size = 10, color = BLACK, font = ctx.font, maxWidth, lineHeight } = opts;
  const lh = lineHeight || size + 4;
  const safeText = sanitize(String(text || ''));
  if (!safeText) return;

  if (maxWidth) {
    const words = safeText.split(' ');
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      const w = font.widthOfTextAtSize(test, size);
      if (w > maxWidth && line) {
        ensureSpace(ctx, lh);
        ctx.page.drawText(line, { x, y: ctx.y, size, color, font });
        ctx.y -= lh;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) {
      ensureSpace(ctx, lh);
      ctx.page.drawText(line, { x, y: ctx.y, size, color, font });
      ctx.y -= lh;
    }
  } else {
    ensureSpace(ctx, lh);
    ctx.page.drawText(safeText, { x, y: ctx.y, size, color, font });
    ctx.y -= lh;
  }
}

// ── Helper: draw a horizontal line ──
function drawHLine(ctx: Ctx, opts: { color?: typeof BORDER_GRAY; thickness?: number; y?: number } = {}): void {
  const { color = THIN_BORDER, thickness = 0.5 } = opts;
  const lineY = opts.y ?? ctx.y;
  ctx.page.drawLine({
    start: { x: MARGIN, y: lineY },
    end: { x: PAGE_W - MARGIN, y: lineY },
    thickness,
    color,
  });
  if (!opts.y) ctx.y -= 8;
}

// ── Helper: draw filled rectangle ──
function drawRect(ctx: Ctx, x: number, y: number, w: number, h: number, color: typeof LIGHT_BG): void {
  ctx.page.drawRectangle({ x, y, width: w, height: h, color });
}

// ── Helper: section header (small gold/gray uppercase label) ──
function drawSectionLabel(ctx: Ctx, label: string, opts: { color?: typeof GRAY_LABEL } = {}): void {
  const { color = GRAY_LABEL } = opts;
  ctx.y -= 4;
  ensureSpace(ctx, 18);
  ctx.page.drawText(sanitize(label.toUpperCase()), {
    x: MARGIN,
    y: ctx.y,
    size: 7.5,
    font: ctx.fontBold,
    color,
  });
  ctx.y -= 14;
}

// ── Helper: draw a table ──
function drawTable(ctx: Ctx, headers: string[], rows: string[][], opts: {
  colWidths?: number[];
  headerBg?: boolean;
} = {}): void {
  const colCount = headers.length;
  const colWidths = opts.colWidths || headers.map(() => CONTENT_W / colCount);
  const rowHeight = 18;
  const cellPad = 6;
  const fontSize = 8.5;

  // Header row
  ensureSpace(ctx, rowHeight * 2);
  if (opts.headerBg) {
    drawRect(ctx, MARGIN, ctx.y - rowHeight + 4, CONTENT_W, rowHeight, rgb(0.96, 0.96, 0.96));
  }
  // Header border bottom
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y - rowHeight + 4 },
    end: { x: PAGE_W - MARGIN, y: ctx.y - rowHeight + 4 },
    thickness: 0.5, color: BORDER_GRAY,
  });

  let xPos = MARGIN;
  for (let i = 0; i < colCount; i++) {
    ctx.page.drawText(sanitize(headers[i]), {
      x: xPos + cellPad, y: ctx.y - 4, size: fontSize, font: ctx.fontBold, color: DARK_TEXT,
    });
    xPos += colWidths[i];
  }
  ctx.y -= rowHeight;

  // Data rows
  for (const row of rows) {
    ensureSpace(ctx, rowHeight);
    // Row border
    ctx.page.drawLine({
      start: { x: MARGIN, y: ctx.y - rowHeight + 4 },
      end: { x: PAGE_W - MARGIN, y: ctx.y - rowHeight + 4 },
      thickness: 0.3, color: rgb(0.9, 0.9, 0.9),
    });

    xPos = MARGIN;
    for (let i = 0; i < colCount; i++) {
      const val = row[i] || '';
      ctx.page.drawText(sanitize(val), {
        x: xPos + cellPad, y: ctx.y - 4, size: fontSize, font: ctx.font, color: DARK_TEXT,
        maxWidth: colWidths[i] - cellPad * 2,
      });
      xPos += colWidths[i];
    }
    ctx.y -= rowHeight;
  }
  ctx.y -= 4;
}

// ── Helper: draw summary box (4-column grid like Truth in Lending) ──
function drawSummaryBoxes(ctx: Ctx, boxes: { title: string; desc: string; value: string }[]): void {
  const boxW = (CONTENT_W - 9) / 4; // 3 gaps of 3pt
  const boxH = 70;

  ensureSpace(ctx, boxH + 8);
  const startY = ctx.y;

  for (let i = 0; i < boxes.length && i < 4; i++) {
    const box = boxes[i];
    const x = MARGIN + i * (boxW + 3);
    const y = startY - boxH;

    // Background
    drawRect(ctx, x, y, boxW, boxH, LIGHT_BG);

    // Title
    ctx.page.drawText(sanitize(box.title.toUpperCase()), {
      x: x + 8, y: y + boxH - 14, size: 7, font: ctx.fontBold, color: DARK_TEXT,
    });
    // Description
    const descWords = sanitize(box.desc).split(' ');
    let descLine = '';
    let descY = y + boxH - 25;
    for (const w of descWords) {
      const test = descLine ? `${descLine} ${w}` : w;
      if (ctx.font.widthOfTextAtSize(test, 6.5) > boxW - 16 && descLine) {
        ctx.page.drawText(descLine, { x: x + 8, y: descY, size: 6.5, font: ctx.font, color: GRAY_LABEL });
        descY -= 9;
        descLine = w;
      } else {
        descLine = test;
      }
    }
    if (descLine) {
      ctx.page.drawText(descLine, { x: x + 8, y: descY, size: 6.5, font: ctx.font, color: GRAY_LABEL });
    }

    // Value (large, serif-like bold at bottom)
    ctx.page.drawText(sanitize(box.value), {
      x: x + 8, y: y + 10, size: 16, font: ctx.fontBold, color: BLACK,
    });
  }

  ctx.y = startY - boxH - 8;
}

// ── Helper: draw itemized line (label ... value) ──
function drawItemLine(ctx: Ctx, label: string, value: string, opts: {
  indent?: boolean; bold?: boolean; large?: boolean; redValue?: boolean;
  borderTop?: boolean; borderBottom?: boolean;
} = {}): void {
  const { indent = false, bold = false, large = false, redValue = false, borderTop = false, borderBottom = false } = opts;
  const size = large ? 12 : 9;
  const font = bold || large ? ctx.fontBold : ctx.font;
  const lh = large ? 20 : 14;

  ensureSpace(ctx, lh + (borderTop ? 6 : 0) + (borderBottom ? 6 : 0));

  if (borderTop) {
    ctx.page.drawLine({
      start: { x: MARGIN, y: ctx.y + 2 },
      end: { x: MARGIN + COL_2 - 10, y: ctx.y + 2 },
      thickness: 0.5, color: rgb(0.85, 0.85, 0.85),
    });
    ctx.y -= 4;
  }

  const x = indent ? MARGIN + 16 : MARGIN;
  const labelColor = indent ? GRAY_LABEL : DARK_TEXT;
  const valColor = redValue ? RED_TEXT : (large ? BLACK : DARK_TEXT);
  const safeLabel = sanitize(label);
  const safeVal = sanitize(value);

  ctx.page.drawText(safeLabel, { x, y: ctx.y, size, font, color: labelColor });
  const valW = font.widthOfTextAtSize(safeVal, size);
  ctx.page.drawText(safeVal, {
    x: MARGIN + COL_2 - 10 - valW,
    y: ctx.y,
    size, font, color: valColor,
  });

  ctx.y -= lh;

  if (borderBottom) {
    ctx.page.drawLine({
      start: { x: MARGIN, y: ctx.y + 4 },
      end: { x: MARGIN + COL_2 - 10, y: ctx.y + 4 },
      thickness: 0.5, color: rgb(0.8, 0.8, 0.8),
    });
    ctx.y -= 4;
  }
}

// ── Helper: draw a boxed panel (As-Is, No Refund, etc.) ──
function drawPanel(ctx: Ctx, title: string, body: string, opts: {
  bg?: typeof LIGHT_BG; titleColor?: typeof BLACK; bodyColor?: typeof DARK_TEXT;
  x?: number; w?: number;
} = {}): void {
  const { bg = LIGHT_BG, titleColor = BLACK, bodyColor = GRAY_LABEL, x = MARGIN + COL_2 + 10, w = COL_2 - 10 } = opts;

  // Estimate height
  const titleH = 20;
  const bodyWords = sanitize(body).split(' ');
  let lines = 1;
  let testLine = '';
  for (const word of bodyWords) {
    const t = testLine ? `${testLine} ${word}` : word;
    if (ctx.font.widthOfTextAtSize(t, 7.5) > w - 20 && testLine) { lines++; testLine = word; }
    else testLine = t;
  }
  const bodyH = lines * 11 + 4;
  const totalH = titleH + bodyH + 16;

  ensureSpace(ctx, totalH);
  const startY = ctx.y;

  // Background
  drawRect(ctx, x, startY - totalH, w, totalH, bg);

  // Title
  const titleText = sanitize(title.toUpperCase());
  const titleW = ctx.fontBold.widthOfTextAtSize(titleText, 11);
  ctx.page.drawText(titleText, {
    x: x + (w - titleW) / 2,
    y: startY - 16,
    size: 11, font: ctx.fontBold, color: titleColor,
  });

  // Body text (word-wrapped)
  const bodyX = x + 10;
  const maxBodyW = w - 20;
  let bodyY = startY - titleH - 12;
  testLine = '';
  for (const word of bodyWords) {
    const t = testLine ? `${testLine} ${word}` : word;
    if (ctx.font.widthOfTextAtSize(t, 7.5) > maxBodyW && testLine) {
      ctx.page.drawText(testLine, { x: bodyX, y: bodyY, size: 7.5, font: ctx.font, color: bodyColor });
      bodyY -= 11;
      testLine = word;
    } else {
      testLine = t;
    }
  }
  if (testLine) {
    ctx.page.drawText(testLine, { x: bodyX, y: bodyY, size: 7.5, font: ctx.font, color: bodyColor });
  }

  return; // caller manages ctx.y
}

// ── Helper: embed signature image ──
async function embedSignature(ctx: Ctx, dataUrl: string, x: number, maxW: number, maxH: number): Promise<void> {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) return;
  try {
    const base64 = dataUrl.split(',')[1];
    if (!base64) return;
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const isPng = dataUrl.includes('image/png');
    const img = isPng ? await ctx.doc.embedPng(bytes) : await ctx.doc.embedJpg(bytes);
    const scale = Math.min(maxW / img.width, maxH / img.height, 1);
    const w = img.width * scale;
    const h = img.height * scale;
    ensureSpace(ctx, h + 4);
    ctx.page.drawImage(img, { x, y: ctx.y - h, width: w, height: h });
    ctx.y -= h + 4;
  } catch (e) {
    console.warn('[pdf-builder] Signature embed failed:', e);
  }
}

// ── Helper: embed logo from public dir ──
async function embedLogo(ctx: Ctx): Promise<void> {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'GoldTripleJLogo.png');
    const logoBytes = fs.readFileSync(logoPath);
    const logoImage = await ctx.doc.embedPng(logoBytes);

    // Draw circular-ish logo (60x60 area)
    const logoSize = 56;
    const logoX = MARGIN;
    const logoY = ctx.y - logoSize;

    // Gold circle border
    const cx = logoX + logoSize / 2;
    const cy = logoY + logoSize / 2;
    const r = logoSize / 2 + 2;
    // Draw circle as a series of line segments
    for (let i = 0; i < 60; i++) {
      const a1 = (i / 60) * 2 * Math.PI;
      const a2 = ((i + 1) / 60) * 2 * Math.PI;
      ctx.page.drawLine({
        start: { x: cx + r * Math.cos(a1), y: cy + r * Math.sin(a1) },
        end: { x: cx + r * Math.cos(a2), y: cy + r * Math.sin(a2) },
        thickness: 1.5,
        color: GOLD,
      });
    }

    // Scale logo to fit
    const scale = Math.min(logoSize / logoImage.width, logoSize / logoImage.height);
    const w = logoImage.width * scale;
    const h = logoImage.height * scale;
    ctx.page.drawImage(logoImage, {
      x: logoX + (logoSize - w) / 2,
      y: logoY + (logoSize - h) / 2,
      width: w, height: h,
    });

    return;
  } catch (e) {
    console.warn('[pdf-builder] Logo embed failed:', e);
  }
}

// ── Helper: format currency ──
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
// DOCUMENT HEADER (shared across all doc types — matches HTML)
// ============================================================
async function drawDocHeader(ctx: Ctx, title: string, subtitle: string, copyLabel?: string): Promise<void> {
  // Copy label
  if (copyLabel) {
    const copyStr = sanitize(`-- ${copyLabel} --`);
    const copyW = ctx.fontBold.widthOfTextAtSize(copyStr, 8);
    ctx.page.drawText(copyStr, {
      x: PAGE_W / 2 - copyW / 2, y: ctx.y, size: 8, color: GRAY_LABEL, font: ctx.fontBold,
    });
    ctx.y -= 6;
    // Dashed border
    drawHLine(ctx, { color: rgb(0.8, 0.8, 0.8), thickness: 0.5 });
    ctx.y -= 4;
  }

  // ── Logo + Title (left) | Dealer info (right) ──
  await embedLogo(ctx);

  const logoAreaW = 68; // logo 56 + padding
  const titleX = MARGIN + logoAreaW;
  const titleStartY = ctx.y;

  // Document title (large uppercase) — auto-size to fit before dealer name column
  const titleStr = sanitize(title.toUpperCase());
  const maxTitleW = PAGE_W - MARGIN - titleX - 220; // leave room for right-aligned dealer info
  let titleSize = 20;
  while (titleSize > 12 && ctx.fontBold.widthOfTextAtSize(titleStr, titleSize) > maxTitleW) {
    titleSize -= 0.5;
  }
  ctx.page.drawText(titleStr, {
    x: titleX, y: titleStartY, size: titleSize, font: ctx.fontBold, color: DARK_TEXT,
  });
  // Subtitle
  ctx.page.drawText(sanitize(subtitle.toUpperCase()), {
    x: titleX, y: titleStartY - 18, size: 7.5, font: ctx.fontBold, color: GRAY_LABEL,
  });

  // Dealer info (right-aligned)
  const dealerNameStr = sanitize(DEALER_NAME);
  const dealerNameW = ctx.fontBold.widthOfTextAtSize(dealerNameStr, 14);
  ctx.page.drawText(dealerNameStr, {
    x: PAGE_W - MARGIN - dealerNameW, y: titleStartY, size: 14, font: ctx.fontBold, color: GOLD,
  });
  const addr = sanitize(DEALER_ADDRESS);
  const addrW = ctx.font.widthOfTextAtSize(addr, 8);
  ctx.page.drawText(addr, {
    x: PAGE_W - MARGIN - addrW, y: titleStartY - 14, size: 8, font: ctx.font, color: GRAY_LABEL,
  });
  const phone = sanitize(`${DEALER_PHONE} | ${DEALER_WEBSITE}`);
  const phoneW = ctx.font.widthOfTextAtSize(phone, 8);
  ctx.page.drawText(phone, {
    x: PAGE_W - MARGIN - phoneW, y: titleStartY - 25, size: 8, font: ctx.font, color: GRAY_LABEL,
  });

  ctx.y = titleStartY - 60;
  // Header bottom border
  drawHLine(ctx, { color: THIN_BORDER, thickness: 0.5 });
  ctx.y -= 8;
}

// ============================================================
// SIGNATURE SECTION (shared — matches HTML SignatureLinePreview)
// ============================================================
async function drawSignatures(ctx: Ctx, decoded: CompletedLinkData, labels: { buyer: string; coBuyer: string; dealer: string }): Promise<void> {
  ensureSpace(ctx, 160);

  // "By signing below..." agreement text
  const agreementText = `By signing below, you agree to the terms of this ${labels.buyer === 'Buyer Signature' ? 'contract' : 'agreement'}. You acknowledge that you have read it completely before signing.`;
  const textW = ctx.fontBold.widthOfTextAtSize(sanitize(agreementText), 10);
  ctx.page.drawText(sanitize(agreementText), {
    x: PAGE_W / 2 - Math.min(textW, CONTENT_W) / 2,
    y: ctx.y,
    size: 10, font: ctx.fontBold, color: DARK_TEXT,
    maxWidth: CONTENT_W,
  });
  ctx.y -= 24;

  // Draw signature block helper
  const drawSigBlock = async (label: string, sigData?: string, sigDate?: string, printedName?: string, x?: number) => {
    const sigX = x ?? MARGIN;
    const blockW = COL_2 - 20;

    ensureSpace(ctx, 60);
    const startY = ctx.y;

    // Signature image if available
    if (sigData && sigData.startsWith('data:image/')) {
      try {
        const base64 = sigData.split(',')[1];
        if (base64) {
          const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
          const isPng = sigData.includes('image/png');
          const img = isPng ? await ctx.doc.embedPng(bytes) : await ctx.doc.embedJpg(bytes);
          const scale = Math.min(150 / img.width, 40 / img.height, 1);
          const w = img.width * scale;
          const h = img.height * scale;
          ctx.page.drawImage(img, { x: sigX, y: startY - h - 4, width: w, height: h });
        }
      } catch {
        // Skip failed signature
      }
    }

    // Signature line
    const lineY = startY - 48;
    ctx.page.drawLine({
      start: { x: sigX, y: lineY },
      end: { x: sigX + blockW, y: lineY },
      thickness: 0.75, color: DARK_TEXT,
    });

    // Label below line
    ctx.page.drawText(sanitize(label), {
      x: sigX, y: lineY - 12, size: 7.5, font: ctx.fontBold, color: GRAY_LABEL,
    });

    // Printed name
    if (printedName) {
      ctx.page.drawText(sanitize(printedName), {
        x: sigX, y: lineY - 22, size: 8, font: ctx.font, color: GRAY_LABEL,
      });
    }

    // Date
    if (sigDate) {
      const dateStr = sanitize(`Date: ${sigDate}`);
      const dateW = ctx.font.widthOfTextAtSize(dateStr, 7.5);
      ctx.page.drawText(dateStr, {
        x: sigX + blockW - dateW, y: lineY - 12, size: 7.5, font: ctx.font, color: GRAY_LABEL,
      });
    }
  };

  const allData: Record<string, unknown> = { ...decoded.dd, ...decoded.cd };
  const buyerName = str(allData.buyerName || allData.renterName);
  const coBuyerName = str(allData.coBuyerName || allData.coRenterName);

  // Row 1: Buyer + Co-Buyer side by side
  const savedY = ctx.y;
  await drawSigBlock(labels.buyer, decoded.bs, decoded.bsd, buyerName, MARGIN);
  ctx.y = savedY;
  await drawSigBlock(labels.coBuyer, decoded.cs, decoded.csd, coBuyerName, MARGIN + COL_2 + 10);
  ctx.y = savedY - 70;

  // Row 2: Dealer
  await drawSigBlock(`${labels.dealer} - DL# ${DEALER_LICENSE}`, decoded.ds, decoded.dsd, undefined, MARGIN);
  ctx.y -= 8;

  // Acknowledgments
  if (decoded.ack && Object.keys(decoded.ack).length > 0) {
    drawSectionLabel(ctx, 'Buyer Acknowledgments');
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
// LEGAL TERMS — two-column small text
// ============================================================
function drawLegalTerms(ctx: Ctx, terms: string[]): void {
  // Split terms into two columns
  const fontSize = 7;
  const lh = 9.5;
  const colWidth = (CONTENT_W - 20) / 2;
  const leftX = MARGIN;
  const rightX = MARGIN + colWidth + 20;

  // Calculate all lines needed for all terms in both columns
  interface LineItem { text: string; bold: boolean }
  const allLines: LineItem[] = [];

  for (const term of terms) {
    // Parse bold prefix (e.g., "TRANSFER OF TITLE:")
    const boldMatch = term.match(/^([A-Z][A-Z\s&,.'()0-9-]+:)\s*/);
    if (boldMatch) {
      allLines.push({ text: boldMatch[1], bold: true });
      const rest = term.slice(boldMatch[0].length);
      // Word wrap the rest
      const words = sanitize(rest).split(' ');
      let line = '';
      for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (ctx.font.widthOfTextAtSize(test, fontSize) > colWidth && line) {
          allLines.push({ text: line, bold: false });
          line = w;
        } else {
          line = test;
        }
      }
      if (line) allLines.push({ text: line, bold: false });
      allLines.push({ text: '', bold: false }); // gap between terms
    } else {
      const words = sanitize(term).split(' ');
      let line = '';
      for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (ctx.font.widthOfTextAtSize(test, fontSize) > colWidth && line) {
          allLines.push({ text: line, bold: false });
          line = w;
        } else {
          line = test;
        }
      }
      if (line) allLines.push({ text: line, bold: false });
      allLines.push({ text: '', bold: false });
    }
  }

  // Split roughly in half for two columns
  const mid = Math.ceil(allLines.length / 2);
  const leftLines = allLines.slice(0, mid);
  const rightLines = allLines.slice(mid);

  const totalLines = Math.max(leftLines.length, rightLines.length);
  const totalHeight = totalLines * lh;

  // May need multiple pages
  let lineIdx = 0;
  while (lineIdx < totalLines) {
    const availableH = ctx.y - MARGIN - 30;
    const linesPerPage = Math.floor(availableH / lh);
    const endIdx = Math.min(lineIdx + linesPerPage, totalLines);

    for (let i = lineIdx; i < endIdx; i++) {
      const leftLine = leftLines[i];
      const rightLine = rightLines[i];

      if (leftLine && leftLine.text) {
        ctx.page.drawText(leftLine.text, {
          x: leftX, y: ctx.y, size: fontSize,
          font: leftLine.bold ? ctx.fontBold : ctx.font,
          color: leftLine.bold ? DARK_TEXT : GRAY_LABEL,
        });
      }
      if (rightLine && rightLine.text) {
        ctx.page.drawText(rightLine.text, {
          x: rightX, y: ctx.y, size: fontSize,
          font: rightLine.bold ? ctx.fontBold : ctx.font,
          color: rightLine.bold ? DARK_TEXT : GRAY_LABEL,
        });
      }
      ctx.y -= lh;
    }

    lineIdx = endIdx;
    if (lineIdx < totalLines) {
      newPage(ctx);
    }
  }
}

// ============================================================
// BILL OF SALE PDF — matches BillOfSalePreview.tsx
// ============================================================
async function buildBillOfSale(ctx: Ctx, data: Record<string, unknown>, copyLabel?: string): Promise<void> {
  await drawDocHeader(ctx, 'Bill of Sale', 'Vehicle Purchase Agreement & Transfer of Ownership', copyLabel);

  // ── Sale info (right-aligned under header) ──
  if (data.saleDate || data.stockNumber) {
    const infoY = ctx.y + 8;
    if (data.saleDate) {
      const dateLabel = 'DATE: ';
      const dateVal = sanitize(str(data.saleDate));
      const dLabelW = ctx.fontBold.widthOfTextAtSize(dateLabel, 7.5);
      const dValW = ctx.font.widthOfTextAtSize(dateVal, 7.5);
      const dX = PAGE_W - MARGIN - dLabelW - dValW;
      ctx.page.drawText(dateLabel, { x: dX, y: infoY, size: 7.5, font: ctx.fontBold, color: GRAY_LABEL });
      ctx.page.drawText(dateVal, { x: dX + dLabelW, y: infoY, size: 7.5, font: ctx.font, color: DARK_TEXT });
    }
    if (data.stockNumber) {
      const stockLabel = 'STOCK #: ';
      const stockVal = sanitize(str(data.stockNumber));
      const sLabelW = ctx.fontBold.widthOfTextAtSize(stockLabel, 7.5);
      const sValW = ctx.font.widthOfTextAtSize(stockVal, 7.5);
      const sX = PAGE_W - MARGIN - sLabelW - sValW - (data.saleDate ? 80 : 0);
      ctx.page.drawText(stockLabel, { x: sX, y: infoY, size: 7.5, font: ctx.fontBold, color: GRAY_LABEL });
      ctx.page.drawText(stockVal, { x: sX + sLabelW, y: infoY, size: 7.5, font: ctx.font, color: DARK_TEXT });
    }
  }

  // ── Seller (Dealer) ──
  drawSectionLabel(ctx, 'Seller (Dealer)', { color: GOLD });
  const dealerY = ctx.y;
  drawText(ctx, DEALER_NAME, { size: 12, font: ctx.fontBold });
  drawText(ctx, '8774 Almeda Genoa Road', { size: 9, color: GRAY_LABEL });
  drawText(ctx, 'Houston, Texas 77075', { size: 9, color: GRAY_LABEL });
  // Second column
  ctx.page.drawText(sanitize(DEALER_PHONE), { x: MARGIN + 200, y: dealerY, size: 9, font: ctx.font, color: GRAY_LABEL });
  ctx.page.drawText(sanitize(DEALER_WEBSITE), { x: MARGIN + 200, y: dealerY - 14, size: 9, font: ctx.font, color: GRAY_LABEL });
  // Third column
  ctx.page.drawText('TEXAS DEALER LICENSE', { x: MARGIN + 360, y: dealerY, size: 7, font: ctx.fontBold, color: GRAY_LABEL });
  ctx.page.drawText(sanitize(DEALER_LICENSE), { x: MARGIN + 360, y: dealerY - 14, size: 10, font: ctx.fontBold, color: DARK_TEXT });
  ctx.y -= 10;

  // ── Buyer / Co-Buyer (two columns) ──
  const buyerAddr = [data.buyerAddress, data.buyerCity, data.buyerState, data.buyerZip].filter(Boolean).join(', ');
  const coBuyerAddr = [data.coBuyerAddress, data.coBuyerCity, data.coBuyerState, data.coBuyerZip].filter(Boolean).join(', ');

  ensureSpace(ctx, 90);
  const partyY = ctx.y;

  // Left: Buyer
  ctx.page.drawText('BUYER INFORMATION', { x: MARGIN, y: partyY, size: 7.5, font: ctx.fontBold, color: GRAY_LABEL });
  ctx.page.drawText(sanitize(str(data.buyerName)), { x: MARGIN, y: partyY - 16, size: 13, font: ctx.fontBold, color: DARK_TEXT });
  ctx.page.drawText(sanitize(buyerAddr), { x: MARGIN, y: partyY - 30, size: 9, font: ctx.font, color: GRAY_LABEL });
  ctx.page.drawText(sanitize(str(data.buyerPhone)), { x: MARGIN, y: partyY - 42, size: 9, font: ctx.font, color: GRAY_LABEL });
  ctx.page.drawText(sanitize(str(data.buyerEmail)), { x: MARGIN, y: partyY - 54, size: 9, font: ctx.font, color: GRAY_LABEL });
  if (data.buyerLicense) {
    ctx.page.drawLine({ start: { x: MARGIN, y: partyY - 62 }, end: { x: MARGIN + COL_2 - 20, y: partyY - 62 }, thickness: 0.3, color: rgb(0.9, 0.9, 0.9) });
    ctx.page.drawText(sanitize(`DL# ${str(data.buyerLicense)}`), { x: MARGIN, y: partyY - 74, size: 9, font: ctx.fontBold, color: DARK_TEXT });
    if (data.buyerLicenseState) {
      ctx.page.drawText(sanitize(`State: ${str(data.buyerLicenseState)}`), { x: MARGIN + 120, y: partyY - 74, size: 9, font: ctx.font, color: GRAY_LABEL });
    }
  }

  // Right: Co-Buyer
  const rightX = MARGIN + COL_2 + 10;
  ctx.page.drawText('CO-BUYER INFORMATION', { x: rightX, y: partyY, size: 7.5, font: ctx.fontBold, color: GRAY_LABEL });
  ctx.page.drawText(sanitize(str(data.coBuyerName)), { x: rightX, y: partyY - 16, size: 13, font: ctx.fontBold, color: DARK_TEXT });
  ctx.page.drawText(sanitize(coBuyerAddr), { x: rightX, y: partyY - 30, size: 9, font: ctx.font, color: GRAY_LABEL });
  ctx.page.drawText(sanitize(str(data.coBuyerPhone)), { x: rightX, y: partyY - 42, size: 9, font: ctx.font, color: GRAY_LABEL });
  ctx.page.drawText(sanitize(str(data.coBuyerEmail)), { x: rightX, y: partyY - 54, size: 9, font: ctx.font, color: GRAY_LABEL });
  if (data.coBuyerLicense) {
    ctx.page.drawLine({ start: { x: rightX, y: partyY - 62 }, end: { x: rightX + COL_2 - 20, y: partyY - 62 }, thickness: 0.3, color: rgb(0.9, 0.9, 0.9) });
    ctx.page.drawText(sanitize(`DL# ${str(data.coBuyerLicense)}`), { x: rightX, y: partyY - 74, size: 9, font: ctx.fontBold, color: DARK_TEXT });
    if (data.coBuyerLicenseState) {
      ctx.page.drawText(sanitize(`State: ${str(data.coBuyerLicenseState)}`), { x: rightX + 120, y: partyY - 74, size: 9, font: ctx.font, color: GRAY_LABEL });
    }
  }
  ctx.y = partyY - 90;

  // ── Vehicle Description (table) ──
  drawSectionLabel(ctx, 'Vehicle Description');
  drawTable(ctx,
    ['Year', 'Make', 'Model', 'Trim', 'Color', 'Body', 'Mileage'],
    [[str(data.vehicleYear), str(data.vehicleMake), str(data.vehicleModel), str(data.vehicleTrim), str(data.vehicleColor), str(data.vehicleBodyStyle), str(data.vehicleMileage)]],
  );
  // VIN + Plate below table
  const vinLabel = 'VIN: ';
  ctx.page.drawText(vinLabel, { x: MARGIN, y: ctx.y, size: 7.5, font: ctx.fontBold, color: GRAY_LABEL });
  ctx.page.drawText(sanitize(str(data.vehicleVin).toUpperCase()), {
    x: MARGIN + ctx.fontBold.widthOfTextAtSize(vinLabel, 7.5),
    y: ctx.y, size: 9, font: ctx.fontBold, color: DARK_TEXT,
  });
  if (data.vehiclePlate) {
    const plateLabel = 'LICENSE PLATE: ';
    const plateX = MARGIN + 250;
    ctx.page.drawText(plateLabel, { x: plateX, y: ctx.y, size: 7.5, font: ctx.fontBold, color: GRAY_LABEL });
    ctx.page.drawText(sanitize(str(data.vehiclePlate).toUpperCase()), {
      x: plateX + ctx.fontBold.widthOfTextAtSize(plateLabel, 7.5),
      y: ctx.y, size: 9, font: ctx.fontBold, color: DARK_TEXT,
    });
  }
  ctx.y -= 20;

  // ── Sale Summary Boxes (4 columns) ──
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

  drawSectionLabel(ctx, 'Sale Summary');
  drawSummaryBoxes(ctx, [
    { title: 'Vehicle Price', desc: 'Agreed purchase price of the vehicle.', value: fmt(salePrice) },
    { title: 'Net Trade-In', desc: 'Trade-in credit after payoff deduction.', value: fmt(calc.netTradeIn) },
    { title: 'Fees & Tax', desc: 'Total taxes, title, registration, and fees.', value: fmt(calc.feesSubtotal) },
    { title: 'Total Due', desc: 'Total amount due from buyer at time of sale.', value: fmt(calc.totalDue) },
  ]);

  // ── PAGE 2: Itemization + Condition ──
  newPage(ctx);

  // Left column: Itemization
  drawSectionLabel(ctx, 'Itemization of Sale Price');
  drawItemLine(ctx, '1. Vehicle Sale Price', fmt(salePrice));
  if (tradeIn > 0 || tradePayoff > 0) {
    drawItemLine(ctx, 'a. Trade-In Allowance', `- ${fmt(tradeIn)}`, { indent: true, redValue: true });
    drawItemLine(ctx, 'b. Trade-In Payoff Owed', `+ ${fmt(tradePayoff)}`, { indent: true });
    drawItemLine(ctx, 'c. Net Trade-In Credit', `- ${fmt(calc.netTradeIn)}`, { indent: true, redValue: true });
  }
  drawItemLine(ctx, '2. Balance After Trade', fmt(calc.balanceAfterTrade), { bold: true, borderTop: true });
  drawItemLine(ctx, 'a. Sales Tax', fmt(tax), { indent: true });
  drawItemLine(ctx, 'b. Title Fee', fmt(titleFee), { indent: true });
  drawItemLine(ctx, 'c. Documentary Fee', fmt(docFee), { indent: true });
  drawItemLine(ctx, 'd. Registration Fee', fmt(regFee), { indent: true });
  if (otherFees > 0) {
    drawItemLine(ctx, `e. ${str(data.otherFeesDescription) || 'Other Fees'}`, fmt(otherFees), { indent: true });
  }
  drawItemLine(ctx, '3. Total Amount Due', fmt(calc.totalDue), { large: true, borderTop: true });

  const paymentDisplay = str(data.paymentMethod) === 'Other' ? str(data.paymentMethodOther) : str(data.paymentMethod);
  if (paymentDisplay) {
    const pmX = MARGIN;
    ctx.page.drawText('Payment Method', { x: pmX, y: ctx.y, size: 7.5, font: ctx.font, color: GRAY_LABEL });
    const pmVal = sanitize(paymentDisplay.toUpperCase());
    const pmValW = ctx.fontBold.widthOfTextAtSize(pmVal, 7.5);
    ctx.page.drawText(pmVal, { x: MARGIN + COL_2 - 10 - pmValW, y: ctx.y, size: 7.5, font: ctx.fontBold, color: DARK_TEXT });
    ctx.y -= 18;
  }

  // Right column: Condition panels
  const condType = str(data.conditionType);
  const panelStartY = ctx.y + (ctx.y < PAGE_H - 200 ? 0 : 100); // Adjust if near top of page
  const savedPanelY = ctx.y;

  if (condType === 'as_is') {
    drawPanel(ctx, 'As Is - No Dealer Warranty',
      'THE VEHICLE IS SOLD "AS IS." The seller, Triple J Auto Investment LLC, hereby disclaims all warranties, either express or implied, including any implied warranties of merchantability and fitness for a particular purpose. The buyer has inspected the vehicle and accepts it in its present condition.',
      { bg: LIGHT_BG, titleColor: BLACK, bodyColor: GRAY_LABEL },
    );
    ctx.y = savedPanelY - 80;
    drawPanel(ctx, 'No Refund Policy',
      'ALL SALES ARE FINAL. The Buyer acknowledges that no refunds, returns, or exchanges will be accepted under any circumstances. All payments made are strictly non-refundable. The Buyer waives any right to rescind this transaction after signing.',
      { bg: RED_BG, titleColor: RED_TEXT, bodyColor: RED_TEXT },
    );
    ctx.y = savedPanelY - 170;
  } else {
    drawPanel(ctx, 'Limited Warranty',
      `WARRANTY PERIOD: ${str(data.warrantyDuration) || '___'}\nCOVERAGE: ${str(data.warrantyDescription) || 'As described in separate warranty document.'}`,
      { bg: GOLD_BG, titleColor: GOLD, bodyColor: GRAY_LABEL },
    );
    ctx.y = savedPanelY - 80;
    drawPanel(ctx, 'No Refund Policy',
      'ALL SALES ARE FINAL. The Buyer acknowledges that no refunds, returns, or exchanges will be accepted under any circumstances. All payments made are strictly non-refundable.',
      { bg: RED_BG, titleColor: RED_TEXT, bodyColor: RED_TEXT },
    );
    ctx.y = savedPanelY - 170;
  }

  // ── Trade-In Details ──
  if (data.tradeInDescription || data.tradeInVin) {
    ensureSpace(ctx, 50);
    drawSectionLabel(ctx, 'Trade-In Vehicle');
    const tiY = ctx.y;
    ctx.page.drawText('DESCRIPTION', { x: MARGIN, y: tiY, size: 7, font: ctx.fontBold, color: GRAY_LABEL });
    ctx.page.drawText(sanitize(str(data.tradeInDescription)), { x: MARGIN, y: tiY - 12, size: 9, font: ctx.font, color: DARK_TEXT });
    ctx.page.drawText('VIN', { x: MARGIN + 200, y: tiY, size: 7, font: ctx.fontBold, color: GRAY_LABEL });
    ctx.page.drawText(sanitize(str(data.tradeInVin).toUpperCase()), { x: MARGIN + 200, y: tiY - 12, size: 9, font: ctx.fontBold, color: DARK_TEXT });
    ctx.page.drawText('ALLOWANCE / PAYOFF', { x: MARGIN + 360, y: tiY, size: 7, font: ctx.fontBold, color: GRAY_LABEL });
    ctx.page.drawText(sanitize(`${fmt(tradeIn)} / ${fmt(tradePayoff)}`), { x: MARGIN + 360, y: tiY - 12, size: 9, font: ctx.font, color: DARK_TEXT });
    ctx.y = tiY - 30;
  }

  // ── Odometer Disclosure ──
  ensureSpace(ctx, 80);
  drawRect(ctx, MARGIN, ctx.y - 80, CONTENT_W, 80, LIGHT_BG);
  const odomY = ctx.y;
  const odomTitle = 'FEDERAL ODOMETER DISCLOSURE STATEMENT';
  const odomTitleW = ctx.fontBold.widthOfTextAtSize(odomTitle, 11);
  ctx.page.drawText(odomTitle, { x: PAGE_W / 2 - odomTitleW / 2, y: odomY - 14, size: 11, font: ctx.fontBold, color: BLACK });

  const odometerStatus = str(data.odometerStatus);
  const odometerLabel =
    odometerStatus === 'actual' ? 'reflects the actual mileage of the vehicle' :
    odometerStatus === 'exceeds' ? "exceeds the odometer's mechanical limits" :
    'IS NOT the actual mileage. ODOMETER DISCREPANCY.';
  const odomText = `The odometer reads ${str(data.odometerReading) || '___'} miles, and ${odometerLabel}.`;
  drawText(ctx, '', {}); // reset position
  ctx.y = odomY - 30;
  drawText(ctx, odomText, { size: 8, color: GRAY_LABEL, maxWidth: CONTENT_W - 20, x: MARGIN + 10 });

  // Odometer details row
  ctx.y -= 2;
  ctx.page.drawLine({ start: { x: MARGIN + 10, y: ctx.y }, end: { x: PAGE_W - MARGIN - 10, y: ctx.y }, thickness: 0.3, color: rgb(0.85, 0.85, 0.85) });
  ctx.y -= 14;
  ctx.page.drawText('ODOMETER READING', { x: MARGIN + 10, y: ctx.y, size: 7, font: ctx.fontBold, color: GRAY_LABEL });
  ctx.page.drawText(sanitize(str(data.odometerReading) || '--'), { x: MARGIN + 10, y: ctx.y - 12, size: 12, font: ctx.fontBold, color: DARK_TEXT });
  ctx.page.drawText('STATUS', { x: MARGIN + 180, y: ctx.y, size: 7, font: ctx.fontBold, color: GRAY_LABEL });
  const statusLabel = odometerStatus === 'actual' ? 'Actual Mileage' : odometerStatus === 'exceeds' ? 'Exceeds Mechanical Limits' : 'NOT ACTUAL - Discrepancy';
  ctx.page.drawText(sanitize(statusLabel.toUpperCase()), { x: MARGIN + 180, y: ctx.y - 12, size: 9, font: ctx.fontBold, color: odometerStatus === 'not_actual' ? RED_TEXT : DARK_TEXT });
  ctx.page.drawText('VEHICLE', { x: MARGIN + 380, y: ctx.y, size: 7, font: ctx.fontBold, color: GRAY_LABEL });
  ctx.page.drawText(sanitize(`${str(data.vehicleYear)} ${str(data.vehicleMake)} ${str(data.vehicleModel)}`), { x: MARGIN + 380, y: ctx.y - 12, size: 9, font: ctx.font, color: DARK_TEXT });
  ctx.y -= 30;

  // ── PAGE 3: Legal Terms ──
  newPage(ctx);
  drawLegalTerms(ctx, [
    'TRANSFER OF TITLE: The Seller agrees to transfer title and all rights of ownership of the above-described vehicle to the Buyer upon receipt of full payment. The Seller warrants that they hold clear title to the vehicle, free of all liens and encumbrances, except as otherwise noted herein.',
    'REPRESENTATIONS: The Buyer acknowledges that they have had the opportunity to inspect the vehicle and have accepted it in its current condition. The Buyer has not relied on any representations made by the Seller other than those expressly set forth in this Bill of Sale.',
    'GOVERNING LAW: This Bill of Sale shall be governed by and construed in accordance with the laws of the State of Texas. Any disputes arising under this agreement shall be resolved in Harris County, Texas.',
    'RISK OF LOSS: Risk of loss and damage to the vehicle transfers to the Buyer upon execution of this Bill of Sale and delivery of the vehicle. The Buyer is responsible for obtaining insurance coverage effective immediately upon taking possession.',
    'ENTIRE AGREEMENT: This Bill of Sale constitutes the entire agreement between the parties. No modifications shall be binding unless made in writing and signed by both parties. This agreement is binding upon the heirs, executors, administrators, and assigns of both parties.',
  ]);
}

// ============================================================
// FINANCING AGREEMENT PDF — matches ContractPreview.tsx
// ============================================================
async function buildFinancing(ctx: Ctx, data: Record<string, unknown>, copyLabel?: string): Promise<void> {
  await drawDocHeader(ctx, 'Retail Installment Contract', 'Security Agreement & Disclosure Statement', copyLabel);

  // ── Buyer / Co-Buyer ──
  ensureSpace(ctx, 80);
  const partyY = ctx.y;

  ctx.page.drawText('BUYER INFORMATION', { x: MARGIN, y: partyY, size: 7.5, font: ctx.fontBold, color: GRAY_LABEL });
  ctx.page.drawText(sanitize(str(data.buyerName)), { x: MARGIN, y: partyY - 16, size: 13, font: ctx.fontBold, color: DARK_TEXT });
  ctx.page.drawText(sanitize(str(data.buyerAddress)), { x: MARGIN, y: partyY - 30, size: 9, font: ctx.font, color: GRAY_LABEL });
  ctx.page.drawText(sanitize(str(data.buyerPhone)), { x: MARGIN, y: partyY - 42, size: 9, font: ctx.font, color: GRAY_LABEL });
  ctx.page.drawText(sanitize(str(data.buyerEmail)), { x: MARGIN, y: partyY - 54, size: 9, font: ctx.font, color: GRAY_LABEL });

  const rx = MARGIN + COL_2 + 10;
  ctx.page.drawText('CO-BUYER INFORMATION', { x: rx, y: partyY, size: 7.5, font: ctx.fontBold, color: GRAY_LABEL });
  ctx.page.drawText(sanitize(str(data.coBuyerName)), { x: rx, y: partyY - 16, size: 13, font: ctx.fontBold, color: DARK_TEXT });
  ctx.page.drawText(sanitize(str(data.coBuyerAddress)), { x: rx, y: partyY - 30, size: 9, font: ctx.font, color: GRAY_LABEL });
  ctx.page.drawText(sanitize(str(data.coBuyerPhone)), { x: rx, y: partyY - 42, size: 9, font: ctx.font, color: GRAY_LABEL });
  ctx.page.drawText(sanitize(str(data.coBuyerEmail)), { x: rx, y: partyY - 54, size: 9, font: ctx.font, color: GRAY_LABEL });
  ctx.y = partyY - 72;

  // ── Vehicle table ──
  drawSectionLabel(ctx, 'Vehicle Description');
  drawTable(ctx,
    ['Year', 'Make', 'Model', 'VIN', 'Plate', 'Mileage'],
    [[str(data.vehicleYear), str(data.vehicleMake), str(data.vehicleModel), str(data.vehicleVin).toUpperCase(), str(data.vehiclePlate).toUpperCase(), str(data.vehicleMileage)]],
  );

  // ── Truth in Lending Boxes ──
  const cashPrice = Number(data.cashPrice) || 0;
  const downPayment = Number(data.downPayment) || 0;
  const tax = Number(data.tax) || 0;
  const titleFee = Number(data.titleFee) || 0;
  const docFee = Number(data.docFee) || 0;
  const apr = Number(data.apr) || 0;
  const numPayments = Number(data.numberOfPayments) || 0;
  const freq = str(data.paymentFrequency) as 'Weekly' | 'Bi-weekly' | 'Monthly';
  const totalCashPrice = cashPrice + tax + titleFee + docFee;
  const amountFinanced = Math.max(0, totalCashPrice - downPayment);
  const payment = calculatePayment(amountFinanced, apr, numPayments, freq);
  const totalOfPayments = payment * numPayments;
  const financeCharge = totalOfPayments - amountFinanced;

  drawSectionLabel(ctx, 'Truth In Lending Disclosures');
  drawSummaryBoxes(ctx, [
    { title: 'Annual Percentage Rate', desc: 'The cost of your credit as a yearly rate.', value: `${apr.toFixed(2)}%` },
    { title: 'Finance Charge', desc: 'The dollar amount the credit will cost you.', value: fmt(financeCharge) },
    { title: 'Amount Financed', desc: 'The amount of credit provided to you.', value: fmt(amountFinanced) },
    { title: 'Total of Payments', desc: 'The amount you will have paid after all payments.', value: fmt(totalOfPayments) },
  ]);

  // ── Payment Schedule table ──
  drawSectionLabel(ctx, 'Payment Schedule');
  const firstPayDate = str(data.firstPaymentDate);
  drawTable(ctx,
    ['Number of Payments', 'Amount of Payments', 'When Payments Are Due', 'Est. Completion'],
    [[String(numPayments), fmt(payment), `${freq} beginning ${firstPayDate}`, 'See schedule']],
    { headerBg: true },
  );

  // ── PAGE 2: Itemization + Policies ──
  newPage(ctx);

  drawSectionLabel(ctx, 'Itemization of Amount Financed');
  drawItemLine(ctx, '1. Cash Price of Vehicle', fmt(cashPrice));
  drawItemLine(ctx, 'a. Sales Tax', fmt(tax), { indent: true });
  drawItemLine(ctx, 'b. Title & Registration Fees', fmt(titleFee), { indent: true });
  drawItemLine(ctx, 'c. Documentary Fee', fmt(docFee), { indent: true });
  drawItemLine(ctx, '2. Total Cash Price', fmt(totalCashPrice), { bold: true, borderTop: true });
  drawItemLine(ctx, '3. Down Payment', `- ${fmt(downPayment)}`, { borderBottom: true, redValue: true });
  drawItemLine(ctx, '4. Amount Financed (2 minus 3)', fmt(amountFinanced), { large: true });

  // Panels
  const panelY = ctx.y + 80; // Position right column panels
  drawPanel(ctx, 'As Is - No Dealer Warranty',
    'THE VEHICLE IS SOLD AS IS. The dealer assumes no responsibility for any repairs regardless of any oral statements about the vehicle.',
    { bg: LIGHT_BG, titleColor: BLACK, bodyColor: GRAY_LABEL },
  );
  ctx.y = panelY - 80;
  drawPanel(ctx, 'No Refund Policy',
    'ALL SALES ARE FINAL. The Buyer acknowledges that no refunds, returns, or exchanges will be accepted. The down payment and any subsequent payments are strictly non-refundable.',
    { bg: RED_BG, titleColor: RED_TEXT, bodyColor: RED_TEXT },
  );
  ctx.y -= 20;

  // Due at signing
  const dueAtSigning = Number(data.dueAtSigning) || 0;
  if (dueAtSigning > 0) {
    ensureSpace(ctx, 60);
    drawRect(ctx, MARGIN, ctx.y - 50, CONTENT_W, 50, WARM_BG);
    const dasLabel = 'TOTAL DUE AT SIGNING';
    const dasLabelW = ctx.fontBold.widthOfTextAtSize(dasLabel, 7.5);
    ctx.page.drawText(dasLabel, { x: PAGE_W / 2 - dasLabelW / 2, y: ctx.y - 14, size: 7.5, font: ctx.fontBold, color: GRAY_LABEL });
    const dasVal = fmt(dueAtSigning);
    const dasValW = ctx.fontBold.widthOfTextAtSize(dasVal, 22);
    ctx.page.drawText(dasVal, { x: PAGE_W / 2 - dasValW / 2, y: ctx.y - 38, size: 22, font: ctx.fontBold, color: GOLD });
    ctx.y -= 60;
  }

  // Texas buyer notice
  ensureSpace(ctx, 50);
  drawRect(ctx, MARGIN, ctx.y - 40, CONTENT_W, 40, YELLOW_BG);
  drawText(ctx, 'NOTICE TO THE BUYER - DO NOT SIGN THIS CONTRACT BEFORE YOU READ IT OR IF IT CONTAINS ANY BLANK SPACES. YOU ARE ENTITLED TO A COPY OF THE CONTRACT YOU SIGN.', {
    x: MARGIN + 8, size: 7, font: ctx.fontBold, color: DARK_TEXT, maxWidth: CONTENT_W - 16,
  });
  ctx.y -= 12;

  // GPS Disclosure
  ensureSpace(ctx, 60);
  drawRect(ctx, MARGIN, ctx.y - 60, CONTENT_W, 60, RED_BG);
  const gpsTitle = 'GPS TRACKING & STARTER INTERRUPT DEVICE - DISCLOSURE, CONSENT & AGREEMENT';
  const gpsTitleW = ctx.fontBold.widthOfTextAtSize(gpsTitle, 8);
  ctx.page.drawText(gpsTitle, { x: PAGE_W / 2 - gpsTitleW / 2, y: ctx.y - 12, size: 8, font: ctx.fontBold, color: RED_TEXT });
  drawText(ctx, 'Buyer acknowledges that a GPS tracking device and/or starter interrupt device has been or will be installed in the Vehicle. Buyer provides express written consent pursuant to Texas Penal Code Section 16.06.', {
    x: MARGIN + 8, size: 7, color: RED_TEXT, maxWidth: CONTENT_W - 16,
  });
  ctx.y -= 20;

  // ── Legal Terms ──
  newPage(ctx);
  drawLegalTerms(ctx, [
    '1. PROMISE TO PAY: Buyer promises to pay Holder the principal amount plus interest at the Annual Percentage Rate until paid in full. Buyer will make payments according to the Payment Schedule above.',
    '2. SECURITY INTEREST: Buyer grants Holder a purchase money security interest in the Vehicle described above and all accessions, accessories, and proceeds thereof.',
    '3. LATE CHARGES: If any installment payment remains unpaid for more than fifteen (15) days after its scheduled due date, Holder may collect a delinquency charge of five percent (5%) of the unpaid installment amount.',
    '4. RETURNED PAYMENTS: A fee of $30.00 shall be assessed for any check, electronic payment, or other instrument returned or dishonored for any reason.',
    '5. DEFAULT: Buyer shall be in default if Buyer fails to make any payment when due, fails to maintain required insurance coverage, violates any term of this Contract, or provides false information.',
    '6. ACCELERATION: Upon default, Holder may declare the entire unpaid balance immediately due and payable.',
    '7. RIGHT TO CURE: Upon default, Holder may provide Buyer written notice and a period of not less than ten (10) days to cure such default.',
    '8. REPOSSESSION: Upon default, Holder may take possession of the Vehicle using peaceful means, without breach of the peace, as permitted by Texas law.',
    '9. DEFICIENCY BALANCE: If the Vehicle is sold after repossession and the proceeds are less than the unpaid balance, Buyer remains liable for the deficiency.',
    '10. INSURANCE: Buyer agrees to maintain comprehensive and collision insurance with Holder named as lienholder/loss payee, and liability insurance meeting Texas minimum requirements.',
    '11. PREPAYMENT: Buyer may prepay this Contract in full at any time without penalty.',
    '12. UNAUTHORIZED MODIFICATIONS: Buyer shall not make material alterations without Holder\'s prior written consent.',
    '13. NO COOLING-OFF PERIOD: THERE IS NO COOLING-OFF PERIOD FOR THIS SALE. Once Buyer signs this Contract, Buyer is legally bound.',
    '14. VEHICLE CONDITION ACKNOWLEDGMENT: Buyer acknowledges inspecting or having the opportunity to inspect the Vehicle. THE VEHICLE IS SOLD AS IS.',
    '15. DOCUMENTARY FEE: A DOCUMENTARY FEE IS NOT AN OFFICIAL FEE. It may be charged for handling documents relating to the sale.',
    '16. TOLL VIOLATIONS & CITATIONS: Buyer is solely responsible for all toll charges, traffic citations, and fines incurred.',
    '17. ATTORNEY FEES: If Holder refers this Contract to an attorney, Buyer agrees to pay reasonable attorney\'s fees and collection costs.',
    '18. GOVERNING LAW: This Contract shall be governed by the laws of the State of Texas. Disputes shall be resolved in Harris County, Texas.',
    '19. ENTIRE AGREEMENT: This Contract constitutes the entire agreement between the parties.',
    '20. SEVERABILITY: If any provision is found invalid, the remaining provisions continue in full force.',
  ]);
}

// ============================================================
// RENTAL AGREEMENT PDF — matches RentalPreview.tsx
// ============================================================
async function buildRental(ctx: Ctx, data: Record<string, unknown>, copyLabel?: string): Promise<void> {
  await drawDocHeader(ctx, 'Vehicle Rental Agreement', 'Rental Contract & Terms of Use', copyLabel);

  // ── Renter / Co-Renter ──
  ensureSpace(ctx, 80);
  const partyY = ctx.y;

  ctx.page.drawText('RENTER INFORMATION', { x: MARGIN, y: partyY, size: 7.5, font: ctx.fontBold, color: GRAY_LABEL });
  ctx.page.drawText(sanitize(str(data.renterName)), { x: MARGIN, y: partyY - 16, size: 13, font: ctx.fontBold, color: DARK_TEXT });
  ctx.page.drawText(sanitize(str(data.renterAddress)), { x: MARGIN, y: partyY - 30, size: 9, font: ctx.font, color: GRAY_LABEL });
  ctx.page.drawText(sanitize(str(data.renterPhone)), { x: MARGIN, y: partyY - 42, size: 9, font: ctx.font, color: GRAY_LABEL });
  ctx.page.drawText(sanitize(str(data.renterEmail)), { x: MARGIN, y: partyY - 54, size: 9, font: ctx.font, color: GRAY_LABEL });
  if (data.renterLicense) {
    ctx.page.drawText(sanitize(`DL# ${str(data.renterLicense)}`), { x: MARGIN, y: partyY - 68, size: 9, font: ctx.fontBold, color: DARK_TEXT });
  }

  const rx = MARGIN + COL_2 + 10;
  ctx.page.drawText('ADDITIONAL DRIVER', { x: rx, y: partyY, size: 7.5, font: ctx.fontBold, color: GRAY_LABEL });
  ctx.page.drawText(sanitize(str(data.coRenterName)), { x: rx, y: partyY - 16, size: 13, font: ctx.fontBold, color: DARK_TEXT });
  ctx.page.drawText(sanitize(str(data.coRenterAddress)), { x: rx, y: partyY - 30, size: 9, font: ctx.font, color: GRAY_LABEL });
  ctx.page.drawText(sanitize(str(data.coRenterPhone)), { x: rx, y: partyY - 42, size: 9, font: ctx.font, color: GRAY_LABEL });
  ctx.page.drawText(sanitize(str(data.coRenterEmail)), { x: rx, y: partyY - 54, size: 9, font: ctx.font, color: GRAY_LABEL });
  if (data.coRenterLicense) {
    ctx.page.drawText(sanitize(`DL# ${str(data.coRenterLicense)}`), { x: rx, y: partyY - 68, size: 9, font: ctx.fontBold, color: DARK_TEXT });
  }
  ctx.y = partyY - 84;

  // ── Vehicle table ──
  drawSectionLabel(ctx, 'Vehicle Description');
  drawTable(ctx,
    ['Year', 'Make', 'Model', 'VIN', 'Plate', 'Mi. Out', 'Mi. In'],
    [[str(data.vehicleYear), str(data.vehicleMake), str(data.vehicleModel), str(data.vehicleVin).toUpperCase(), str(data.vehiclePlate).toUpperCase(), str(data.mileageOut), str(data.mileageIn)]],
  );
  // Fuel levels
  if (data.fuelLevelOut || data.fuelLevelIn) {
    ctx.page.drawText('FUEL OUT:', { x: MARGIN, y: ctx.y, size: 7.5, font: ctx.fontBold, color: GRAY_LABEL });
    ctx.page.drawText(sanitize(str(data.fuelLevelOut)), { x: MARGIN + 55, y: ctx.y, size: 9, font: ctx.font, color: DARK_TEXT });
    ctx.page.drawText('FUEL IN:', { x: MARGIN + COL_2, y: ctx.y, size: 7.5, font: ctx.fontBold, color: GRAY_LABEL });
    ctx.page.drawText(sanitize(str(data.fuelLevelIn)), { x: MARGIN + COL_2 + 50, y: ctx.y, size: 9, font: ctx.font, color: DARK_TEXT });
    ctx.y -= 18;
  }

  // ── Rental Summary Boxes ──
  const rate = Number(data.rentalRate) || 0;
  const period = str(data.rentalPeriod) as 'Daily' | 'Weekly' | 'Monthly';
  const duration = calculateRentalDuration(str(data.rentalStartDate), str(data.rentalEndDate), period);
  const secDep = Number(data.securityDeposit) || 0;
  const insFee = Number(data.insuranceFee) || 0;
  const addlDriver = Number(data.additionalDriverFee) || 0;
  const taxRate = Number(data.tax) || 0;
  const dueAtSigning = Number(data.dueAtSigning) || 0;
  const periodLabel = period === 'Daily' ? 'Day(s)' : period === 'Weekly' ? 'Week(s)' : 'Month(s)';

  const calc = calculateRentalTotal({
    rentalRate: rate, rentalPeriod: period,
    rentalStartDate: str(data.rentalStartDate), rentalEndDate: str(data.rentalEndDate),
    securityDeposit: secDep, mileageAllowance: Number(data.mileageAllowance) || 0,
    excessMileageCharge: Number(data.excessMileageCharge) || 0,
    insuranceFee: insFee, additionalDriverFee: addlDriver, tax: taxRate,
  } as never);

  drawSectionLabel(ctx, 'Rental Summary');
  drawSummaryBoxes(ctx, [
    { title: 'Rental Period', desc: 'Duration of the rental agreement.', value: `${duration} ${periodLabel}` },
    { title: 'Base Rental', desc: 'Total rental charges before fees and tax.', value: fmt(calc.baseRental) },
    { title: 'Security Deposit', desc: 'Refundable deposit held for the rental term.', value: fmt(secDep) },
    { title: 'Total Due at Signing', desc: 'Amount due before vehicle pickup.', value: fmt(dueAtSigning > 0 ? dueAtSigning : calc.totalDue) },
  ]);

  // ── Payment Schedule table ──
  drawSectionLabel(ctx, 'Payment Schedule');
  const periodSingular = period === 'Daily' ? 'day' : period === 'Weekly' ? 'week' : 'month';
  const schedule = generateRentalSchedule({
    rentalRate: rate, rentalPeriod: period,
    rentalStartDate: str(data.rentalStartDate), rentalEndDate: str(data.rentalEndDate),
    securityDeposit: secDep, mileageAllowance: Number(data.mileageAllowance) || 0,
    excessMileageCharge: Number(data.excessMileageCharge) || 0,
    insuranceFee: insFee, additionalDriverFee: addlDriver, tax: taxRate,
  } as never);
  const perPeriodAmount = schedule.length > 0 ? schedule[0].amountDue : 0;

  drawTable(ctx,
    ['# Payments', `Amount per ${periodSingular}`, 'When Due', 'Pickup Date', 'Return Date'],
    [[String(duration), fmt(perPeriodAmount), `${period} beginning ${str(data.rentalStartDate)}`, str(data.rentalStartDate), str(data.rentalEndDate)]],
    { headerBg: true },
  );

  // ── PAGE 2: Itemization + Policies ──
  newPage(ctx);

  drawSectionLabel(ctx, 'Itemization of Charges');
  drawItemLine(ctx, `1. Base Rental (${duration} ${periodLabel} @ ${fmt(rate)})`, fmt(calc.baseRental));
  drawItemLine(ctx, 'a. Insurance Fee', fmt(calc.insuranceTotal), { indent: true });
  drawItemLine(ctx, 'b. Additional Driver Fee', fmt(calc.additionalDriverTotal), { indent: true });
  drawItemLine(ctx, '2. Subtotal', fmt(calc.subtotal), { bold: true, borderTop: true });
  drawItemLine(ctx, `Sales Tax (${taxRate}%)`, fmt(calc.taxAmount), { indent: true });
  drawItemLine(ctx, '3. Total Rental Charges', fmt(calc.grandTotal), { bold: true, borderTop: true });
  drawItemLine(ctx, '4. Security Deposit (Refundable)', fmt(secDep), { borderBottom: true });
  drawItemLine(ctx, '5. Total Due at Signing', fmt(dueAtSigning > 0 ? dueAtSigning : calc.totalDue), { large: true });

  // Right column panels
  const savedY = ctx.y;
  drawPanel(ctx, 'Vehicle Condition',
    'THE VEHICLE IS PROVIDED IN ITS CURRENT CONDITION. The renter acknowledges inspecting the vehicle prior to rental and accepts its current condition. Any pre-existing damage has been documented on a separate vehicle condition report.',
    { bg: LIGHT_BG, titleColor: BLACK, bodyColor: GRAY_LABEL },
  );
  ctx.y = savedY - 80;

  const mileAllow = Number(data.mileageAllowance) || 0;
  const excessChg = Number(data.excessMileageCharge) || 0;
  const mileageText = mileAllow > 0
    ? `MILEAGE ALLOWANCE: ${mileAllow} miles per ${periodSingular}. ${excessChg > 0 ? `Excess mileage charged at ${fmt(excessChg)} per mile.` : ''}`
    : 'MILEAGE ALLOWANCE: Unlimited.';
  drawPanel(ctx, 'Mileage Policy',
    `${mileageText} The renter is responsible for all fuel consumed during the rental period.`,
    { bg: RED_BG, titleColor: RED_TEXT, bodyColor: RED_TEXT },
  );
  ctx.y -= 20;

  // GPS Disclosure
  ensureSpace(ctx, 60);
  drawRect(ctx, MARGIN, ctx.y - 50, CONTENT_W, 50, RED_BG);
  const gpsTitle = 'GPS TRACKING DEVICE - DISCLOSURE & CONSENT';
  const gpsTitleW = ctx.fontBold.widthOfTextAtSize(gpsTitle, 8);
  ctx.page.drawText(gpsTitle, { x: PAGE_W / 2 - gpsTitleW / 2, y: ctx.y - 12, size: 8, font: ctx.fontBold, color: RED_TEXT });
  drawText(ctx, 'Renter acknowledges and consents that the Vehicle is equipped with a GPS tracking device. Renter provides express written consent pursuant to Texas Penal Code Section 16.06. Tampering with the GPS device constitutes a material breach.', {
    x: MARGIN + 8, size: 7, color: RED_TEXT, maxWidth: CONTENT_W - 16,
  });
  ctx.y -= 12;

  // ── Legal Terms ──
  newPage(ctx);
  drawLegalTerms(ctx, [
    '1. RENTAL AGREEMENT: Renter agrees to rent the Vehicle for the specified period at the agreed rate. The Vehicle remains the property of Owner at all times.',
    '2. AUTHORIZED DRIVERS: Only the Renter and any listed additional drivers may operate the Vehicle. All drivers must possess a valid driver\'s license.',
    '3. INSURANCE: Renter warrants maintaining automobile liability insurance meeting Texas minimum requirements and comprehensive and collision coverage during the entire rental period.',
    '4. VEHICLE CONDITION: At delivery, Owner and Renter shall jointly inspect the Vehicle. Upon return, any new damage shall be Renter\'s sole responsibility.',
    '5. PROHIBITED USE: The Vehicle shall NOT be used by unauthorized persons, for illegal purposes, commercial purposes, ride-sharing, off-road, racing, or outside Texas without written consent.',
    '6. LATE RETURN: Additional charges at the daily rate plus a $50.00 late fee per day. Failure to return within 48 hours may be reported to law enforcement.',
    '7. LATE PAYMENT: A late fee of $25.00 per day. A fee of $30.00 for returned payments.',
    '8. ACCIDENT & THEFT REPORTING: Renter must immediately contact law enforcement and notify Owner within 24 hours of any accident, collision, theft, or damage.',
    '9. TOWING & IMPOUND: Renter is solely responsible for all towing, impound, and storage fees incurred due to Renter\'s actions.',
    '10. TOLL VIOLATIONS & CITATIONS: Renter is solely responsible for all toll charges, parking tickets, and traffic citations plus $25.00 administrative fee.',
    '11. MAINTENANCE: Renter shall maintain proper fluid levels and tire pressure. No repairs or modifications without Owner\'s consent.',
    '12. SMOKING & PET POLICY: Smoking and pets are strictly PROHIBITED. Violation incurs a $300.00 cleaning fee plus actual restoration costs.',
    '13. KEY REPLACEMENT: Renter is responsible for all keys and fobs. Lost keys charged at actual replacement cost.',
    '14. VEHICLE BREAKDOWN: Notify Owner immediately. No third-party repairs without consent.',
    '15. OWNER\'S RIGHT TO RECOVER: Owner may immediately terminate and take possession upon default, without prior notice, provided no breach of the peace.',
    '16. EARLY TERMINATION: Renter may terminate early by returning the Vehicle and paying all amounts owed through return date.',
    '17. PERSONAL PROPERTY: Owner assumes no responsibility for personal property left in the Vehicle.',
    '18. INDEMNIFICATION: Renter agrees to indemnify and hold harmless Owner from all claims arising from Renter\'s use of the Vehicle.',
    '19. GOVERNING LAW: This Agreement shall be governed by Texas law. Disputes resolved in Harris County, Texas.',
    '20. SECURITY DEPOSIT: Refunded within 14 days of return, less deductions for damage, unpaid charges, or excessive cleaning.',
  ]);
}


// ============================================================
// MAIN ENTRY POINT
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

  // Signatures (on current or new page depending on space)
  const sigLabels = decoded.s === 'rental'
    ? { buyer: 'Renter Signature', coBuyer: 'Additional Driver Signature', dealer: 'Triple J Auto Representative' }
    : { buyer: 'Buyer Signature', coBuyer: 'Co-Buyer Signature', dealer: 'Triple J Auto Representative' };
  newPage(ctx);
  await drawSignatures(ctx, decoded, sigLabels);

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
      color: rgb(0.75, 0.75, 0.75),
      font,
    });
  }

  return doc.save();
}
