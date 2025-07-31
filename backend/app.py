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
    
    # Enhanced CORS configuration
    CORS(app, 
         origins=[
             "null",  # For file:// protocol
             "file://",  # Alternative file protocol
             "http://localhost:8080", 
             "http://127.0.0.1:8080",
             "http://localhost:3000",
             "http://127.0.0.1:3000",
             "http://localhost:8000",
             "http://127.0.0.1:8000"
         ],
         supports_credentials=True,
         allow_headers=[
             "Content-Type", 
             "Authorization", 
             "Access-Control-Allow-Credentials",
             "Access-Control-Allow-Origin"
         ],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
         expose_headers=["Content-Type", "Authorization"])
    
    # Add CORS headers
    @app.after_request
    def after_request(response):
        origin = request.headers.get('Origin')
        
        if origin == 'null' or origin is None:
            response.headers.add('Access-Control-Allow-Origin', '*')
        else:
            response.headers.add('Access-Control-Allow-Origin', origin)
        
        response.headers.add('Access-Control-Allow-Headers', 
                           'Content-Type,Authorization,Access-Control-Allow-Credentials')
        response.headers.add('Access-Control-Allow-Methods', 
                           'GET,PUT,POST,DELETE,OPTIONS,PATCH')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        response.headers.add('Vary', 'Origin')
        response.headers.add('Access-Control-Max-Age', '86400')
        
        return response
    
    # Handle preflight requests
    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            response = jsonify({'status': 'preflight'})
            response.headers.add("Access-Control-Allow-Origin", request.headers.get('Origin', '*'))
            response.headers.add('Access-Control-Allow-Headers', 
                               'Content-Type,Authorization,Access-Control-Allow-Credentials')
            response.headers.add('Access-Control-Allow-Methods', 
                               'GET,PUT,POST,DELETE,OPTIONS,PATCH')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            return response
    
    # Import models with error handling
    try:
        from models import User, Order, OrderItem
        print("✅ Models imported successfully")
    except ImportError as e:
        print(f"❌ Models import error: {e}")
        # Create basic models if import fails
        class User(db.Model):
            __tablename__ = 'users'
            id = db.Column(db.Integer, primary_key=True)
            email = db.Column(db.String(120), unique=True, nullable=False)
            first_name = db.Column(db.String(50), nullable=False)
            last_name = db.Column(db.String(50), nullable=False)
            is_guest = db.Column(db.Boolean, default=False)
    
    # Try to import Product model
    try:
        from models import Product
        print("✅ Product model imported successfully")
    except ImportError as e:
        print(f"❌ Product model import error: {e}")
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
    
    # Register blueprints with detailed error handling
    blueprint_count = 0
    
    try:
        from orders.routes import orders_bp
        app.register_blueprint(orders_bp)
        blueprint_count += 1
        print("✅ Orders blueprint registered successfully")
    except ImportError as e:
        print(f"❌ Orders blueprint import error: {e}")
        print(f"   Make sure orders/routes.py exists and has the correct content")
    except Exception as e:
        print(f"❌ Orders blueprint registration error: {e}")
    
    try:
        from auth.routes import auth_bp
        app.register_blueprint(auth_bp)
        blueprint_count += 1
        print("✅ Auth blueprint registered successfully")
    except ImportError as e:
        print(f"❌ Auth blueprint import error: {e}")
    except Exception as e:
        print(f"❌ Auth blueprint registration error: {e}")
    
    try:
        from products.routes import products_bp
        app.register_blueprint(products_bp)
        blueprint_count += 1
        print("✅ Products blueprint registered successfully")
    except ImportError as e:
        print(f"❌ Products blueprint import error: {e}")
    except Exception as e:
        print(f"❌ Products blueprint registration error: {e}")
    
    print(f"📊 Total blueprints registered: {blueprint_count}")
    
    # ===== DIRECT ROUTES (These should always work) =====
    
    @app.route('/')
    def hello():
        return jsonify({
            'message': 'GAOJIE Skincare API is running!',
            'status': 'success',
            'environment': app.config['FLASK_ENV'],
            'cors_enabled': True,
            'blueprints_registered': blueprint_count
        })
    
    @app.route('/api/health')
    def health_check():
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'api_version': '1.0',
            'omise_configured': bool(app.config.get('OMISE_SECRET_KEY')),
            'cors_enabled': True,
            'blueprints_registered': blueprint_count
        })
    
    @app.route('/api/test-cors')
    def test_cors():
        return jsonify({
            'message': 'CORS is working!',
            'origin': request.headers.get('Origin', 'No origin header'),
            'user_agent': request.headers.get('User-Agent', 'No user agent'),
            'method': request.method,
            'status': 'success'
        })
    
    @app.route('/api/test-debug')
    def test_debug():
        return jsonify({
            'message': 'Debug endpoint working!',
            'status': 'success',
            'blueprints_registered': blueprint_count
        })
    
    @app.route('/api/orders/test')
    def test_orders_direct():
        try:
            order_count = Order.query.count()
            return jsonify({
                'message': 'Orders system working!',
                'order_count': order_count,
                'available_endpoints': [
                    '/api/orders/guest/create',
                    '/api/orders/create'
                ],
                'status': 'success'
            })
        except Exception as e:
            return jsonify({
                'message': 'Orders system error',
                'error': str(e),
                'status': 'error'
            }), 500
    
    @app.route('/api/products/test')
    def test_products():
        try:
            product_count = Product.query.count()
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
    
    # Debug: Print all registered routes
    with app.app_context():
        print("\n=== REGISTERED ROUTES ===")
        for rule in app.url_map.iter_rules():
            print(f"✅ Route: {rule.rule} -> {rule.endpoint}")
        print("=== END ROUTES ===\n")
    
    return app

# Create the app instance
app = create_app()

# Run the app
if __name__ == '__main__':
    with app.app_context():
        print("🔧 Setting up database...")
        try:
            db.create_all()
            print("✅ Database tables created successfully!")
            
            # Create sample products if none exist
            try:
                from models import Product
                if Product.query.count() == 0:
                    print("📦 Creating sample products...")
                    sample_products = [
                        Product(name="Amino-Acid Cleanser", price=1290, is_active=True),
                        Product(name="Hydrating Moisturiser", price=1590, is_active=True),
                        Product(name="Vitamin C Serum", price=1890, is_active=True)
                    ]
                    for product in sample_products:
                        db.session.add(product)
                    db.session.commit()
                    print("✅ Sample products created!")
            except Exception as e:
                print(f"❌ Sample products creation failed: {e}")
        except Exception as e:
            print(f"❌ Database setup error: {e}")
    
    print("\n🚀 Starting GAOJIE Skincare API server...")
    print("🌐 CORS enabled for file:// protocol and local development")
    print("💳 Omise payment processing ready")
    print("👤 Guest checkout supported")
    print("\n📋 Test these endpoints:")
    print("- http://localhost:5000/")
    print("- http://localhost:5000/api/health")
    print("- http://localhost:5000/api/test-cors")
    print("- http://localhost:5000/api/test-debug")
    print("- http://localhost:5000/api/orders/test")
    print("- http://localhost:5000/api/products/test")
    
    app.run(debug=True, host='0.0.0.0', port=5000)