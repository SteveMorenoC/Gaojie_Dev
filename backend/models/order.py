from datetime import datetime
from sqlalchemy import Numeric
from extensions import db
import uuid

class Order(db.Model):
    """Order model for customer purchases"""
    
    __tablename__ = 'orders'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    
    # Customer Information
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Order Details
    status = db.Column(db.String(20), default='pending', nullable=False, index=True)
    # Status options: pending, confirmed, processing, shipped, delivered, cancelled, refunded
    
    # Pricing
    subtotal = db.Column(Numeric(10, 2), nullable=False)  # Before tax/shipping
    tax_amount = db.Column(Numeric(10, 2), default=0)
    shipping_amount = db.Column(Numeric(10, 2), default=0)
    discount_amount = db.Column(Numeric(10, 2), default=0)
    total_amount = db.Column(Numeric(10, 2), nullable=False)  # Final amount
    
    # Shipping Information
    shipping_first_name = db.Column(db.String(50), nullable=False)
    shipping_last_name = db.Column(db.String(50), nullable=False)
    shipping_company = db.Column(db.String(100))
    shipping_address_line1 = db.Column(db.String(255), nullable=False)
    shipping_address_line2 = db.Column(db.String(255))
    shipping_city = db.Column(db.String(100), nullable=False)
    shipping_state = db.Column(db.String(100), nullable=False)
    shipping_postal_code = db.Column(db.String(20), nullable=False)
    shipping_country = db.Column(db.String(100), default='Thailand', nullable=False)
    shipping_phone = db.Column(db.String(20))
    
    # Billing Information (can be same as shipping)
    billing_same_as_shipping = db.Column(db.Boolean, default=True)
    billing_first_name = db.Column(db.String(50))
    billing_last_name = db.Column(db.String(50))
    billing_company = db.Column(db.String(100))
    billing_address_line1 = db.Column(db.String(255))
    billing_address_line2 = db.Column(db.String(255))
    billing_city = db.Column(db.String(100))
    billing_state = db.Column(db.String(100))
    billing_postal_code = db.Column(db.String(20))
    billing_country = db.Column(db.String(100))
    
    # Payment Information
    payment_method = db.Column(db.String(50))  # 'credit_card', 'bank_transfer', etc.
    payment_status = db.Column(db.String(20), default='pending')
    # Payment status: pending, processing, completed, failed, refunded
    payment_reference = db.Column(db.String(100))  # Omise charge ID
    
    # Special Instructions
    order_notes = db.Column(db.Text)
    admin_notes = db.Column(db.Text)  # Internal notes
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    shipped_at = db.Column(db.DateTime)
    delivered_at = db.Column(db.DateTime)
    
    # Relationships
    order_items = db.relationship('OrderItem', backref='order', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Order {self.order_number}>'
    
    @property
    def item_count(self):
        """Total number of items in order"""
        return sum(item.quantity for item in self.order_items)
    
    @property
    def shipping_full_name(self):
        """Full shipping name"""
        return f"{self.shipping_first_name} {self.shipping_last_name}"
    
    @property
    def shipping_address(self):
        """Formatted shipping address"""
        address_parts = [
            self.shipping_address_line1,
            self.shipping_address_line2,
            self.shipping_city,
            self.shipping_state,
            self.shipping_postal_code,
            self.shipping_country
        ]
        return ", ".join(part for part in address_parts if part)
    
    def to_dict(self, include_items=True):
        """Convert order to dictionary for JSON responses"""
        order_data = {
            'id': self.id,
            'order_number': self.order_number,
            'status': self.status,
            'subtotal': float(self.subtotal),
            'tax_amount': float(self.tax_amount),
            'shipping_amount': float(self.shipping_amount),
            'discount_amount': float(self.discount_amount),
            'total_amount': float(self.total_amount),
            'item_count': self.item_count,
            'payment_method': self.payment_method,
            'payment_status': self.payment_status,
            'shipping_full_name': self.shipping_full_name,
            'shipping_address': self.shipping_address,
            'order_notes': self.order_notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'shipped_at': self.shipped_at.isoformat() if self.shipped_at else None,
            'delivered_at': self.delivered_at.isoformat() if self.delivered_at else None
        }
        
        if include_items:
            order_data['items'] = [item.to_dict() for item in self.order_items]
        
        return order_data
    
    @staticmethod
    def generate_order_number():
        """Generate unique order number"""
        # Format: GJ-YYYYMMDD-XXXX (GJ = GAOJIE)
        date_str = datetime.utcnow().strftime('%Y%m%d')
        random_str = str(uuid.uuid4())[:8].upper()
        return f"GJ-{date_str}-{random_str}"

class OrderItem(db.Model):
    """Individual items within an order"""
    
    __tablename__ = 'order_items'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # References
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    
    # Item Details (snapshot at time of order)
    product_name = db.Column(db.String(100), nullable=False)
    product_slug = db.Column(db.String(120), nullable=False)
    product_sku = db.Column(db.String(50))
    product_image = db.Column(db.String(200))
    
    # Pricing (prices at time of order)
    unit_price = db.Column(Numeric(10, 2), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    total_price = db.Column(Numeric(10, 2), nullable=False)  # unit_price * quantity
    
    # Product details at time of order
    product_size = db.Column(db.String(20))
    product_category = db.Column(db.String(50))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    product = db.relationship('Product', backref='order_items')
    
    def __repr__(self):
        return f'<OrderItem {self.product_name} x{self.quantity}>'
    
    def to_dict(self):
        """Convert order item to dictionary for JSON responses"""
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_name': self.product_name,
            'product_slug': self.product_slug,
            'product_image': self.product_image,
            'product_size': self.product_size,
            'product_category': self.product_category,
            'unit_price': float(self.unit_price),
            'quantity': self.quantity,
            'total_price': float(self.total_price),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }