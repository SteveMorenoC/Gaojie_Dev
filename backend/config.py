import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Base configuration class for the Flask application"""
    
    # Flask Configuration
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    FLASK_ENV = os.environ.get('FLASK_ENV') or 'development'
    
    # Session Configuration for CORS
    SESSION_COOKIE_SECURE = False  # Set to True in production with HTTPS
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'  # Important for CORS
    PERMANENT_SESSION_LIFETIME = 3600  # 1 hour
    
    # Database Configuration
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///skincare_store.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False  # Disable event system to save resources
    
    # Omise Configuration
    OMISE_SECRET_KEY = os.environ.get('OMISE_SECRET_KEY')
    OMISE_PUBLIC_KEY = os.environ.get('OMISE_PUBLIC_KEY')
    OMISE_API_VERSION = os.environ.get('OMISE_API_VERSION') or '2017-11-02'
    
    # Store Configuration
    STORE_CURRENCY = os.environ.get('STORE_CURRENCY') or 'THB'
    STORE_LOCALE = os.environ.get('STORE_LOCALE') or 'th_TH'
    
    # Email Configuration (we'll use this later)
    MAIL_SERVER = os.environ.get('MAIL_SERVER')
    MAIL_PORT = int(os.environ.get('MAIL_PORT') or 587)
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    
    # File Upload Configuration
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    UPLOAD_FOLDER = 'static/uploads'

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}