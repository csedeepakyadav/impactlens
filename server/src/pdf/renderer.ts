import puppeteer, { type Browser } from 'puppeteer';
import type { ImpactReport } from '../../../shared/types.ts';
import { buildReportHtml, headerTemplate, footerTemplate } from './template.ts';

let browserPromise: Promise<Browser> | null = null;

async function launch(): Promise<Browser> {
  // Prefer the system Chrome install; fall back to Puppeteer's bundled browser.
  try {
    return await puppeteer.launch({ headless: true, channel: 'chrome' });
  } catch {
    return await puppeteer.launch({ headless: true });
  }
}

function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = launch();
    // If launch fails, allow a retry on the next request.
    browserPromise.catch(() => (browserPromise = null));
  }
  return browserPromise;
}

export async function renderPdf(report: ImpactReport): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(buildReportHtml(report), { waitUntil: 'load' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: headerTemplate(),
      footerTemplate: footerTemplate(report.meta.id),
      margin: { top: '24mm', bottom: '20mm', left: '18mm', right: '18mm' },
    });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}
