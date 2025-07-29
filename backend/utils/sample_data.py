from extensions import db
from models import Product
from datetime import datetime

def create_sample_products():
    """Create sample skincare products for testing"""
    
    sample_products = [
        {
            'name': 'Amino-Acid Cleanser',
            'slug': 'amino-acid-cleanser',
            'description': 'A gentle daily cleanser formulated with amino acids to remove impurities while maintaining skin\'s natural moisture barrier. Perfect for all skin types, this cleanser leaves skin feeling clean, soft, and balanced.',
            'short_description': 'Gentle daily cleanser for glowing skin',
            'price': 1290.00,
            'original_price': None,
            'category': 'cleanser',
            'skin_type': 'all',
            'ingredients': 'Amino Acids, Glycerin, Sodium Cocoamphoacetate, Sodium Lauroyl Glutamate',
            'size': '120ml',
            'stock_quantity': 50,
            'is_active': True,
            'is_featured': True,
            'is_bestseller': True,
            'is_new': False,
            'primary_image': 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'secondary_image': 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'tags': 'cleanser, gentle, amino acids, daily use',
            'meta_title': 'Amino-Acid Cleanser - GAOJIE Skincare',
            'meta_description': 'Gentle amino acid cleanser for daily use. Perfect for all skin types.',
            'view_count': 245,
            'sales_count': 89
        },
        {
            'name': 'Hydrating Moisturiser',
            'slug': 'hydrating-moisturiser',
            'description': 'Advanced hydrating moisturizer with hyaluronic acid and ceramides. Provides 24-hour moisture while strengthening the skin barrier. Lightweight yet deeply nourishing formula.',
            'short_description': '24-hour moisture with hyaluronic acid',
            'price': 1590.00,
            'original_price': None,
            'category': 'moisturiser',
            'skin_type': 'dry, combination',
            'ingredients': 'Hyaluronic Acid, Ceramides, Niacinamide, Squalane',
            'size': '50ml',
            'stock_quantity': 35,
            'is_active': True,
            'is_featured': True,
            'is_bestseller': False,
            'is_new': True,
            'primary_image': 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'secondary_image': 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'tags': 'moisturizer, hyaluronic acid, hydrating, ceramides',
            'meta_title': 'Hydrating Moisturiser - GAOJIE Skincare',
            'meta_description': '24-hour hydrating moisturizer with hyaluronic acid and ceramides.',
            'view_count': 178,
            'sales_count': 67
        },
        {
            'name': 'Vitamin C Brightening Serum',
            'slug': 'vitamin-c-brightening-serum',
            'description': 'Potent vitamin C serum with 20% L-Ascorbic Acid to brighten skin, reduce dark spots, and boost collagen production. Enhanced with vitamin E and ferulic acid for maximum stability and efficacy.',
            'short_description': 'Radiant glow with vitamin C',
            'price': 1890.00,
            'original_price': 2290.00,
            'category': 'serum',
            'skin_type': 'all',
            'ingredients': '20% L-Ascorbic Acid, Vitamin E, Ferulic Acid, Hyaluronic Acid',
            'size': '30ml',
            'stock_quantity': 28,
            'is_active': True,
            'is_featured': True,
            'is_bestseller': True,
            'is_new': False,
            'primary_image': 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'secondary_image': 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'tags': 'vitamin c, brightening, serum, antioxidant',
            'meta_title': 'Vitamin C Brightening Serum - GAOJIE Skincare',
            'meta_description': 'Potent 20% Vitamin C serum for brightening and anti-aging.',
            'view_count': 312,
            'sales_count': 134
        },
        {
            'name': 'Retinol Renewal Serum',
            'slug': 'retinol-renewal-serum',
            'description': 'Advanced anti-aging serum with 0.5% retinol to accelerate cell turnover, reduce fine lines, and improve skin texture. Formulated with squalane and peptides to minimize irritation.',
            'short_description': 'Advanced anti-aging treatment',
            'price': 2190.00,
            'original_price': None,
            'category': 'serum',
            'skin_type': 'normal, oily',
            'ingredients': '0.5% Retinol, Squalane, Peptides, Niacinamide',
            'size': '30ml',
            'stock_quantity': 15,
            'is_active': True,
            'is_featured': False,
            'is_bestseller': False,
            'is_new': False,
            'primary_image': 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'secondary_image': 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'tags': 'retinol, anti-aging, renewal, peptides',
            'meta_title': 'Retinol Renewal Serum - GAOJIE Skincare',
            'meta_description': 'Advanced 0.5% retinol serum for anti-aging and skin renewal.',
            'view_count': 89,
            'sales_count': 23
        },
        {
            'name': 'Gentle Daily Cleanser',
            'slug': 'gentle-daily-cleanser',
            'description': 'Ultra-gentle cleanser for sensitive skin. Formulated with oat extract and ceramides to cleanse without stripping natural oils. Perfect for morning and evening use.',
            'short_description': 'Ultra-gentle for sensitive skin',
            'price': 1190.00,
            'original_price': None,
            'category': 'cleanser',
            'skin_type': 'sensitive, dry',
            'ingredients': 'Oat Extract, Ceramides, Glycerin, Sodium Cocoyl Isethionate',
            'size': '120ml',
            'stock_quantity': 42,
            'is_active': True,
            'is_featured': False,
            'is_bestseller': False,
            'is_new': True,
            'primary_image': 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'secondary_image': 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'tags': 'gentle, sensitive skin, oat extract, daily use',
            'meta_title': 'Gentle Daily Cleanser - GAOJIE Skincare',
            'meta_description': 'Ultra-gentle cleanser perfect for sensitive skin.',
            'view_count': 156,
            'sales_count': 45
        },
        {
            'name': 'Night Recovery Cream',
            'slug': 'night-recovery-cream',
            'description': 'Rich night cream with peptides and botanical oils to repair and regenerate skin overnight. Wake up to smoother, more radiant skin.',
            'short_description': 'Overnight repair and regeneration',
            'price': 1790.00,
            'original_price': None,
            'category': 'moisturiser',
            'skin_type': 'mature, dry',
            'ingredients': 'Peptides, Jojoba Oil, Rosehip Oil, Shea Butter',
            'size': '50ml',
            'stock_quantity': 25,
            'is_active': True,
            'is_featured': False,
            'is_bestseller': False,
            'is_new': True,
            'primary_image': 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'secondary_image': 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'tags': 'night cream, peptides, recovery, anti-aging',
            'meta_title': 'Night Recovery Cream - GAOJIE Skincare',
            'meta_description': 'Rich night cream with peptides for overnight skin repair.',
            'view_count': 98,
            'sales_count': 34
        }
    ]
    
    # Check if products already exist
    existing_count = Product.query.count()
    if existing_count > 0:
        print(f"Sample data already exists ({existing_count} products found)")
        return
    
    # Create products
    for product_data in sample_products:
        product = Product(**product_data)
        db.session.add(product)
    
    try:
        db.session.commit()
        print(f"Created {len(sample_products)} sample products successfully!")
    except Exception as e:
        db.session.rollback()
        print(f"Error creating sample products: {e}")

if __name__ == '__main__':
    # This allows running the script directly
    from app import app
    with app.app_context():
        create_sample_products()