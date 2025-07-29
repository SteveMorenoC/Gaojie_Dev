// Cart functionality
document.addEventListener('DOMContentLoaded', function() {
    // Cart state
    let cartState = {
        items: [
            {
                id: 1,
                title: 'Amino-Acid Cleanser',
                price: 1290,
                originalPrice: 1590,
                quantity: 1,
                image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=150&h=150&fit=crop&crop=center'
            },
            {
                id: 2,
                title: 'Hydrating Moisturiser',
                price: 1590,
                originalPrice: null,
                quantity: 1,
                image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=150&h=150&fit=crop&crop=center'
            }
        ],
        shipping: 80,
        taxRate: 0.07,
        freeShippingThreshold: 999,
        promoCode: null,
        promoDiscount: 0
    };

    // Initialize cart functionality
    initCart();

    function initCart() {
        // Quantity controls
        setupQuantityControls();
        
        // Remove buttons
        setupRemoveButtons();
        
        // Add recommendation buttons
        setupRecommendationButtons();
        
        // Promo code functionality
        setupPromoCode();
        
        // Initial calculation
        updateCartTotals();
        
        // Checkout button
        setupCheckoutButton();
    }

    function setupQuantityControls() {
        // Quantity increase/decrease buttons
        document.querySelectorAll('.qty-btn').forEach(button => {
            button.addEventListener('click', function() {
                const action = this.dataset.action;
                const input = this.parentElement.querySelector('.qty-input');
                const itemId = parseInt(input.dataset.item);
                
                let currentValue = parseInt(input.value);
                
                if (action === 'increase') {
                    currentValue++;
                } else if (action === 'decrease' && currentValue > 1) {
                    currentValue--;
                }
                
                input.value = currentValue;
                updateItemQuantity(itemId, currentValue);
            });
        });

        // Direct input changes
        document.querySelectorAll('.qty-input').forEach(input => {
            input.addEventListener('change', function() {
                const itemId = parseInt(this.dataset.item);
                const quantity = Math.max(1, parseInt(this.value) || 1);
                this.value = quantity;
                updateItemQuantity(itemId, quantity);
            });
        });
    }

    function setupRemoveButtons() {
        document.querySelectorAll('.remove-btn').forEach(button => {
            button.addEventListener('click', function() {
                const itemId = parseInt(this.dataset.item);
                removeItem(itemId);
            });
        });
    }

    function setupRecommendationButtons() {
        document.querySelectorAll('.add-rec-btn').forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.dataset.product;
                addRecommendedItem(productId);
            });
        });
    }

    function setupPromoCode() {
        const promoInput = document.getElementById('promo-code');
        const applyBtn = document.getElementById('apply-promo');

        if (applyBtn) {
            applyBtn.addEventListener('click', function() {
                const code = promoInput.value.trim().toLowerCase();
                applyPromoCode(code);
            });
        }

        if (promoInput) {
            promoInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    const code = this.value.trim().toLowerCase();
                    applyPromoCode(code);
                }
            });
        }
    }

    function setupCheckoutButton() {
        const checkoutBtn = document.querySelector('.checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', function() {
                // Add loading state
                this.innerHTML = `
                    <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-opacity="0.3"/>
                        <path fill="currentColor" d="M4 12a8 8 0 0 1 8-8v8H4z" stroke="currentColor" stroke-width="4"/>
                    </svg>
                    Processing...
                `;
                this.disabled = true;

                // Simulate checkout process
                setTimeout(() => {
                    // In a real app, this would redirect to payment processor
                    alert('Redirecting to secure checkout...');
                    
                    // Reset button
                    this.innerHTML = `
                        Complete Secure Checkout
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M6 3L11 8L6 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    `;
                    this.disabled = false;
                }, 2000);
            });
        }
    }

    function updateItemQuantity(itemId, quantity) {
        const item = cartState.items.find(item => item.id === itemId);
        if (item) {
            item.quantity = quantity;
            updateCartTotals();
        }
    }

    function removeItem(itemId) {
        // Add fade out animation
        const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
        if (itemElement) {
            itemElement.style.opacity = '0.5';
            itemElement.style.transform = 'translateX(-20px)';
            
            setTimeout(() => {
                cartState.items = cartState.items.filter(item => item.id !== itemId);
                itemElement.remove();
                updateCartTotals();
                updateCartCount();
                
                // Check if cart is empty
                if (cartState.items.length === 0) {
                    handleEmptyCart();
                }
                
                // Show success message
                showNotification('Item removed from cart', 'success');
            }, 300);
        }
    }

    function addRecommendedItem(productId) {
        const recommendations = {
            'vitamin-c-serum': {
                id: Date.now(),
                title: 'Vitamin C Serum',
                price: 1890,
                originalPrice: null,
                quantity: 1,
                image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=150&h=150&fit=crop&crop=center'
            },
            'spf-sunscreen': {
                id: Date.now() + 1,
                title: 'SPF 50 Sunscreen',
                price: 1490,
                originalPrice: null,
                quantity: 1,
                image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=150&h=150&fit=crop&crop=center'
            }
        };

        const newItem = recommendations[productId];
        if (newItem) {
            cartState.items.push(newItem);
            addItemToDOM(newItem);
            updateCartTotals();
            updateCartCount();
            showNotification('Item added to cart!', 'success');
        }
    }

    function addItemToDOM(item) {
        const cartItems = document.querySelector('.cart-items');
        if (!cartItems) return;
        
        const itemHTML = `
            <div class="cart-item" data-item-id="${item.id}">
                <div class="item-image">
                    <img src="${item.image}" alt="${item.title}" loading="lazy">
                </div>
                <div class="item-details">
                    <h3 class="item-title">${item.title}</h3>
                    <p class="item-description">Premium skincare product</p>
                    <div class="item-features">
                        <span class="feature-item">✓ Free Returns</span>
                        <span class="feature-item">✓ Dermatologist Tested</span>
                    </div>
                    <div class="item-reviews">
                        <div class="stars">★★★★★</div>
                        <span class="review-count">(1,200+ reviews)</span>
                    </div>
                </div>
                <div class="item-actions">
                    <div class="quantity-controls">
                        <button class="qty-btn minus" data-action="decrease">−</button>
                        <input type="number" value="${item.quantity}" min="1" class="qty-input" data-item="${item.id}">
                        <button class="qty-btn plus" data-action="increase">+</button>
                    </div>
                    <div class="item-pricing">
                        <div class="price-info">
                            <span class="current-price">฿${item.price.toLocaleString()}</span>
                            ${item.originalPrice ? `<span class="original-price">฿${item.originalPrice.toLocaleString()}</span>` : ''}
                        </div>
                    </div>
                    <button class="remove-btn" data-item="${item.id}" aria-label="Remove item">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        cartItems.insertAdjacentHTML('beforeend', itemHTML);
        
        // Re-initialize controls for the new item
        const newItemElement = cartItems.lastElementChild;
        setupQuantityControlsForItem(newItemElement);
        setupRemoveButtonForItem(newItemElement);
    }

    function setupQuantityControlsForItem(itemElement) {
        const buttons = itemElement.querySelectorAll('.qty-btn');
        const input = itemElement.querySelector('.qty-input');
        
        buttons.forEach(button => {
            button.addEventListener('click', function() {
                const action = this.dataset.action;
                const itemId = parseInt(input.dataset.item);
                
                let currentValue = parseInt(input.value);
                
                if (action === 'increase') {
                    currentValue++;
                } else if (action === 'decrease' && currentValue > 1) {
                    currentValue--;
                }
                
                input.value = currentValue;
                updateItemQuantity(itemId, currentValue);
            });
        });

        input.addEventListener('change', function() {
            const itemId = parseInt(this.dataset.item);
            const quantity = Math.max(1, parseInt(this.value) || 1);
            this.value = quantity;
            updateItemQuantity(itemId, quantity);
        });
    }

    function setupRemoveButtonForItem(itemElement) {
        const removeBtn = itemElement.querySelector('.remove-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', function() {
                const itemId = parseInt(this.dataset.item);
                removeItem(itemId);
            });
        }
    }

    function applyPromoCode(code) {
        const validCodes = {
            'welcome15': 0.15,
            'save10': 0.10,
            'newcustomer': 0.20,
            'freeship': 'freeship'
        };

        if (validCodes[code]) {
            cartState.promoCode = code;
            if (code === 'freeship') {
                cartState.shipping = 0;
                cartState.promoDiscount = 0;
                showNotification('Free shipping applied!', 'success');
            } else {
                cartState.promoDiscount = validCodes[code];
                showNotification(`${Math.round(validCodes[code] * 100)}% discount applied!`, 'success');
            }
            
            const promoInput = document.getElementById('promo-code');
            if (promoInput) {
                promoInput.value = '';
            }
            updateCartTotals();
        } else {
            showNotification('Invalid promo code', 'error');
        }
    }

    function updateCartTotals() {
        const subtotal = cartState.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discount = subtotal * cartState.promoDiscount;
        const discountedSubtotal = subtotal - discount;
        const tax = discountedSubtotal * cartState.taxRate;
        const total = discountedSubtotal + tax + cartState.shipping;
        
        // Update DOM elements with null checks
        const subtotalElement = document.querySelector('.detail-row:nth-child(1) span:last-child');
        if (subtotalElement) {
            subtotalElement.textContent = `฿${subtotal.toLocaleString()}`;
        }
        
        const discountRow = document.querySelector('.detail-row.discount');
        const discountElement = document.querySelector('.detail-row.discount span:last-child');
        if (discountElement && discountRow) {
            if (discount > 0) {
                discountElement.textContent = `-฿${Math.round(discount).toLocaleString()}`;
                discountRow.style.display = 'flex';
            } else {
                discountRow.style.display = 'none';
            }
        }
        
        const shippingElement = document.querySelector('.shipping-cost');
        if (shippingElement) {
            shippingElement.textContent = cartState.shipping === 0 ? 'FREE' : `฿${cartState.shipping}`;
        }
        
        const taxElement = document.querySelector('.detail-row.tax span:last-child');
        if (taxElement) {
            taxElement.textContent = `฿${Math.round(tax).toLocaleString()}`;
        }
        
        const totalElement = document.querySelector('.detail-row.total span:last-child');
        if (totalElement) {
            totalElement.textContent = `฿${Math.round(total).toLocaleString()}`;
        }
        
        // Update shipping progress
        updateShippingProgress(subtotal);
        
        // Update item count
        const totalItems = cartState.items.reduce((sum, item) => sum + item.quantity, 0);
        const cartCountElement = document.querySelector('.cart-count');
        if (cartCountElement) {
            cartCountElement.textContent = `${totalItems} item${totalItems !== 1 ? 's' : ''}`;
        }
    }

    function updateShippingProgress(subtotal) {
        const remaining = Math.max(0, cartState.freeShippingThreshold - subtotal);
        const progress = Math.min(100, (subtotal / cartState.freeShippingThreshold) * 100);
        
        const progressBar = document.querySelector('.shipping-fill');
        const message = document.querySelector('.shipping-message');
        
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        
        if (message) {
            if (remaining > 0) {
                message.innerHTML = `
                    <span class="shipping-icon">🚚</span>
                    Add <strong>฿${remaining.toLocaleString()}</strong> more for FREE shipping!
                `;
            } else {
                message.innerHTML = `
                    <span class="shipping-icon">✅</span>
                    <strong>You qualify for FREE shipping!</strong>
                `;
                cartState.shipping = 0;
            }
        }
    }

    function updateCartCount() {
        const totalItems = cartState.items.reduce((sum, item) => sum + item.quantity, 0);
        const bagCount = document.querySelector('.bag-count');
        if (bagCount) {
            bagCount.textContent = totalItems;
        }
    }

    function showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">
                    ${type === 'success' ? '✓' : '⚠'}
                </span>
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            max-width: 300px;
            font-size: 14px;
        `;
        
        const notificationContent = notification.querySelector('.notification-content');
        if (notificationContent) {
            notificationContent.style.cssText = `
                display: flex;
                align-items: center;
                gap: 12px;
            `;
        }
        
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.style.cssText = `
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                margin-left: auto;
            `;
        }
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            removeNotification(notification);
        }, 3000);
        
        // Close button functionality
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                removeNotification(notification);
            });
        }
    }

    function removeNotification(notification) {
        if (notification && notification.parentNode) {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }

    // Live chat support functionality
    const chatSupport = document.querySelector('.chat-support');
    if (chatSupport) {
        chatSupport.addEventListener('click', function(e) {
            e.preventDefault();
            showNotification('Live chat will be available soon!', 'success');
        });
    }

    // Handle empty cart state
    function handleEmptyCart() {
        if (cartState.items.length === 0) {
            const cartItemsSection = document.querySelector('.cart-items-section');
            if (cartItemsSection) {
                cartItemsSection.innerHTML = `
                    <div class="empty-cart" style="
                        text-align: center;
                        padding: 60px 20px;
                        color: var(--color-secondary);
                    ">
                        <div class="empty-cart-icon" style="
                            font-size: 4rem;
                            margin-bottom: 20px;
                        ">🛍️</div>
                        <h2 class="empty-cart-title" style="
                            font-size: 1.5rem;
                            font-weight: 600;
                            color: var(--color-primary);
                            margin-bottom: 10px;
                        ">Your cart is empty</h2>
                        <p class="empty-cart-message" style="
                            margin-bottom: 30px;
                            color: var(--color-secondary);
                        ">Looks like you haven't added any items to your cart yet.</p>
                        <a href="main.html" class="continue-shopping-btn" style="
                            display: inline-block;
                            background-color: var(--color-primary);
                            color: var(--color-white);
                            padding: 12px 24px;
                            border-radius: 8px;
                            text-decoration: none;
                            font-weight: 600;
                            transition: var(--transition);
                        ">Start Shopping</a>
                    </div>
                `;
            }
            
            // Hide cart summary
            const cartSummary = document.querySelector('.cart-summary');
            if (cartSummary) {
                cartSummary.style.display = 'none';
            }
        }
    }

    // Newsletter signup (from footer)
    const newsletterButton = document.querySelector('.newsletter-button');
    if (newsletterButton) {
        newsletterButton.addEventListener('click', function(e) {
            e.preventDefault();
            const emailInput = document.querySelector('.newsletter-input');
            if (emailInput) {
                const email = emailInput.value;
                if (email && email.includes('@')) {
                    showNotification('Thank you for subscribing! Check your email for your 15% discount code.', 'success');
                    emailInput.value = '';
                } else {
                    showNotification('Please enter a valid email address', 'error');
                }
            }
        });
    }
});