from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from extensions import db
from models import Order, OrderItem, Product, User
from datetime import datetime

# Create orders blueprint
orders_bp = Blueprint('orders', __name__, url_prefix='/api/orders')

@orders_bp.route('/create', methods=['POST'])
@login_required
def create_order():
    """Create a new order from cart data"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No order data provided'
            }), 400
        
        # Validate required fields
        required_fields = ['items', 'shipping_info']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'status': 'error',
                    'message': f'Missing required field: {field}'
                }), 400
        
        cart_items = data['items']
        shipping_info = data['shipping_info']
        
        if not cart_items:
            return jsonify({
                'status': 'error',
                'message': 'Cart is empty'
            }), 400
        
        # Validate shipping info
        required_shipping = ['first_name', 'last_name', 'address_line1', 'city', 'state', 'postal_code']
        for field in required_shipping:
            if field not in shipping_info or not shipping_info[field]:
                return jsonify({
                    'status': 'error',
                    'message': f'Missing shipping information: {field.replace("_", " ").title()}'
                }), 400
        
        # Calculate order totals
        subtotal = 0
        validated_items = []
        
        for cart_item in cart_items:
            # Get current product data
            product = Product.query.get(cart_item['id'])
            if not product or not product.is_active:
                return jsonify({
                    'status': 'error',
                    'message': f'Product not available: {cart_item.get("name", "Unknown")}'
                }), 400
            
            # Check stock availability
            if product.track_inventory and product.stock_quantity < cart_item['quantity']:
                return jsonify({
                    'status': 'error',
                    'message': f'Insufficient stock for {product.name}. Available: {product.stock_quantity}'
                }), 400
            
            # Calculate item total
            item_total = float(product.price) * cart_item['quantity']
            subtotal += item_total
            
            validated_items.append({
                'product': product,
                'quantity': cart_item['quantity'],
                'unit_price': float(product.price),
                'total_price': item_total
            })
        
        # Calculate additional charges
        tax_amount = 0  # Add VAT calculation if needed
        shipping_amount = 0 if subtotal >= 999 else 100  # Free shipping over ฿999
        discount_amount = 0  # Add discount logic if needed
        total_amount = subtotal + tax_amount + shipping_amount - discount_amount
        
        # Create order
        order = Order(
            order_number=Order.generate_order_number(),
            user_id=current_user.id,
            status='pending',
            subtotal=subtotal,
            tax_amount=tax_amount,
            shipping_amount=shipping_amount,
            discount_amount=discount_amount,
            total_amount=total_amount,
            
            # Shipping information
            shipping_first_name=shipping_info['first_name'].strip(),
            shipping_last_name=shipping_info['last_name'].strip(),
            shipping_company=shipping_info.get('company', '').strip(),
            shipping_address_line1=shipping_info['address_line1'].strip(),
            shipping_address_line2=shipping_info.get('address_line2', '').strip(),
            shipping_city=shipping_info['city'].strip(),
            shipping_state=shipping_info['state'].strip(),
            shipping_postal_code=shipping_info['postal_code'].strip(),
            shipping_country=shipping_info.get('country', 'Thailand').strip(),
            shipping_phone=shipping_info.get('phone', '').strip(),
            
            # Payment method (will be set during payment)
            payment_method=data.get('payment_method', 'pending'),
            payment_status='pending',
            
            # Notes
            order_notes=data.get('notes', '').strip()
        )
        
        db.session.add(order)
        db.session.flush()  # Get order ID before creating items
        
        # Create order items
        for item_data in validated_items:
            product = item_data['product']
            
            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                product_slug=product.slug,
                product_image=product.primary_image,
                product_size=product.size,
                product_category=product.category,
                unit_price=item_data['unit_price'],
                quantity=item_data['quantity'],
                total_price=item_data['total_price']
            )
            
            db.session.add(order_item)
            
            # Update product stock if tracking inventory
            if product.track_inventory:
                product.stock_quantity -= item_data['quantity']
            
            # Update sales count
            product.sales_count += item_data['quantity']
        
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': f'Order {order.order_number} created successfully!',
            'order': order.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Order creation error: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to create order. Please try again.'
        }), 500

@orders_bp.route('/my-orders', methods=['GET'])
@login_required
def get_my_orders():
    """Get current user's orders"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        # Get orders for current user
        orders_pagination = Order.query.filter_by(user_id=current_user.id)\
            .order_by(Order.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        orders = orders_pagination.items
        
        return jsonify({
            'orders': [order.to_dict(include_items=True) for order in orders],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': orders_pagination.total,
                'pages': orders_pagination.pages,
                'has_next': orders_pagination.has_next,
                'has_prev': orders_pagination.has_prev
            },
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Failed to fetch orders'
        }), 500

