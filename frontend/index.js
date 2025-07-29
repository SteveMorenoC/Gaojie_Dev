// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mainNav = document.getElementById('main-nav');
    const searchForm = document.querySelector('.search-form');
    
    // Product functionality
    const productCards = document.querySelectorAll('.product-card');
    const addToBagBtns = document.querySelectorAll('.add-to-bag-btn');
    const categoryCards = document.querySelectorAll('.category-card');
    const newsletterForm = document.querySelector('.newsletter-form');
    const notifyForm = document.querySelector('.notify-form');
    const influencerForm = document.getElementById('influencer-form');

    // Initialize product interactions
    initializeProductInteractions();
    initializeCategoryInteractions();
    initializeNewsletterForm();
    initializeNotifyForm();
    initializeInfluencerForm();

    // Mobile Menu Toggle
    if (mobileMenuToggle && mainNav) {
        mobileMenuToggle.addEventListener('click', function() {
            mainNav.classList.toggle('active');
            
            // Toggle hamburger animation
            this.classList.toggle('active');
            
            // Update aria-expanded for accessibility
            const isExpanded = mainNav.classList.contains('active');
            this.setAttribute('aria-expanded', isExpanded);
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (mainNav && mainNav.classList.contains('active')) {
            if (!mainNav.contains(event.target) && !mobileMenuToggle.contains(event.target)) {
                mainNav.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
            }
        }
    });

    // Close mobile menu when window is resized to desktop
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && mainNav) {
            mainNav.classList.remove('active');
            if (mobileMenuToggle) {
                mobileMenuToggle.classList.remove('active');
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
            }
        }
    });

    // Search Form Enhancement
    if (searchForm) {
        searchForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const searchInput = this.querySelector('.search-input');
            const searchTerm = searchInput.value.trim();
            
            if (searchTerm) {
                // Redirect to search results page (replace with your actual search URL)
                window.location.href = `/search?q=${encodeURIComponent(searchTerm)}`;
            }
        });
    }

    // Keyboard Navigation Enhancement
    document.addEventListener('keydown', function(event) {
        // Close mobile menu with Escape key
        if (event.key === 'Escape' && mainNav && mainNav.classList.contains('active')) {
            mainNav.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
            mobileMenuToggle.setAttribute('aria-expanded', 'false');
            mobileMenuToggle.focus();
        }
    });
});

// Product Interactions
function initializeProductInteractions() {
    // Add to Bag functionality
    const addToBagBtns = document.querySelectorAll('.add-to-bag-btn');
    addToBagBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Add loading state
            const originalText = this.textContent;
            this.textContent = 'Adding...';
            this.disabled = true;
            this.style.opacity = '0.7';
            
            // Simulate API call
            setTimeout(() => {
                this.textContent = 'Added to Bag!';
                this.style.backgroundColor = '#4ECDC4';
                this.style.borderColor = '#4ECDC4';
                this.style.color = 'white';
                
                setTimeout(() => {
                    this.textContent = originalText;
                    this.disabled = false;
                    this.style.opacity = '';
                    this.style.backgroundColor = '';
                    this.style.borderColor = '';
                    this.style.color = '';
                }, 2000);
            }, 1000);
        });
    });

    // Enhanced hover effects for product cards
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// Newsletter Form
function initializeNewsletterForm() {
    const newsletterForm = document.querySelector('.newsletter-form');
    const newsletterButton = document.querySelector('.newsletter-button');
    const newsletterInput = document.querySelector('.newsletter-input');
    
    if (newsletterForm && newsletterButton && newsletterInput) {
        newsletterButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            const email = newsletterInput.value.trim();
            
            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (!email) {
                newsletterInput.style.borderColor = '#ff6b6b';
                newsletterInput.placeholder = 'Email required for discount';
                return;
            }
            
            if (!emailRegex.test(email)) {
                newsletterInput.style.borderColor = '#ff6b6b';
                newsletterInput.value = '';
                newsletterInput.placeholder = 'Please enter a valid email';
                return;
            }
            
            // Success state
            const originalText = this.textContent;
            this.textContent = 'Sending discount...';
            this.disabled = true;
            
            // Simulate API call
            setTimeout(() => {
                this.textContent = 'Check your email!';
                this.style.backgroundColor = '#4ECDC4';
                newsletterInput.value = '';
                newsletterInput.placeholder = 'Discount code sent! 🎉';
                newsletterInput.style.borderColor = '#4ECDC4';
                
                setTimeout(() => {
                    this.textContent = originalText;
                    this.disabled = false;
                    this.style.backgroundColor = '';
                    newsletterInput.placeholder = 'Enter your email for 15% off';
                    newsletterInput.style.borderColor = '';
                }, 4000);
            }, 1500);
        });
        
        // Reset border color on focus
        newsletterInput.addEventListener('focus', function() {
            this.style.borderColor = '';
            if (this.placeholder === 'Email required for discount' || this.placeholder === 'Please enter a valid email') {
                this.placeholder = 'Enter your email for 15% off';
            }
        });
    }
}

