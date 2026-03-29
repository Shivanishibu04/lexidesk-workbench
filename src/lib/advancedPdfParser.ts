import * as pdfjsLib from 'pdfjs-dist';

/**
 * Advanced PDF Text Extractor (Two-Pass Statistical Analysis)
 * 
 * This module dynamically detects and removes headers and footers without relying
 * on arbitrary layout percentages. It works by passing over the document twice:
 * 
 * PASS 1: Analyzes all pages to find repeating text strings at extreme Y-coordinates 
 *         across multiple pages (e.g. "Case No. 1241", "Confidential").
 *         It also catches lone page numbers via Regex.
 * 
 * PASS 2: Extracts the text, stripping out any lines identified as repeating
 *         structural elements. Formatting is then applied.
 */

interface TextItem {
    str: string;
    transform: number[];
}

export async function extractTextWithoutHeadersFooters(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    // Track potential header/footer strings by how many pages they appear on
    const edgeTextFrequency: Record<string, number> = {};
    const totalPages = pdf.numPages;

    // ==========================================
    // PASS 1: Statistical Gathering
    // ==========================================
    for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.0 });
        const height = viewport.height;
        const textContent = await page.getTextContent();

        textContent.items.forEach((item: any) => {
            if (!item.transform) return;
            const text = item.str.trim();
            if (!text) return;

            const y = item.transform[5];
            
            // Only analyze items that fall in the outer 15% edges for gathering statistics
            const isNearEdge = y > height * 0.85 || y < height * 0.15;
            
            if (isNearEdge) {
                // If it's near the edge, increment its frequency across pages
                // We use the exact text as the key
                edgeTextFrequency[text] = (edgeTextFrequency[text] || 0) + 1;
            }
        });
    }

    // Determine which edge strings are true headers/footers
    // Rule: If it appears identically on more than 30% of pages (min 2), it's a structural element
    const thresholdCount = Math.max(2, Math.floor(totalPages * 0.3));
    const confirmedHeadersFooters = new Set<string>();
    
    for (const [text, count] of Object.entries(edgeTextFrequency)) {
        if (count >= thresholdCount) {
            confirmedHeadersFooters.add(text);
        }
    }

    // ==========================================
    // PASS 2: Extraction & Filtering
    // ==========================================
    let fullText = '';
    
    // Regex for standalone page numbers or "Page X of Y"
    const isPageNumRegex = /^(\d+|page\s*\d+(\s*of\s*\d+)?)$/i;

    for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.0 });
        const height = viewport.height;
        const textContent = await page.getTextContent();
        
        const validItems = textContent.items.filter((item: any) => {
            if (!item.transform) return true;
            const text = item.str.trim();
            if (!text) return false;
            
            const y = item.transform[5];
            const isNearEdge = y > height * 0.85 || y < height * 0.15;
            
            if (isNearEdge) {
                // Remove if it's statistically proven to be a repeating header/footer
                if (confirmedHeadersFooters.has(text)) {
                    return false;
                }
                
                // Remove if it matches a page number pattern near the edge
                if (isPageNumRegex.test(text)) {
                    return false;
                }
            }
            
            return true;
        });

        const pageText = validItems.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
    }

    // ==========================================
    // FORMATTING / CLEANUP
    // ==========================================
    fullText = fullText.replace(/([a-zA-Z]+)-\s+([a-zA-Z]+)/g, "$1$2");
    fullText = fullText.replace(/ {2,}/g, ' ');
    fullText = fullText.replace(/\n{3,}/g, '\n\n');
    
    return fullText.trim();
}