@orders_bp.route('/<int:order_id>', methods=['GET'])
@login_required
def get_order(order_id):
    """Get a specific order"""
    try:
        order = Order.query.filter_by(id=order_id, user_id=current_user.id).first()
        
        if not order:
            return jsonify({
                'status': 'error',
                'message': 'Order not found'
            }), 404
        
        return jsonify({
            'order': order.to_dict(include_items=True),
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Failed to fetch order'
        }), 500

@orders_bp.route('/by-number/<string:order_number>', methods=['GET'])
@login_required
def get_order_by_number(order_number):
    """Get order by order number"""
    try:
        order = Order.query.filter_by(
            order_number=order_number, 
            user_id=current_user.id
        ).first()
        
        if not order:
            return jsonify({
                'status': 'error',
                'message': 'Order not found'
            }), 404
        
        return jsonify({
            'order': order.to_dict(include_items=True),
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Failed to fetch order'
        }), 500

@orders_bp.route('/status/<int:order_id>', methods=['PUT'])
@login_required  
def update_order_status(order_id):
    """Update order status (for admin users only)"""
    try:
        # Check if user is admin
        if not current_user.is_admin:
            return jsonify({
                'status': 'error',
                'message': 'Access denied. Admin privileges required.'
            }), 403
        
        data = request.get_json()
        if not data or 'status' not in data:
            return jsonify({
                'status': 'error',
                'message': 'New status is required'
            }), 400
        
        new_status = data['status']
        valid_statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
        
        if new_status not in valid_statuses:
            return jsonify({
                'status': 'error',
                'message': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'
            }), 400
        
        order = Order.query.get(order_id)
        if not order:
            return jsonify({
                'status': 'error',
                'message': 'Order not found'
            }), 404
        
        old_status = order.status
        order.status = new_status
        order.updated_at = datetime.utcnow()
        
        # Set timestamps for specific statuses
        if new_status == 'shipped' and not order.shipped_at:
            order.shipped_at = datetime.utcnow()
        elif new_status == 'delivered' and not order.delivered_at:
            order.delivered_at = datetime.utcnow()
        
        # Add admin note if provided
        if 'admin_notes' in data:
            order.admin_notes = data['admin_notes']
        
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': f'Order {order.order_number} status updated from {old_status} to {new_status}',
            'order': order.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': 'Failed to update order status'
        }), 500

# Admin routes
@orders_bp.route('/admin/all', methods=['GET'])
@login_required
def get_all_orders():
    """Get all orders (admin only)"""
    try:
        # Check if user is admin
        if not current_user.is_admin:
            return jsonify({
                'status': 'error',
                'message': 'Access denied. Admin privileges required.'
            }), 403
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status_filter = request.args.get('status')
        
        # Build query
        query = Order.query
        
        if status_filter:
            query = query.filter(Order.status == status_filter)
        
        # Paginate results
        orders_pagination = query.order_by(Order.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        orders = orders_pagination.items
        
        return jsonify({
            'orders': [order.to_dict(include_items=False) for order in orders],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': orders_pagination.total,
                'pages': orders_pagination.pages,
                'has_next': orders_pagination.has_next,
                'has_prev': orders_pagination.has_prev
            },
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Failed to fetch orders'
        }), 500