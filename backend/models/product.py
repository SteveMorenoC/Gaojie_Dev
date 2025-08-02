from datetime import datetime
from sqlalchemy import Numeric
from extensions import db
import re

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
    usage_instructions = db.Column(db.Text)  # How to use instructions
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
    
    # Badges
    badge_ids = db.Column(db.Text)  # JSON string of badge IDs
    
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
    
    @staticmethod
    def generate_slug(name):
        """Generate a URL-friendly slug from product name"""
        # Convert to lowercase and replace spaces/special chars with hyphens
        slug = re.sub(r'[^a-zA-Z0-9\s-]', '', name.lower())
        slug = re.sub(r'\s+', '-', slug)
        slug = re.sub(r'-+', '-', slug)
        slug = slug.strip('-')
        return slug
    
    def set_slug_from_name(self):
        """Set the slug based on the product name"""
        if self.name:
            base_slug = self.generate_slug(self.name)
            
            # Check for uniqueness and append number if needed
            counter = 1
            slug = base_slug
            while Product.query.filter_by(slug=slug).first() is not None:
                slug = f"{base_slug}-{counter}"
                counter += 1
            
            self.slug = slug
    
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
    
    def get_gallery_images_list(self):
        """Parse gallery_images JSON string to list"""
        if not self.gallery_images:
            return []
        try:
            import json
            return json.loads(self.gallery_images) if isinstance(self.gallery_images, str) else self.gallery_images
        except (json.JSONDecodeError, TypeError):
            return []
    
    def get_badge_ids_list(self):
        """Parse badge_ids JSON string to list"""
        badge_ids = getattr(self, 'badge_ids', None)
        if not badge_ids:
            return []
        try:
            import json
            return json.loads(badge_ids) if isinstance(badge_ids, str) else badge_ids
        except (json.JSONDecodeError, TypeError):
            return []
    
    def get_badges(self):
        """Get actual badge objects for this product"""
        badge_ids = self.get_badge_ids_list()
        if not badge_ids:
            return []
        
        # Import here to avoid circular imports
        from models.badge import Badge
        try:
            return Badge.query.filter(Badge.id.in_(badge_ids), Badge.is_active == True).all()
        except Exception as e:
            print(f"Error fetching badges: {e}")
            return []
    
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
            'cost_price': float(self.cost_price) if self.cost_price else None,
            'category': self.category,
            'skin_type': self.skin_type,
            'ingredients': self.ingredients,
            'usage_instructions': self.usage_instructions,
            'size': self.size,
            'stock_quantity': self.stock_quantity,
            'low_stock_threshold': self.low_stock_threshold,
            'is_active': self.is_active,
            'is_featured': self.is_featured,
            'is_bestseller': self.is_bestseller,
            'is_new': self.is_new,
            'meta_title': self.meta_title,
            'meta_description': self.meta_description,
            'primary_image': self.primary_image,
            'secondary_image': self.secondary_image,
            'gallery_images': self.gallery_images,
            'gallery_images_list': self.get_gallery_images_list(),
            'badge_ids': getattr(self, 'badge_ids', None),
            'badge_ids_list': self.get_badge_ids_list(),
            'badges': [badge.to_dict() for badge in self.get_badges()],
            'tags': self.tags,
            'is_on_sale': self.is_on_sale,
            'discount_percentage': self.discount_percentage,
            'is_in_stock': self.is_in_stock,
            'is_low_stock': self.is_low_stock,
            'view_count': self.view_count,
            'sales_count': self.sales_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }