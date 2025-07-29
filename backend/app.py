import os
from flask import Flask, jsonify
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
    
    # Enable CORS for frontend communication with credentials support
    CORS(app, 
         origins=["null", "file://", "http://localhost:8080", "http://127.0.0.1:8080"],
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    
    # Import models (this ensures they're registered with SQLAlchemy)
    # We import here to avoid circular imports
    from models import Product, User, Order, OrderItem
    
    # User loader for Flask-Login
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))
    
    # Register blueprints
    from products import products_bp
    from auth import auth_bp
    from orders import orders_bp, cart_bp
    app.register_blueprint(products_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(cart_bp)
    
    # Register a simple test route
    @app.route('/')
    def hello():
        return jsonify({
            'message': 'GAOJIE Skincare API is running!',
            'status': 'success',
            'environment': app.config['FLASK_ENV']
        })
    
    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'api_version': '1.0'
        })
    
    # Test endpoint to see if database works
    @app.route('/api/products/test')
    def test_products():
        try:
            # Try to count products (this tests database connection)
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
    
    return app

# Create the app instance
app = create_app()

# This allows us to run the app directly with `python app.py`
if __name__ == '__main__':
    with app.app_context():
        # Recreate database with new Order models (DEVELOPMENT ONLY)
        print("Updating database with Order models...")
        db.drop_all()
        db.create_all()
        print("Database tables created successfully!")
        
        # Create sample products for testing
        from utils.sample_data import create_sample_products
        create_sample_products()
    
    app.run(debug=True, host='0.0.0.0', port=5000)