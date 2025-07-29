from datetime import datetime
from sqlalchemy import Numeric
from extensions import db

class Product(db.Model):
    """Product model for skincare items"""
    
    __tablename__ = 'products'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # Basic Product Information
    name = db.Column(db.String(100), nullable=False, index=True)
    slug = db.Column(db.String(120), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=False)
    short_description = db.Column(db.String(300))
    
    # Pricing
    price = db.Column(Numeric(10, 2), nullable=False)  # Price in THB
    original_price = db.Column(Numeric(10, 2))  # For showing discounts
    cost_price = db.Column(Numeric(10, 2))  # For profit calculations
    
    # Inventory Management
    stock_quantity = db.Column(db.Integer, default=0, nullable=False)
    low_stock_threshold = db.Column(db.Integer, default=10)
    track_inventory = db.Column(db.Boolean, default=True)
    
    # Skincare Specific Fields
    category = db.Column(db.String(50), nullable=False, index=True)  # cleanser, moisturizer, serum, etc.
    skin_type = db.Column(db.String(100))  # "all", "oily", "dry", "combination", "sensitive"
    ingredients = db.Column(db.Text)  # Key ingredients list
    size = db.Column(db.String(20))  # "50ml", "100ml", etc.
    
    # Product Status
    is_active = db.Column(db.Boolean, default=True, index=True)
    is_featured = db.Column(db.Boolean, default=False, index=True)
    is_bestseller = db.Column(db.Boolean, default=False)
    is_new = db.Column(db.Boolean, default=False)
    
    # SEO and Marketing
    meta_title = db.Column(db.String(120))
    meta_description = db.Column(db.String(300))
    tags = db.Column(db.String(500))  # Comma-separated tags
    
    # Images
    primary_image = db.Column(db.String(200))  # Main product image
    secondary_image = db.Column(db.String(200))  # Hover/secondary image
    gallery_images = db.Column(db.Text)  # JSON string of additional images
    
    # Analytics
    view_count = db.Column(db.Integer, default=0)
    sales_count = db.Column(db.Integer, default=0)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships (we'll add these later)
    # order_items = db.relationship('OrderItem', backref='product', lazy=True)
    
    def __repr__(self):
        return f'<Product {self.name}>'
    
    @property
    def is_on_sale(self):
        """Check if product is on sale"""
        return self.original_price and self.price < self.original_price
    
    @property
    def discount_percentage(self):
        """Calculate discount percentage"""
        if self.is_on_sale:
            return int(((self.original_price - self.price) / self.original_price) * 100)
        return 0
    
    @property
    def is_in_stock(self):
        """Check if product is in stock"""
        if not self.track_inventory:
            return True
        return self.stock_quantity > 0
    
    @property
    def is_low_stock(self):
        """Check if product is low in stock"""
        if not self.track_inventory:
            return False
        return self.stock_quantity <= self.low_stock_threshold
    
    def to_dict(self):
        """Convert product to dictionary for JSON responses"""
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'description': self.description,
            'short_description': self.short_description,
            'price': float(self.price),
            'original_price': float(self.original_price) if self.original_price else None,
            'category': self.category,
            'skin_type': self.skin_type,
            'ingredients': self.ingredients,
            'size': self.size,
            'stock_quantity': self.stock_quantity,
            'is_active': self.is_active,
            'is_featured': self.is_featured,
            'is_bestseller': self.is_bestseller,
            'is_new': self.is_new,
            'primary_image': self.primary_image,
            'secondary_image': self.secondary_image,
            'tags': self.tags,
            'is_on_sale': self.is_on_sale,
            'discount_percentage': self.discount_percentage,
            'is_in_stock': self.is_in_stock,
            'is_low_stock': self.is_low_stock,
            'view_count': self.view_count,
            'sales_count': self.sales_count,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }