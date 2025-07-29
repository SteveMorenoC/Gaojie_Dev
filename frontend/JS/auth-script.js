// Authentication Pages JavaScript

document.addEventListener('DOMContentLoaded', function() {
    
    // ===== LOGIN PAGE FUNCTIONALITY =====
    const loginForm = document.querySelector('.login-form-container');
    const loginSubmitBtn = document.querySelector('.login-submit-btn');
    const loginInputs = document.querySelectorAll('.login-input');

    if (loginForm && loginSubmitBtn) {
        // Login form submission
        loginSubmitBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleLoginSubmit();
        });

        // Real-time validation for login inputs
        loginInputs.forEach(input => {
            input.addEventListener('input', function() {
                validateLoginInput(this);
            });
        });
    }

    // ===== REGISTER PAGE FUNCTIONALITY =====
    const registerForm = document.querySelector('.register-form-container');
    const registerSubmitBtn = document.querySelector('.register-submit-btn');
    const registerInputs = document.querySelectorAll('.register-input');
    const passwordInputs = document.querySelectorAll('input[type="password"]');

    if (registerForm && registerSubmitBtn) {
        // Register form submission
        registerSubmitBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleRegisterSubmit();
        });

        // Real-time validation for register inputs
        registerInputs.forEach(input => {
            input.addEventListener('input', function() {
                validateRegisterInput(this);
            });
        });

        // Password confirmation validation
        if (passwordInputs.length >= 2) {
            passwordInputs[1].addEventListener('input', function() {
                validatePasswordMatch();
            });
        }
    }

    // ===== FORGOT PASSWORD PAGE FUNCTIONALITY =====
    const forgotForm = document.querySelector('.forgot-form-container');
    const forgotSubmitBtn = document.querySelector('.forgot-submit-btn');
    const forgotInput = document.querySelector('.forgot-input');

    if (forgotForm && forgotSubmitBtn) {
        // Forgot password form submission
        forgotSubmitBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleForgotPasswordSubmit();
        });

        // Real-time validation for forgot password input
        if (forgotInput) {
            forgotInput.addEventListener('input', function() {
                validateForgotPasswordInput(this);
            });
        }
    }

    // ===== VALIDATION FUNCTIONS =====

    function validateLoginInput(input) {
        const value = input.value.trim();
        
        if (input.type === 'email') {
            if (value && !isValidEmail(value)) {
                setInputError(input, 'Please enter a valid email address');
                return false;
            }
        }
        
        if (input.type === 'password') {
            if (value && value.length < 6) {
                setInputError(input, 'Password must be at least 6 characters');
                return false;
            }
        }
        
        setInputSuccess(input);
        return true;
    }

    function validateRegisterInput(input) {
        const value = input.value.trim();
        
        if (input.type === 'text') {
            if (value && value.length < 2) {
                setInputError(input, 'Name must be at least 2 characters');
                return false;
            }
        }
        
        if (input.type === 'email') {
            if (value && !isValidEmail(value)) {
                setInputError(input, 'Please enter a valid email address');
                return false;
            }
        }
        
        if (input.type === 'password') {
            if (value && value.length < 8) {
                setInputError(input, 'Password must be at least 8 characters');
                return false;
            }
        }
        
        setInputSuccess(input);
        return true;
    }

    function validateForgotPasswordInput(input) {
        const value = input.value.trim();
        
        if (value && !isValidEmail(value)) {
            setInputError(input, 'Please enter a valid email address');
            return false;
        }
        
        setInputSuccess(input);
        return true;
    }

    function validatePasswordMatch() {
        const passwords = document.querySelectorAll('input[type="password"]');
        if (passwords.length >= 2) {
            const password = passwords[0].value;
            const confirmPassword = passwords[1].value;
            
            if (confirmPassword && password !== confirmPassword) {
                setInputError(passwords[1], 'Passwords do not match');
                return false;
            }
            
            if (confirmPassword) {
                setInputSuccess(passwords[1]);
            }
            return true;
        }
    }

    function setInputError(input, message) {
        input.style.borderColor = '#dc3545';
        input.style.backgroundColor = '#fff5f5';
        
        // Remove existing error message
        const existingError = input.parentNode.querySelector('.auth-error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'auth-error-message';
        errorDiv.style.color = '#dc3545';
        errorDiv.style.fontSize = '14px';
        errorDiv.style.marginTop = '4px';
        errorDiv.style.marginBottom = '8px';
        errorDiv.textContent = message;
        input.parentNode.insertBefore(errorDiv, input.nextSibling);
    }

    function setInputSuccess(input) {
        input.style.borderColor = '#28a745';
        input.style.backgroundColor = '#f8fff9';
        
        // Remove existing error message
        const existingError = input.parentNode.querySelector('.auth-error-message');
        if (existingError) {
            existingError.remove();
        }
    }

    function resetInputStyle(input) {
        input.style.borderColor = '#e5e5e5';
        input.style.backgroundColor = 'white';
        
        // Remove existing error message
        const existingError = input.parentNode.querySelector('.auth-error-message');
        if (existingError) {
            existingError.remove();
        }
    }

    // ===== FORM SUBMISSION HANDLERS =====

    function handleLoginSubmit() {
        const emailInput = document.querySelector('.login-input[type="email"]');
        const passwordInput = document.querySelector('.login-input[type="password"]');
        
        let isValid = true;
        
        // Validate email
        if (!emailInput.value.trim()) {
            setInputError(emailInput, 'Email is required');
            isValid = false;
        } else if (!isValidEmail(emailInput.value.trim())) {
            setInputError(emailInput, 'Please enter a valid email address');
            isValid = false;
        }
        
        // Validate password
        if (!passwordInput.value) {
            setInputError(passwordInput, 'Password is required');
            isValid = false;
        }
        
        if (isValid) {
            // Show loading state
            loginSubmitBtn.textContent = 'Signing In...';
            loginSubmitBtn.disabled = true;
            
            // Simulate login process
            setTimeout(() => {
                showSuccessMessage('Login successful! Redirecting...');
                // Here you would typically redirect or make an API call
                // window.location.href = '/dashboard';
            }, 1500);
        }
    }

    function handleRegisterSubmit() {
        const inputs = document.querySelectorAll('.register-input');
        const termsCheckbox = document.querySelector('.register-terms input[type="checkbox"]');
        
        let isValid = true;
        
        // Validate all inputs
        inputs.forEach(input => {
            if (!input.value.trim()) {
                setInputError(input, 'This field is required');
                isValid = false;
            } else {
                const inputValid = validateRegisterInput(input);
                if (!inputValid) isValid = false;
            }
        });
        
        // Validate password match
        if (!validatePasswordMatch()) {
            isValid = false;
        }
        
        // Validate terms checkbox
        if (!termsCheckbox.checked) {
            showErrorMessage('Please agree to the Terms of Service and Privacy Policy');
            isValid = false;
        }
        
        if (isValid) {
            // Show loading state
            registerSubmitBtn.textContent = 'Creating Account...';
            registerSubmitBtn.disabled = true;
            
            // Simulate registration process
            setTimeout(() => {
                showSuccessMessage('Account created successfully! Welcome to GAOJIE!');
                // Here you would typically redirect or make an API call
                // window.location.href = '/welcome';
            }, 2000);
        }
    }

    function handleForgotPasswordSubmit() {
        const emailInput = document.querySelector('.forgot-input');
        
        let isValid = true;
        
        if (!emailInput.value.trim()) {
            setInputError(emailInput, 'Email is required');
            isValid = false;
        } else if (!isValidEmail(emailInput.value.trim())) {
            setInputError(emailInput, 'Please enter a valid email address');
            isValid = false;
        }
        
        if (isValid) {
            // Show loading state
            forgotSubmitBtn.textContent = 'Sending Reset Link...';
            forgotSubmitBtn.disabled = true;
            
            // Simulate email sending process
            setTimeout(() => {
                showSuccessMessage('Password reset link sent! Check your email.');
                // Here you would typically make an API call to send reset email
            }, 1500);
        }
    }

    // ===== UTILITY FUNCTIONS =====

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function showSuccessMessage(message) {
        showMessage(message, 'success');
    }

    function showErrorMessage(message) {
        showMessage(message, 'error');
    }

    function showMessage(message, type) {
        // Remove existing messages
        const existingMessage = document.querySelector('.auth-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = 'auth-message';
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            max-width: 400px;
            word-wrap: break-word;
            animation: slideInRight 0.3s ease-out;
            ${type === 'success' ? 'background: #28a745;' : 'background: #dc3545;'}
        `;
        messageDiv.textContent = message;
        
        // Add animation keyframes
        if (!document.querySelector('#auth-message-styles')) {
            const styles = document.createElement('style');
            styles.id = 'auth-message-styles';
            styles.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(messageDiv);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => {
                    if (messageDiv.parentNode) {
                        messageDiv.remove();
                    }
                }, 300);
            }
        }, 5000);
        
        // Allow manual close on click
        messageDiv.addEventListener('click', () => {
            messageDiv.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 300);
        });
    }

    // ===== ENHANCED USER EXPERIENCE =====
    
    // Auto-focus first input on page load
    const firstInput = document.querySelector('.login-input, .register-input, .forgot-input');
    if (firstInput) {
        setTimeout(() => {
            firstInput.focus();
        }, 100);
    }
    
    // Enter key submission
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            if (loginSubmitBtn && document.contains(loginSubmitBtn)) {
                loginSubmitBtn.click();
            } else if (registerSubmitBtn && document.contains(registerSubmitBtn)) {
                registerSubmitBtn.click();
            } else if (forgotSubmitBtn && document.contains(forgotSubmitBtn)) {
                forgotSubmitBtn.click();
            }
        }
    });
    
    // Clear validation styles when user starts typing
    document.querySelectorAll('.login-input, .register-input, .forgot-input').forEach(input => {
        input.addEventListener('focus', function() {
            if (this.style.borderColor === 'rgb(220, 53, 69)') { // Error state
                resetInputStyle(this);
            }
        });
    });

});

// ===== FORM AUTO-SAVE (Optional Enhancement) =====
function enableAutoSave() {
    const inputs = document.querySelectorAll('.register-input');
    
    inputs.forEach(input => {
        // Load saved data
        const savedValue = localStorage.getItem(`gaojie_form_${input.type}_${input.placeholder}`);
        if (savedValue && input.type !== 'password') {
            input.value = savedValue;
        }
        
        // Save data on input
        input.addEventListener('input', function() {
            if (this.type !== 'password') {
                localStorage.setItem(`gaojie_form_${this.type}_${this.placeholder}`, this.value);
            }
        });
    });
}

// Call auto-save for register page
if (document.querySelector('.register-form-container')) {
    enableAutoSave();
}

// Clear auto-saved data on successful registration
function clearAutoSavedData() {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('gaojie_form_'));
    keys.forEach(key => localStorage.removeItem(key));
}