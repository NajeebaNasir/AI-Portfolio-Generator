import pdf from 'pdf-parse';

export class PdfParser {
  public static async parse(buffer: Buffer): Promise<string> {
    try {
      const extractedUrls: string[] = [];

      const data = await pdf(buffer, {
        pagerender: async (pageData: any) => {
          try {
            const annotations = await pageData.getAnnotations();
            if (Array.isArray(annotations)) {
              for (const ann of annotations) {
                if (ann && ann.subtype === 'Link' && (ann.url || ann.unsafeUrl)) {
                  const targetUrl = ann.url || ann.unsafeUrl;
                  if (targetUrl && !extractedUrls.includes(targetUrl)) {
                    extractedUrls.push(targetUrl);
                  }
                }
              }
            }
          } catch (annErr) {
            console.warn('[PdfParser] Could not extract page annotations:', annErr);
          }

          const textContent = await pageData.getTextContent({ normalizeWhitespace: true });
          return PdfParser.renderPage(textContent);
        },
      });

      let fullText = data.text || '';

      if (extractedUrls.length > 0) {
        fullText += '\n\n---\nEmbedded PDF Links Found:\n';
        for (const url of extractedUrls) {
          fullText += `URL: ${url}\n`;
        }
      }

      if (!fullText || fullText.trim().length === 0) {
        throw new Error(
          'PDF appears to be empty or consists exclusively of scanned images (OCR required).'
        );
      }

      return fullText;
    } catch (err: any) {
      console.error('[PdfParser] Error parsing PDF:', err?.message || err);
      throw new Error(`Failed to extract text from PDF: ${err.message}`);
    }
  }

