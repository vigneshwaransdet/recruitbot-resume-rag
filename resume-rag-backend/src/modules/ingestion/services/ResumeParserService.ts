import fs from "fs";
// Use the pdfjs-dist v2 legacy CommonJS build. It extracts text reliably
// under ts-node-dev and avoids the bundled-pdf.js issues seen with
// pdf-parse@1 in this environment.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfjs = require("pdfjs-dist/legacy/build/pdf.js");

/**
 * ResumeParserService
 *
 * Converts an uploaded PDF into raw text using pdfjs-dist.
 */
export class ResumeParserService {
  /**
   * Extract raw text from a PDF file on disk.
   *
   * @param filePath absolute path to the temporary uploaded PDF
   * @returns extracted raw text (trimmed; may be empty if the PDF has
   *          no extractable text, e.g. a scanned/image-only PDF)
   */
  async extractTextFromPdf(filePath: string): Promise<string> {
    const fileBuffer = await fs.promises.readFile(filePath);
    const data = new Uint8Array(fileBuffer);

    const doc = await pdfjs.getDocument({
      data,
      isEvalSupported: false,
      useSystemFonts: true,
    }).promise;

    const pageTexts: string[] = [];
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const page = await doc.getPage(pageNum);
      const content = await page.getTextContent();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pageText = content.items.map((item: any) => item.str).join(" ");
      pageTexts.push(pageText);
    }

    // Best-effort cleanup of pdf.js internal resources.
    try {
      await doc.cleanup();
      await doc.destroy();
    } catch {
      /* ignore */
    }

    return pageTexts.join("\n").trim();
  }
}
