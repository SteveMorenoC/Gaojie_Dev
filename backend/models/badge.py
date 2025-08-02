from datetime import datetime
from extensions import db

class Badge(db.Model):
    """Badge model for product categorization and labeling"""
    
    __tablename__ = 'badges'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # Badge Information
    name = db.Column(db.String(50), nullable=False, unique=True, index=True)  # e.g., "Moisturizer", "Anti-Aging"
    slug = db.Column(db.String(60), unique=True, nullable=False, index=True)  # e.g., "moisturizer", "anti-aging"
    
    # Styling
    background_color = db.Column(db.String(7), nullable=False)  # Hex color like #E3F2FD
    text_color = db.Column(db.String(7), nullable=False)        # Hex color like #1976D2
    
    # Configuration
    is_active = db.Column(db.Boolean, default=True, index=True)
    is_category_badge = db.Column(db.Boolean, default=True)     # True for category badges, False for promo badges
    sort_order = db.Column(db.Integer, default=0)               # For ordering in admin interface
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Badge {self.name}>'
    
    @property
    def css_class(self):
        """Generate CSS class name from slug"""
        return f"badge-{self.slug}"
    
    def to_dict(self):
        """Convert badge to dictionary for JSON responses"""
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'background_color': self.background_color,
            'text_color': self.text_color,
            'css_class': self.css_class,
            'is_active': self.is_active,
            'is_category_badge': self.is_category_badge,
            'sort_order': self.sort_order,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }