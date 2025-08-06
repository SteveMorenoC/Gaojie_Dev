from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from extensions import db
from models import Order, OrderItem, Product, User
from datetime import datetime
import uuid
import logging

# Set up logging
logger = logging.getLogger(__name__)

# Create orders blueprint
orders_bp = Blueprint('orders', __name__, url_prefix='/api/orders')

def generate_order_number():
    """Generate a unique order number"""
    timestamp = datetime.now().strftime('%Y%m%d')
    unique_id = str(uuid.uuid4())[:8].upper()
    return f"GJ{timestamp}{unique_id}"

def validate_shipping_info(shipping_info):
    """Validate shipping information"""
    required_fields = [
        'first_name', 'last_name', 'address_line1', 
        'city', 'state', 'postal_code'
    ]
    
    missing_fields = []
    for field in required_fields:
        if field not in shipping_info or not str(shipping_info[field]).strip():
            missing_fields.append(field.replace('_', ' ').title())
    
    if missing_fields:
        return False, f"Missing shipping information: {', '.join(missing_fields)}"
    
    return True, None

def calculate_order_totals(cart_items, promo_code=None):
    """Calculate order totals including tax, shipping, and discounts"""
    subtotal = 0
    
    # Calculate subtotal
    for item in cart_items:
        product = Product.query.get(item['id'])
        if not product or not product.is_active:
            raise ValueError(f"Product not available: {item.get('name', 'Unknown')}")
        
        # Check stock if product tracks inventory
        if hasattr(product, 'track_inventory') and product.track_inventory:
            if hasattr(product, 'stock_quantity') and product.stock_quantity < item['quantity']:
                raise ValueError(f"Insufficient stock for {product.name}. Available: {product.stock_quantity}")
        
        item_total = float(product.price) * item['quantity']
        subtotal += item_total
    
    # Calculate shipping (free over ฿1500)
    shipping_amount = 0 if subtotal >= 1500 else 100
    
    # Calculate discount
    discount_amount = 0
    if promo_code:
        discount_codes = {
            'welcome15': 0.15,
            'save10': 0.10,
            'newcustomer': 0.20
        }
        if promo_code.lower() in discount_codes:
            discount_amount = subtotal * discount_codes[promo_code.lower()]
    
    # Calculate tax (7% VAT on discounted subtotal)
    discounted_subtotal = subtotal - discount_amount
    tax_amount = discounted_subtotal * 0.07
    
    # Final total
    total_amount = discounted_subtotal + shipping_amount + tax_amount
    
    return {
        'subtotal': subtotal,
        'discount_amount': discount_amount,
        'shipping_amount': shipping_amount,
        'tax_amount': tax_amount,
        'total_amount': total_amount
    }

def process_card_payment(amount, token_id, description):
    """Process credit card payment using Omise"""
    try:
        # Try to import and use Omise service
        try:
            from services.omise_service import omise_service
            
            # Convert amount to satang (smallest unit for THB)
            amount_satang = omise_service.convert_to_satang(amount)
            
            # Create charge
            success, charge_data, error = omise_service.create_charge(
                amount=amount_satang,
                currency='THB',
                token_id=token_id,
                description=description,
                metadata={
                    'source': 'gaojie_skincare',
                    'platform': 'web'
                }
            )
            
            return success, charge_data, error
            
        except ImportError:
            logger.warning("Omise service not available - using mock payment")
            # Mock successful payment for development
            return True, {
                'id': f'chrg_test_mock_{uuid.uuid4().hex[:8]}',
                'paid': True,
                'amount': int(amount * 100)
            }, None
        
    except Exception as e:
        logger.error(f"Payment processing failed: {e}")
        return False, None, str(e)

