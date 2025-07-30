// Fixed checkout.js - loads real cart data from localStorage

document.addEventListener('DOMContentLoaded', function() {
    let currentStep = 1;
    let checkoutData = loadCartData(); // Load from localStorage instead of hardcoded

    initCheckout();

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
        
        const freeShippingThreshold = 999;
        const shipping = subtotal >= freeShippingThreshold ? 0 : 100;
        const tax = subtotal * 0.07; // 7% VAT
        
        return {
            cart: cart,
            subtotal: subtotal,
            shipping: shipping,
            tax: tax,
            discount: discount,
            discountCode: promo.code || null
        };
    }

    function initCheckout() {
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
        prefillTestData(); // For demo purposes
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

    // Calculate and Update Totals
    function calculateTotals() {
        const subtotal = checkoutData.subtotal;
        const discount = checkoutData.discount;
        const shipping = checkoutData.shipping;
        const discountedSubtotal = subtotal - discount;
        const tax = Math.round(discountedSubtotal * 0.07);
        const total = discountedSubtotal + shipping + tax;
    
        console.log('Calculating totals:', { subtotal, discount, shipping, tax, total }); // Debug
    
        // Update ALL possible selectors for each value
        updateElement(['#subtotal', '.subtotal-amount', '#subtotal-amount'], `฿${subtotal.toLocaleString()}`);
        updateElement(['#shipping-cost', '.shipping-amount', '#shipping-amount'], shipping === 0 ? 'FREE' : `฿${shipping}`);
        updateElement(['#tax-amount', '.tax-amount', '#tax'], `฿${tax.toLocaleString()}`);
        
        // Add #final-total to the total selectors
        updateElement(['#order-total', '.total-amount', '#final-total', '#total'], `฿${total.toLocaleString()}`);
        
        // Show/hide discount row
        const discountRow = document.getElementById('discount-row');
        const discountAmount = document.getElementById('discount-amount');
        
        if (discount > 0 && discountRow) {
            discountRow.style.display = 'flex';
            if (discountAmount) {
                discountAmount.textContent = `-฿${Math.round(discount).toLocaleString()}`;
            }
        } else if (discountRow) {
            discountRow.style.display = 'none';
        }
    
        console.log('Updated final-total element:', document.getElementById('final-total')); // Debug
    }

    function updateElement(selectors, value) {
        let found = false;
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                console.log(`Updating ${selector} with value:`, value); // Debug
                element.textContent = value;
                found = true;
                break;
            }
        }
        if (!found) {
            console.log('No element found for selectors:', selectors); // Debug
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
    }

    function setupShippingOptions() {
        const shippingOptions = document.querySelectorAll('input[name="shipping"]');
        shippingOptions.forEach(option => {
            option.addEventListener('change', function() {
                const cost = parseInt(this.dataset.cost) || 0;
                checkoutData.shipping = cost;
                calculateTotals();
            });
        });
    }

    function setupPaymentOptions() {
        const paymentOptions = document.querySelectorAll('input[name="payment-method"]');
        paymentOptions.forEach(option => {
            option.addEventListener('change', function() {
                // Handle payment method specific logic
                console.log('Payment method selected:', this.value);
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
            'newcustomer': { type: 'percentage', value: 0.20, description: '20% off your order' },
            'freeship': { type: 'shipping', value: 0, description: 'Free shipping' }
        };

        const discount = validCodes[code];
        if (discount) {
            if (discount.type === 'percentage') {
                checkoutData.discount = checkoutData.subtotal * discount.value;
            } else if (discount.type === 'shipping') {
                checkoutData.shipping = 0;
            }
            
            // Save to localStorage
            localStorage.setItem('gaojie_promo', JSON.stringify({
                code: code,
                discount: discount.type === 'percentage' ? discount.value : 0
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
        const form = document.getElementById('checkout-form');
        if (form) {
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                if (validateAllSteps()) {
                    // Show loading state
                    const submitBtn = document.querySelector('.final-submit-btn');
                    if (submitBtn) {
                        const originalText = submitBtn.innerHTML;
                        submitBtn.innerHTML = `
                            <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-opacity="0.3"/>
                                <path fill="currentColor" d="M4 12a8 8 0 0 1 8-8v8H4z" stroke="currentColor" stroke-width="4"/>
                            </svg>
                            Processing Order...
                        `;
                        submitBtn.disabled = true;
                    }

                    // Submit order to Python backend
                    try {
                        const response = await fetch('/api/orders/create', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                items: getCartItems(),
                                shipping_info: getShippingInfo(),
                                payment_method: getSelectedPaymentMethod(),
                                notes: document.getElementById('order-notes')?.value || ''
                            })
                        });

                        const result = await response.json();
                        
                        if (result.status === 'success') {
                            // Clear cart and redirect to success page
                            clearCart();
                            window.location.href = `/order-confirmation?order=${result.order.order_number}`;
                        } else {
                            showError(result.message);
                            // Reset button
                            if (submitBtn) {
                                submitBtn.innerHTML = originalText;
                                submitBtn.disabled = false;
                            }
                        }
                    } catch (error) {
                        showError('Order submission failed. Please try again.');
                        // Reset button
                        if (submitBtn) {
                            submitBtn.innerHTML = originalText;
                            submitBtn.disabled = false;
                        }
                    }
                }
            });
        }
    }

    function validateAllSteps() {
        let allValid = true;
        
        document.querySelectorAll('.checkout-step').forEach(step => {
            const requiredFields = step.querySelectorAll('input[required], select[required]');
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    showFieldError(field, 'This field is required');
                    allValid = false;
                }
            });
        });
        
        return allValid;
    }

    // Helper functions (same as in cart.js)
    function getCartItems() {
        return checkoutData.cart.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            variant_id: item.variant_id || null
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

    function getSelectedPaymentMethod() {
        const paymentRadio = document.querySelector('input[name="payment-method"]:checked');
        return paymentRadio ? paymentRadio.value : 'credit_card';
    }

    function clearCart() {
        localStorage.removeItem('gaojie_cart');
        localStorage.removeItem('gaojie_promo');
    }

    function showError(message) {
        showNotification(message, 'error');
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
        if (window.location.search.includes('demo=true')) {
            setTimeout(() => {
                document.getElementById('email').value = 'demo@example.com';
                document.getElementById('first-name').value = 'Demo';
                document.getElementById('last-name').value = 'User';
                document.getElementById('phone').value = '+66 12 345 6789';
                document.getElementById('address').value = '123 Demo Street';
                document.getElementById('city').value = 'Bangkok';
                document.getElementById('postal-code').value = '10110';
                document.getElementById('province').value = 'bangkok';
            }, 500);
        }
    }
});