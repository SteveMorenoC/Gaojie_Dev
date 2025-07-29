from flask import Blueprint, request, jsonify, session
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import check_password_hash
from sqlalchemy import func
from datetime import datetime
from extensions import db
from models import User
import re

# Create auth blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Simple test endpoint
@auth_bp.route('/test', methods=['GET'])
def test_auth():
    """Test if auth blueprint is working"""
    try:
        # Test database connection
        user_count = User.query.count()
        return jsonify({
            'status': 'success',
            'message': 'Auth blueprint is working!',
            'user_count': user_count
        })
    except Exception as e:
        print(f"Auth test error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'message': f'Database error: {str(e)}'
        }), 500

def validate_request_data(required_fields, data):
    """Validate that all required fields are present"""
    missing_fields = []
    for field in required_fields:
        if field not in data or not data[field] or not str(data[field]).strip():
            missing_fields.append(field)
    
    if missing_fields:
        return {
            'status': 'error',
            'message': f'Missing required fields: {", ".join(missing_fields)}',
            'missing_fields': missing_fields
        }
    return None

def validate_email_format(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password_strength(password):
    """Validate password strength"""
    if len(password) < 8:
        return "Password must be at least 8 characters long"
    
    if not any(c.isupper() for c in password):
        return "Password must contain at least one uppercase letter"
    
    if not any(c.islower() for c in password):
        return "Password must contain at least one lowercase letter"
    
    if not any(c.isdigit() for c in password):
        return "Password must contain at least one number"
    
    return None

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    print("=== REGISTRATION ROUTE HIT ===")
    try:
        print("Registration attempt started")  # Debug
        data = request.get_json()
        print(f"Received data: {data}")  # Debug
        
        if not data:
            print("No data provided")  # Debug
            return jsonify({
                'status': 'error',
                'message': 'No data provided'
            }), 400
        
        # Validate required fields
        required_fields = ['first_name', 'last_name', 'email', 'password']
        validation_error = validate_request_data(required_fields, data)
        if validation_error:
            return jsonify(validation_error), 400
        
        # Extract and clean data
        first_name = data['first_name'].strip()
        last_name = data['last_name'].strip()
        email = data['email'].strip().lower()
        password = data['password']
        phone = data.get('phone', '').strip()
        newsletter = data.get('newsletter', False)
        
        # Validate email format
        if not validate_email_format(email):
            return jsonify({
                'status': 'error',
                'message': 'Please enter a valid email address'
            }), 400
        
        # Validate name lengths
        if len(first_name) < 2 or len(last_name) < 2:
            return jsonify({
                'status': 'error',
                'message': 'First and last names must be at least 2 characters long'
            }), 400
        
        # Validate password strength
        password_error = validate_password_strength(password)
        if password_error:
            return jsonify({
                'status': 'error',
                'message': password_error
            }), 400
        
        # Check if user already exists
        existing_user = User.find_by_email(email)
        if existing_user:
            return jsonify({
                'status': 'error',
                'message': 'An account with this email already exists'
            }), 409
        
        # Create new user
        try:
            print("Creating user...")  # Debug
            user = User.create_user(
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                phone=phone if phone else None,
                newsletter_subscribed=newsletter
            )
            print(f"User created: {user}")  # Debug
            
            # Try to log the user in
            print("Attempting login...")  # Debug
            login_user(user, remember=False)
            print("Login successful")  # Debug
            
            return jsonify({
                'status': 'success',
                'message': 'Account created successfully! Welcome to GAOJIE!',
                'user': user.to_dict()
            }), 201
            
        except Exception as create_error:
            print(f"User creation error: {create_error}")  # Debug
            db.session.rollback()
            return jsonify({
                'status': 'error',
                'message': f'Registration failed: {str(create_error)}'
            }), 400
        
    except Exception as e:
        print(f"General registration error: {e}")  # Debug
        import traceback
        traceback.print_exc()  # This will show the full error
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': 'Registration failed. Please try again.'
        }), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Log in an existing user"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No data provided'
            }), 400
        
        # Validate required fields
        required_fields = ['email', 'password']
        validation_error = validate_request_data(required_fields, data)
        if validation_error:
            return jsonify(validation_error), 400
        
        email = data['email'].strip().lower()
        password = data['password']
        remember_me = data.get('remember_me', False)
        
        # Validate email format
        if not validate_email_format(email):
            return jsonify({
                'status': 'error',
                'message': 'Please enter a valid email address'
            }), 400
        
        # Find user by email
        user = User.find_by_email(email)
        
        if not user or not user.check_password(password):
            return jsonify({
                'status': 'error',
                'message': 'Invalid email or password'
            }), 401
        
        if not user.is_active:
            return jsonify({
                'status': 'error',
                'message': 'Your account has been deactivated. Please contact support.'
            }), 403
        
        # Log the user in
        login_user(user, remember=remember_me)
        user.update_last_login()
        
        return jsonify({
            'status': 'success',
            'message': f'Welcome back, {user.first_name}!',
            'user': user.to_dict()
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Login failed. Please try again.'
        }), 500

