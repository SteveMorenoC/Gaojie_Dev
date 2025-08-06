from flask import Blueprint, request, jsonify
from extensions import db
from models import Product
from sqlalchemy import or_
from datetime import datetime
import re

# Create products blueprint
products_bp = Blueprint('products', __name__, url_prefix='/api/products')

@products_bp.route('/', methods=['GET'])
def get_products():
    """Get all products with optional filtering and pagination"""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 12, type=int)  # 12 products per page
        category = request.args.get('category')
        featured = request.args.get('featured', type=bool)
        bestseller = request.args.get('bestseller', type=bool)
        new = request.args.get('new', type=bool)
        search = request.args.get('search')
        
        # Build query
        query = Product.query.filter_by(is_active=True)
        
        # Apply filters
        if category:
            query = query.filter(Product.category == category)
        
        if featured is not None:
            query = query.filter(Product.is_featured == featured)
            
        if bestseller is not None:
            query = query.filter(Product.is_bestseller == bestseller)
            
        if new is not None:
            query = query.filter(Product.is_new == new)
            
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Product.name.ilike(search_term),
                    Product.description.ilike(search_term),
                    Product.tags.ilike(search_term)
                )
            )
        
        # Order by created_at (newest first) or by sales_count for bestsellers
        if bestseller:
            query = query.order_by(Product.sales_count.desc())
        else:
            query = query.order_by(Product.created_at.desc())
        
        # Paginate results
        products_pagination = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        products = products_pagination.items
        
        return jsonify({
            'products': [product.to_dict() for product in products],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': products_pagination.total,
                'pages': products_pagination.pages,
                'has_next': products_pagination.has_next,
                'has_prev': products_pagination.has_prev
            },
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({
            'message': 'Error fetching products',
            'error': str(e),
            'status': 'error'
        }), 500

@products_bp.route('/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """Get a single product by ID"""
    try:
        product = Product.query.filter_by(id=product_id, is_active=True).first()
        
        if not product:
            return jsonify({
                'message': 'Product not found',
                'status': 'error'
            }), 404
        
        # Increment view count
        product.view_count += 1
        db.session.commit()
        
        return jsonify({
            'product': product.to_dict(),
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({
            'message': 'Error fetching product',
            'error': str(e),
            'status': 'error'
        }), 500

@products_bp.route('/slug/<string:slug>', methods=['GET'])
def get_product_by_slug(slug):
    """Get a single product by slug (SEO-friendly URLs)"""
    try:
        product = Product.query.filter_by(slug=slug, is_active=True).first()
        
        if not product:
            return jsonify({
                'message': 'Product not found',
                'status': 'error'
            }), 404
        
        # Increment view count
        product.view_count += 1
        db.session.commit()
        
        return jsonify({
            'product': product.to_dict(),
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({
            'message': 'Error fetching product',
            'error': str(e),
            'status': 'error'
        }), 500

@products_bp.route('/related/<int:product_id>', methods=['GET'])
def get_related_products(product_id):
    """Get related products for a given product (same category first, then random)"""
    try:
        # Get the current product to find its category
        current_product = Product.query.get(product_id)
        if not current_product:
            return jsonify({
                'message': 'Product not found',
                'status': 'error'
            }), 404
        
        limit = request.args.get('limit', 4, type=int)
        category = current_product.category
        
        # First, try to get products from the same category (excluding current product)
        same_category_products = Product.query.filter(
            Product.id != product_id,
            Product.category == category,
            Product.is_active == True
        ).order_by(db.func.random()).limit(limit).all()
        
        related_products = same_category_products
        
        # If we don't have enough products from the same category, fill with random products
        if len(related_products) < limit:
            needed = limit - len(related_products)
            existing_ids = [p.id for p in related_products] + [product_id]
            
            additional_products = Product.query.filter(
                ~Product.id.in_(existing_ids),
                Product.is_active == True
            ).order_by(db.func.random()).limit(needed).all()
            
            related_products.extend(additional_products)
        
        return jsonify({
            'products': [product.to_dict() for product in related_products],
            'total': len(related_products),
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({
            'message': 'Error fetching related products',
            'error': str(e),
            'status': 'error'
        }), 500

@products_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get all unique product categories"""
    try:
        categories = db.session.query(Product.category).filter_by(is_active=True).distinct().all()
        category_list = [category[0] for category in categories if category[0]]
        
        return jsonify({
            'categories': category_list,
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({
            'message': 'Error fetching categories',
            'error': str(e),
            'status': 'error'
        }), 500

@products_bp.route('/featured', methods=['GET'])
def get_featured_products():
    """Get featured products"""
    try:
        limit = request.args.get('limit', 4, type=int)
        
        products = Product.query.filter_by(
            is_active=True, 
            is_featured=True
        ).order_by(Product.created_at.desc()).limit(limit).all()
        
        return jsonify({
            'products': [product.to_dict() for product in products],
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({
            'message': 'Error fetching featured products',
            'error': str(e),
            'status': 'error'
        }), 500

@products_bp.route('/bestsellers', methods=['GET'])
def get_bestsellers():
    """Get bestselling products"""
    try:
        limit = request.args.get('limit', 4, type=int)
        
        products = Product.query.filter_by(
            is_active=True, 
            is_bestseller=True
        ).order_by(Product.sales_count.desc()).limit(limit).all()
        
        return jsonify({
            'products': [product.to_dict() for product in products],
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({
            'message': 'Error fetching bestsellers',
            'error': str(e),
            'status': 'error'
        }), 500

# ===== DEBUG ENDPOINT (TEMPORARY) =====

@products_bp.route('/admin/debug', methods=['GET'])
def debug_admin_get_products():
    """TEMPORARY: Get all products for admin debugging (NO AUTH REQUIRED - REMOVE IN PRODUCTION)"""
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

@products_bp.route('/new', methods=['GET'])
def get_new_products():
    """Get new products"""
    try:
        limit = request.args.get('limit', 4, type=int)
        
        products = Product.query.filter_by(
            is_active=True, 
            is_new=True
        ).order_by(Product.created_at.desc()).limit(limit).all()
        
        return jsonify({
            'products': [product.to_dict() for product in products],
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({
            'message': 'Error fetching new products',
            'error': str(e),
            'status': 'error'
        }), 500

# ===== ADMIN ENDPOINTS =====

def generate_slug(name):
    """Generate URL-friendly slug from product name"""
    slug = re.sub(r'[^\w\s-]', '', name.lower())
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.strip('-')

def admin_required(f):
    """Decorator to require admin privileges"""
    from functools import wraps
    
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            from flask import session
            from flask_login import current_user
            
            # Check session-based auth first (primary method)
            if 'user_id' in session:
                from models import User
                user = User.query.get(session['user_id'])
                if user and user.is_admin:
                    return f(*args, **kwargs)
                elif user:
                    return jsonify({'message': 'Admin privileges required', 'status': 'error'}), 403
            
            # Check Flask-Login as fallback
            if current_user.is_authenticated and hasattr(current_user, 'is_admin') and current_user.is_admin:
                return f(*args, **kwargs)
            elif current_user.is_authenticated:
                return jsonify({'message': 'Admin privileges required', 'status': 'error'}), 403
            
            # No valid authentication found
            return jsonify({'message': 'Authentication required', 'status': 'error'}), 401
                
        except Exception as e:
            print(f"Admin auth error: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({'message': 'Authentication error', 'error': str(e), 'status': 'error'}), 401
    
    return decorated_function

@products_bp.route('/admin', methods=['GET'])
@admin_required
def admin_get_products():
    """Get all products for admin (including inactive ones)"""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        category = request.args.get('category')
        status = request.args.get('status')  # 'active', 'inactive', 'all'
        stock = request.args.get('stock')    # 'in-stock', 'low-stock', 'out-of-stock', 'all'
        search = request.args.get('search')
        
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
        
        # Get category counts for admin
        category_counts = {}
        all_categories = db.session.query(Product.category).distinct().all()
        for cat in all_categories:
            if cat[0]:
                category_counts[cat[0]] = Product.query.filter_by(category=cat[0]).count()
        
        return jsonify({
            'products': [product.to_dict() for product in products],
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
        })
        
    except Exception as e:
        return jsonify({
            'message': 'Error fetching products',
            'error': str(e),
            'status': 'error'
        }), 500

@products_bp.route('/admin/<int:product_id>', methods=['GET'])
@admin_required
def admin_get_product(product_id):
    """Get a single product by ID for admin (including inactive)"""
    try:
        product = Product.query.get(product_id)
        
        if not product:
            return jsonify({
                'message': 'Product not found',
                'status': 'error'
            }), 404
        
        return jsonify({
            'product': product.to_dict(),
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({
            'message': 'Error fetching product',
            'error': str(e),
            'status': 'error'
        }), 500

@products_bp.route('/admin', methods=['POST'])
@admin_required
def admin_create_product():
    """Create a new product"""
    try:
        data = request.get_json()
        
        # NO REQUIRED FIELDS - allow saving with any data
        
        # Set default stock_quantity if not provided
        if 'stock_quantity' not in data:
            data['stock_quantity'] = 0
        
        # Use provided slug/sku if available, otherwise generate from name or timestamp
        if data.get('slug'):
            slug = data['slug'].lower().replace(' ', '-')
        elif data.get('name'):
            slug = generate_slug(data['name'])
        else:
            from datetime import datetime
            slug = f"product-{int(datetime.now().timestamp())}"
        
        # Check if slug already exists
        existing_product = Product.query.filter_by(slug=slug).first()
        if existing_product:
            # Add number suffix to make it unique
            counter = 1
            while existing_product:
                new_slug = f"{slug}-{counter}"
                existing_product = Product.query.filter_by(slug=new_slug).first()
                counter += 1
            slug = new_slug
        
        # Handle gallery images (convert list to JSON string if provided)
        gallery_images = data.get('gallery_images')
        if isinstance(gallery_images, list):
            import json
            gallery_images = json.dumps(gallery_images)
        
        # Handle gallery items (convert list to JSON string if provided)
        gallery_items = data.get('gallery_items')
        if isinstance(gallery_items, list):
            import json
            gallery_items = json.dumps(gallery_items)
        
        # Handle badge IDs (convert list to JSON string if provided)
        badge_ids = data.get('badge_ids')
        if isinstance(badge_ids, list):
            import json
            badge_ids = json.dumps(badge_ids)
        
        # Create new product with defaults for missing fields
        product = Product(
            name=data.get('name', 'Untitled Product'),
            slug=slug,
            description=data.get('description', ''),
            short_description=data.get('short_description', ''),
            price=float(data['price']) if data.get('price') else 0.0,
            original_price=float(data['original_price']) if data.get('original_price') else None,
            cost_price=float(data['cost_price']) if data.get('cost_price') else None,
            stock_quantity=int(data['stock_quantity']),
            low_stock_threshold=int(data.get('low_stock_threshold', 10)),
            category=data.get('category', 'uncategorized'),
            skin_type=data.get('skin_type'),
            ingredients=data.get('ingredients'),
            usage_instructions=data.get('usage_instructions'),
            benefits=data.get('benefits'),
            more_details=data.get('more_details'),
            size=data.get('size'),
            is_active=data.get('is_active', True),
            is_featured=data.get('is_featured', False),
            is_bestseller=data.get('is_bestseller', False),
            is_new=data.get('is_new', False),
            meta_title=data.get('meta_title'),
            meta_description=data.get('meta_description'),
            tags=data.get('tags'),
            primary_image=data.get('primary_image'),
            secondary_image=data.get('secondary_image'),
            gallery_images=gallery_images,
            gallery_items=gallery_items,
            video_url=data.get('video_url'),
            badge_ids=badge_ids
        )
        
        db.session.add(product)
        db.session.commit()
        
        return jsonify({
            'message': 'Product created successfully',
            'product': product.to_dict(),
            'status': 'success'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': 'Error creating product',
            'error': str(e),
            'status': 'error'
        }), 500

@products_bp.route('/admin/<int:product_id>', methods=['PUT'])
@admin_required
def admin_update_product(product_id):
    """Update an existing product"""
    try:
        product = Product.query.get(product_id)
        
        if not product:
            return jsonify({
                'message': 'Product not found',
                'status': 'error'
            }), 404
        
        data = request.get_json()
        
        # Update fields if provided
        if 'name' in data:
            product.name = data['name']
        
        # Handle slug update if provided directly or regenerate from name
        if 'slug' in data and data['slug']:
            # User provided a custom slug/sku
            new_slug = data['slug'].lower().replace(' ', '-')
        elif 'name' in data and data['name']:
            # Regenerate slug from name
            new_slug = generate_slug(data['name'])
        else:
            new_slug = product.slug  # Keep existing slug
            
        # Check if slug needs to be updated and is unique
        if new_slug != product.slug:
            existing_product = Product.query.filter_by(slug=new_slug).filter(Product.id != product_id).first()
            if existing_product:
                counter = 1
                while existing_product:
                    numbered_slug = f"{new_slug}-{counter}"
                    existing_product = Product.query.filter_by(slug=numbered_slug).filter(Product.id != product_id).first()
                    counter += 1
                new_slug = numbered_slug
            product.slug = new_slug
        
        # Update other fields
        updateable_fields = [
            'description', 'short_description', 'price', 'original_price', 'cost_price',
            'stock_quantity', 'low_stock_threshold', 'category', 'skin_type', 'ingredients',
            'usage_instructions', 'benefits', 'more_details', 'size', 'is_active', 'is_featured', 'is_bestseller', 'is_new', 'meta_title',
            'meta_description', 'tags', 'primary_image', 'secondary_image', 'gallery_images', 'gallery_items', 'video_url', 'badge_ids'
        ]
        
        for field in updateable_fields:
            if field in data:
                if field in ['price', 'original_price', 'cost_price'] and data[field] is not None:
                    setattr(product, field, float(data[field]))
                elif field in ['stock_quantity', 'low_stock_threshold'] and data[field] is not None:
                    setattr(product, field, int(data[field]))
                elif field == 'gallery_images' and isinstance(data[field], list):
                    # Convert list to JSON string for gallery_images
                    import json
                    setattr(product, field, json.dumps(data[field]))
                elif field == 'gallery_items' and isinstance(data[field], list):
                    # Convert list to JSON string for gallery_items
                    import json
                    setattr(product, field, json.dumps(data[field]))
                elif field == 'badge_ids' and isinstance(data[field], list):
                    # Convert list to JSON string for badge_ids
                    import json
                    setattr(product, field, json.dumps(data[field]))
                else:
                    setattr(product, field, data[field])
        
        product.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Product updated successfully',
            'product': product.to_dict(),
            'status': 'success'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': 'Error updating product',
            'error': str(e),
            'status': 'error'
        }), 500

@products_bp.route('/admin/<int:product_id>', methods=['DELETE'])
@admin_required
def admin_delete_product(product_id):
    """Delete a product (soft delete by setting is_active to False)"""
    try:
        product = Product.query.get(product_id)
        
        if not product:
            return jsonify({
                'message': 'Product not found',
                'status': 'error'
            }), 404
        
        # Check if product has orders (you might want to prevent deletion)
        # For now, we'll do a soft delete
        product.is_active = False
        product.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Product deleted successfully',
            'status': 'success'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': 'Error deleting product',
            'error': str(e),
            'status': 'error'
        }), 500

@products_bp.route('/admin/<int:product_id>/duplicate', methods=['POST'])
@admin_required
def admin_duplicate_product(product_id):
    """Duplicate an existing product"""
    try:
        original_product = Product.query.get(product_id)
        
        if not original_product:
            return jsonify({
                'message': 'Product not found',
                'status': 'error'
            }), 404
        
        # Create a copy with modified name and slug
        duplicate_name = f"{original_product.name} (Copy)"
        duplicate_slug = generate_slug(duplicate_name)
        
        # Ensure unique slug
        existing_product = Product.query.filter_by(slug=duplicate_slug).first()
        if existing_product:
            counter = 1
            while existing_product:
                new_slug = f"{duplicate_slug}-{counter}"
                existing_product = Product.query.filter_by(slug=new_slug).first()
                counter += 1
            duplicate_slug = new_slug
        
        # Create duplicate product
        duplicate_product = Product(
            name=duplicate_name,
            slug=duplicate_slug,
            description=original_product.description,
            short_description=original_product.short_description,
            price=original_product.price,
            original_price=original_product.original_price,
            cost_price=original_product.cost_price,
            stock_quantity=0,  # Start with 0 stock for duplicates
            low_stock_threshold=original_product.low_stock_threshold,
            category=original_product.category,
            skin_type=original_product.skin_type,
            ingredients=original_product.ingredients,
            usage_instructions=original_product.usage_instructions,
            size=original_product.size,
            is_active=False,  # Start as inactive for review
            is_featured=False,
            is_bestseller=False,
            is_new=False,
            meta_title=original_product.meta_title,
            meta_description=original_product.meta_description,
            tags=original_product.tags,
            primary_image=original_product.primary_image,
            secondary_image=original_product.secondary_image,
            gallery_images=original_product.gallery_images
        )
        
        db.session.add(duplicate_product)
        db.session.commit()
        
        return jsonify({
            'message': 'Product duplicated successfully',
            'product': duplicate_product.to_dict(),
            'status': 'success'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': 'Error duplicating product',
            'error': str(e),
            'status': 'error'
        }), 500

@products_bp.route('/admin/<int:product_id>/toggle-status', methods=['POST'])
@admin_required
def admin_toggle_product_status(product_id):
    """Toggle product active/inactive status"""
    try:
        product = Product.query.get(product_id)
        
        if not product:
            return jsonify({
                'message': 'Product not found',
                'status': 'error'
            }), 404
        
        product.is_active = not product.is_active
        product.updated_at = datetime.utcnow()
        db.session.commit()
        
        status_text = 'activated' if product.is_active else 'deactivated'
        
        return jsonify({
            'message': f'Product {status_text} successfully',
            'product': product.to_dict(),
            'status': 'success'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': 'Error toggling product status',
            'error': str(e),
            'status': 'error'
        }), 500

@products_bp.route('/admin', methods=['POST'])
def create_product():
    """Create a new product (admin only)"""
    try:
        data = request.get_json()
        
        # Create new product
        product = Product(
            name=data.get('name'),
            description=data.get('description'),
            short_description=data.get('short_description'),
            price=data.get('price'),
            original_price=data.get('original_price'),
            category=data.get('category'),
            stock_quantity=data.get('stock_quantity', 0),
            skin_type=data.get('skin_type'),
            ingredients=data.get('ingredients'),
            usage_instructions=data.get('usage_instructions'),
            benefits=data.get('benefits'),
            more_details=data.get('more_details'),
            size=data.get('size'),
            primary_image=data.get('primary_image'),
            secondary_image=data.get('secondary_image'),
            video_url=data.get('video_url'),
            is_active=data.get('is_active', True),
            is_featured=data.get('is_featured', False),
            is_bestseller=data.get('is_bestseller', False),
            is_new=data.get('is_new', False)
        )
        
        # Generate slug from product name
        product.set_slug_from_name()
        
        # Handle badge assignment
        badge_ids = data.get('badge_ids', [])
        if badge_ids:
            import json
            product.badge_ids = json.dumps(badge_ids)
        
        db.session.add(product)
        db.session.commit()
        
        return jsonify({
            'product': product.to_dict(),
            'status': 'success',
            'message': 'Product created successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': 'Error creating product',
            'error': str(e),
            'status': 'error'
        }), 500