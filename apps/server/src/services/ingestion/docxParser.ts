import mammoth from 'mammoth';

export class DocxParser {
  public static async parse(buffer: Buffer): Promise<string> {
    try {
      // Use convertToHtml instead of extractRawText.
      //
      // extractRawText strips all formatting — heading styles, bold, bullets,
      // and tables are all flattened to a single stream of plain text with no
      // structural signal.  The LLM then has to guess what is a section header
      // and what is body content from word patterns alone.
      //
      // convertToHtml preserves the DOCX semantic structure:
      //   Word Heading 1/2/3  → <h1>, <h2>, <h3>
      //   Bullet paragraphs   → <ul><li>
      //   Bold runs           → <strong>
      //   Tables              → <table><tr><td>
      //
      // We then convert that HTML into the same structured markdown format
      // that pdfParser produces, giving the LLM a consistent input regardless
      // of whether the user uploaded a PDF or DOCX.
      const result = await mammoth.convertToHtml({ buffer });

      if (!result.value || result.value.trim().length === 0) {
        throw new Error('DOCX document appears to be empty.');
      }

      const structured = DocxParser.htmlToStructuredText(result.value);

      if (!structured || structured.trim().length === 0) {
        throw new Error('DOCX document produced no extractable text.');
      }

      return structured;
    } catch (err: any) {
      console.error('[DocxParser] Error parsing DOCX:', err?.message || err);
      throw new Error(`Failed to extract text from DOCX: ${err.message}`);
    }
  }

  /**
   * Converts mammoth HTML output to structured plain text using the same
   * ## / ### / - format that pdfParser produces.
   *
   * Mapping:
   *   <h1>          → ## (treated as section header — same level as PDF sections)
   *   <h2>          → ## section header
   *   <h3>          → ### sub-header (role/company/project title)
   *   <h4>–<h6>     → ### sub-header
   *   <ul><li>      → - bullet
   *   <ol><li>      → - bullet
   *   <strong> only → ### sub-header (if the entire paragraph is bold)
   *   <table>       → each cell on its own line, rows separated by |
   *   <p>           → plain body text
   */
  private static htmlToStructuredText(html: string): string {
    const lines: string[] = [];

    // Normalise — remove newlines inside the HTML string so our regex
    // patterns work cleanly across tag boundaries
    const flat = html.replace(/\r?\n/g, ' ').replace(/\s{2,}/g, ' ');

    // Extract all top-level block elements in document order
    // We process tags sequentially by scanning the HTML left to right
    let remaining = flat;

    // Helper: strip all HTML tags from a string and decode basic entities
    const stripTags = (s: string): string =>
      s
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#\d+;/g, '')
        .replace(/&[a-zA-Z]+;/g, '')
        .trim();

    // Helper: check if a paragraph's entire content is wrapped in <strong>
    const isEntirelyBold = (inner: string): boolean => {
      const textOnly = stripTags(inner);
      const boldContent = stripTags(inner.replace(/<strong>(.*?)<\/strong>/gi, '$1'));
      // If stripping strong tags gives the same text, the whole thing is bold
      return textOnly.length > 0 && boldContent.length === textOnly.length;
    };

    // Process tag by tag
    const blockTagRe = /<(h[1-6]|p|ul|ol|table|tr|li|td|th)\b[^>]*>([\s\S]*?)<\/\1>/gi;
    let match: RegExpExecArray | null;

    // We need a sequential (non-overlapping, ordered) approach.
    // Use a simple state machine: scan for the next block-level open tag.
    const processBlock = (tagName: string, inner: string): void => {
      const text = stripTags(inner).replace(/\s+/g, ' ').trim();
      if (!text) return;

      switch (tagName) {
        case 'h1':
        case 'h2':
          if (lines.length > 0) lines.push('');
          lines.push(`## ${text}`);
          break;

        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          lines.push(`### ${text}`);
          break;

        case 'p': {
          // A paragraph that is entirely bold and short acts as a sub-header
          if (isEntirelyBold(inner) && text.length < 80) {
            lines.push(`### ${text}`);
          } else {
            lines.push(text);
          }
          break;
        }

        case 'li':
          lines.push(`- ${text}`);
          break;

        case 'td':
        case 'th':
          // Table cells: inline with pipe separator (handled at tr level below)
          break;

        default:
          break;
      }
    };

    // Flatten nested HTML into sequential block elements
    // Walk through the HTML collecting block elements in order
    // Strategy: replace block elements with placeholder tokens in order,
    // then process each token
    const tokens: Array<{ tag: string; inner: string }> = [];

    // Extract list items first (inside ul/ol)
    const listRe = /<(?:ul|ol)[^>]*>([\s\S]*?)<\/(?:ul|ol)>/gi;
    let listified = flat.replace(listRe, (_, listContent) => {
      const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let liMatch;
      let result = '';
      while ((liMatch = liRe.exec(listContent)) !== null) {
        const liText = stripTags(liMatch[1]).replace(/\s+/g, ' ').trim();
        if (liText) result += `\n- ${liText}`;
      }
      return result;
    });

    // Extract table rows
    listified = listified.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (_, tableContent) => {
      const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      let rowMatch;
      let result = '';
      while ((rowMatch = rowRe.exec(tableContent)) !== null) {
        const cells: string[] = [];
        const cellRe = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
        let cellMatch;
        while ((cellMatch = cellRe.exec(rowMatch[1])) !== null) {
          const cellText = stripTags(cellMatch[1]).replace(/\s+/g, ' ').trim();
          if (cellText) cells.push(cellText);
        }
        if (cells.length > 0) result += '\n' + cells.join(' | ');
      }
      return result;
    });

    // Extract headings and paragraphs
    const blockRe = /<(h[1-6]|p)\b[^>]*>([\s\S]*?)<\/\1>/gi;
    let blockMatch;
    let output = listified;

    output = output.replace(/<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, tag, inner) => {
      const text = stripTags(inner).replace(/\s+/g, ' ').trim();
      if (!text) return '';
      if (tag === 'h1' || tag === 'h2') return `\n\n## ${text}`;
      return `\n### ${text}`;
    });

    output = output.replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, (_, inner) => {
      const text = stripTags(inner).replace(/\s+/g, ' ').trim();
      if (!text) return '';
      if (isEntirelyBold(inner) && text.length < 80) return `\n### ${text}`;
      return `\n${text}`;
    });

    // Strip any remaining HTML tags
    output = stripTags(output);

    // Clean up: normalise blank lines, trim each line
    const finalLines = output
      .split('\n')
      .map((l) => l.trim())
      .filter((l, i, arr) => {
        // Remove consecutive blank lines, keep at most one
        if (l === '') return i === 0 || arr[i - 1] !== '';
        return true;
      });

    return finalLines.join('\n').trim();
  }
}
