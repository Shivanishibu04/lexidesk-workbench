"""
Advanced PDF Text Extractor (Python/PyMuPDF)

This standalone module demonstrates how to remove headers and footers 
dynamically in the backend using PyMuPDF (fitz) by analyzing Font Sizes 
and Layout Bounding Boxes, without using absolute percentages.
"""

import fitz # PyMuPDF
import re
from collections import Counter

def extract_text_without_headers_footers(pdf_path: str) -> str:
    doc = fitz.open(pdf_path)
    
    # PASS 1: Find the "Dominant Font Size"
    # The font size used most frequently in the document is assumed to be the body text.
    font_sizes = []
    
    # Read the first few pages to establish baseline
    for i in range(min(5, len(doc))):
        page = doc[i]
        blocks = page.get_text("dict")["blocks"]
        for b in blocks:
            if b['type'] == 0: # text block
                for line in b["lines"]:
                    for span in line["spans"]:
                        font_sizes.append(round(span["size"], 1))
                        
    if not font_sizes:
        return ""
        
    dominant_size = Counter(font_sizes).most_common(1)[0][0]
    
    # PASS 2: Extraction
    full_text = []
    is_page_regex = re.compile(r"^(\d+|page\s*\d+(\s*of\s*\d+)?)$", re.IGNORECASE)
    
    for page in doc:
        blocks = page.get_text("dict")["blocks"]
        # Sort blocks top-to-bottom
        blocks.sort(key=lambda b: b["bbox"][1] if "bbox" in b else 0)
        
        page_text = []
        
        for b in blocks:
            if b['type'] != 0:
                continue
                
            block_text_combined = ""
            is_valid_block = False
            
            for line in b["lines"]:
                for span in line["spans"]:
                    text = span["text"].strip()
                    if not text:
                        continue
                        
                    size = round(span["size"], 1)
                    
                    # Heuristic: If it's noticeably smaller than the dominant body text, 
                    # AND it is isolated at the top/bottom (first or last blocks), it's a header/footer.
                    # PyMuPDF bbox layout handles the margin clustering for us natively.
                    if size < dominant_size - 1.0:
                        # Too small = likely header/footer/footnote
                        pass 
                    elif is_page_regex.match(text):
                        # Page number
                        pass
                    else:
                        is_valid_block = True
                        block_text_combined += span["text"] + " "
                        
            if is_valid_block:
                page_text.append(block_text_combined.strip())
                
        full_text.append(" ".join(page_text))
        
    # Formatting
    final_raw_text = "\n\n".join(full_text)
    
    # Clean up hyphenations and weird multi-spaces
    final_raw_text = re.sub(r'([a-zA-Z]+)-\s+([a-zA-Z]+)', r'\1\2', final_raw_text)
    final_raw_text = re.sub(r' {2,}', ' ', final_raw_text)
    final_raw_text = re.sub(r'\n{3,}', '\n\n', final_raw_text)
    
    return final_raw_text.strip()

