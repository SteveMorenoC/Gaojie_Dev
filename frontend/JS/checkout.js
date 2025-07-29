// Refined Checkout JavaScript - Conversion Optimized
document.addEventListener('DOMContentLoaded', function() {
    let currentStep = 1;
    let checkoutData = {
        subtotal: 2880,
        shipping: 0,
        tax: 202,
        discount: 0,
        discountCode: null
    };

    // Initialize checkout
    initCheckout();

    function initCheckout() {
        setupFormValidation();
        setupShippingOptions();
        setupPaymentOptions();
        setupPromoCode();
        setupFormSubmission();
        calculateTotals();
        prefillTestData(); // For demo purposes
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
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(field.value)) {
                    showFieldError(field, 'Please enter a valid email');
                    isValid = false;
                }
            }

            // Phone validation
            if (field.type === 'tel' && field.value) {
                const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
                if (!phoneRegex.test(field.value)) {
                    showFieldError(field, 'Please enter a valid phone number');
                    isValid = false;
                }
            }
        });

        if (!isValid) {
            showNotification('Please fill in all required fields correctly', 'error');
        }

        return isValid;
    }

    function showFieldError(field, message) {
        field.style.borderColor = '#ef4444';
        
        let errorEl = field.parentNode.querySelector('.error-message');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'error-message';
            errorEl.style.cssText = `
                color: #ef4444;
                font-size: 0.75rem;
                margin-top: 4px;
            `;
            field.parentNode.appendChild(errorEl);
        }
        errorEl.textContent = message;
    }

    function clearFieldError(field) {
        field.style.borderColor = '';
        const errorEl = field.parentNode.querySelector('.error-message');
        if (errorEl) {
            errorEl.remove();
        }
    }

    // Form Validation with Real-time Feedback
    function setupFormValidation() {
        const inputs = document.querySelectorAll('input, select');
        
        inputs.forEach(input => {
            input.addEventListener('input', function() {
                clearFieldError(this);
                
                // Real-time formatting
                if (this.id === 'card-number') {
                    formatCardNumber(this);
                } else if (this.id === 'expiry') {
                    formatExpiry(this);
                } else if (this.id === 'cvv') {
                    this.value = this.value.replace(/\D/g, '').substring(0, 4);
                } else if (this.id === 'phone') {
                    formatPhoneNumber(this);
                }
            });

            input.addEventListener('blur', function() {
                if (this.hasAttribute('required') && !this.value.trim()) {
                    showFieldError(this, 'This field is required');
                }
            });
        });
    }

    function formatCardNumber(input) {
        let value = input.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
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

    function formatPhoneNumber(input) {
        let value = input.value.replace(/\D/g, '');
        if (value.startsWith('66')) {
            value = '+' + value;
        } else if (value.startsWith('0')) {
            value = '+66' + value.substring(1);
        }
        input.value = value;
    }

    // Shipping Options
    function setupShippingOptions() {
        const shippingOptions = document.querySelectorAll('input[name="shipping"]');
        
        shippingOptions.forEach(option => {
            option.addEventListener('change', function() {
                const cost = parseInt(this.closest('.shipping-option').dataset.cost) || 0;
                checkoutData.shipping = cost;
                calculateTotals();
                
                const methodName = this.closest('.shipping-option').querySelector('.option-name').textContent;
                showNotification(`Shipping updated to ${methodName}`, 'success');
            });
        });
    }

    // Payment Options
    function setupPaymentOptions() {
        const paymentOptions = document.querySelectorAll('input[name="payment"]');
        const cardForm = document.getElementById('card-form');
        
        paymentOptions.forEach(option => {
            option.addEventListener('change', function() {
                // Show/hide card form
                if (this.value === 'card') {
                    cardForm.classList.add('active');
                } else {
                    cardForm.classList.remove('active');
                }
                
                const methodName = this.closest('.payment-option').querySelector('.option-name').textContent;
                showNotification(`Payment method set to ${methodName}`, 'success');
            });
        });
    }

    // Promo Code
    function setupPromoCode() {
        const promoInput = document.getElementById('promo-input');
        const applyBtn = document.getElementById('apply-promo');

        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                applyPromoCode(promoInput.value.trim().toLowerCase());
            });
        }

        if (promoInput) {
            promoInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    applyPromoCode(promoInput.value.trim().toLowerCase());
                }
            });
        }
    }

    function applyPromoCode(code) {
        const validCodes = {
            'welcome15': { type: 'percentage', value: 0.15, description: '15% off' },
            'save200': { type: 'fixed', value: 200, description: '฿200 off' },
            'newcustomer': { type: 'percentage', value: 0.20, description: '20% off' },
            'freeship': { type: 'shipping', value: 0, description: 'Free shipping' }
        };

        if (validCodes[code]) {
            const discount = validCodes[code];
            checkoutData.discountCode = code;
            
            if (discount.type === 'percentage') {
                checkoutData.discount = checkoutData.subtotal * discount.value;
            } else if (discount.type === 'fixed') {
                checkoutData.discount = discount.value;
            } else if (discount.type === 'shipping') {
                checkoutData.shipping = 0;
                document.querySelector('input[name="shipping"]:checked').closest('.shipping-option').dataset.cost = '0';
            }
            
            calculateTotals();
            showDiscountApplied(discount.description);
            showNotification(`Promo code applied: ${discount.description}`, 'success');
            
            // Clear input
            document.getElementById('promo-input').value = '';
        } else {
            showNotification('Invalid promo code', 'error');
        }
    }

    function showDiscountApplied(description) {
        const discountRow = document.getElementById('discount-row');
        const discountAmount = document.getElementById('discount-amount');
        
        if (checkoutData.discount > 0) {
            discountRow.style.display = 'flex';
            discountAmount.textContent = `-฿${Math.round(checkoutData.discount).toLocaleString()}`;
        }
    }

    // Calculate and Update Totals
    function calculateTotals() {
        const subtotal = checkoutData.subtotal;
        const discount = checkoutData.discount;
        const shipping = checkoutData.shipping;
        const discountedSubtotal = subtotal - discount;
        const tax = Math.round(discountedSubtotal * 0.07); // 7% VAT in Thailand
        const total = discountedSubtotal + shipping + tax;

        // Update DOM
        document.getElementById('subtotal').textContent = `฿${subtotal.toLocaleString()}`;
        document.getElementById('shipping-cost').textContent = shipping === 0 ? 'Free' : `฿${shipping.toLocaleString()}`;
        document.getElementById('tax-amount').textContent = `฿${tax.toLocaleString()}`;
        document.getElementById('final-total').textContent = `฿${total.toLocaleString()}`;

        // Update discount row
        if (discount > 0) {
            document.getElementById('discount-row').style.display = 'flex';
            document.getElementById('discount-amount').textContent = `-฿${Math.round(discount).toLocaleString()}`;
        }

        // Update checkout data
        checkoutData.tax = tax;
    }

    // Form Submission
    function setupFormSubmission() {
        const completeBtn = document.getElementById('complete-order');
        
        if (completeBtn) {
            completeBtn.addEventListener('click', function(e) {
                e.preventDefault();
                
                if (!validateCurrentStep()) {
                    return;
                }

                // Add loading state
                this.classList.add('loading');
                this.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-opacity="0.3"/>
                        <path fill="currentColor" d="M4 12a8 8 0 0 1 8-8v8H4z"/>
                    </svg>
                    Processing Order...
                `;
                this.disabled = true;

                // Simulate processing
                setTimeout(() => {
                    showNotification('Order placed successfully! Redirecting...', 'success');
                    
                    // Would redirect to success page in real implementation
                    setTimeout(() => {
                        alert('Order completed! (This would redirect to a success page)');
                        // Reset for demo
                        location.reload();
                    }, 2000);
                }, 3000);
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
            z-index: 1000;
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

    // Auto-fill for demo/testing
    function prefillTestData() {
        // Only enable in development or when query param is present
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

    // Auto-save form progress (in memory only)
    let formProgress = {};
    
    function saveFormProgress() {
        const inputs = document.querySelectorAll('input, select');
        inputs.forEach(input => {
            if (input.id && input.value) {
                formProgress[input.id] = input.value;
            }
        });
    }

    // Save progress on input changes
    document.addEventListener('input', saveFormProgress);
    document.addEventListener('change', saveFormProgress);

    // Accessibility improvements
    function setupAccessibility() {
        // Add ARIA labels
        document.querySelectorAll('.checkout-step').forEach((step, index) => {
            step.setAttribute('aria-labelledby', `step-${index + 1}-header`);
            const header = step.querySelector('h2');
            if (header) {
                header.id = `step-${index + 1}-header`;
            }
        });

        // Keyboard navigation for custom radio buttons
        document.querySelectorAll('.shipping-option, .payment-option').forEach(option => {
            option.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const radio = this.querySelector('input[type="radio"]');
                    if (radio) {
                        radio.checked = true;
                        radio.dispatchEvent(new Event('change'));
                    }
                }
            });
        });
    }

    setupAccessibility();

    // Page visibility API for form data persistence
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'hidden') {
            saveFormProgress();
        }
    });

    // Track conversion funnel (analytics placeholder)
    function trackStep(step) {
        // In real implementation, send to analytics
        console.log(`Checkout step ${step} reached`);
        
        // Google Analytics 4 example:
        // gtag('event', 'begin_checkout', {
        //     currency: 'THB',
        //     value: checkoutData.subtotal,
        //     items: [...] // product items
        // });
    }

    // Track initial page load
    trackStep(1);

    // Support link functionality
    const supportLinks = document.querySelectorAll('.support-link');
    supportLinks.forEach(link => {
        if (link.getAttribute('href').startsWith('tel:')) {
            link.addEventListener('click', function() {
                showNotification('Calling customer support...', 'info');
            });
        }
    });
});