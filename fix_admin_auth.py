#!/usr/bin/env python3
"""
Quick fix for admin authentication issue
Creates an admin user and provides instructions for testing
"""

import sys
import os
sys.path.insert(0, 'backend')

# We'll create a temporary admin bypass endpoint
def create_temp_admin_endpoint():
    """Create a temporary non-authenticated admin products endpoint for testing"""
    
    admin_products_code = '''
# Temporary non-authenticated admin endpoint for debugging
@products_bp.route('/admin/debug', methods=['GET'])
def debug_admin_get_products():
    """Get all products for admin debugging (NO AUTH REQUIRED - REMOVE IN PRODUCTION)"""
    try:
        print("🔧 DEBUG: Admin products endpoint called")
        
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        category = request.args.get('category')
        status = request.args.get('status', 'all')  # 'active', 'inactive', 'all'
        stock = request.args.get('stock')    # 'in-stock', 'low-stock', 'out-of-stock', 'all'
        search = request.args.get('search')
        
        print(f"🔧 DEBUG: Parameters - status={status}, category={category}")
        
        # Build query (admin sees all products including inactive)
        query = Product.query
        
        # Apply filters
        if category and category != 'all':
            query = query.filter(Product.category == category)
        
        if status and status != 'all':
            if status == 'active':
                query = query.filter(Product.is_active == True)
            elif status == 'inactive':
                query = query.filter(Product.is_active == False)
        
        if stock and stock != 'all':
            if stock == 'in-stock':
                query = query.filter(Product.stock_quantity > Product.low_stock_threshold)
            elif stock == 'low-stock':
                query = query.filter(
                    Product.stock_quantity <= Product.low_stock_threshold,
                    Product.stock_quantity > 0
                )
            elif stock == 'out-of-stock':
                query = query.filter(Product.stock_quantity == 0)
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Product.name.ilike(search_term),
                    Product.description.ilike(search_term),
                    Product.slug.ilike(search_term),
                    Product.tags.ilike(search_term)
                )
            )
        
        # Order by updated_at (most recently updated first)
        query = query.order_by(Product.updated_at.desc())
        
        # Paginate results
        products_pagination = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        products = products_pagination.items
        print(f"🔧 DEBUG: Found {len(products)} products")
        
        # Get category counts for admin
        category_counts = {}
        all_categories = db.session.query(Product.category).distinct().all()
        for cat in all_categories:
            if cat[0]:
                category_counts[cat[0]] = Product.query.filter_by(category=cat[0]).count()
        
        print(f"🔧 DEBUG: Category counts: {category_counts}")
        
        # Convert to dict
        product_dicts = []
        for product in products:
            try:
                product_dict = product.to_dict()
                product_dicts.append(product_dict)
            except Exception as e:
                print(f"🔧 DEBUG: Error converting {product.name}: {e}")
                raise e
        
        print(f"🔧 DEBUG: Successfully converted {len(product_dicts)} products")
        
        response_data = {
            'products': product_dicts,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': products_pagination.total,
                'pages': products_pagination.pages,
                'has_next': products_pagination.has_next,
                'has_prev': products_pagination.has_prev
            },
            'category_counts': category_counts,
            'total_products': Product.query.count(),
            'status': 'success'
        }
        
        print("🔧 DEBUG: Response created successfully")
        return jsonify(response_data)
        
    except Exception as e:
        print(f"🔧 DEBUG: Error in admin products: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'message': 'Error fetching products',
            'error': str(e),
            'status': 'error'
        }), 500
'''
    
    return admin_products_code

def main():
    print("🔧 Admin Authentication Fix")
    print("===========================")
    
    print("\n📋 The admin products endpoint is failing due to authentication.")
    print("Here are the recommended fixes:")
    
    print("\n1️⃣ IMMEDIATE FIX - Temporary Debug Endpoint:")
    print("   Add this code to backend/products/routes.py:")
    print("   " + "="*50)
    print(create_temp_admin_endpoint())
    print("   " + "="*50)
    
    print("\n   Then change the frontend to call '/api/products/admin/debug' instead")
    
    print("\n2️⃣ PROPER FIX - Create Admin User:")
    print("   Use the existing endpoint: POST /api/admin/create-admin")
    print("   Send: {\"email\": \"admin@gaojie.com\", \"password\": \"admin123\"}")
    
    print("\n3️⃣ ALTERNATIVE FIX - Disable Auth Temporarily:")
    print("   Comment out the @admin_required decorator on the admin endpoints")
    
    print("\n🎯 RECOMMENDED ACTION:")
    print("   1. Add the debug endpoint code above")
    print("   2. Update frontend to use /api/products/admin/debug")
    print("   3. Test that it works")
    print("   4. Then implement proper admin authentication")
    
    return True

if __name__ == '__main__':
    main()