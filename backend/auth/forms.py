from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, ValidationError
from wtforms.validators import DataRequired, Email, Length, EqualTo
from models import User

class RegistrationForm(FlaskForm):
    """User registration form with validation"""
    
    first_name = StringField('First Name', validators=[
        DataRequired(message='First name is required'),
        Length(min=2, max=50, message='First name must be between 2 and 50 characters')
    ])
    
    last_name = StringField('Last Name', validators=[
        DataRequired(message='Last name is required'),
        Length(min=2, max=50, message='Last name must be between 2 and 50 characters')
    ])
    
    email = StringField('Email', validators=[
        DataRequired(message='Email is required'),
        Email(message='Please enter a valid email address'),
        Length(max=120, message='Email must be less than 120 characters')
    ])
    
    phone = StringField('Phone Number', validators=[
        Length(max=20, message='Phone number must be less than 20 characters')
    ])
    
    password = PasswordField('Password', validators=[
        DataRequired(message='Password is required'),
        Length(min=8, message='Password must be at least 8 characters long')
    ])
    
    confirm_password = PasswordField('Confirm Password', validators=[
        DataRequired(message='Please confirm your password'),
        EqualTo('password', message='Passwords must match')
    ])
    
    newsletter = BooleanField('Subscribe to Newsletter')
    
    def validate_email(self, email):
        """Check if email is already registered"""
        user = User.find_by_email(email.data)
        if user:
            raise ValidationError('This email is already registered. Please use a different email or login.')
    
    def validate_password(self, password):
        """Validate password strength"""
        pwd = password.data
        
        if not any(c.isupper() for c in pwd):
            raise ValidationError('Password must contain at least one uppercase letter')
        
        if not any(c.islower() for c in pwd):
            raise ValidationError('Password must contain at least one lowercase letter')
        
        if not any(c.isdigit() for c in pwd):
            raise ValidationError('Password must contain at least one number')

class LoginForm(FlaskForm):
    """User login form"""
    
    email = StringField('Email', validators=[
        DataRequired(message='Email is required'),
        Email(message='Please enter a valid email address')
    ])
    
    password = PasswordField('Password', validators=[
        DataRequired(message='Password is required')
    ])
    
    remember_me = BooleanField('Remember Me')

class ChangePasswordForm(FlaskForm):
    """Change password form for logged-in users"""
    
    current_password = PasswordField('Current Password', validators=[
        DataRequired(message='Current password is required')
    ])
    
    new_password = PasswordField('New Password', validators=[
        DataRequired(message='New password is required'),
        Length(min=8, message='Password must be at least 8 characters long')
    ])
    
    confirm_new_password = PasswordField('Confirm New Password', validators=[
        DataRequired(message='Please confirm your new password'),
        EqualTo('new_password', message='Passwords must match')
    ])
    
    def validate_new_password(self, new_password):
        """Validate new password strength"""
        pwd = new_password.data
        
        if not any(c.isupper() for c in pwd):
            raise ValidationError('Password must contain at least one uppercase letter')
        
        if not any(c.islower() for c in pwd):
            raise ValidationError('Password must contain at least one lowercase letter')
        
        if not any(c.isdigit() for c in pwd):
            raise ValidationError('Password must contain at least one number')

class UpdateProfileForm(FlaskForm):
    """Update user profile form"""
    
    first_name = StringField('First Name', validators=[
        DataRequired(message='First name is required'),
        Length(min=2, max=50, message='First name must be between 2 and 50 characters')
    ])
    
    last_name = StringField('Last Name', validators=[
        DataRequired(message='Last name is required'),
        Length(min=2, max=50, message='Last name must be between 2 and 50 characters')
    ])
    
    phone = StringField('Phone Number', validators=[
        Length(max=20, message='Phone number must be less than 20 characters')
    ])
    
    newsletter = BooleanField('Subscribe to Newsletter')

class ForgotPasswordForm(FlaskForm):
    """Forgot password form"""
    
    email = StringField('Email', validators=[
        DataRequired(message='Email is required'),
        Email(message='Please enter a valid email address')
    ])
    
    def validate_email(self, email):
        """Check if email exists in system"""
        user = User.find_by_email(email.data)
        if not user:
            raise ValidationError('No account found with this email address.')