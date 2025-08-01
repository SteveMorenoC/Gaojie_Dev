// Updated checkout.js with Omise payment integration and guest checkout support

document.addEventListener('DOMContentLoaded', function() {
    let currentStep = 1;
    let checkoutData = loadCartData();
    let isAuthenticated = false;
    let currentUser = null;

    // Omise configuration - you'll need to set your public key
    const OMISE_PUBLIC_KEY = 'pkey_test_64jt8kd53p45vdulorn'; // Replace with your actual public key
    
    initCheckout();

    async function initCheckout() {
        // Check authentication status
        await checkAuthStatus();
        
        // Check if cart is empty
        if (checkoutData.cart.length === 0) {
            showEmptyCartMessage();
            return;
        }
        
        loadOrderSummary();
        setupFormValidation();
        setupShippingOptions();
        setupPaymentOptions();
        setupPromoCode();
        setupFormSubmission();
        calculateTotals();
        
        // Pre-fill user data if authenticated
        if (isAuthenticated && currentUser) {
            prefillUserData();
        } else {
            prefillTestData(); // For demo purposes
        }
    }

    async function checkAuthStatus() {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/check`, {
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                isAuthenticated = data.authenticated;
                currentUser = data.user;
                
                // Update UI based on auth status
                updateAuthUI();
            }
        } catch (error) {
            console.log('Auth check failed (probably not authenticated):', error);
            isAuthenticated = false;
            currentUser = null;
        }
    }

    function updateAuthUI() {
        const stepHeader = document.querySelector('#step-1 .step-header');
        if (stepHeader && isAuthenticated) {
            stepHeader.innerHTML = `
                <h2>Contact Information</h2>
                <p>Signed in as <strong>${currentUser.email}</strong> • <a href="#" class="login-link" onclick="logout()">Sign out</a></p>
            `;
        }
    }

    function prefillUserData() {
        if (currentUser) {
            document.getElementById('email').value = currentUser.email;
            document.getElementById('first-name').value = currentUser.first_name || '';
            document.getElementById('last-name').value = currentUser.last_name || '';
            document.getElementById('phone').value = currentUser.phone || '';
        }
    }

    function loadCartData() {
        const cart = JSON.parse(localStorage.getItem('gaojie_cart')) || [];
        let subtotal = 0;
        
        // Calculate subtotal from real cart
        cart.forEach(item => {
            subtotal += item.price * item.quantity;
        });
        
        // Apply promo code if exists
        const promo = JSON.parse(localStorage.getItem('gaojie_promo') || '{}');
        const discount = promo.discount ? subtotal * promo.discount : 0;
        
        const freeShippingThreshold = 1500;
        const shipping = subtotal >= freeShippingThreshold ? 0 : 100;
        const tax = (subtotal - discount) * 0.07; // 7% VAT
        
        return {
            cart: cart,
            subtotal: subtotal,
            shipping: shipping,
            tax: tax,
            discount: discount,
            discountCode: promo.code || null
        };
    }

    function loadOrderSummary() {
        const orderItems = document.querySelector('.order-items');
        const itemCount = document.querySelector('.item-count');
        
        if (orderItems) {
            orderItems.innerHTML = '';
            
            checkoutData.cart.forEach(item => {
                const itemElement = createOrderItem(item);
                orderItems.appendChild(itemElement);
            });
        }
        
        if (itemCount) {
            const totalItems = checkoutData.cart.reduce((sum, item) => sum + item.quantity, 0);
            itemCount.textContent = `${totalItems} items`;
        }
    }

    function createOrderItem(item) {
        const div = document.createElement('div');
        div.className = 'order-item';
        
        div.innerHTML = `
            <div class="item-image">
                <img src="${item.image || 'https://via.placeholder.com/60'}" alt="${item.name}">
                <span class="item-quantity">${item.quantity}</span>
            </div>
            <div class="item-details">
                <h4>${item.name}</h4>
                <p>Premium skincare</p>
            </div>
            <div class="item-price">฿${(item.price * item.quantity).toLocaleString()}</div>
        `;
        
        return div;
    }

    function showEmptyCartMessage() {
        const checkoutContainer = document.querySelector('.checkout-container');
        if (checkoutContainer) {
            checkoutContainer.innerHTML = `
                <div style="text-align: center; padding: 60px 20px;">
                    <h2>Your cart is empty</h2>
                    <p>Add some products to your cart before checkout.</p>
                    <a href="main.html" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #31e230; color: white; text-decoration: none; border-radius: 6px;">Continue Shopping</a>
                </div>
            `;
        }
    }

    function calculateTotals() {
        const subtotal = checkoutData.subtotal;
        const discount = checkoutData.discount;
        const shipping = checkoutData.shipping;
        const discountedSubtotal = subtotal - discount;
        const tax = Math.round(discountedSubtotal * 0.07);
        const total = discountedSubtotal + shipping + tax;
    
        // Update display elements
        updateElement(['#subtotal', '.subtotal-amount'], `฿${subtotal.toLocaleString()}`);
        updateElement(['#shipping-cost', '.shipping-amount'], shipping === 0 ? 'FREE' : `฿${shipping}`);
        updateElement(['#tax-amount', '.tax-amount'], `฿${tax.toLocaleString()}`);
        updateElement(['#final-total', '.total-amount'], `฿${total.toLocaleString()}`);
        
        // Show/hide discount row
        const discountRow = document.getElementById('discount-row');
        if (discount > 0 && discountRow) {
            discountRow.style.display = 'flex';
            const discountAmount = document.getElementById('discount-amount');
            if (discountAmount) {
                discountAmount.textContent = `-฿${Math.round(discount).toLocaleString()}`;
            }
        } else if (discountRow) {
            discountRow.style.display = 'none';
        }

        // Update checkout data
        checkoutData.tax = tax;
        checkoutData.total = total;
    }

    function updateElement(selectors, value) {
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                element.textContent = value;
                return;
            }
        }
    }

    // Step Navigation
    window.nextStep = function(step) {
        if (validateCurrentStep()) {
            showStep(step);
        }
    };

    window.previousStep = function(step) {
        showStep(step);
    };

    function showStep(step) {
        // Hide all steps
        document.querySelectorAll('.checkout-step').forEach(s => {
            s.classList.remove('active');
        });

        // Show target step
        const targetStep = document.getElementById(`step-${step}`);
        if (targetStep) {
            targetStep.classList.add('active');
        }

        // Update progress
        updateProgress(step);
        currentStep = step;

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function updateProgress(activeStep) {
        document.querySelectorAll('.progress-step').forEach((step, index) => {
            const stepNumber = index + 1;
            step.classList.remove('active', 'completed');
            
            if (stepNumber < activeStep) {
                step.classList.add('completed');
                const circle = step.querySelector('.progress-circle');
                if (circle) circle.textContent = '✓';
            } else if (stepNumber === activeStep) {
                step.classList.add('active');
                const circle = step.querySelector('.progress-circle');
                if (circle) circle.textContent = stepNumber;
            } else {
                const circle = step.querySelector('.progress-circle');
                if (circle) circle.textContent = stepNumber;
            }
        });
    }

    function validateCurrentStep() {
        const currentStepEl = document.querySelector('.checkout-step.active');
        if (!currentStepEl) return true;

        const requiredFields = currentStepEl.querySelectorAll('input[required], select[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                showFieldError(field, 'This field is required');
                isValid = false;
            } else {
                clearFieldError(field);
            }

            // Email validation
            if (field.type === 'email' && field.value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
                if (!emailRegex.test(field.value)) {
                    showFieldError(field, 'Please enter a valid email address');
                    isValid = false;
                }
            }
        });

        return isValid;
    }

    function showFieldError(field, message) {
        clearFieldError(field);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        errorDiv.style.cssText = 'color: #dc2626; font-size: 0.875rem; margin-top: 4px;';
        
        field.style.borderColor = '#dc2626';
        field.parentNode.appendChild(errorDiv);
    }

    function clearFieldError(field) {
        field.style.borderColor = '';
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }

    function setupFormValidation() {
        // Add real-time validation
        document.querySelectorAll('input[required], select[required]').forEach(field => {
            field.addEventListener('blur', function() {
                if (!this.value.trim()) {
                    showFieldError(this, 'This field is required');
                } else {
                    clearFieldError(this);
                }
            });

            field.addEventListener('input', function() {
                if (this.value.trim()) {
                    clearFieldError(this);
                }
            });
        });

        // Add input formatting
        const cardNumberInput = document.getElementById('card-number');
        const expiryInput = document.getElementById('expiry');
        const cvvInput = document.getElementById('cvv');

        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', function() {
                formatCardNumber(this);
            });
        }

        if (expiryInput) {
            expiryInput.addEventListener('input', function() {
                formatExpiry(this);
            });
        }

        if (cvvInput) {
            cvvInput.addEventListener('input', function() {
                this.value = this.value.replace(/\D/g, '').substring(0, 4);
            });
        }
    }

    function formatCardNumber(input) {
        let value = input.value.replace(/\D/g, '');
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        if (formattedValue.length > 19) {
            formattedValue = formattedValue.substr(0, 19);
        }
        input.value = formattedValue;
    }

    function formatExpiry(input) {
        let value = input.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        input.value = value;
    }

    function setupShippingOptions() {
        const shippingOptions = document.querySelectorAll('input[name="shipping"]');
        shippingOptions.forEach(option => {
            option.addEventListener('change', function() {
                const cost = parseInt(this.closest('.shipping-option').dataset.cost) || 0;
                checkoutData.shipping = cost;
                calculateTotals();
            });
        });
    }

    function setupPaymentOptions() {
        const paymentOptions = document.querySelectorAll('input[name="payment"]');
        const cardForm = document.getElementById('card-form');
        
        paymentOptions.forEach(option => {
            option.addEventListener('change', function() {
                if (this.value === 'card') {
                    cardForm.classList.add('active');
                } else {
                    cardForm.classList.remove('active');
                }
            });
        });
    }

    function setupPromoCode() {
        const promoInput = document.getElementById('promo-input');
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

    function applyPromoCode(code) {
        const validCodes = {
            'welcome15': { type: 'percentage', value: 0.15, description: '15% off your order' },
            'save10': { type: 'percentage', value: 0.10, description: '10% off your order' },
            'newcustomer': { type: 'percentage', value: 0.20, description: '20% off your order' }
        };

        const discount = validCodes[code];
        if (discount) {
            checkoutData.discount = checkoutData.subtotal * discount.value;
            checkoutData.discountCode = code;
            
            // Save to localStorage
            localStorage.setItem('gaojie_promo', JSON.stringify({
                code: code,
                discount: discount.value
            }));
            
            calculateTotals();
            showNotification(`Promo code applied: ${discount.description}`, 'success');
            
            // Clear input
            document.getElementById('promo-input').value = '';
        } else {
            showNotification('Invalid promo code', 'error');
        }
    }

    function setupFormSubmission() {
        const completeBtn = document.getElementById('complete-order');
        
        if (completeBtn) {
            completeBtn.addEventListener('click', async function(e) {
                e.preventDefault();
                
                if (!validateCurrentStep()) {
                    return;
                }

                // Show loading state
                this.classList.add('loading');
                this.innerHTML = `
                    <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-opacity="0.3"/>
                        <path fill="currentColor" d="M4 12a8 8 0 0 1 8-8v8H4z" stroke="currentColor" stroke-width="4"/>
                    </svg>
                    Processing Order...
                `;
                this.disabled = true;

                try {
                    await processOrder();
                } catch (error) {
                    console.error('Order processing failed:', error);
                    showNotification('Order processing failed. Please try again.', 'error');
                    
                    // Reset button
                    this.classList.remove('loading');
                    this.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        Complete Order
                    `;
                    this.disabled = false;
                }
            });
        }
    }

    async function processOrder() {
        try {
            const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
            let paymentInfo = { method: paymentMethod };

            // Handle credit card payment
            if (paymentMethod === 'card') {
                const token = await createOmiseToken();
                if (!token) {
                    throw new Error('Failed to process payment');
                }
                paymentInfo.token = token.id;
            }

            // Prepare order data
            const orderData = {
                items: getCartItems(),
                shipping_info: getShippingInfo(),
                payment_info: paymentInfo,
                notes: document.getElementById('order-notes')?.value || '',
                promo_code: checkoutData.discountCode
            };

            // Add guest info if not authenticated
            if (!isAuthenticated) {
                orderData.guest_info = {
                    email: document.getElementById('email').value,
                    first_name: document.getElementById('first-name').value,
                    last_name: document.getElementById('last-name').value,
                    phone: document.getElementById('phone').value
                };
            }

            // Submit order
            const endpoint = isAuthenticated ? '/orders/create' : '/orders/guest/create';
            const fullUrl = `${API_BASE_URL}${endpoint}`;
            console.log('Submitting order to:', fullUrl);
            console.log('Order data:', orderData);
            
            const response = await fetch(fullUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(orderData)
            });

            const result = await response.json();

            if (result.status === 'success') {
                // Clear cart and redirect to success page
                clearCart();
                showNotification('Order placed successfully! Redirecting...', 'success');
                
                setTimeout(() => {
                    // Redirect to success page
                    window.location.href = `success.html?order=${result.order.order_number}`;
                }, 2000);
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            console.error('Order processing error:', error);
            throw error;
        }
    }

    async function createOmiseToken() {
        try {
            // Get card data
            const cardData = {
                name: document.getElementById('card-name').value,
                number: document.getElementById('card-number').value.replace(/\s/g, ''),
                expiration_month: document.getElementById('expiry').value.split('/')[0],
                expiration_year: '20' + document.getElementById('expiry').value.split('/')[1],
                security_code: document.getElementById('cvv').value
            };

            // Create token using Omise.js (you need to include the Omise.js library)
            return new Promise((resolve, reject) => {
                if (typeof Omise === 'undefined') {
                    // Fallback for development - in production, use real Omise.js
                    console.warn('Omise.js not loaded, using mock token');
                    resolve({ id: 'tokn_test_mock_token' });
                    return;
                }

                Omise.setPublicKey(OMISE_PUBLIC_KEY);
                Omise.createToken('card', cardData, function(statusCode, response) {
                    if (statusCode === 200) {
                        resolve(response);
                    } else {
                        reject(new Error(response.message || 'Payment failed'));
                    }
                });
            });

        } catch (error) {
            console.error('Token creation failed:', error);
            throw error;
        }
    }

    function getCartItems() {
        return checkoutData.cart.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price
        }));
    }

    function getShippingInfo() {
        return {
            first_name: document.getElementById('first-name').value,
            last_name: document.getElementById('last-name').value,
            company: document.getElementById('company')?.value || '',
            address_line1: document.getElementById('address').value,
            address_line2: document.getElementById('address2')?.value || '',
            city: document.getElementById('city').value,
            state: document.getElementById('province').value,
            postal_code: document.getElementById('postal-code').value,
            country: 'Thailand',
            phone: document.getElementById('phone').value
        };
    }

    function clearCart() {
        localStorage.removeItem('gaojie_cart');
        localStorage.removeItem('gaojie_promo');
    }

    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            z-index: 1000;
            font-weight: 500;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Auto-fill for demo/testing
    function prefillTestData() {
        if (window.location.search.includes('demo=true') || !isAuthenticated) {
            setTimeout(() => {
                if (!document.getElementById('email').value) {
                    document.getElementById('email').value = 'demo@example.com';
                    document.getElementById('first-name').value = 'Demo';
                    document.getElementById('last-name').value = 'User';
                    document.getElementById('phone').value = '+66 12 345 6789';
                    document.getElementById('address').value = '123 Demo Street';
                    document.getElementById('city').value = 'Bangkok';
                    document.getElementById('postal-code').value = '10110';
                    document.getElementById('province').value = 'bangkok';
                }
            }, 500);
        }
    }

    // Global functions
    window.logout = async function() {
        try {
            await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
            
            isAuthenticated = false;
            currentUser = null;
            location.reload();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };
});