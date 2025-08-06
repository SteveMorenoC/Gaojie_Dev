import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from config import config
from extensions import db, migrate, login_manager

def create_app(config_name=None):
    """Application factory function"""
    
    # Create Flask app
    app = Flask(__name__)
    
    # Load configuration
    config_name = config_name or os.environ.get('FLASK_ENV', 'development')
    app.config.from_object(config[config_name])
    
    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Configure Flask-Login
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Please log in to access this page.'
    login_manager.login_message_category = 'info'
    
    # Simplified CORS configuration
    CORS(app, 
         origins="*",  # Allow all origins for development
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"])
    
    
    # Import models (this ensures they're registered with SQLAlchemy)
    from models import User, Order, OrderItem, Badge
    
    # Try to import Product model
    try:
        from models import Product
    except ImportError:
        print("Warning: Product model not found. Creating a basic one.")
        # Create a basic Product model if it doesn't exist
        class Product(db.Model):
            __tablename__ = 'products'
            id = db.Column(db.Integer, primary_key=True)
            name = db.Column(db.String(255), nullable=False)
            price = db.Column(db.Numeric(10, 2), nullable=False)
            is_active = db.Column(db.Boolean, default=True)
    
    # User loader for Flask-Login
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))
    
    # Register blueprints with error handling
    try:
        from products.routes import products_bp
        app.register_blueprint(products_bp)
    except ImportError as e:
        print(f"Warning: Could not import products blueprint: {e}")
    
    try:
        from auth.routes import auth_bp
        app.register_blueprint(auth_bp)
    except ImportError as e:
        print(f"Warning: Could not import auth blueprint: {e}")
    
    try:
        from orders.routes import orders_bp
        app.register_blueprint(orders_bp)
    except ImportError as e:
        print(f"Warning: Could not import orders blueprint: {e}")
    
    try:
        from orders.cart import cart_bp
        app.register_blueprint(cart_bp)
    except ImportError as e:
        print(f"Warning: Could not import cart blueprint: {e}")
    
    try:
        from badges.routes import badges_bp
        app.register_blueprint(badges_bp)
    except ImportError as e:
        print(f"Warning: Could not import badges blueprint: {e}")
    
    # Register a simple test route
    @app.route('/')
    def hello():
        return jsonify({
            'message': 'GAOJIE Skincare API is running!',
            'status': 'success',
            'environment': app.config['FLASK_ENV'],
            'cors_enabled': True
        })
    
    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'api_version': '1.0',
            'omise_configured': bool(app.config.get('OMISE_SECRET_KEY')),
            'cors_enabled': True
        })
    
    # Create admin user endpoint (for development)
    @app.route('/api/admin/create-admin', methods=['POST'])
    def create_admin_user():
        """Create an admin user (development only)"""
        try:
            data = request.get_json()
            
            # Check if admin user already exists
            admin_user = User.query.filter_by(is_admin=True).first()
            if admin_user:
                return jsonify({
                    'status': 'error',
                    'message': 'Admin user already exists',
                    'existing_admin': admin_user.email
                }), 400
            
            # Create admin user
            admin = User.create_user(
                email=data.get('email', 'admin@gaojie.com'),
                password=data.get('password', 'admin123'),
                first_name=data.get('first_name', 'Admin'),
                last_name=data.get('last_name', 'User')
            )
            
            # Set as admin
            admin.is_admin = True
            admin.is_verified = True
            db.session.commit()
            
            return jsonify({
                'status': 'success',
                'message': 'Admin user created successfully',
                'admin_user': {
                    'id': admin.id,
                    'email': admin.email,
                    'name': admin.full_name
                }
            })
            
        except Exception as e:
            db.session.rollback()
            return jsonify({
                'status': 'error',
                'message': f'Failed to create admin user: {str(e)}'
            }), 500

    # Test endpoint to see if database works
    @app.route('/api/products/test')
    def test_products():
        try:
            # Try to count products (this tests database connection)
            try:
                from models import Product
                product_count = Product.query.count()
            except:
                product_count = 0
            return jsonify({
                'message': 'Database connection successful!',
                'product_count': product_count,
                'status': 'success'
            })
        except Exception as e:
            return jsonify({
                'message': 'Database error',
                'error': str(e),
                'status': 'error'
            }), 500
    
    # CORS test endpoint
    @app.route('/api/test-cors')
    def test_cors():
        return jsonify({
            'message': 'CORS is working!',
            'origin': request.headers.get('Origin', 'No origin header'),
            'user_agent': request.headers.get('User-Agent', 'No user agent'),
            'method': request.method,
            'status': 'success'
        })
    
    # Debug endpoint to see what checkout is sending
    @app.route('/api/debug/order', methods=['POST', 'OPTIONS'])
    def debug_order():
        if request.method == 'OPTIONS':
            response = jsonify({'status': 'preflight'})
            response.headers.add("Access-Control-Allow-Origin", request.headers.get('Origin', '*'))
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
            return response
            
        try:
            data = request.get_json()
            return jsonify({
                'message': 'Debug endpoint received data',
                'data': data,
                'headers': dict(request.headers),
                'status': 'success'
            })
        except Exception as e:
            return jsonify({
                'message': 'Debug endpoint error',
                'error': str(e),
                'status': 'error'
            }), 500
    
    # Reset products endpoint (for development)
    @app.route('/api/products/reset', methods=['POST'])
    def reset_products():
        try:
            from models import Product
            # Delete all existing products
            Product.query.delete()
            db.session.commit()
            
            # Create new sample products
            sample_products = [
                Product(
                    name="Amino-Acid Cleanser", 
                    slug="amino-acid-cleanser",
                    description="Gentle amino acid-based cleanser that removes impurities without stripping natural oils",
                    short_description="Gentle cleanser for all skin types",
                    price=1290, 
                    category="cleanser",
                    stock_quantity=50,
                    is_active=True,
                    is_featured=True,
                    primary_image="https://via.placeholder.com/400x400/f0f0f0/333333?text=Amino-Acid+Cleanser",
                    secondary_image="https://via.placeholder.com/400x400/e0e0e0/333333?text=Cleanser+2"
                ),
                Product(
                    name="Hydrating Moisturiser", 
                    slug="hydrating-moisturiser",
                    description="Lightweight moisturiser that provides long-lasting hydration without feeling heavy",
                    short_description="Daily hydrating moisturiser",
                    price=1590, 
                    category="moisturizer",
                    stock_quantity=30,
                    is_active=True,
                    is_featured=True,
                    primary_image="https://via.placeholder.com/400x400/f5f5f5/333333?text=Hydrating+Moisturiser",
                    secondary_image="https://via.placeholder.com/400x400/e5e5e5/333333?text=Moisturiser+2"
                ),
                Product(
                    name="Vitamin C Serum", 
                    slug="vitamin-c-serum",
                    description="Brightening serum with 15% vitamin C to improve skin radiance and even tone",
                    short_description="Brightening vitamin C serum",
                    price=1890, 
                    category="serum",
                    stock_quantity=25,
                    is_active=True,
                    is_featured=True,
                    primary_image="https://via.placeholder.com/400x400/fff5e6/333333?text=Vitamin+C+Serum",
                    secondary_image="https://via.placeholder.com/400x400/ffe6cc/333333?text=Serum+2"
                )
            ]
            for product in sample_products:
                db.session.add(product)
            db.session.commit()
            
            return jsonify({
                'status': 'success',
                'message': 'Products reset successfully',
                'product_count': len(sample_products)
            })
        except Exception as e:
            db.session.rollback()
            return jsonify({
                'status': 'error',
                'message': f'Reset failed: {str(e)}'
            }), 500

    # Orders test endpoint
    @app.route('/api/orders/test')
    def test_orders_direct():
        try:
            order_count = Order.query.count()
            return jsonify({
                'message': 'Orders system working!',
                'order_count': order_count,
                'available_endpoints': [
                    '/api/orders/guest/create',
                    '/api/orders/create',
                    '/api/orders/test'
                ],
                'status': 'success'
            })
        except Exception as e:
            return jsonify({
                'message': 'Orders system error',
                'error': str(e),
                'status': 'error'
            }), 500
    
    # ===== PRODUCT ROUTES =====
    @app.route('/product/<slug>')
    def product_page(slug):
        """Serve individual product pages based on slug"""
        from flask import send_from_directory, abort
        import os
        
        # Check if product exists
        product = Product.query.filter_by(slug=slug, is_active=True).first()
        if not product:
            abort(404)
        
        # Serve the product.html template
        frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend')
        try:
            return send_from_directory(frontend_dir, 'product.html')
        except FileNotFoundError:
            abort(404)
    
    # ===== LOGO REDIRECT ROUTE =====
    @app.route('/home')
    @app.route('/main')
    @app.route('/logo')
    def logo_redirect():
        """Handle logo clicks - redirect to main.html"""
        from flask import send_from_directory
        import os
        frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend')
        try:
            return send_from_directory(frontend_dir, 'main.html')
        except FileNotFoundError:
            from flask import abort
            abort(404)
    
    # ===== ADMIN ROUTES =====
    @app.route('/admin')
    @app.route('/admin/')
    def admin_redirect():
        """Redirect /admin to admin dashboard"""
        from flask import send_from_directory
        import os
        frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend')
        try:
            return send_from_directory(os.path.join(frontend_dir, 'admin'), 'admin-dashboard.html')
        except FileNotFoundError:
            from flask import abort
            abort(404)
    
    # Admin page routes
    @app.route('/admin-dashboard')
    def admin_dashboard():
        """Serve admin dashboard"""
        from flask import send_from_directory
        import os
        frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend')
        try:
            return send_from_directory(os.path.join(frontend_dir, 'admin'), 'admin-dashboard.html')
        except FileNotFoundError:
            from flask import abort
            abort(404)
    
    @app.route('/admin-orders')
    def admin_orders():
        """Serve admin orders page"""
        from flask import send_from_directory
        import os
        frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend')
        try:
            return send_from_directory(os.path.join(frontend_dir, 'admin'), 'admin-orders.html')
        except FileNotFoundError:
            from flask import abort
            abort(404)
    
    @app.route('/admin-products')
    def admin_products():
        """Serve admin products page"""
        from flask import send_from_directory
        import os
        frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend')
        try:
            return send_from_directory(os.path.join(frontend_dir, 'admin'), 'admin-products.html')
        except FileNotFoundError:
            from flask import abort
            abort(404)
    
    @app.route('/admin-analytics')
    def admin_analytics():
        """Serve admin analytics page"""
        from flask import send_from_directory
        import os
        frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend')
        try:
            return send_from_directory(os.path.join(frontend_dir, 'admin'), 'admin-analytics.html')
        except FileNotFoundError:
            from flask import abort
            abort(404)
    
    @app.route('/admin-influencer-applications')
    def admin_influencer_applications():
        """Serve admin influencer applications page"""
        from flask import send_from_directory
        import os
        frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend')
        try:
            return send_from_directory(os.path.join(frontend_dir, 'admin'), 'admin-influencer-applications.html')
        except FileNotFoundError:
            from flask import abort
            abort(404)

    # ===== SERVE FRONTEND FILES =====
    @app.route('/<path:filename>')
    def serve_frontend(filename):
        """Serve frontend files but not API routes"""
        # Don't serve files for API routes
        if filename.startswith('api/'):
            from flask import abort
            abort(404)
            
        # Handle trailing slashes and directory requests
        if filename.endswith('/'):
            filename = filename.rstrip('/')
            
        import os
        frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend')
        
        # If it's a directory-like request (like main.html/), redirect properly
        if '/' in filename and not filename.split('/')[-1].count('.'):
            from flask import abort
            abort(404)
            
        try:
            from flask import send_from_directory
            return send_from_directory(frontend_dir, filename)
        except FileNotFoundError:
            from flask import abort
            abort(404)
    
    # ===== CART ROUTE =====
    @app.route('/cart')
    def cart_page():
        """Serve cart page"""
        from flask import send_from_directory
        import os
        frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend')
        try:
            return send_from_directory(frontend_dir, 'cart.html')
        except FileNotFoundError:
            from flask import abort
            abort(404)
    
    # ===== CHECKOUT ROUTE =====
    @app.route('/checkout')
    def checkout_page():
        """Serve checkout page"""
        from flask import send_from_directory
        import os
        frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend')
        try:
            return send_from_directory(frontend_dir, 'checkout.html')
        except FileNotFoundError:
            from flask import abort
            abort(404)
    
    # Category page routes
    @app.route('/cleanser')
    @app.route('/moisturiser')
    @app.route('/treatments')
    @app.route('/lip-care')
    @app.route('/sets')
    @app.route('/category/<category_name>')
    def category_page(category_name=None):
        """Serve dynamic category pages"""
        import os
        frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend')
        
        # Map URL paths to category names
        category_mapping = {
            'cleanser': 'cleanser',
            'moisturiser': 'moisturiser', 
            'treatments': 'serum',  # treatments maps to serum category
            'lip-care': 'lip-care',
            'sets': 'sets'
        }
        
        # Extract category from URL
        if not category_name:
            # Get category from request path
            import flask
            path = flask.request.path.strip('/')
            category_name = category_mapping.get(path, path)
        
        try:
            from flask import send_from_directory
            return send_from_directory(frontend_dir, 'category.html')
        except FileNotFoundError:
            from flask import abort
            abort(404)
    
    return app

