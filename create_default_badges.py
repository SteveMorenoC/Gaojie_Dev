#!/usr/bin/env python3
"""
Script to create default badges in the database.
Run this after setting up the Badge model and running migrations.
"""

import sys
import os

# Add the backend directory to the Python path
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_dir)

from app import create_app
from extensions import db
from models.badge import Badge
from datetime import datetime

def create_default_badges():
    """Create default badges based on existing CSS styles"""
    
    app = create_app()
    
    with app.app_context():
        # Check if badges already exist
        existing_count = Badge.query.count()
        if existing_count > 0:
            print(f"✅ Badges already exist ({existing_count} found). Skipping creation.")
            return
        
        # Default badges based on existing CSS
        default_badges = [
            {
                'name': 'Cleanser',
                'slug': 'cleanser',
                'background_color': '#E3F2FD',
                'text_color': '#1976D2',
                'is_category_badge': True,
                'sort_order': 1
            },
            {
                'name': 'Moisturiser',
                'slug': 'moisturiser',
                'background_color': '#E3F2FD',
                'text_color': '#1976D2',
                'is_category_badge': True,
                'sort_order': 2
            },
            {
                'name': 'Serum',
                'slug': 'serum',
                'background_color': '#F3E5F5',
                'text_color': '#7B1FA2',
                'is_category_badge': True,
                'sort_order': 3
            },
            {
                'name': 'Anti-Aging',
                'slug': 'anti-aging',
                'background_color': '#FFF3E0',
                'text_color': '#F57C00',
                'is_category_badge': True,
                'sort_order': 4
            },
            {
                'name': 'Bestseller',
                'slug': 'bestseller',
                'background_color': '#FF6B6B',
                'text_color': '#FFFFFF',
                'is_category_badge': False,  # This is a promo badge
                'sort_order': 10
            },
            {
                'name': 'New',
                'slug': 'new',
                'background_color': '#4ECDC4',
                'text_color': '#FFFFFF',
                'is_category_badge': False,  # This is a promo badge
                'sort_order': 11
            },
            {
                'name': 'Limited',
                'slug': 'limited',
                'background_color': '#2C2C2C',
                'text_color': '#FFFFFF',
                'is_category_badge': False,  # This is a promo badge
                'sort_order': 12
            },
            {
                'name': 'Promotion',
                'slug': 'promotion',
                'background_color': '#26D0CE',
                'text_color': '#FFFFFF',
                'is_category_badge': False,  # This is a promo badge
                'sort_order': 13
            },
            {
                'name': 'Travel Size',
                'slug': 'travel',
                'background_color': '#8B5CF6',
                'text_color': '#FFFFFF',
                'is_category_badge': True,
                'sort_order': 5
            },
            {
                'name': 'Value Pack',
                'slug': 'value',
                'background_color': '#10B981',
                'text_color': '#FFFFFF',
                'is_category_badge': True,
                'sort_order': 6
            }
        ]
        
        created_count = 0
        
        for badge_data in default_badges:
            try:
                badge = Badge(**badge_data)
                db.session.add(badge)
                created_count += 1
                print(f"✅ Created badge: {badge_data['name']}")
            except Exception as e:
                print(f"❌ Error creating badge {badge_data['name']}: {e}")
        
        try:
            db.session.commit()
            print(f"\n🎉 Successfully created {created_count} default badges!")
            
            # Verify creation
            total_badges = Badge.query.count()
            print(f"📊 Total badges in database: {total_badges}")
            
        except Exception as e:
            db.session.rollback()
            print(f"💥 Error committing badges to database: {e}")

if __name__ == '__main__':
    print("🏗️  Creating default badges...")
    create_default_badges()