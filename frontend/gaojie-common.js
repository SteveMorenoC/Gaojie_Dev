// GAOJIE Skincare - Common utilities and shared functions

// Initialize common functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('GAOJIE Skincare - Common utilities loaded');
    
    // Update all logo links to use backend route
    const logoLinks = document.querySelectorAll('.logo-link');
    logoLinks.forEach(link => {
        // Only update if it's not already pointing to backend route
        if (!link.href.includes('/main') && !link.href.includes('/home') && !link.href.includes('/logo')) {
            link.href = '/main';
        }
    });
    
    // Initialize cart count on page load
    GaojieUtils.updateCartCount();
});

// Common utility functions for GAOJIE Skincare
window.GaojieUtils = {
    // Show notification messages
    showNotification: function(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `gaojie-notification gaojie-notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            z-index: 1000;
            font-weight: 500;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            animation: gaojieSlideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'gaojieSlideOut 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },

    // Hide notifications manually
    hideNotification: function() {
        const notifications = document.querySelectorAll('.gaojie-notification');
        notifications.forEach(notification => {
            notification.style.animation = 'gaojieSlideOut 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        });
    },

    // Format currency for Thai Baht
    formatCurrency: function(amount) {
        return `฿${amount.toLocaleString()}`;
    },

    // Format Thai phone number
    formatPhoneNumber: function(phone) {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 10) {
            return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 9)}`;
        }
        return phone;
    },

    // Validate email format
    isValidEmail: function(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    },

    // Loading state helper
    setLoadingState: function(element, isLoading, originalText = null) {
        if (isLoading) {
            element.dataset.originalText = originalText || element.textContent;
            element.innerHTML = `
                <svg class="gaojie-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-opacity="0.3"/>
                    <path fill="currentColor" d="M4 12a8 8 0 0 1 8-8v8H4z" stroke="currentColor" stroke-width="4"/>
                </svg>
                Loading...
            `;
            element.disabled = true;
        } else {
            element.textContent = element.dataset.originalText || originalText;
            element.disabled = false;
        }
    },

    // Cart management functions
    getCart: function() {
        return JSON.parse(localStorage.getItem('gaojie_cart')) || [];
    },

    saveCart: function(cart) {
        localStorage.setItem('gaojie_cart', JSON.stringify(cart));
        this.updateCartCount();
    },

    updateCartCount: function() {
        const cart = this.getCart();
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        
        // Update all cart count elements on the page
        const cartCountElements = document.querySelectorAll('.bag-count');
        cartCountElements.forEach(element => {
            element.textContent = totalItems;
        });
        
        console.log(`🛒 Cart updated: ${totalItems} items`);
    },

    addToCart: function(product) {
        const cart = this.getCart();
        const existingItem = cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity = (existingItem.quantity || 1) + 1;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.primary_image,
                slug: product.slug,
                quantity: 1
            });
        }
        
        this.saveCart(cart);
        this.showNotification(`Added ${product.name} to cart`, 'success');
        return cart;
    },

    removeFromCart: function(productId) {
        let cart = this.getCart();
        cart = cart.filter(item => item.id !== productId);
        this.saveCart(cart);
        return cart;
    },

    clearCart: function() {
        localStorage.removeItem('gaojie_cart');
        this.updateCartCount();
    }
};

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes gaojieSlideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes gaojieSlideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .gaojie-spinner {
        animation: spin 1s linear infinite;
        display: inline-block;
        margin-right: 8px;
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);