#!/usr/bin/env python3
"""
Clean up category.html by removing static product cards and keeping only the dynamic loading structure
"""

def clean_category_html():
    with open('category.html', 'r') as f:
        lines = f.readlines()
    
    cleaned_lines = []
    in_product_card = False
    card_depth = 0
    
    for i, line in enumerate(lines):
        # Check if we're starting a product card
        if 'class="category-product-card"' in line and not in_product_card:
            in_product_card = True
            card_depth = 0
            continue
            
        if in_product_card:
            # Count div depth
            card_depth += line.count('<div') - line.count('</div>')
            
            # If we've closed all divs, we're done with this product card
            if card_depth <= 0:
                in_product_card = False
            continue
        
        # Keep all other lines
        cleaned_lines.append(line)
    
    # Write cleaned content
    with open('category.html', 'w') as f:
        f.writelines(cleaned_lines)
    
    print("✅ Cleaned category.html - removed static product cards")

if __name__ == '__main__':
    clean_category_html()