@orders_bp.route('/guest/create', methods=['POST'])
def create_guest_order():
    """Create an order for guest users (no authentication required)"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No order data provided'
            }), 400
        
        # Validate required fields
        required_fields = ['items', 'shipping_info', 'guest_info']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'status': 'error',
                    'message': f'Missing required field: {field}'
                }), 400
        
        cart_items = data['items']
        shipping_info = data['shipping_info']
        guest_info = data['guest_info']
        payment_info = data.get('payment_info', {})
        
        if not cart_items:
            return jsonify({
                'status': 'error',
                'message': 'Cart is empty'
            }), 400
        
        # Validate guest info
        if 'email' not in guest_info or not guest_info['email']:
            return jsonify({
                'status': 'error',
                'message': 'Guest email is required'
            }), 400
        
        # Validate shipping info
        is_valid, error_msg = validate_shipping_info(shipping_info)
        if not is_valid:
            return jsonify({
                'status': 'error',
                'message': error_msg
            }), 400
        
        # Calculate totals
        try:
            totals = calculate_order_totals(cart_items, data.get('promo_code'))
        except ValueError as e:
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 400
        
        # Process payment if payment method is credit card
        payment_method = payment_info.get('method', 'pending')
        payment_status = 'pending'
        payment_reference = None
        
        if payment_method == 'card' and 'token' in payment_info:
            # Process credit card payment
            success, charge_data, error = process_card_payment(
                totals['total_amount'], 
                payment_info['token'],
                f"Order payment for {guest_info['email']}"
            )
            
            if success:
                payment_status = 'completed' if charge_data.get('paid') else 'processing'
                payment_reference = charge_data['id']
            else:
                return jsonify({
                    'status': 'error',
                    'message': f'Payment failed: {error}'
                }), 400
        
        # Create guest user or find existing
        guest_user = User.query.filter_by(email=guest_info['email']).first()
        if not guest_user:
            guest_user = User(
                email=guest_info['email'],
                first_name=guest_info.get('first_name', shipping_info['first_name']),
                last_name=guest_info.get('last_name', shipping_info['last_name']),
                phone=guest_info.get('phone', ''),
                password_hash='',  # Guest users don't have passwords
                is_active=True,
                is_verified=False,
                is_guest=True
            )
            db.session.add(guest_user)
            db.session.flush()
        
        # Create order
        order = Order(
            order_number=generate_order_number(),
            user_id=guest_user.id,
            status='confirmed' if payment_status == 'completed' else 'pending',
            
            # Financial details
            subtotal=totals['subtotal'],
            tax_amount=totals['tax_amount'],
            shipping_amount=totals['shipping_amount'],
            discount_amount=totals['discount_amount'],
            total_amount=totals['total_amount'],
            
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
            
            # Payment information
            payment_method=payment_method,
            payment_status=payment_status,
            payment_reference=payment_reference,
            
            # Notes
            order_notes=data.get('notes', '').strip()
        )
        
        db.session.add(order)
        db.session.flush()  # Get order ID
        
        # Generate tracking number
        order.tracking_number = Order.generate_tracking_number(order.order_number)
        
        # Create order items
        for cart_item in cart_items:
            product = Product.query.get(cart_item['id'])
            
            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=cart_item['quantity'],
                unit_price=float(product.price),
                total_price=float(product.price) * cart_item['quantity'],
                product_name=product.name,
                product_sku=getattr(product, 'sku', f'PROD-{product.id}')
            )
            db.session.add(order_item)
            
            # Update product stock if tracking inventory
            if hasattr(product, 'track_inventory') and product.track_inventory:
                if hasattr(product, 'stock_quantity'):
                    product.stock_quantity -= cart_item['quantity']
            
            # Update sales count if available
            if hasattr(product, 'sales_count'):
                product.sales_count += cart_item['quantity']
        
        db.session.commit()
        
        logger.info(f"Guest order created successfully: {order.order_number}")
        
        return jsonify({
            'status': 'success',
            'message': 'Order created successfully!',
            'order': {
                'order_number': order.order_number,
                'id': order.id,
                'total_amount': float(order.total_amount),
                'payment_status': order.payment_status,
                'status': order.status
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Guest order creation failed: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Order creation failed. Please try again.'
        }), 500

@orders_bp.route('/create', methods=['POST'])
@login_required
def create_authenticated_order():
    """Create an order for authenticated users"""
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
        payment_info = data.get('payment_info', {})
        
        if not cart_items:
            return jsonify({
                'status': 'error',
                'message': 'Cart is empty'
            }), 400
        
        # Validate shipping info
        is_valid, error_msg = validate_shipping_info(shipping_info)
        if not is_valid:
            return jsonify({
                'status': 'error',
                'message': error_msg
            }), 400
        
        # Calculate totals
        try:
            totals = calculate_order_totals(cart_items, data.get('promo_code'))
        except ValueError as e:
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 400
        
        # Process payment if payment method is credit card
        payment_method = payment_info.get('method', 'pending')
        payment_status = 'pending'
        payment_reference = None
        
        if payment_method == 'card' and 'token' in payment_info:
            # Process credit card payment
            success, charge_data, error = process_card_payment(
                totals['total_amount'], 
                payment_info['token'],
                f"Order payment for {current_user.email}"
            )
            
            if success:
                payment_status = 'completed' if charge_data.get('paid') else 'processing'
                payment_reference = charge_data['id']
            else:
                return jsonify({
                    'status': 'error',
                    'message': f'Payment failed: {error}'
                }), 400
        
        # Create order for authenticated user
        order = Order(
            order_number=generate_order_number(),
            user_id=current_user.id,
            status='confirmed' if payment_status == 'completed' else 'pending',
            
            # Financial details
            subtotal=totals['subtotal'],
            tax_amount=totals['tax_amount'],
            shipping_amount=totals['shipping_amount'],
            discount_amount=totals['discount_amount'],
            total_amount=totals['total_amount'],
            
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
            
            # Payment information
            payment_method=payment_method,
            payment_status=payment_status,
            payment_reference=payment_reference,
            
            # Notes
            order_notes=data.get('notes', '').strip()
        )
        
        db.session.add(order)
        db.session.flush()  # Get order ID
        
        # Generate tracking number
        order.tracking_number = Order.generate_tracking_number(order.order_number)
        
        # Create order items
        for cart_item in cart_items:
            product = Product.query.get(cart_item['id'])
            
            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=cart_item['quantity'],
                unit_price=float(product.price),
                total_price=float(product.price) * cart_item['quantity'],
                product_name=product.name,
                product_sku=getattr(product, 'sku', f'PROD-{product.id}')
            )
            db.session.add(order_item)
            
            # Update product stock if tracking inventory
            if hasattr(product, 'track_inventory') and product.track_inventory:
                if hasattr(product, 'stock_quantity'):
                    product.stock_quantity -= cart_item['quantity']
        
        db.session.commit()
        
        logger.info(f"Authenticated order created successfully: {order.order_number}")
        
        return jsonify({
            'status': 'success',
            'message': 'Order created successfully!',
            'order': {
                'order_number': order.order_number,
                'id': order.id,
                'total_amount': float(order.total_amount),
                'payment_status': order.payment_status,
                'status': order.status
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Authenticated order creation failed: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Order creation failed. Please try again.'
        }), 500

@orders_bp.route('/<order_number>', methods=['GET'])
def get_order(order_number):
    """Get order details by order number"""
    try:
        order = Order.query.filter_by(order_number=order_number).first()
        
        if not order:
            return jsonify({
                'status': 'error',
                'message': 'Order not found'
            }), 404
        
        # Check if user has access to this order
        if current_user.is_authenticated:
            if order.user_id != current_user.id and not getattr(current_user, 'is_admin', False):
                return jsonify({
                    'status': 'error',
                    'message': 'Access denied'
                }), 403
        else:
            # For guest users, allow access to anyone with the order number
            pass
        
        return jsonify({
            'status': 'success',
            'order': order.to_dict(include_items=True, include_customer=True)
        })
        
    except Exception as e:
        logger.error(f"Failed to retrieve order {order_number}: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to retrieve order'
        }), 500

@orders_bp.route('/test', methods=['GET'])
def test_orders():
    """Test endpoint for orders"""
    try:
        order_count = Order.query.count()
        return jsonify({
            'status': 'success',
            'message': 'Orders blueprint is working!',
            'order_count': order_count,
            'endpoints': [
                '/api/orders/guest/create',
                '/api/orders/create',
                '/api/orders/<order_number>',
                '/api/orders/test'
            ]
        })
    except Exception as e:
        logger.error(f"Orders test error: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Database error: {str(e)}'
        }), 500