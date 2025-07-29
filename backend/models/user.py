from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from extensions import db

class User(UserMixin, db.Model):
    """User/Customer model with authentication features"""
    
    __tablename__ = 'users'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # Authentication Fields
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(200), nullable=False)
    
    # Personal Information
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    phone = db.Column(db.String(20))
    
    # Account Status
    is_active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)
    is_admin = db.Column(db.Boolean, default=False)
    
    # Preferences
    newsletter_subscribed = db.Column(db.Boolean, default=False)
    preferred_language = db.Column(db.String(5), default='en')
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login_at = db.Column(db.DateTime)
    
    # Relationships (we'll expand these later)
    # orders = db.relationship('Order', backref='customer', lazy=True)
    
    def __repr__(self):
        return f'<User {self.email}>'
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check if provided password matches hash"""
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
            'newsletter_subscribed': self.newsletter_subscribed,
            'preferred_language': self.preferred_language,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login_at': self.last_login_at.isoformat() if self.last_login_at else None
        }
        
        if include_sensitive:
            user_data.update({
                'is_admin': self.is_admin
            })
        
        return user_data
    
    @staticmethod
    def find_by_email(email):
        """Find user by email address"""
        return User.query.filter_by(email=email.lower().strip()).first()
    
    @staticmethod
    def create_user(email, password, first_name, last_name, **kwargs):
        """Create new user with validation"""
        print(f"Creating user with email: {email}")  # Debug
        
        # Check if user already exists
        existing_user = User.find_by_email(email)
        if existing_user:
            print(f"User already exists: {email}")  # Debug
            raise ValueError('User with this email already exists')
        
        print("Creating new user object...")  # Debug
        # Create new user
        user = User(
            email=email.lower().strip(),
            first_name=first_name.strip(),
            last_name=last_name.strip(),
            **kwargs
        )
        print("Setting password...")  # Debug
        user.set_password(password)
        
        print("Adding to database...")  # Debug
        db.session.add(user)
        print("Committing...")  # Debug
        db.session.commit()
        
        print(f"User created successfully: {user.id}")  # Debug
        return user