// Product Page JavaScript - Conversion Optimized
document.addEventListener('DOMContentLoaded', function() {
    // Product state
    let productState = {
        selectedVariant: '150ml',
        selectedPrice: 1290,
        quantity: 1,
        images: [
            'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&h=600&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&h=600&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=600&h=600&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&h=600&fit=crop&crop=center'
        ]
    };

    // Initialize all functionality
    initProductPage();

    function initProductPage() {
        setupImageGallery();
        setupVariantSelection();
        setupQuantityControls();
        setupTabs();
        setupAddToCart();
        setupImageModal();
        setupQuickAdd();
        setupReviewHelpers();
        trackPageView();
    }

    // Image Gallery
    function setupImageGallery() {
        const thumbnails = document.querySelectorAll('.thumbnail');
        const mainImage = document.getElementById('main-product-image');

        thumbnails.forEach((thumbnail, index) => {
            thumbnail.addEventListener('click', function() {
                // Update active thumbnail
                thumbnails.forEach(t => t.classList.remove('active'));
                this.classList.add('active');

                // Update main image
                mainImage.src = productState.images[index];
                
                // Add a subtle animation
                mainImage.style.opacity = '0.7';
                setTimeout(() => {
                    mainImage.style.opacity = '1';
                }, 150);
            });
        });

        // Image zoom functionality
        const zoomBtn = document.getElementById('zoom-trigger');
        const mainImageContainer = document.querySelector('.main-image');

        if (zoomBtn && mainImageContainer) {
            zoomBtn.addEventListener('click', openImageModal);
            mainImageContainer.addEventListener('click', openImageModal);
        }
    }

    // Variant Selection
    function setupVariantSelection() {
        const variantOptions = document.querySelectorAll('.variant-option');
        
        variantOptions.forEach(option => {
            option.addEventListener('click', function() {
                // Update active variant
                variantOptions.forEach(v => v.classList.remove('active'));
                this.classList.add('active');

                // Update product state
                productState.selectedVariant = this.textContent.trim();
                productState.selectedPrice = parseInt(this.dataset.price);

                // Update price display
                updatePriceDisplay();
                
                // Show notification
                showNotification(`Size updated to ${productState.selectedVariant}`, 'success');
            });
        });
    }

    function updatePriceDisplay() {
        const priceElement = document.querySelector('.price-current');
        if (priceElement) {
            priceElement.textContent = `฿${productState.selectedPrice.toLocaleString()}`;
        }

        // Update original price (assuming 12% discount)
        const originalPriceElement = document.querySelector('.price-original');
        if (originalPriceElement) {
            const originalPrice = Math.round(productState.selectedPrice / 0.88);
            originalPriceElement.textContent = `฿${originalPrice.toLocaleString()}`;
        }
    }

    // Quantity Controls
    function setupQuantityControls() {
        const minusBtn = document.querySelector('.qty-btn.minus');
        const plusBtn = document.querySelector('.qty-btn.plus');
        const qtyInput = document.querySelector('.qty-input');

        if (minusBtn) {
            minusBtn.addEventListener('click', function() {
                if (productState.quantity > 1) {
                    productState.quantity--;
                    qtyInput.value = productState.quantity;
                }
            });
        }

        if (plusBtn) {
            plusBtn.addEventListener('click', function() {
                if (productState.quantity < 10) { // Max quantity limit
                    productState.quantity++;
                    qtyInput.value = productState.quantity;
                }
            });
        }

        if (qtyInput) {
            qtyInput.addEventListener('change', function() {
                const value = parseInt(this.value);
                if (value >= 1 && value <= 10) {
                    productState.quantity = value;
                } else {
                    this.value = productState.quantity; // Reset to previous valid value
                }
            });
        }
    }

    // Tab Functionality
    function setupTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabPanels = document.querySelectorAll('.tab-panel');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const tabId = this.dataset.tab;

                // Update active tab button
                tabBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                // Update active tab panel
                tabPanels.forEach(panel => {
                    panel.classList.remove('active');
                    if (panel.id === tabId) {
                        panel.classList.add('active');
                    }
                });

                // Track tab interaction
                trackEvent('Product Tab Viewed', { tab: tabId });
            });
        });

        // Make rating count clickable to jump to reviews
        const ratingCount = document.querySelector('.rating-count');
        if (ratingCount) {
            ratingCount.addEventListener('click', function() {
                // Switch to reviews tab
                const reviewsTab = document.querySelector('[data-tab="reviews"]');
                const reviewsPanel = document.getElementById('reviews');
                
                if (reviewsTab && reviewsPanel) {
                    tabBtns.forEach(b => b.classList.remove('active'));
                    tabPanels.forEach(p => p.classList.remove('active'));
                    
                    reviewsTab.classList.add('active');
                    reviewsPanel.classList.add('active');
                    
                    // Smooth scroll to reviews
                    reviewsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        }
    }

    // Add to Cart Functionality
    function setupAddToCart() {
        const addToCartBtn = document.querySelector('.add-to-cart-btn');
        const buyNowBtn = document.querySelector('.buy-now-btn');

        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', function() {
                // Add loading state
                const originalText = this.innerHTML;
                this.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="animate-spin">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-opacity="0.3"/>
                        <path fill="currentColor" d="M4 12a8 8 0 0 1 8-8v8H4z"/>
                    </svg>
                    Adding...
                `;
                this.disabled = true;

                // Simulate add to cart
                setTimeout(() => {
                    // Add to cart logic would go here
                    updateCartCount();
                    showNotification(`Added ${productState.quantity}x ${productState.selectedVariant} to cart!`, 'success');
                    
                    // Reset button
                    this.innerHTML = originalText;
                    this.disabled = false;

                    // Track conversion event
                    trackEvent('Product Added to Cart', {
                        product: 'Amino-Acid Cleanser',
                        variant: productState.selectedVariant,
                        quantity: productState.quantity,
                        price: productState.selectedPrice
                    });
                }, 1000);
            });
        }

        if (buyNowBtn) {
            buyNowBtn.addEventListener('click', function() {
                // Add loading state
                const originalText = this.textContent;
                this.textContent = 'Processing...';
                this.disabled = true;

                // Simulate buy now (would redirect to checkout)
                setTimeout(() => {
                    showNotification('Redirecting to checkout...', 'success');
                    
                    // Track conversion event
                    trackEvent('Buy Now Clicked', {
                        product: 'Amino-Acid Cleanser',
                        variant: productState.selectedVariant,
                        quantity: productState.quantity,
                        price: productState.selectedPrice
                    });

                    // Would redirect to checkout in real implementation
                    setTimeout(() => {
                        window.location.href = 'checkout.html';
                    }, 1000);
                }, 800);
            });
        }
    }

    function updateCartCount() {
        const cartCount = document.querySelector('.bag-count');
        if (cartCount) {
            const currentCount = parseInt(cartCount.textContent) || 0;
            const newCount = currentCount + productState.quantity;
            cartCount.textContent = newCount;
            
            // Add animation
            cartCount.style.transform = 'scale(1.3)';
            setTimeout(() => {
                cartCount.style.transform = 'scale(1)';
            }, 200);
        }
    }

    // Image Modal
    function setupImageModal() {
        const modal = document.getElementById('image-modal');
        const modalImage = document.getElementById('modal-image');
        const closeBtn = document.querySelector('.modal-close');

        if (closeBtn) {
            closeBtn.addEventListener('click', closeImageModal);
        }

        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    closeImageModal();
                }
            });
        }

        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (modal && modal.classList.contains('active')) {
                if (e.key === 'Escape') {
                    closeImageModal();
                }
            }
        });
    }

    function openImageModal() {
        const modal = document.getElementById('image-modal');
        const modalImage = document.getElementById('modal-image');
        const mainImage = document.getElementById('main-product-image');

        if (modal && modalImage && mainImage) {
            modalImage.src = mainImage.src;
            modalImage.alt = mainImage.alt;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeImageModal() {
        const modal = document.getElementById('image-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Quick Add for Related Products
    function setupQuickAdd() {
        const quickAddBtns = document.querySelectorAll('.quick-add');
        
        quickAddBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const productName = this.closest('.related-item').querySelector('h4').textContent;
                const originalText = this.textContent;
                
                // Add loading state
                this.textContent = 'Adding...';
                this.disabled = true;

                setTimeout(() => {
                    updateCartCount();
                    showNotification(`${productName} added to cart!`, 'success');
                    
                    // Reset button with checkmark
                    this.textContent = '✓ Added';
                    setTimeout(() => {
                        this.textContent = originalText;
                        this.disabled = false;
                    }, 2000);

                    // Track event
                    trackEvent('Related Product Added', { product: productName });
                }, 800);
            });
        });
    }

    // Review Helpers
    function setupReviewHelpers() {
        const helpfulBtns = document.querySelectorAll('.helpful-btn');
        const loadMoreBtn = document.querySelector('.load-more-reviews');

        helpfulBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                if (!this.classList.contains('voted')) {
                    this.classList.add('voted');
                    this.style.color = '#10b981';
                    
                    // Extract and increment count
                    const match = this.textContent.match(/\((\d+)\)/);
                    if (match) {
                        const count = parseInt(match[1]) + 1;
                        this.textContent = this.textContent.replace(/\(\d+\)/, `(${count})`);
                    }
                    
                    showNotification('Thank you for your feedback!', 'success');
                }
            });
        });

        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', function() {
                this.textContent = 'Loading...';
                this.disabled = true;

                // Simulate loading more reviews
                setTimeout(() => {
                    showNotification('More reviews loaded!', 'success');
                    this.textContent = 'Load More Reviews';
                    this.disabled = false;
                }, 1000);
            });
        }
    }

    // Notifications
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const bgColor = type === 'success' ? '#10b981' : 
                       type === 'error' ? '#ef4444' : '#3b82f6';
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1001;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
            font-size: 14px;
            font-weight: 500;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span>${type === 'success' ? '✓' : type === 'error' ? '⚠' : 'ℹ'}</span>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, type === 'error' ? 5000 : 3000);
    }

    // Analytics Tracking
    function trackEvent(eventName, properties = {}) {
        // In real implementation, this would send to analytics service
        console.log('Event:', eventName, properties);
        
        // Example: Google Analytics 4
        // gtag('event', eventName, properties);
        
        // Example: Facebook Pixel
        // fbq('track', eventName, properties);
    }

    function trackPageView() {
        trackEvent('Product Page Viewed', {
            product: 'Amino-Acid Cleanser',
            category: 'Cleansers',
            price: productState.selectedPrice
        });
    }

    // Conversion Rate Optimization Features
    function setupCROFeatures() {
        // Scroll-triggered urgency message
        let urgencyShown = false;
        window.addEventListener('scroll', function() {
            const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            
            if (scrollPercent > 50 && !urgencyShown) {
                urgencyShown = true;
                showNotification('💎 This product is selling fast! Only 12 left in stock.', 'info');
                trackEvent('Urgency Message Shown');
            }
        });

        // Exit intent detection (for desktop)
        if (window.innerWidth > 768) {
            let exitIntentShown = false;
            document.addEventListener('mouseleave', function(e) {
                if (e.clientY <= 0 && !exitIntentShown) {
                    exitIntentShown = true;
                    showExitIntentModal();
                }
            });
        }

        // Time on page urgency
        setTimeout(() => {
            if (document.visibilityState === 'visible') {
                showNotification('⏰ Still deciding? Free shipping ends in 2 hours!', 'info');
                trackEvent('Time Based Urgency Shown');
            }
        }, 60000); // Show after 1 minute

        // Cart abandonment prevention
        setupCartAbandonmentPrevention();
    }

    function showExitIntentModal() {
        // Create and show exit intent modal
        const modal = document.createElement('div');
        modal.className = 'exit-intent-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 1002;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                padding: 40px;
                border-radius: 12px;
                max-width: 500px;
                text-align: center;
                position: relative;
            ">
                <button onclick="this.closest('.exit-intent-modal').remove()" style="
                    position: absolute;
                    top: 15px;
                    right: 20px;
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #666;
                ">&times;</button>
                <h3 style="margin-bottom: 16px; color: #333;">Wait! Don't leave empty-handed</h3>
                <p style="margin-bottom: 24px; color: #666;">Get 10% off your first order with code WELCOME10</p>
                <button onclick="
                    this.closest('.exit-intent-modal').remove();
                    document.querySelector('.add-to-cart-btn').click();
                " style="
                    background: #000;
                    color: white;
                    padding: 12px 24px;
                    border: none;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                ">Get My Discount</button>
            </div>
        `;

        document.body.appendChild(modal);
        trackEvent('Exit Intent Modal Shown');

        // Auto-remove after 10 seconds if no interaction
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 10000);
    }

    function setupCartAbandonmentPrevention() {
        // Track when user adds to cart but doesn't complete purchase
        let hasAddedToCart = false;
        
        document.querySelector('.add-to-cart-btn')?.addEventListener('click', function() {
            hasAddedToCart = true;
        });

        // Show retention message before page unload
        window.addEventListener('beforeunload', function(e) {
            if (hasAddedToCart) {
                e.preventDefault();
                e.returnValue = 'You have items in your cart. Are you sure you want to leave?';
                trackEvent('Cart Abandonment Warning Shown');
            }
        });
    }

    // Performance Optimization
    function setupPerformanceOptimizations() {
        // Lazy load related product images
        const relatedImages = document.querySelectorAll('.related-item img');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.style.opacity = '0';
                        img.onload = () => {
                            img.style.opacity = '1';
                            img.style.transition = 'opacity 0.3s';
                        };
                        imageObserver.unobserve(img);
                    }
                });
            });

            relatedImages.forEach(img => {
                imageObserver.observe(img);
            });
        }

        // Preload critical images
        const criticalImages = [
            productState.images[1], // Second product image
            'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=200&h=200&fit=crop&crop=center'
        ];

        criticalImages.forEach(src => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = src;
            document.head.appendChild(link);
        });
    }

    // Social Proof Enhancement
    function setupSocialProof() {
        // Show recent purchase notifications
        const purchaseNotifications = [
            'Someone in Bangkok just bought this product',
            'This product was viewed 47 times in the last hour',
            '3 people have this in their cart right now'
        ];

        let notificationIndex = 0;
        setInterval(() => {
            if (Math.random() > 0.7) { // 30% chance every interval
                showNotification(purchaseNotifications[notificationIndex], 'info');
                notificationIndex = (notificationIndex + 1) % purchaseNotifications.length;
                trackEvent('Social Proof Notification Shown');
            }
        }, 45000); // Every 45 seconds

        // Real-time stock updates
        let currentStock = 12;
        setInterval(() => {
            if (Math.random() > 0.85) { // 15% chance
                currentStock = Math.max(8, currentStock - 1);
                const stockElement = document.querySelector('.stock-level span:last-child');
                if (stockElement) {
                    stockElement.textContent = `Only ${currentStock} left in stock`;
                    if (currentStock <= 10) {
                        stockElement.style.color = '#ef4444';
                        stockElement.style.fontWeight = 'bold';
                    }
                }
                trackEvent('Stock Level Updated', { stock: currentStock });
            }
        }, 120000); // Every 2 minutes
    }

    // Accessibility Enhancements
    function setupAccessibility() {
        // Add ARIA labels to interactive elements
        const variantOptions = document.querySelectorAll('.variant-option');
        variantOptions.forEach((option, index) => {
            option.setAttribute('role', 'button');
            option.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');
            
            option.addEventListener('click', function() {
                variantOptions.forEach(v => v.setAttribute('aria-pressed', 'false'));
                this.setAttribute('aria-pressed', 'true');
            });
        });

        // Keyboard navigation for thumbnails
        const thumbnails = document.querySelectorAll('.thumbnail');
        thumbnails.forEach((thumbnail, index) => {
            thumbnail.setAttribute('tabindex', '0');
            thumbnail.setAttribute('role', 'button');
            thumbnail.setAttribute('aria-label', `View product image ${index + 1}`);
            
            thumbnail.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
            });
        });

        // Announce quantity changes to screen readers
        const qtyInput = document.querySelector('.qty-input');
        if (qtyInput) {
            qtyInput.setAttribute('aria-label', 'Product quantity');
            qtyInput.addEventListener('change', function() {
                const announcement = document.createElement('div');
                announcement.setAttribute('aria-live', 'polite');
                announcement.style.position = 'absolute';
                announcement.style.left = '-10000px';
                announcement.textContent = `Quantity changed to ${this.value}`;
                document.body.appendChild(announcement);
                
                setTimeout(() => {
                    document.body.removeChild(announcement);
                }, 1000);
            });
        }
    }

    // Mobile Optimizations
    function setupMobileOptimizations() {
        if (window.innerWidth <= 768) {
            // Touch-friendly interactions
            let touchStartY = 0;
            let touchEndY = 0;

            const productImages = document.querySelector('.product-images');
            if (productImages) {
                productImages.addEventListener('touchstart', function(e) {
                    touchStartY = e.changedTouches[0].screenY;
                });

                productImages.addEventListener('touchend', function(e) {
                    touchEndY = e.changedTouches[0].screenY;
                    const swipeDistance = touchStartY - touchEndY;
                    
                    // Swipe up to zoom
                    if (swipeDistance > 50) {
                        openImageModal();
                    }
                });
            }

            // Sticky add to cart on mobile
            const productActions = document.querySelector('.product-actions');
            if (productActions) {
                const stickyActions = productActions.cloneNode(true);
                stickyActions.classList.add('sticky-mobile-actions');
                stickyActions.style.cssText = `
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: white;
                    padding: 16px;
                    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
                    z-index: 100;
                    transform: translateY(100%);
                    transition: transform 0.3s ease;
                `;

                document.body.appendChild(stickyActions);

                // Show/hide sticky actions based on scroll
                let isSticky = false;
                window.addEventListener('scroll', function() {
                    const productActionsRect = productActions.getBoundingClientRect();
                    
                    if (productActionsRect.bottom < window.innerHeight && !isSticky) {
                        stickyActions.style.transform = 'translateY(0)';
                        isSticky = true;
                    } else if (productActionsRect.bottom >= window.innerHeight && isSticky) {
                        stickyActions.style.transform = 'translateY(100%)';
                        isSticky = false;
                    }
                });

                // Rebind events for sticky actions
                setupAddToCartForElement(stickyActions);
            }
        }
    }

    function setupAddToCartForElement(container) {
        const addToCartBtn = container.querySelector('.add-to-cart-btn');
        const buyNowBtn = container.querySelector('.buy-now-btn');

        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', function() {
                // Trigger original add to cart functionality
                document.querySelector('.product-actions .add-to-cart-btn').click();
            });
        }

        if (buyNowBtn) {
            buyNowBtn.addEventListener('click', function() {
                // Trigger original buy now functionality
                document.querySelector('.product-actions .buy-now-btn').click();
            });
        }
    }

    // Initialize all enhancement features
    setTimeout(() => {
        setupCROFeatures();
        setupPerformanceOptimizations();
        setupSocialProof();
        setupAccessibility();
        setupMobileOptimizations();
    }, 1000);

    // Page visibility tracking
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'hidden') {
            trackEvent('Page Hidden');
        } else {
            trackEvent('Page Visible');
        }
    });

    // Error handling
    window.addEventListener('error', function(e) {
        trackEvent('JavaScript Error', {
            message: e.message,
            filename: e.filename,
            line: e.lineno
        });
    });
});