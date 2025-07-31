# Models package initialization
from .user import User
from .order import Order
from .order_item import OrderItem

# Import Product model if it exists in a separate file
try:
    from .product import Product
except ImportError:
    # If Product is defined elsewhere, you can import it here
    # or create a product.py file with the Product model
    pass

__all__ = ['User', 'Order', 'OrderItem', 'Product']