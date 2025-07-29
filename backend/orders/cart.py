from flask import Blueprint, request, jsonify, session
from flask_login import login_required, current_user
from extensions import db
from models import Product
import json

# Create cart blueprint
cart_bp = Blueprint('cart', __name__, url_prefix='/api/cart')

def get_cart_items():
    """Get cart items from session or user account"""
    if current_user.is_authenticated:
        # For logged-in users, we could store cart in database
        # For now, we'll use session storage for simplicity
        return session.get('cart', [])
    else:
        return session.get('cart', [])

def save_cart_items(cart_items):
    """Save cart items to session or user account"""
    session['cart'] = cart_items
    session.permanent = True

@cart_bp.route('/', methods=['GET'])
def get_cart():
    """Get current cart contents"""
    try:
        cart_items = get_cart_items()
        cart_data = []
        total_amount = 0
        total_items = 0
        
        for item in cart_items:
            # Get current product data
            product = Product.query.get(item['id'])
            if product and product.is_active:
                # Check if price has changed
                current_price = float(product.price)
                cart_price = item.get('price', current_price)
                price_changed = abs(current_price - cart_price) > 0.01
                
                item_total = current_price * item['quantity']
                total_amount += item_total
                total_items += item['quantity']
                
                cart_data.append({
                    'id': product.id,
                    'name': product.name,
                    'slug': product.slug,
                    'price': current_price,
                    'original_cart_price': cart_price,
                    'price_changed': price_changed,
                    'image': product.primary_image,
                    'category': product.category,
                    'size': product.size,
                    'quantity': item['quantity'],
                    'item_total': item_total,
                    'in_stock': product.is_in_stock,
                    'stock_quantity': product.stock_quantity if product.track_inventory else None
                })
        
        # Calculate shipping
        shipping_amount = 0 if total_amount >= 999 else 100
        grand_total = total_amount + shipping_amount
        
        return jsonify({
            'cart_items': cart_data,
            'summary': {
                'total_items': total_items,
                'subtotal': total_amount,
                'shipping_amount': shipping_amount,
                'total_amount': grand_total,
                'free_shipping_threshold': 999,
                'free_shipping_eligible': total_amount >= 999
            },
            'status': 'success'
        })
        
    except Exception as e:
        print(f"Cart error: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to load cart'
        }), 500

@cart_bp.route('/add', methods=['POST'])
def add_to_cart():
    """Add item to cart"""
    try:
        data = request.get_json()
        
        if not data or 'product_id' not in data:
            return jsonify({
                'status': 'error',
                'message': 'Product ID is required'
            }), 400
        
        product_id = data['product_id']
        quantity = data.get('quantity', 1)
        
        # Validate product
        product = Product.query.get(product_id)
        if not product or not product.is_active:
            return jsonify({
                'status': 'error',
                'message': 'Product not found or unavailable'
            }), 404
        
        # Check stock
        if product.track_inventory and product.stock_quantity < quantity:
            return jsonify({
                'status': 'error',
                'message': f'Only {product.stock_quantity} items available'
            }), 400
        
        # Get current cart
        cart_items = get_cart_items()
        
        # Check if item already in cart
        existing_item = next((item for item in cart_items if item['id'] == product_id), None)
        
        if existing_item:
            # Update quantity
            new_quantity = existing_item['quantity'] + quantity
            
            # Check stock for new quantity
            if product.track_inventory and product.stock_quantity < new_quantity:
                return jsonify({
                    'status': 'error',
                    'message': f'Cannot add {quantity} more. Only {product.stock_quantity} items available total.'
                }), 400
            
            existing_item['quantity'] = new_quantity
            existing_item['price'] = float(product.price)  # Update to current price
            message = f'Updated {product.name} quantity to {new_quantity}'
        else:
            # Add new item
            cart_items.append({
                'id': product_id,
                'name': product.name,
                'slug': product.slug,
                'price': float(product.price),
                'image': product.primary_image,
                'quantity': quantity
            })
            message = f'Added {product.name} to cart'
        
        # Save cart
        save_cart_items(cart_items)
        
        # Calculate new totals
        total_items = sum(item['quantity'] for item in cart_items)
        
        return jsonify({
            'status': 'success',
            'message': message,
            'cart_count': total_items
        })
        
    except Exception as e:
        print(f"Add to cart error: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to add item to cart'
        }), 500

