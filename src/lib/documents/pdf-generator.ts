import puppeteer from 'puppeteer-core';

// ============================================================
// PDF Generator — Puppeteer-based PDF generation
//
// FLOW:
//   1. Launch headless Chrome (Vercel: @sparticuz/chromium, local: system Chrome)
//   2. Navigate to /documents/render/[id]?copy=LABEL&token=SECRET
//   3. Wait for page to fully render
//   4. Generate PDF with letter-size pages + print background
//   5. Return PDF buffer
// ============================================================

async function getExecutablePath(): Promise<string> {
  // Allow explicit override via env var
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;

  // Production (Vercel): use @sparticuz/chromium
  try {
    const chromium = await import('@sparticuz/chromium');
    return await chromium.default.executablePath();
  } catch {
    // Local development: find system Chrome
    const { existsSync } = await import('fs');
    const candidates = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ];
    const found = candidates.find(p => existsSync(p));
    if (found) return found;
    throw new Error('No Chrome/Chromium found. Set CHROMIUM_PATH env var.');
  }
}

async function getChromiumArgs(): Promise<string[]> {
  try {
    const chromium = await import('@sparticuz/chromium');
    return chromium.default.args;
  } catch {
    return ['--no-sandbox', '--disable-setuid-sandbox'];
  }
}

export interface GeneratePdfOptions {
  agreementId: string;
  copyLabel: string; // e.g., "BUYER COPY" or "DEALER COPY"
}

export async function generatePdf({ agreementId, copyLabel }: GeneratePdfOptions): Promise<Buffer> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  const token = process.env.INTERNAL_RENDER_TOKEN;
  if (!token) throw new Error('INTERNAL_RENDER_TOKEN not set');

  const url = `${baseUrl}/documents/render/${agreementId}?copy=${encodeURIComponent(copyLabel)}&token=${encodeURIComponent(token)}`;

  const executablePath = await getExecutablePath();
  const args = await getChromiumArgs();

  const browser = await puppeteer.launch({
    args,
    executablePath,
    headless: true,
  });

  try {
    const page = await browser.newPage();

    // Navigate and wait for full render
    const response = await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    if (!response || response.status() !== 200) {
      throw new Error(`Render route returned ${response?.status() || 'no response'}`);
    }

    // Wait for fonts and images
    await page.waitForFunction(() => document.fonts.ready.then(() => true), { timeout: 10000 });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      margin: { top: '0.35in', right: '0.35in', bottom: '0.35in', left: '0.35in' },
      printBackground: true,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
