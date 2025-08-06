#!/usr/bin/env python3
"""
Database migration script to safely add urgency indicator fields to the products table.
This handles the case where the database schema is out of sync with the model.
"""

import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

def migrate_urgency_fields():
    """Safely add urgency fields to the products table."""
    
    try:
        print("🔄 Starting urgency fields migration...")
        
        from extensions import db
        from app import app
        
        with app.app_context():
            # Check if we can connect to the database
            try:
                # Try to get the database engine
                engine = db.engine
                print("✅ Database connection established")
                
                # Check current table structure
                inspector = db.inspect(engine)
                columns = inspector.get_columns('products')
                existing_columns = [col['name'] for col in columns]
                
                print(f"📊 Found {len(existing_columns)} existing columns in products table")
                
                # Check which urgency fields need to be added
                urgency_fields = [
                    'show_urgency_override',
                    'urgency_message', 
                    'urgency_stock_display'
                ]
                
                missing_fields = [field for field in urgency_fields if field not in existing_columns]
                
                if not missing_fields:
                    print("✅ All urgency fields already exist in database!")
                    return test_urgency_access()
                
                print(f"🔧 Need to add {len(missing_fields)} missing fields: {missing_fields}")
                
                # Add missing columns using raw SQL
                with engine.connect() as conn:
                    for field in missing_fields:
                        if field == 'show_urgency_override':
                            sql = "ALTER TABLE products ADD COLUMN show_urgency_override BOOLEAN DEFAULT FALSE"
                        elif field == 'urgency_message':
                            sql = "ALTER TABLE products ADD COLUMN urgency_message VARCHAR(200)"
                        elif field == 'urgency_stock_display':
                            sql = "ALTER TABLE products ADD COLUMN urgency_stock_display INTEGER"
                        
                        try:
                            conn.execute(db.text(sql))
                            conn.commit()
                            print(f"✅ Added column: {field}")
                        except Exception as e:
                            print(f"⚠️  Column {field} might already exist: {e}")
                
                print("🎉 Migration completed successfully!")
                return test_urgency_access()
                
            except Exception as e:
                print(f"❌ Database error: {e}")
                return False
                
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Make sure you're running this from the project root directory")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_urgency_access():
    """Test that we can access products with the new urgency fields."""
    
    try:
        print("\n🧪 Testing product access with urgency fields...")
        
        from models.product import Product
        
        # Try to query products
        products = Product.query.limit(3).all()
        
        if not products:
            print("⚠️  No products found in database")
            return True
        
        print(f"📦 Testing {len(products)} products...")
        
        for product in products:
            try:
                # Test accessing the new properties
                should_show = product.should_show_urgency
                urgency_data = product.urgency_display_data
                to_dict = product.to_dict()
                
                print(f"✅ {product.name}: should_show_urgency={should_show}")
                
                # Test setting urgency fields
                product.show_urgency_override = False
                product.urgency_message = None
                product.urgency_stock_display = None
                
            except Exception as e:
                print(f"❌ Error testing {product.name}: {e}")
                return False
        
        print("✅ All urgency field tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Error testing product access: {e}")
        return False

def setup_sample_urgency_data():
    """Set up some sample urgency data for testing."""
    
    try:
        print("\n🎲 Setting up sample urgency data...")
        
        from models.product import Product
        from extensions import db
        
        products = Product.query.limit(5).all()
        
        if not products:
            print("⚠️  No products to update")
            return True
        
        # Set up different urgency scenarios
        for i, product in enumerate(products):
            if i == 0:
                # High stock - no urgency
                product.stock_quantity = 50
                product.show_urgency_override = False
                print(f"📦 {product.name}: High stock (no urgency)")
                
            elif i == 1:
                # Low stock - automatic urgency
                product.stock_quantity = 8
                product.show_urgency_override = False
                print(f"⚠️  {product.name}: Low stock (auto urgency)")
                
            elif i == 2:
                # Manual override - marketing
                product.stock_quantity = 100
                product.show_urgency_override = True
                product.urgency_message = "🔥 Flash Sale - Limited Time!"
                product.urgency_stock_display = 3
                print(f"🎯 {product.name}: Manual urgency override")
                
            else:
                # Random stock levels
                import random
                stock = random.randint(5, 30)
                product.stock_quantity = stock
                product.show_urgency_override = False
                print(f"📊 {product.name}: Random stock ({stock})")
        
        db.session.commit()
        print("✅ Sample urgency data setup complete!")
        return True
        
    except Exception as e:
        print(f"❌ Error setting up sample data: {e}")
        db.session.rollback()
        return False

if __name__ == '__main__':
    print("🚀 Starting urgency fields migration...")
    
    if migrate_urgency_fields():
        print("\n🎉 Migration successful!")
        
        # Ask if user wants to set up sample data
        setup_sample = input("\n❓ Set up sample urgency data for testing? (y/n): ").lower().strip()
        if setup_sample in ['y', 'yes']:
            setup_sample_urgency_data()
        
        print("\n📋 Next steps:")
        print("1. Restart your Flask server")
        print("2. Try loading the admin products page")
        print("3. Visit product pages to see urgency indicators")
        print("4. Open /urgency-test.html for testing scenarios")
        
    else:
        print("❌ Migration failed - check the errors above")
        sys.exit(1)