// Influencer Form (for Influencer page)
function initializeInfluencerForm() {
    const form = document.getElementById('influencer-form');
    const submitBtn = document.getElementById('submit-btn');
    
    if (!form || !submitBtn) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        // Validation
        if (!validateInfluencerForm(data)) {
            return;
        }
        
        // Submit form
        submitInfluencerApplication(data, submitBtn);
    });
}

function validateInfluencerForm(data) {
    // Clear previous errors
    clearFormErrors();
    
    let isValid = true;
    
    // Required fields validation
    const requiredFields = ['fullName', 'email', 'phone', 'lineId'];
    requiredFields.forEach(field => {
        if (!data[field] || data[field].trim() === '') {
            showFieldError(field, 'This field is required');
            isValid = false;
        }
    });
    
    // Email validation
    if (data.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            showFieldError('email', 'Please enter a valid email address');
            isValid = false;
        }
    }
    
    // Social media validation - at least one required
    const socialFields = ['instagram', 'tiktok', 'facebook'];
    const hasSocialMedia = socialFields.some(field => data[field] && data[field].trim() !== '');
    
    if (!hasSocialMedia) {
        showSocialMediaError('Please provide at least one social media account');
        isValid = false;
    } else {
        // Validate social media URLs
        socialFields.forEach(field => {
            if (data[field] && data[field].trim() !== '') {
                if (!isValidURL(data[field])) {
                    showFieldError(field, 'Please enter a valid URL');
                    isValid = false;
                }
            }
        });
    }
    
    // Terms agreement validation
    if (!data.terms) {
        showFieldError('terms', 'You must agree to the Terms of Service');
        isValid = false;
    }
    
    return isValid;
}

function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function showFieldError(fieldName, message) {
    const field = document.querySelector(`[name="${fieldName}"]`);
    if (field) {
        field.style.borderColor = '#ff6b6b';
        
        // Remove existing error message
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.color = '#ff6b6b';
        errorDiv.style.fontSize = '0.875rem';
        errorDiv.style.marginTop = '0.25rem';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }
}

function showSocialMediaError(message) {
    const socialInputs = document.querySelector('.social-inputs');
    if (socialInputs) {
        // Remove existing error
        const existingError = socialInputs.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.color = '#ff6b6b';
        errorDiv.style.fontSize = '0.875rem';
        errorDiv.style.marginTop = '0.25rem';
        errorDiv.textContent = message;
        socialInputs.parentNode.appendChild(errorDiv);
    }
}

function clearFormErrors() {
    // Clear error styles
    const inputs = document.querySelectorAll('.form-input, .form-textarea');
    inputs.forEach(input => {
        input.style.borderColor = '';
    });
    
    // Remove error messages
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(error => error.remove());
}

