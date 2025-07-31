from datetime import datetime
from sqlalchemy import Numeric
from extensions import db

class OrderItem(db.Model):
    """Individual items within an order"""
    
    __tablename__ = 'order_items'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # Foreign Keys
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    
    # Item Details
    quantity = db.Column(db.Integer, nullable=False, default=1)
    unit_price = db.Column(Numeric(10, 2), nullable=False)  # Price at time of order
    total_price = db.Column(Numeric(10, 2), nullable=False)  # unit_price * quantity
    
    # Product snapshot (in case product details change)
    product_name = db.Column(db.String(255))  # Product name at time of order
    product_sku = db.Column(db.String(50))    # SKU at time of order
    
    # Variant information (if applicable)
    variant_id = db.Column(db.Integer)  # For future variant support
    variant_details = db.Column(db.Text)  # JSON string of variant details
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    product = db.relationship('Product', backref='order_items')
    
    def __repr__(self):
        return f'<OrderItem {self.id}: {self.quantity}x {self.product_name}>'
    
    @property
    def line_total(self):
        """Total price for this line item"""
        return float(self.total_price)
    
    def to_dict(self, include_product=True):
        """Convert order item to dictionary for JSON responses"""
        item_data = {
            'id': self.id,
            'quantity': self.quantity,
            'unit_price': float(self.unit_price),
            'total_price': float(self.total_price),
            'product_name': self.product_name,
            'product_sku': self.product_sku,
            'variant_details': self.variant_details,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        # Include current product information if requested and available
        if include_product and self.product:
            item_data['product'] = {
                'id': self.product.id,
                'name': self.product.name,
                'current_price': float(self.product.price),
                'image': self.product.image_url if hasattr(self.product, 'image_url') else None,
                'is_active': self.product.is_active,
                'price_changed': float(self.product.price) != float(self.unit_price)
            }
        
        return item_data
    
    def save_product_snapshot(self):
        """Save product details at time of order"""
        if self.product:
            self.product_name = self.product.name
            self.product_sku = getattr(self.product, 'sku', f'PROD-{self.product.id}')
    
    @classmethod
    def create_from_cart_item(cls, order_id, product, quantity):
        """Create order item from cart item and product"""
        unit_price = float(product.price)
        total_price = unit_price * quantity
        
        order_item = cls(
            order_id=order_id,
            product_id=product.id,
            quantity=quantity,
            unit_price=unit_price,
            total_price=total_price,
            product_name=product.name,
            product_sku=getattr(product, 'sku', f'PROD-{product.id}')
        )
        
        return order_item