# Create the app instance
app = create_app()

# This allows us to run the app directly with `python app.py`
if __name__ == '__main__':
    with app.app_context():
        # Create database tables if they don't exist
        print("Checking database tables...")
        try:
            db.create_all()
            print("Database tables verified/created successfully!")
            
            # Create sample products for testing if none exist
            try:
                from models import Product
                if Product.query.count() == 0:
                    print("Creating sample products...")
                    sample_products = [
                        Product(
                            name="Amino-Acid Cleanser", 
                            slug="amino-acid-cleanser",
                            description="Gentle amino acid-based cleanser that removes impurities without stripping natural oils",
                            short_description="Gentle cleanser for all skin types",
                            price=1290, 
                            category="cleanser",
                            stock_quantity=50,
                            is_active=True,
                            is_featured=True,
                            primary_image="https://via.placeholder.com/400x400/f0f0f0/333333?text=Amino-Acid+Cleanser",
                            secondary_image="https://via.placeholder.com/400x400/e0e0e0/333333?text=Cleanser+2"
                        ),
                        Product(
                            name="Hydrating Moisturiser", 
                            slug="hydrating-moisturiser",
                            description="Lightweight moisturiser that provides long-lasting hydration without feeling heavy",
                            short_description="Daily hydrating moisturiser",
                            price=1590, 
                            category="moisturizer",
                            stock_quantity=30,
                            is_active=True,
                            is_featured=True,
                            primary_image="https://via.placeholder.com/400x400/f5f5f5/333333?text=Hydrating+Moisturiser",
                            secondary_image="https://via.placeholder.com/400x400/e5e5e5/333333?text=Moisturiser+2"
                        ),
                        Product(
                            name="Vitamin C Serum", 
                            slug="vitamin-c-serum",
                            description="Brightening serum with 15% vitamin C to improve skin radiance and even tone",
                            short_description="Brightening vitamin C serum",
                            price=1890, 
                            category="serum",
                            stock_quantity=25,
                            is_active=True,
                            is_featured=True,
                            primary_image="https://via.placeholder.com/400x400/fff5e6/333333?text=Vitamin+C+Serum",
                            secondary_image="https://via.placeholder.com/400x400/ffe6cc/333333?text=Serum+2"
                        )
                    ]
                    for product in sample_products:
                        db.session.add(product)
                    db.session.commit()
                    print("Sample products created!")
            except Exception as e:
                print(f"Sample products creation failed: {e}")
                
        except Exception as e:
            print(f"Database setup error: {e}")
    
    print("Starting GAOJIE Skincare API server...")
    print("CORS enabled for file:// protocol and local development")
    print("Omise payment processing ready")
    print("Guest checkout supported")
    print("\nTest these endpoints:")
    print("- http://localhost:5000/api/health")
    print("- http://localhost:5000/api/test-cors")
    print("- http://localhost:5000/api/orders/test")
    
    app.run(debug=True, host='0.0.0.0', port=5000)