@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    """Log out the current user"""
    try:
        user_name = current_user.first_name
        logout_user()
        
        return jsonify({
            'status': 'success',
            'message': f'Goodbye, {user_name}! You have been logged out successfully.'
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Logout failed. Please try again.'
        }), 500

@auth_bp.route('/me', methods=['GET'])
@login_required
def get_current_user():
    """Get current user information"""
    try:
        return jsonify({
            'status': 'success',
            'user': current_user.to_dict(include_sensitive=True)
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Failed to get user information'
        }), 500

@auth_bp.route('/profile', methods=['PUT'])
@login_required
def update_profile():
    """Update user profile"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No data provided'
            }), 400
        
        # Update allowed fields
        if 'first_name' in data:
            first_name = data['first_name'].strip()
            if len(first_name) >= 2:
                current_user.first_name = first_name
            else:
                return jsonify({
                    'status': 'error',
                    'message': 'First name must be at least 2 characters long'
                }), 400
        
        if 'last_name' in data:
            last_name = data['last_name'].strip()
            if len(last_name) >= 2:
                current_user.last_name = last_name
            else:
                return jsonify({
                    'status': 'error',
                    'message': 'Last name must be at least 2 characters long'
                }), 400
        
        if 'phone' in data:
            current_user.phone = data['phone'].strip() if data['phone'] else None
        
        if 'newsletter_subscribed' in data:
            current_user.newsletter_subscribed = bool(data['newsletter_subscribed'])
        
        current_user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Profile updated successfully!',
            'user': current_user.to_dict(include_sensitive=True)
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': 'Failed to update profile. Please try again.'
        }), 500

@auth_bp.route('/change-password', methods=['PUT'])
@login_required
def change_password():
    """Change user password"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No data provided'
            }), 400
        
        # Validate required fields
        required_fields = ['current_password', 'new_password']
        validation_error = validate_request_data(required_fields, data)
        if validation_error:
            return jsonify(validation_error), 400
        
        current_password = data['current_password']
        new_password = data['new_password']
        
        # Verify current password
        if not current_user.check_password(current_password):
            return jsonify({
                'status': 'error',
                'message': 'Current password is incorrect'
            }), 400
        
        # Validate new password strength
        password_error = validate_password_strength(new_password)
        if password_error:
            return jsonify({
                'status': 'error',
                'message': password_error
            }), 400
        
        # Check that new password is different
        if current_user.check_password(new_password):
            return jsonify({
                'status': 'error',
                'message': 'New password must be different from current password'
            }), 400
        
        # Update password
        current_user.set_password(new_password)
        current_user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Password changed successfully!'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': 'Failed to change password. Please try again.'
        }), 500

@auth_bp.route('/check', methods=['GET'])
def check_auth():
    """Check if user is authenticated"""
    try:
        if current_user.is_authenticated:
            return jsonify({
                'status': 'success',
                'authenticated': True,
                'user': current_user.to_dict()
            })
        else:
            return jsonify({
                'status': 'success',
                'authenticated': False,
                'user': None
            })
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Failed to check authentication status'
        }), 500