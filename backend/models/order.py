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
    
    @classmethod
    def generate_order_number(cls):
        """Generate a unique order number"""
        timestamp = datetime.now().strftime('%Y%m%d')
        unique_id = str(uuid.uuid4())[:8].upper()
        order_number = f"GJ{timestamp}{unique_id}"
        
        # Ensure uniqueness
        while cls.query.filter_by(order_number=order_number).first():
            unique_id = str(uuid.uuid4())[:8].upper()
            order_number = f"GJ{timestamp}{unique_id}"
        
        return order_number
    
    @property
    def item_count(self):
        """Total number of items in order"""
        return sum(item.quantity for item in self.order_items)
    
    @property
    def shipping_full_name(self):
        """Full shipping name"""
        return f"{self.shipping_first_name} {self.shipping_last_name}"
    
    @property
    def billing_full_name(self):
        """Full billing name"""
        if self.billing_same_as_shipping:
            return self.shipping_full_name
        return f"{self.billing_first_name} {self.billing_last_name}"
    
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
    
    @property
    def billing_address(self):
        """Formatted billing address"""
        if self.billing_same_as_shipping:
            return self.shipping_address
        
        address_parts = [
            self.billing_address_line1,
            self.billing_address_line2,
            self.billing_city,
            self.billing_state,
            self.billing_postal_code,
            self.billing_country
        ]
        return ", ".join(part for part in address_parts if part)
    
    @property
    def status_display(self):
        """Human-readable status"""
        status_map = {
            'pending': 'Pending Payment',
            'confirmed': 'Order Confirmed',
            'processing': 'Processing',
            'shipped': 'Shipped',
            'delivered': 'Delivered',
            'cancelled': 'Cancelled',
            'refunded': 'Refunded'
        }
        return status_map.get(self.status, self.status.title())
    
    @property
    def payment_status_display(self):
        """Human-readable payment status"""
        status_map = {
            'pending': 'Payment Pending',
            'processing': 'Processing Payment',
            'completed': 'Payment Completed',
            'failed': 'Payment Failed',
            'refunded': 'Payment Refunded'
        }
        return status_map.get(self.payment_status, self.payment_status.title())
    
    def can_be_cancelled(self):
        """Check if order can be cancelled"""
        return self.status in ['pending', 'confirmed'] and self.payment_status != 'completed'
    
    def can_be_refunded(self):
        """Check if order can be refunded"""
        return self.payment_status == 'completed' and self.status not in ['refunded', 'cancelled']
    
    def update_status(self, new_status, admin_notes=None):
        """Update order status with timestamp tracking"""
        old_status = self.status
        self.status = new_status
        self.updated_at = datetime.utcnow()
        
        # Track shipping and delivery timestamps
        if new_status == 'shipped' and old_status != 'shipped':
            self.shipped_at = datetime.utcnow()
        elif new_status == 'delivered' and old_status != 'delivered':
            self.delivered_at = datetime.utcnow()
        
        if admin_notes:
            existing_notes = self.admin_notes or ''
            timestamp = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
            new_note = f"[{timestamp}] Status changed from {old_status} to {new_status}: {admin_notes}"
            self.admin_notes = f"{existing_notes}\n{new_note}".strip()
        
        db.session.commit()
    
    def to_dict(self, include_items=True, include_customer=False):
        """Convert order to dictionary for JSON responses"""
        order_data = {
            'id': self.id,
            'order_number': self.order_number,
            'status': self.status,
            'status_display': self.status_display,
            'payment_status': self.payment_status,
            'payment_status_display': self.payment_status_display,
            'payment_method': self.payment_method,
            'payment_reference': self.payment_reference,
            
            # Financial data
            'subtotal': float(self.subtotal),
            'tax_amount': float(self.tax_amount),
            'shipping_amount': float(self.shipping_amount),
            'discount_amount': float(self.discount_amount),
            'total_amount': float(self.total_amount),
            'item_count': self.item_count,
            
            # Shipping information
            'shipping': {
                'full_name': self.shipping_full_name,
                'company': self.shipping_company,
                'address_line1': self.shipping_address_line1,
                'address_line2': self.shipping_address_line2,
                'city': self.shipping_city,
                'state': self.shipping_state,
                'postal_code': self.shipping_postal_code,
                'country': self.shipping_country,
                'phone': self.shipping_phone,
                'formatted_address': self.shipping_address
            },
            
            # Billing information
            'billing': {
                'same_as_shipping': self.billing_same_as_shipping,
                'full_name': self.billing_full_name,
                'formatted_address': self.billing_address
            } if not self.billing_same_as_shipping else None,
            
            # Notes
            'order_notes': self.order_notes,
            
            # Timestamps
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'shipped_at': self.shipped_at.isoformat() if self.shipped_at else None,
            'delivered_at': self.delivered_at.isoformat() if self.delivered_at else None,
        }
        
        # Include customer information if requested
        if include_customer and hasattr(self, 'customer'):
            order_data['customer'] = {
                'id': self.customer.id,
                'email': self.customer.email,
                'full_name': self.customer.full_name,
                'is_guest': self.customer.is_guest
            }
        
        # Include order items if requested
        if include_items:
            order_data['items'] = [item.to_dict() for item in self.order_items]
        
        return order_data