function submitInfluencerApplication(data, submitBtn) {
    // Loading state
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = 'Submitting Application...';
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // Success state
        submitBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="margin-right: 8px;">
                <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Application Submitted!
        `;
        submitBtn.style.backgroundColor = '#4ECDC4';
        
        // Show success message
        showSuccessMessage();
        
        // Reset form after delay
        setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            submitBtn.style.backgroundColor = '';
            document.getElementById('influencer-form').reset();
            hideSuccessMessage();
        }, 5000);
        
    }, 2000);
}

function showSuccessMessage() {
    const form = document.getElementById('influencer-form');
    const successDiv = document.createElement('div');
    successDiv.id = 'success-message';
    successDiv.style.cssText = `
        background: #4ECDC4;
        color: white;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1rem;
        text-align: center;
        font-weight: 600;
    `;
    successDiv.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Thank you! We'll review your application and get back to you within 48 hours.
        </div>
    `;
    form.insertBefore(successDiv, form.firstChild);
}

function hideSuccessMessage() {
    const successMessage = document.getElementById('success-message');
    if (successMessage) {
        successMessage.remove();
    }
}

// Notify Form (for Coming Soon page)
function initializeNotifyForm() {
    const notifyButton = document.querySelector('.notify-button');
    const notifyInput = document.querySelector('.notify-input');
    
    if (notifyButton && notifyInput) {
        notifyButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            const email = notifyInput.value.trim();
            
            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (!email) {
                notifyInput.style.borderColor = '#ff6b6b';
                notifyInput.placeholder = 'Please enter your email';
                return;
            }
            
            if (!emailRegex.test(email)) {
                notifyInput.style.borderColor = '#ff6b6b';
                notifyInput.value = '';
                notifyInput.placeholder = 'Please enter a valid email';
                return;
            }
            
            // Success state
            const originalText = this.textContent;
            this.textContent = 'Adding you...';
            this.disabled = true;
            
            // Simulate API call
            setTimeout(() => {
                this.textContent = 'You\'re on the list!';
                this.style.backgroundColor = '#4ECDC4';
                notifyInput.value = '';
                notifyInput.placeholder = 'Thank you! We\'ll be in touch.';
                notifyInput.style.borderColor = '#4ECDC4';
                
                setTimeout(() => {
                    this.textContent = originalText;
                    this.disabled = false;
                    this.style.backgroundColor = '';
                    notifyInput.placeholder = 'Enter your email';
                    notifyInput.style.borderColor = '';
                }, 3000);
            }, 1500);
        });
        
        // Reset border color on focus
        notifyInput.addEventListener('focus', function() {
            this.style.borderColor = '';
            if (this.placeholder === 'Please enter your email' || this.placeholder === 'Please enter a valid email') {
                this.placeholder = 'Enter your email';
            }
        });
    }
}

