import puppeteer from 'puppeteer-core';
import { createClient } from '@/lib/supabase/server';
import { existsSync } from 'fs';

// ============================================================
// PDF Generator — Puppeteer renders HTML preview to PDF
//
// FLOW:
//   1. Verify agreement exists in Supabase
//   2. Launch headless Chromium
//   3. Navigate to /documents/render/[id] (same React components)
//   4. Wait for .print-doc selector (proves real doc, not error page)
//   5. Generate PDF with page.pdf()
//   6. Return PDF buffer
//
// The render route uses BillOfSalePreview, ContractPreview, or
// RentalPreview — so the PDF matches the HTML preview exactly.
//
//  ┌────────────┐     ┌──────────────────┐     ┌───────────┐
//  │ API Route  │────►│  generatePdf()   │────►│ Chromium  │
//  │ or Finalize│     │  launch browser  │     │ headless  │
//  └────────────┘     └──────────────────┘     └─────┬─────┘
//                                                    │
//                     ┌──────────────────┐           │
//                     │ /documents/      │◄──────────┘
//                     │ render/[id]      │  page.goto()
//                     │ (Server Comp.)   │
//                     └────────┬─────────┘
//                              │
//                     ┌────────▼─────────┐
//                     │ Preview Component│
//                     │ + Tailwind CSS   │
//                     │ + Print CSS      │
//                     └────────┬─────────┘
//                              │
//                     ┌────────▼─────────┐
//                     │   page.pdf()     │
//                     │   Letter size    │
//                     │   @media print   │
//                     └──────────────────┘
// ============================================================

const IS_SERVERLESS = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION);

// Common Chrome install paths by platform
const LOCAL_CHROME_PATHS: Record<string, string[]> = {
  win32: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    `${process.env.LOCALAPPDATA || ''}\\Google\\Chrome\\Application\\chrome.exe`,
  ],
  darwin: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ],
  linux: [
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ],
};

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return `http://localhost:${process.env.PORT || 3000}`;
}

async function getLocalChromePath(): Promise<string> {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;

  const paths = LOCAL_CHROME_PATHS[process.platform] || [];
  for (const p of paths) {
    if (p && existsSync(p)) return p;
  }

  throw new Error(
    `Chrome not found. Install Google Chrome or set CHROME_PATH env var.\n` +
    `Searched: ${paths.filter(Boolean).join(', ')}`,
  );
}

async function launchBrowser() {
  if (IS_SERVERLESS) {
    const chromium = (await import('@sparticuz/chromium')).default;
    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1200, height: 1600 },
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  return puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1200, height: 1600 },
    executablePath: await getLocalChromePath(),
    headless: true,
  });
}

export async function generatePdf({
  agreementId,
  copyLabel,
}: {
  agreementId: string;
  copyLabel: string;
}): Promise<Buffer> {
  // 1. Verify agreement has completed data
  const supabase = await createClient();
  const { data: agreement, error } = await supabase
    .from('document_agreements')
    .select('id, completed_link')
    .eq('id', agreementId)
    .single();

  if (error || !agreement?.completed_link) {
    throw new Error(`Agreement ${agreementId} not found or has no completed data`);
  }

  // 2. Build render URL
  const token = process.env.INTERNAL_RENDER_TOKEN;
  if (!token) {
    throw new Error('INTERNAL_RENDER_TOKEN environment variable is required for PDF generation');
  }

  const baseUrl = getBaseUrl();
  const renderUrl = `${baseUrl}/documents/render/${agreementId}?copy=${encodeURIComponent(copyLabel)}&token=${encodeURIComponent(token)}`;

  // 3. Launch Chromium and generate PDF
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();

    // Navigate to render route, wait for all resources (images, fonts, CSS)
    await page.goto(renderUrl, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Verify document rendered (not an error page)
    await page.waitForSelector('.print-doc', { timeout: 10000 });

    // Generate PDF — uses @page CSS rules from globals.css
    // (Letter size, 0.35in margins, print-color-adjust: exact)
    const pdfUint8 = await page.pdf({
      format: 'letter',
      printBackground: true,
      preferCSSPageSize: true,
    });

    return Buffer.from(pdfUint8);
  } finally {
    await browser.close();
  }
}
