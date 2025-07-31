from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from extensions import db

class User(UserMixin, db.Model):
    """User/Customer model with authentication features and guest support"""
    
    __tablename__ = 'users'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # Authentication Fields
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(200), nullable=True)  # Nullable for guest users
    
    # Personal Information
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    phone = db.Column(db.String(20))
    
    # Account Status
    is_active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)
    is_admin = db.Column(db.Boolean, default=False)
    is_guest = db.Column(db.Boolean, default=False)  # New field for guest users
    
    # Preferences
    newsletter_subscribed = db.Column(db.Boolean, default=False)
    preferred_language = db.Column(db.String(5), default='en')
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login_at = db.Column(db.DateTime)
    
    # Relationships
    orders = db.relationship('Order', backref='customer', lazy=True)
    
    def __repr__(self):
        return f'<User {self.email}>'
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check if provided password matches hash"""
        if not self.password_hash:  # Guest users don't have passwords
            return False
        return check_password_hash(self.password_hash, password)
    
    @property
    def full_name(self):
        """Get user's full name"""
        return f"{self.first_name} {self.last_name}"
    
    def update_last_login(self):
        """Update last login timestamp"""
        self.last_login_at = datetime.utcnow()
        db.session.commit()
    
    def to_dict(self, include_sensitive=False):
        """Convert user to dictionary for JSON responses"""
        user_data = {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': self.full_name,
            'phone': self.phone,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'is_guest': self.is_guest,
            'newsletter_subscribed': self.newsletter_subscribed,
            'preferred_language': self.preferred_language,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login_at': self.last_login_at.isoformat() if self.last_login_at else None
        }
        
        if include_sensitive:
            user_data.update({
                'updated_at': self.updated_at.isoformat() if self.updated_at else None,
                'is_admin': self.is_admin
            })
        
        return user_data
    
    @classmethod
    def find_by_email(cls, email):
        """Find user by email address"""
        return cls.query.filter_by(email=email.lower()).first()
    
    @classmethod
    def create_user(cls, email, password, first_name, last_name, 
                   phone=None, newsletter_subscribed=False, is_guest=False):
        """Create a new user"""
        user = cls(
            email=email.lower(),
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            newsletter_subscribed=newsletter_subscribed,
            is_guest=is_guest,
            is_verified=False if not is_guest else True  # Guest users are auto-verified
        )
        
        if password and not is_guest:
            user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        return user
    
    @classmethod
    def create_guest_user(cls, email, first_name, last_name, phone=None):
        """Create a guest user (no password required)"""
        # Check if user already exists
        existing_user = cls.find_by_email(email)
        if existing_user:
            if existing_user.is_guest:
                # Update existing guest user info
                existing_user.first_name = first_name
                existing_user.last_name = last_name
                if phone:
                    existing_user.phone = phone
                existing_user.updated_at = datetime.utcnow()
                db.session.commit()
                return existing_user
            else:
                # User exists as registered user, return existing
                return existing_user
        
        # Create new guest user
        return cls.create_user(
            email=email,
            password=None,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            is_guest=True
        )
    
    def convert_guest_to_registered(self, password):
        """Convert a guest user to a registered user"""
        if not self.is_guest:
            raise ValueError("User is already registered")
        
        self.set_password(password)
        self.is_guest = False
        self.is_verified = False  # Will need to verify email
        self.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return self
    
    def can_login(self):
        """Check if user can login (not for guest users)"""
        return not self.is_guest and self.password_hash and self.is_active
    
    @property
    def display_name(self):
        """Get display name for UI"""
        if self.is_guest:
            return f"{self.first_name} (Guest)"
        return self.full_name
    
    def has_placed_orders(self):
        """Check if user has placed any orders"""
        return self.orders.count() > 0
    
    def get_order_count(self):
        """Get total number of orders placed by user"""
        return self.orders.count()
    
    def get_total_spent(self):
        """Get total amount spent by user"""
        from models.order import Order  # Import here to avoid circular imports
        
        total = db.session.query(db.func.sum(Order.total_amount)).filter(
            Order.user_id == self.id,
            Order.status.in_(['confirmed', 'processing', 'shipped', 'delivered'])
        ).scalar()
        
        return float(total or 0)
    
    def get_recent_orders(self, limit=5):
        """Get user's recent orders"""
        return self.orders.order_by(db.desc('created_at')).limit(limit).all()