// Category Card Interactions
function initializeCategoryInteractions() {
    const categoryCards = document.querySelectorAll('.category-card');
    
    categoryCards.forEach(card => {
        card.addEventListener('click', function() {
            // Get product title for routing (you can customize this)
            const productTitle = this.querySelector('.category-product-title').textContent;
            console.log('Clicked on:', productTitle);
            
            // Here you would typically navigate to the product page
            // window.location.href = `/product/${productSlug}`;
        });
        
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// GAOJIE Skincare - Enhanced Main JavaScript

// Mobile menu functionality
document.addEventListener('DOMContentLoaded', function() {
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const mainNav = document.getElementById('main-nav');
    
    if (mobileToggle && mainNav) {
        mobileToggle.addEventListener('click', function() {
            mainNav.classList.toggle('active');
            mobileToggle.classList.toggle('active');
        });
    }
    
    // Initialize cart functionality
    initializeCart();
    
    // Initialize product interactions
    initializeProductInteractions();
    
    // Initialize search functionality
    initializeSearch();
});

// Cart Management
let cart = JSON.parse(localStorage.getItem('gaojie_cart')) || [];

function initializeCart() {
    updateCartDisplay();
    
    // Add to cart event delegation for dynamic content
    document.addEventListener('click', function(e) {
        if (e.target.matches('.add-to-bag-btn')) {
            e.preventDefault();
            const productId = e.target.getAttribute('data-product-id');
            if (productId) {
                addToCart(productId);
            }
        }
    });
}

async function addToCart(productId) {
    try {
        // Get product details from API
        const response = await api.getProduct(productId);
        
        if (response.status === 'success') {
            const product = response.product;
            
            // Check if product already in cart
            const existingItem = cart.find(item => item.id === product.id);
            
            if (existingItem) {
                existingItem.quantity += 1;
                showNotification(`Updated ${product.name} quantity in cart`);
            } else {
                cart.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.primary_image,
                    slug: product.slug,
                    quantity: 1
                });
                showNotification(`Added ${product.name} to cart`);
            }
            
            // Save cart and update display
            localStorage.setItem('gaojie_cart', JSON.stringify(cart));
            updateCartDisplay();
            
        } else {
            showNotification('Error adding product to cart', 'error');
        }
        
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Error adding product to cart', 'error');
    }
}

function updateCartDisplay() {
    const cartCount = document.querySelector('.bag-count');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: type === 'success' ? '#4CAF50' : '#f44336',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '4px',
        zIndex: '10000',
        fontSize: '14px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease'
    });
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Product Interactions
function initializeProductInteractions() {
    // Product image hover effects (for dynamically loaded content)
    document.addEventListener('mouseenter', function(e) {
        if (e.target.matches('.product-card, .category-card')) {
            const primary = e.target.querySelector('.product-image.primary, .category-image');
            const secondary = e.target.querySelector('.product-image.secondary');
            
            if (primary && secondary) {
                primary.style.opacity = '0';
                secondary.style.opacity = '1';
            }
        }
    }, true);
    
    document.addEventListener('mouseleave', function(e) {
        if (e.target.matches('.product-card, .category-card')) {
            const primary = e.target.querySelector('.product-image.primary, .category-image');
            const secondary = e.target.querySelector('.product-image.secondary');
            
            if (primary && secondary) {
                primary.style.opacity = '1';
                secondary.style.opacity = '0';
            }
        }
    }, true);
    
    // Product card click navigation
    document.addEventListener('click', function(e) {
        const productCard = e.target.closest('.product-card, .category-card');
        if (productCard && !e.target.matches('.add-to-bag-btn')) {
            const productId = productCard.getAttribute('data-product-id');
            if (productId) {
                // Navigate to product page (we'll implement this later)
                console.log(`Navigate to product ${productId}`);
                // window.location.href = `/product/${productId}`;
            }
        }
    });
}

// Search Functionality
function initializeSearch() {
    const searchForm = document.querySelector('.search-form');
    const searchInput = document.querySelector('.search-input');
    
    if (searchForm && searchInput) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                performSearch(searchTerm);
            }
        });
    }
}

async function performSearch(searchTerm) {
    console.log(`Searching for: ${searchTerm}`);
    
    try {
        const response = await api.searchProducts(searchTerm);
        
        if (response.status === 'success') {
            // For now, just log results. Later we'll create a search results page
            console.log('Search results:', response.products);
            showNotification(`Found ${response.products.length} products for "${searchTerm}"`);
        }
        
    } catch (error) {
        console.error('Search error:', error);
        showNotification('Search failed. Please try again.', 'error');
    }
}

// Newsletter Signup
document.addEventListener('click', function(e) {
    if (e.target.matches('.newsletter-button')) {
        e.preventDefault();
        const email = document.querySelector('.newsletter-input').value;
        
        if (email && email.includes('@')) {
            showNotification('Thank you for subscribing! Check your email for your 15% discount.');
            document.querySelector('.newsletter-input').value = '';
        } else {
            showNotification('Please enter a valid email address.', 'error');
        }
    }
});

// Smooth scroll for anchor links
document.addEventListener('click', function(e) {
    if (e.target.matches('a[href^="#"]')) {
        e.preventDefault();
        const target = document.querySelector(e.target.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
});

// Image lazy loading optimization
function optimizeImages() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.src; // This triggers loading
                    observer.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
}

// Initialize image optimization when page loads
document.addEventListener('DOMContentLoaded', optimizeImages);

// Utility function to format currency
function formatCurrency(amount) {
    return `฿${amount.toLocaleString()}`;
}

// Console welcome message
console.log('%c🌟 GAOJIE Skincare', 'color: #333; font-size: 20px; font-weight: bold;');
console.log('%cWebsite powered by Flask API', 'color: #666; font-size: 12px;');