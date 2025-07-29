from flask import Blueprint, request, jsonify
from extensions import db
from models import Product
from sqlalchemy import or_

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