@cart_bp.route('/update', methods=['PUT'])
def update_cart_item():
    """Update cart item quantity"""
    try:
        data = request.get_json()
        
        if not data or 'product_id' not in data or 'quantity' not in data:
            return jsonify({
                'status': 'error',
                'message': 'Product ID and quantity are required'
            }), 400
        
        product_id = data['product_id']
        new_quantity = data['quantity']
        
        if new_quantity < 0:
            return jsonify({
                'status': 'error',
                'message': 'Quantity cannot be negative'
            }), 400
        
        # Get current cart
        cart_items = get_cart_items()
        
        # Find item in cart
        item_index = next((i for i, item in enumerate(cart_items) if item['id'] == product_id), None)
        
        if item_index is None:
            return jsonify({
                'status': 'error',
                'message': 'Item not found in cart'
            }), 404
        
        if new_quantity == 0:
            # Remove item
            removed_item = cart_items.pop(item_index)
            message = f'Removed {removed_item["name"]} from cart'
        else:
            # Validate stock
            product = Product.query.get(product_id)
            if product and product.track_inventory and product.stock_quantity < new_quantity:
                return jsonify({
                    'status': 'error',
                    'message': f'Only {product.stock_quantity} items available'
                }), 400
            
            # Update quantity
            cart_items[item_index]['quantity'] = new_quantity
            message = f'Updated {cart_items[item_index]["name"]} quantity to {new_quantity}'
        
        # Save cart
        save_cart_items(cart_items)
        
        # Calculate new totals
        total_items = sum(item['quantity'] for item in cart_items)
        
        return jsonify({
            'status': 'success',
            'message': message,
            'cart_count': total_items
        })
        
    except Exception as e:
        print(f"Update cart error: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to update cart'
        }), 500

@cart_bp.route('/remove', methods=['DELETE'])
def remove_from_cart():
    """Remove item from cart"""
    try:
        data = request.get_json()
        
        if not data or 'product_id' not in data:
            return jsonify({
                'status': 'error',
                'message': 'Product ID is required'
            }), 400
        
        product_id = data['product_id']
        
        # Get current cart
        cart_items = get_cart_items()
        
        # Find and remove item
        item_index = next((i for i, item in enumerate(cart_items) if item['id'] == product_id), None)
        
        if item_index is None:
            return jsonify({
                'status': 'error',
                'message': 'Item not found in cart'
            }), 404
        
        removed_item = cart_items.pop(item_index)
        
        # Save cart
        save_cart_items(cart_items)
        
        # Calculate new totals
        total_items = sum(item['quantity'] for item in cart_items)
        
        return jsonify({
            'status': 'success',
            'message': f'Removed {removed_item["name"]} from cart',
            'cart_count': total_items
        })
        
    except Exception as e:
        print(f"Remove from cart error: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to remove item from cart'
        }), 500

@cart_bp.route('/clear', methods=['DELETE'])
def clear_cart():
    """Clear all items from cart"""
    try:
        session['cart'] = []
        
        return jsonify({
            'status': 'success',
            'message': 'Cart cleared successfully',
            'cart_count': 0
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Failed to clear cart'
        }), 500

@cart_bp.route('/count', methods=['GET'])
def get_cart_count():
    """Get total number of items in cart"""
    try:
        cart_items = get_cart_items()
        total_items = sum(item['quantity'] for item in cart_items)
        
        return jsonify({
            'cart_count': total_items,
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Failed to get cart count'
        }), 500