  /**
   * Converts a PDF page's text items into structured markdown-like plain text.
   *
   * WHY THIS APPROACH:
   * The naive Y-coordinate approach interleaves left-column and right-column
   * content from two-column resume layouts, causing the LLM to misclassify
   * entries (e.g. an education entry appearing inside the Projects block).
   *
   * We can't fix this with geometry heuristics because every resume has a
   * different layout — column widths, margins, and item positions vary freely.
   *
   * Instead, we use FONT METADATA:
   * - Section headers in virtually every professional resume are bold and/or
   *   ALL-CAPS regardless of their position on the page.
   * - Normal body text and bullet points are regular weight.
   *
   * This approach is layout-agnostic: it doesn't care whether the resume is
   * single-column, two-column, or sidebar-based. It detects importance from
   * the text itself, not from geometry.
   *
   * OUTPUT FORMAT:
   * Section headers  → ## Header
   * Sub-headers/roles → ### Sub-header  (bold but not ALL-CAPS)
   * Bullet items     → - item
   * Normal lines     → plain text
   *
   * This gives the LLM clear structural signal: it knows exactly where each
   * section starts and what is a header vs content regardless of original layout.
   */
  private static renderPage(textContent: any): string {
    const items: any[] = textContent.items || [];
    if (items.length === 0) return '';

    // ------------------------------------------------------------------
    // Step 1: Group items into visual lines by Y coordinate.
    // Use a generous tolerance so items on the same baseline are merged.
    // Sort items within each line left-to-right by X so reading order is
    // preserved even when columns interleave in the raw stream.
    // ------------------------------------------------------------------
    const Y_TOLERANCE = 3;

    interface RichItem {
      x: number;
      y: number;
      str: string;
      fontName: string;
      height: number;
    }

    const richItems: RichItem[] = items
      .map((it: any) => ({
        x: it.transform[4],
        y: it.transform[5],
        str: (it.str || '').replace(/\s+/g, ' '),
        fontName: (it.fontName || '').toLowerCase(),
        height: it.height || 0,
      }))
      .filter((it: RichItem) => it.str.trim().length > 0);

    // Sort top-to-bottom (descending Y in PDF space = top of page first),
    // then left-to-right within the same Y band.
    richItems.sort((a, b) => b.y - a.y || a.x - b.x);

    interface Line {
      y: number;
      items: RichItem[];
    }

    const lines: Line[] = [];
    for (const item of richItems) {
      const last = lines[lines.length - 1];
      if (last && Math.abs(item.y - last.y) <= Y_TOLERANCE) {
        last.items.push(item);
      } else {
        lines.push({ y: item.y, items: [item] });
      }
    }

    // Within each line, sort left-to-right
    for (const line of lines) {
      line.items.sort((a, b) => a.x - b.x);
    }

    // ------------------------------------------------------------------
    // Step 2: Classify each line using font metadata and text patterns.
    //
    // isBold:    font name contains 'bold' — standard across all PDF fonts
    // isAllCaps: every alphabetic character is uppercase and line >= 3 chars
    // isBullet:  line starts with a bullet character or common bullet proxies
    //
    // Classification rules (in priority order):
    //  SECTION HEADER  = (bold OR all-caps) AND short line (< 60 chars)
    //                    AND not a date/number-only line
    //  SUB-HEADER      = bold AND longer line (role titles, company names)
    //  BULLET          = starts with bullet char
    //  BODY            = everything else
    // ------------------------------------------------------------------
    interface ClassifiedLine {
      text: string;
      type: 'section' | 'subheader' | 'bullet' | 'body';
    }

    const BULLET_CHARS = /^[\-•·►▸▶‣⁃*]\s+/;
    const DATE_RE = /^\d{4}|^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i;
    // Bold font names across PDF generators: Adobe, LibreOffice, Google Docs,
    // Microsoft Word each use different conventions. Cover all common patterns.
    const BOLD_FONT_RE = /bold|bd|demi|heavy|black|semibold|extrabold|ultrabold/i;

    // Compute median font height across all items on the page.
    // Items taller than 1.2× median are likely headers even when font name
    // gives no bold signal (e.g. PDFs with non-standard embedded font names).
    const heights = richItems.map((it) => it.height).filter((h) => h > 0).sort((a, b) => a - b);
    const medianHeight = heights.length > 0 ? heights[Math.floor(heights.length / 2)] : 0;
    const HEIGHT_HEADER_THRESHOLD = medianHeight * 1.25;

    const classified: ClassifiedLine[] = lines.map((line) => {
      const text = line.items.map((it) => it.str).join(' ').trim();
      if (!text) return { text, type: 'body' as const };

      // Bold: match any item in the line whose font name signals bold weight,
      // OR whose height is significantly above the page median.
      const isBold = line.items.some(
        (it) => BOLD_FONT_RE.test(it.fontName) || (it.height > 0 && it.height >= HEIGHT_HEADER_THRESHOLD)
      );
      const alphabetic = text.replace(/[^a-zA-Z]/g, '');
      const isAllCaps = alphabetic.length >= 3 && alphabetic === alphabetic.toUpperCase();
      const isBullet = BULLET_CHARS.test(text);
      const isShort = text.length < 80;  // raised from 60 — project titles can be longer
      const isDateLine = DATE_RE.test(text);

      if (isBullet) {
        return { text: text.replace(BULLET_CHARS, '').trim(), type: 'bullet' as const };
      }

      // Section headers: ALL-CAPS short non-date lines are always section headers
      if (isAllCaps && isShort && !isDateLine) {
        return { text, type: 'section' as const };
      }

      // Bold lines: distinguish section headers from sub-headers by word count.
      // Section headers tend to be 1–4 words ("Projects", "Work Experience").
      // Sub-headers are role/project titles and can be longer.
      if (isBold && isShort && !isDateLine) {
        const wordCount = text.trim().split(/\s+/).length;
        if (wordCount <= 5) {
          return { text, type: 'section' as const };
        }
        return { text, type: 'subheader' as const };
      }

      // Longer bold lines (project titles with tech stacks, company names)
      if (isBold && !isDateLine) {
        return { text, type: 'subheader' as const };
      }

      return { text, type: 'body' as const };
    });

    // ------------------------------------------------------------------
    // Step 3: Render to structured plain text.
    // Collapse consecutive blank lines. Add a blank line before sections.
    // ------------------------------------------------------------------
    const outputLines: string[] = [];

    for (const cl of classified) {
      if (!cl.text) continue;

      switch (cl.type) {
        case 'section':
          // Blank line before each section header for clear separation
          if (outputLines.length > 0) outputLines.push('');
          outputLines.push(`## ${cl.text}`);
          break;
        case 'subheader':
          outputLines.push(`### ${cl.text}`);
          break;
        case 'bullet':
          outputLines.push(`- ${cl.text}`);
          break;
        case 'body':
          outputLines.push(cl.text);
          break;
      }
    }

    return outputLines.join('\n');
  }
}
