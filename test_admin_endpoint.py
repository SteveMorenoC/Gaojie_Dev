#!/usr/bin/env python3
"""
Test script to debug the admin products endpoint
"""

import sys
sys.path.insert(0, 'backend')

from backend.app import app
from backend.extensions import db
from backend.models.product import Product

def test_admin_endpoint_logic():
    """Test the exact logic used in the admin products endpoint"""
    
    with app.app_context():
        try:
            print('🧪 Testing admin products endpoint logic...')
            
            # Simulate what the admin endpoint does
            query = Product.query
            
            # Test with status filter
            status = 'all'  # This is what the frontend sends
            if status and status != 'all':
                if status == 'active':
                    query = query.filter(Product.is_active == True)
                elif status == 'inactive':
                    query = query.filter(Product.is_active == False)
            
            # Get products
            products = query.order_by(Product.updated_at.desc()).limit(50).all()
            print(f'✅ Found {len(products)} products')
            
            # Test category counts
            category_counts = {}
            all_categories = db.session.query(Product.category).distinct().all()
            for cat in all_categories:
                if cat[0]:
                    category_counts[cat[0]] = Product.query.filter_by(category=cat[0]).count()
            
            print(f'✅ Category counts: {category_counts}')
            
            # Test converting to dict (critical test)
            product_dicts = []
            for i, product in enumerate(products):
                try:
                    product_dict = product.to_dict()
                    product_dicts.append(product_dict)
                    print(f'✅ Product {i+1}: {product.name} -> dict success')
                except Exception as e:
                    print(f'❌ Error converting {product.name} to dict: {e}')
                    import traceback
                    traceback.print_exc()
                    return False
            
            print(f'✅ Successfully converted {len(product_dicts)} products to dict')
            
            # Test creating the response structure
            response_data = {
                'products': product_dicts,
                'pagination': {
                    'page': 1,
                    'per_page': 50,
                    'total': len(products),
                    'pages': 1,
                    'has_next': False,
                    'has_prev': False
                },
                'category_counts': category_counts,
                'total_products': Product.query.count(),
                'status': 'success'
            }
            
            print('✅ Response structure created successfully')
            print('🎉 Admin endpoint logic works correctly!')
            
            return True
            
        except Exception as e:
            print(f'❌ Error in admin logic: {e}')
            import traceback
            traceback.print_exc()
            return False

if __name__ == '__main__':
    success = test_admin_endpoint_logic()
    if success:
        print('\n✅ The admin endpoint logic is working correctly')
        print('⚠️  The 500 error is likely due to admin authentication failure')
        print('\n🔧 Possible fixes:')
        print('1. Check if admin user exists and is logged in')
        print('2. Temporarily disable admin authentication for testing')
        print('3. Check session/cookie authentication')
    else:
        print('\n❌ Found issues in admin endpoint logic')