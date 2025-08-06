#!/usr/bin/env python3
"""
Database migration script to add urgency indicator fields to existing products.
Run this after updating the Product model to add the new urgency fields.
"""

import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from extensions import db
from models.product import Product

def update_urgency_fields():
    """Add urgency fields to existing products and set up some test scenarios."""
    
    try:
        print("🔄 Updating product urgency fields...")
        
        # Get all products
        products = Product.query.all()
        print(f"📦 Found {len(products)} products to update")
        
        if not products:
            print("⚠️  No products found. Create some products first.")
            return
            
        # Update each product with realistic stock levels
        for i, product in enumerate(products):
            if i == 0:
                # First product: High stock (no urgency)
                product.stock_quantity = 45
                product.low_stock_threshold = 10
                product.show_urgency_override = False
                print(f"✅ {product.name}: High stock (45) - No urgency")
                
            elif i == 1:
                # Second product: Low stock (automatic urgency)
                product.stock_quantity = 7
                product.low_stock_threshold = 10
                product.show_urgency_override = False
                print(f"✅ {product.name}: Low stock (7) - Automatic urgency")
                
            elif i == 2:
                # Third product: Manual override example
                product.stock_quantity = 50  # Actually have plenty
                product.low_stock_threshold = 10
                product.show_urgency_override = True
                product.urgency_message = "🔥 Flash Sale - Only a few left!"
                product.urgency_stock_display = 3
                print(f"✅ {product.name}: Manual override - Marketing urgency")
                
            else:
                # Other products: Random stock levels
                import random
                stock = random.randint(5, 80)
                product.stock_quantity = stock
                product.low_stock_threshold = 10
                product.show_urgency_override = False
                urgency_status = "Will show urgency" if stock <= 10 else "No urgency"
                print(f"✅ {product.name}: Stock ({stock}) - {urgency_status}")
        
        # Commit changes
        db.session.commit()
        print(f"🎉 Successfully updated {len(products)} products!")
        
        # Show summary
        print("\n📊 Urgency Summary:")
        for product in products:
            if product.show_urgency_override:
                print(f"   {product.name}: MANUAL OVERRIDE - '{product.urgency_message}' ({product.urgency_stock_display} shown)")
            elif product.stock_quantity <= max(10, product.low_stock_threshold):
                print(f"   {product.name}: AUTO URGENCY - {product.stock_quantity} left")
            else:
                print(f"   {product.name}: No urgency - {product.stock_quantity} in stock")
                
    except Exception as e:
        print(f"❌ Error updating urgency fields: {e}")
        db.session.rollback()
        return False
        
    return True

def test_urgency_logic():
    """Test the urgency logic for each product."""
    
    print("\n🧪 Testing urgency logic...")
    
    products = Product.query.all()
    for product in products:
        print(f"\n📦 {product.name}:")
        print(f"   Stock: {product.stock_quantity}")
        print(f"   Threshold: {product.low_stock_threshold}")
        print(f"   Manual Override: {product.show_urgency_override}")
        
        # Test the should_show_urgency property
        should_show = product.should_show_urgency
        print(f"   Should Show Urgency: {should_show}")
        
        if should_show:
            urgency_data = product.urgency_display_data
            if urgency_data:
                print(f"   Message: '{urgency_data['message']}'")
                print(f"   Display Stock: {urgency_data['stock_count']}")
                print(f"   Mode: {'Manual' if urgency_data['is_override'] else 'Automatic'}")

if __name__ == '__main__':
    print("🚀 Starting urgency fields update...")
    
    # Import the Flask app to get the app context
    try:
        from app import app
        
        with app.app_context():
            # Create tables if they don't exist (this will add the new columns)
            db.create_all()
            print("✅ Database tables updated")
            
            # Update products
            if update_urgency_fields():
                test_urgency_logic()
                print("\n🎉 Urgency system setup complete!")
                print("\n📋 Next steps:")
                print("1. Visit any product page to see urgency indicators")
                print("2. Open /urgency-test.html to test different scenarios")
                print("3. Use admin panel to adjust urgency settings for products")
            else:
                print("❌ Failed to setup urgency system")
                
    except ImportError as e:
        print(f"❌ Could not import Flask app: {e}")
        print("Make sure you're running this from the project root directory")
    except Exception as e:
        print(f"❌ Error: {e}")