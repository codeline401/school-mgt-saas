import puppeteer, { Browser, PaperFormat } from "puppeteer";
import type { ExportFormat, ExportOrientation } from "@school-mgt/types";

// ============================================================================
// PDF GENERATOR (HTML → PDF via Puppeteer)
// ============================================================================

export class PdfGenerator {
  private browser: Browser | null = null;
  private browserPromise: Promise<Browser> | null = null;

  private async getBrowser(): Promise<Browser> {
    if (this.browser) return this.browser;
    if (!this.browserPromise) {
      this.browserPromise = puppeteer
        .launch({
          headless: true,
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
          ],
        })
        .then((browser) => {
          this.browser = browser;
          return browser;
        })
        .finally(() => {
          this.browserPromise = null;
        });
    }
    return this.browserPromise;
  }

  async htmlToPdf(
    html: string,
    options?: {
      format?: ExportFormat | "A5" | "THERMAL"; // fix reveiw
      orientation?: ExportOrientation;
    },
  ): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      await page.setContent(html, {
        waitUntil: ["load", "domcontentloaded"],
        timeout: 30000,
      });

      // Si le format est "THERMAL", on ne passe pas de paperFormat à Puppeteer :
      // il utilisera la taille définie dans la règle CSS @page du HTML
      const isThermal = options?.format === "THERMAL";
      const paperFormat: PaperFormat | undefined = isThermal
        ? undefined
        : ((options?.format as PaperFormat) ?? "A4");

      const pdf = await page.pdf({
        format: paperFormat,
        preferCSSPageSize: true, // Priorité aux dimensions CSS @page
        landscape: options?.orientation === "landscape",
        printBackground: true,
        margin: isThermal
          ? { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" }
          : { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
      });

      return Buffer.from(pdf);
    } finally {
      await page.close();
    }
  }
}

export const pdfGenerator = new PdfGenerator();
