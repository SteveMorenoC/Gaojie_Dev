from flask import Blueprint, request, jsonify
from extensions import db
from models import Badge
from datetime import datetime
import re

# Create badges blueprint
badges_bp = Blueprint('badges', __name__, url_prefix='/api/badges')

def generate_slug(name):
    """Generate URL-friendly slug from badge name"""
    slug = re.sub(r'[^\w\s-]', '', name.lower())
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.strip('-')

def admin_required(f):
    """Decorator to require admin privileges"""
    from functools import wraps
    
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            from flask import session
            from flask_login import current_user
            
            # Check session-based auth first (primary method)
            if 'user_id' in session:
                from models import User
                user = User.query.get(session['user_id'])
                if user and user.is_admin:
                    return f(*args, **kwargs)
                elif user:
                    return jsonify({'message': 'Admin privileges required', 'status': 'error'}), 403
            
            # Check Flask-Login as fallback
            if current_user.is_authenticated and hasattr(current_user, 'is_admin') and current_user.is_admin:
                return f(*args, **kwargs)
            elif current_user.is_authenticated:
                return jsonify({'message': 'Admin privileges required', 'status': 'error'}), 403
            
            # No valid authentication found
            return jsonify({'message': 'Authentication required', 'status': 'error'}), 401
                
        except Exception as e:
            print(f"Admin auth error: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({'message': 'Authentication error', 'error': str(e), 'status': 'error'}), 401
    
    return decorated_function

# ===== PUBLIC ENDPOINTS =====

@badges_bp.route('/', methods=['GET'])
def get_badges():
    """Get all active badges"""
    try:
        # Get query parameters
        category_only = request.args.get('category_only', type=bool, default=False)
        
        # Build query
        query = Badge.query.filter_by(is_active=True)
        
        if category_only:
            query = query.filter_by(is_category_badge=True)
        
        # Order by sort_order, then by name
        badges = query.order_by(Badge.sort_order.asc(), Badge.name.asc()).all()
        
        return jsonify({
            'badges': [badge.to_dict() for badge in badges],
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({
            'message': 'Error fetching badges',
            'error': str(e),
            'status': 'error'
        }), 500

@badges_bp.route('/<int:badge_id>', methods=['GET'])
def get_badge(badge_id):
    """Get a single badge by ID"""
    try:
        badge = Badge.query.filter_by(id=badge_id, is_active=True).first()
        
        if not badge:
            return jsonify({
                'message': 'Badge not found',
                'status': 'error'
            }), 404
        
        return jsonify({
            'badge': badge.to_dict(),
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({
            'message': 'Error fetching badge',
            'error': str(e),
            'status': 'error'
        }), 500

# ===== ADMIN ENDPOINTS =====

@badges_bp.route('/admin', methods=['GET'])
@admin_required
def admin_get_badges():
    """Get all badges for admin (including inactive ones)"""
    try:
        # Get query parameters
        status = request.args.get('status')  # 'active', 'inactive', 'all'
        badge_type = request.args.get('type')  # 'category', 'promo', 'all'
        
        # Build query (admin sees all badges including inactive)
        query = Badge.query
        
        # Apply filters
        if status and status != 'all':
            if status == 'active':
                query = query.filter(Badge.is_active == True)
            elif status == 'inactive':
                query = query.filter(Badge.is_active == False)
        
        if badge_type and badge_type != 'all':
            if badge_type == 'category':
                query = query.filter(Badge.is_category_badge == True)
            elif badge_type == 'promo':
                query = query.filter(Badge.is_category_badge == False)
        
        # Order by sort_order, then by created_at (newest first)
        badges = query.order_by(Badge.sort_order.asc(), Badge.created_at.desc()).all()
        
        return jsonify({
            'badges': [badge.to_dict() for badge in badges],
            'total_badges': Badge.query.count(),
            'active_badges': Badge.query.filter_by(is_active=True).count(),
            'category_badges': Badge.query.filter_by(is_category_badge=True).count(),
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({
            'message': 'Error fetching badges',
            'error': str(e),
            'status': 'error'
        }), 500

@badges_bp.route('/admin/<int:badge_id>', methods=['GET'])
@admin_required
def admin_get_badge(badge_id):
    """Get a single badge by ID for admin (including inactive)"""
    try:
        badge = Badge.query.get(badge_id)
        
        if not badge:
            return jsonify({
                'message': 'Badge not found',
                'status': 'error'
            }), 404
        
        return jsonify({
            'badge': badge.to_dict(),
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({
            'message': 'Error fetching badge',
            'error': str(e),
            'status': 'error'
        }), 500

@badges_bp.route('/admin', methods=['POST'])
@admin_required
def admin_create_badge():
    """Create a new badge"""
    try:
        data = request.get_json()
        
        # Required fields
        required_fields = ['name', 'background_color', 'text_color']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    'message': f'Missing required field: {field}',
                    'status': 'error'
                }), 400
        
        # Generate slug from name
        slug = generate_slug(data['name'])
        
        # Check if slug already exists
        existing_badge = Badge.query.filter_by(slug=slug).first()
        if existing_badge:
            # Add number suffix to make it unique
            counter = 1
            while existing_badge:
                new_slug = f"{slug}-{counter}"
                existing_badge = Badge.query.filter_by(slug=new_slug).first()
                counter += 1
            slug = new_slug
        
        # Validate hex colors
        def is_valid_hex_color(color):
            return re.match(r'^#[0-9A-Fa-f]{6}$', color) is not None
        
        if not is_valid_hex_color(data['background_color']):
            return jsonify({
                'message': 'Invalid background color format. Use hex format like #FF6B6B',
                'status': 'error'
            }), 400
            
        if not is_valid_hex_color(data['text_color']):
            return jsonify({
                'message': 'Invalid text color format. Use hex format like #FFFFFF',
                'status': 'error'
            }), 400
        
        # Create new badge
        badge = Badge(
            name=data['name'].strip(),
            slug=slug,
            background_color=data['background_color'].upper(),
            text_color=data['text_color'].upper(),
            is_active=data.get('is_active', True),
            is_category_badge=data.get('is_category_badge', True),
            sort_order=data.get('sort_order', 0)
        )
        
        db.session.add(badge)
        db.session.commit()
        
        return jsonify({
            'message': 'Badge created successfully',
            'badge': badge.to_dict(),
            'status': 'success'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': 'Error creating badge',
            'error': str(e),
            'status': 'error'
        }), 500

@badges_bp.route('/admin/<int:badge_id>', methods=['PUT'])
@admin_required
def admin_update_badge(badge_id):
    """Update an existing badge"""
    try:
        badge = Badge.query.get(badge_id)
        
        if not badge:
            return jsonify({
                'message': 'Badge not found',
                'status': 'error'
            }), 404
        
        data = request.get_json()
        
        # Update name and regenerate slug if name changed
        if 'name' in data and data['name'] and data['name'] != badge.name:
            new_slug = generate_slug(data['name'])
            
            # Check if new slug conflicts with existing badges
            existing_badge = Badge.query.filter_by(slug=new_slug).filter(Badge.id != badge_id).first()
            if existing_badge:
                counter = 1
                while existing_badge:
                    numbered_slug = f"{new_slug}-{counter}"
                    existing_badge = Badge.query.filter_by(slug=numbered_slug).filter(Badge.id != badge_id).first()
                    counter += 1
                new_slug = numbered_slug
            
            badge.name = data['name'].strip()
            badge.slug = new_slug
        
        # Validate and update colors
        if 'background_color' in data:
            if not re.match(r'^#[0-9A-Fa-f]{6}$', data['background_color']):
                return jsonify({
                    'message': 'Invalid background color format. Use hex format like #FF6B6B',
                    'status': 'error'
                }), 400
            badge.background_color = data['background_color'].upper()
        
        if 'text_color' in data:
            if not re.match(r'^#[0-9A-Fa-f]{6}$', data['text_color']):
                return jsonify({
                    'message': 'Invalid text color format. Use hex format like #FFFFFF',
                    'status': 'error'
                }), 400
            badge.text_color = data['text_color'].upper()
        
        # Update other fields
        updateable_fields = ['is_active', 'is_category_badge', 'sort_order']
        for field in updateable_fields:
            if field in data:
                setattr(badge, field, data[field])
        
        badge.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Badge updated successfully',
            'badge': badge.to_dict(),
            'status': 'success'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': 'Error updating badge',
            'error': str(e),
            'status': 'error'
        }), 500

@badges_bp.route('/admin/<int:badge_id>', methods=['DELETE'])
@admin_required
def admin_delete_badge(badge_id):
    """Delete a badge (soft delete by setting is_active to False)"""
    try:
        badge = Badge.query.get(badge_id)
        
        if not badge:
            return jsonify({
                'message': 'Badge not found',
                'status': 'error'
            }), 404
        
        # Soft delete by setting is_active to False
        badge.is_active = False
        badge.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Badge deleted successfully',
            'status': 'success'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': 'Error deleting badge',
            'error': str(e),
            'status': 'error'
        }), 500

@badges_bp.route('/admin/<int:badge_id>/toggle-status', methods=['POST'])
@admin_required
def admin_toggle_badge_status(badge_id):
    """Toggle badge active/inactive status"""
    try:
        badge = Badge.query.get(badge_id)
        
        if not badge:
            return jsonify({
                'message': 'Badge not found',
                'status': 'error'
            }), 404
        
        badge.is_active = not badge.is_active
        badge.updated_at = datetime.utcnow()
        db.session.commit()
        
        status_text = 'activated' if badge.is_active else 'deactivated'
        
        return jsonify({
            'message': f'Badge {status_text} successfully',
            'badge': badge.to_dict(),
            'status': 'success'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': 'Error toggling badge status',
            'error': str(e),
            'status': 'error'
        }), 500