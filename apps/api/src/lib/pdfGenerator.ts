import puppeteer, { Browser } from "puppeteer";
import type { ExportFormat, ExportOrientation } from "@school-mgt/types";

// ============================================================================
// PDF GENERATOR (HTML → PDF via Puppeteer)
// ============================================================================

export class PdfGenerator {
  private browser: Browser | null = null;

  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
      });
    }
    return this.browser;
  }

  async htmlToPdf(
    html: string,
    options?: { format?: ExportFormat; orientation?: ExportOrientation },
  ): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      await page.setContent(html, {
        // FIX : "networkidle0" retiré des types Puppeteer récents — on attend
        // "load" puis "domcontentloaded" pour un équivalent fiable
        waitUntil: ["load", "domcontentloaded"],
        timeout: 30000,
      });
      const pdf = await page.pdf({
        format: options?.format ?? "A4",
        landscape: options?.orientation === "landscape",
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: "15mm", right: "12mm", bottom: "15mm", left: "12mm" },
      });
      return Buffer.from(pdf);
    } finally {
      await page.close();
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export const pdfGenerator = new PdfGenerator();
