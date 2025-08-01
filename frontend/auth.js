// Authentication functionality for GAOJIE Skincare
console.log('🔥 AUTH.JS FILE LOADED!');

// API Configuration
const API_BASE_URL = `${window.location.protocol}//${window.location.host}/api`;
console.log('🔥 API_BASE_URL:', API_BASE_URL);

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }
    
    async init() {
        console.log('Auth: init() called');
        console.log('Auth: Current URL:', window.location.href);
        console.log('Auth: Referrer:', document.referrer);
        
        // Check if we just logged in or registered
        const justLoggedIn = sessionStorage.getItem('just_logged_in');
        const justRegistered = sessionStorage.getItem('just_registered');
        const expectingAuth = justLoggedIn || justRegistered || document.referrer.includes('login.html') || document.referrer.includes('register.html');
        
        console.log('Auth: Expecting authentication?', expectingAuth);
        
        // Small delay to ensure DOM is fully ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check authentication with retry if we're expecting to be logged in
        if (expectingAuth) {
            console.log('Auth: Using retry mechanism for expected auth');
            await this.checkAuthStatusWithRetry(5); // More retries for expected auth
        } else {
            await this.checkAuthStatus();
        }
        
        this.setupEventListeners();
        this.updateUI();
        console.log('Auth: init() completed');
    }
    
    async checkAuthStatusWithRetry(maxRetries = 3) {
        console.log('Auth: Starting auth check with retry mechanism');
        
        // Check multiple indicators that we should be authenticated
        const justLoggedIn = sessionStorage.getItem('just_logged_in');
        const justRegistered = sessionStorage.getItem('just_registered');
        const expectingAuth = justLoggedIn || justRegistered || 
                            document.referrer.includes('login.html') || 
                            document.referrer.includes('register.html');
        
        console.log('Auth: Expecting authentication?', expectingAuth);
        console.log('Auth: Just logged in?', !!justLoggedIn);
        console.log('Auth: Just registered?', !!justRegistered);
        
        // Give extra time if we just completed login/registration
        if (justLoggedIn || justRegistered) {
            console.log('Auth: Detected recent login/registration, waiting a bit for session...');
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            console.log(`Auth: Attempt ${attempt}/${maxRetries}`);
            
            try {
                const result = await this.checkAuthStatus();
                
                // If we got a valid response
                if (result && result.status === 'success') {
                    console.log('Auth: Got valid response, authenticated:', result.authenticated);
                    
                    // If authenticated or we're not expecting auth, we're done
                    if (result.authenticated || !expectingAuth) {
                        console.log('Auth: Auth check completed successfully');
                        
                        // Force UI update if we found authentication
                        if (result.authenticated && this.isAuthenticated && this.currentUser) {
                            console.log('Auth: Forcing UI update after successful auth detection');
                            this.updateUI();
                        }
                        
                        // Clear the session flags now that we've processed them
                        if (justLoggedIn || justRegistered) {
                            console.log('Auth: Clearing session storage flags');
                            sessionStorage.removeItem('just_logged_in');
                            sessionStorage.removeItem('just_registered');
                        }
                        
                        return result;
                    }
                    
                    // If we expected auth but didn't get it, retry with longer delay
                    if (expectingAuth && !result.authenticated && attempt < maxRetries) {
                        console.log('Auth: Expected authentication but not found, retrying...');
                        // Use progressively longer delays, especially for recent login/register
                        const baseDelay = (justLoggedIn || justRegistered) ? 1500 : 1000;
                        const delay = attempt <= 2 ? baseDelay : baseDelay * 2;
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }
                }
                
                return result;
                
            } catch (error) {
                console.error(`Auth: Attempt ${attempt} failed:`, error);
                
                // Wait before retrying (except on last attempt)
                if (attempt < maxRetries) {
                    console.log('Auth: Waiting before retry due to error...');
                    const retryDelay = (justLoggedIn || justRegistered) ? 1000 : 800;
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            }
        }
        
        console.log('Auth: All retry attempts exhausted, defaulting to not authenticated');
        return { status: 'success', authenticated: false, user: null };
    }
    
    // Check current authentication status
    async checkAuthStatus() {
        console.log('Auth: Checking auth status...');
        try {
            const response = await fetch(`${API_BASE_URL}/auth/check`, {
                credentials: 'include'
            });
            
            const data = await response.json();
            console.log('Auth: API response:', data);
            
            if (data.status === 'success') {
                this.isAuthenticated = data.authenticated;
                this.currentUser = data.user;
                console.log('Auth: Set isAuthenticated =', this.isAuthenticated);
                console.log('Auth: Set currentUser =', this.currentUser);
                return data;
            }
            
        } catch (error) {
            console.error('Auth check failed:', error);
            // Assume not authenticated if API is down
            this.isAuthenticated = false;
            this.currentUser = null;
        }
        
        // Always return a valid state for UI updates
        return {
            status: 'success',
            authenticated: this.isAuthenticated,
            user: this.currentUser
        };
    }
    
    // Register new user
    async register(userData) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                this.isAuthenticated = true;
                this.currentUser = data.user;
                this.updateUI();
                this.showNotification(data.message, 'success');
                return { success: true, data };
            } else {
                this.showNotification(data.message, 'error');
                return { success: false, error: data.message };
            }
            
        } catch (error) {
            console.error('Registration failed:', error);
            this.showNotification('Registration failed. Please try again.', 'error');
            return { success: false, error: 'Network error' };
        }
    }
    
    // Login user
    async login(credentials) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(credentials)
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                this.isAuthenticated = true;
                this.currentUser = data.user;
                this.updateUI();
                this.showNotification(data.message, 'success');
                return { success: true, data };
            } else {
                this.showNotification(data.message, 'error');
                return { success: false, error: data.message };
            }
            
        } catch (error) {
            console.error('Login failed:', error);
            this.showNotification('Login failed. Please try again.', 'error');
            return { success: false, error: 'Network error' };
        }
    }
    
    // Logout user
    async logout() {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
            
            const data = await response.json();
            
            this.isAuthenticated = false;
            this.currentUser = null;
            this.updateUI();
            this.showNotification(data.message || 'Logged out successfully', 'success');
            
            return { success: true, data };
            
        } catch (error) {
            console.error('Logout failed:', error);
            // Even if logout request fails, clear local state
            this.isAuthenticated = false;
            this.currentUser = null;
            this.updateUI();
            this.showNotification('Logged out', 'success');
            return { success: false, error: 'Network error' };
        }
    }
    
    // Update user profile
    async updateProfile(profileData) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(profileData)
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                this.currentUser = data.user;
                this.updateUI();
                this.showNotification(data.message, 'success');
                return { success: true, data };
            } else {
                this.showNotification(data.message, 'error');
                return { success: false, error: data.message };
            }
            
        } catch (error) {
            console.error('Profile update failed:', error);
            this.showNotification('Profile update failed. Please try again.', 'error');
            return { success: false, error: 'Network error' };
        }
    }
    
    // Change password
    async changePassword(passwordData) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(passwordData)
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                this.showNotification(data.message, 'success');
                return { success: true, data };
            } else {
                this.showNotification(data.message, 'error');
                return { success: false, error: data.message };
            }
            
        } catch (error) {
            console.error('Password change failed:', error);
            this.showNotification('Password change failed. Please try again.', 'error');
            return { success: false, error: 'Network error' };
        }
    }
    
    // Update UI based on authentication status
    updateUI() {
        // Remove any leftover debug elements
        this.removeDebugElements();
        
        // Update header actions
        this.updateHeaderActions();
        
        // Update any user-specific content
        this.updateUserContent();
        
        // Dispatch custom event for other parts of the app
        document.dispatchEvent(new CustomEvent('authStatusChanged', {
            detail: {
                isAuthenticated: this.isAuthenticated,
                user: this.currentUser
            }
        }));
    }
    
    // Remove any debug elements from the page
    removeDebugElements() {
        const debugDiv = document.getElementById('auth-debug');
        if (debugDiv) {
            debugDiv.remove();
        }
    }
    
    updateHeaderActions() {
        console.log('Auth: updateHeaderActions called');
        console.log('Auth: isAuthenticated =', this.isAuthenticated);
        console.log('Auth: currentUser =', this.currentUser);
        
        const authButtons = document.querySelector('.auth-buttons');
        
        if (!authButtons) {
            console.log('Auth: No .auth-buttons found in DOM');
            console.log('Auth: Available elements:', document.querySelectorAll('[class*="auth"]'));
            return;
        }
        
        if (this.isAuthenticated && this.currentUser) {
            console.log('Auth: User is authenticated, hiding auth buttons');
            console.log('Auth: authButtons element:', authButtons);
            console.log('Auth: authButtons.style before:', authButtons.style.cssText);
            
            // Hide auth buttons and show user menu - use multiple methods
            authButtons.style.display = 'none !important';
            authButtons.style.visibility = 'hidden';
            authButtons.style.opacity = '0';
            authButtons.setAttribute('hidden', 'true');
            authButtons.classList.add('auth-hidden');
            
            console.log('Auth: Auth buttons hidden, authButtons.style.display =', authButtons.style.display);
            console.log('Auth: authButtons.style after:', authButtons.style.cssText);
            
            // Check if user menu already exists
            let userMenu = document.querySelector('.user-menu');
            console.log('Auth: Existing user menu found:', !!userMenu);
            if (!userMenu) {
                console.log('Auth: Creating new user menu');
                userMenu = document.createElement('div');
                userMenu.className = 'user-menu';
                userMenu.innerHTML = `
                    <button class="user-btn" aria-label="User menu">
                        <span class="user-name">Hi, ${this.currentUser.first_name}</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </button>
                    <div class="user-dropdown" style="display: none;">
                        <a href="user-orders.html" class="dropdown-item">My Orders</a>
                        <a href="#" class="dropdown-item" data-action="profile">My Profile</a>
                        <a href="#" class="dropdown-item" data-action="logout">Logout</a>
                    </div>
                `;
                
                // Insert after auth buttons
                console.log('Auth: Inserting user menu after auth buttons');
                authButtons.parentNode.insertBefore(userMenu, authButtons.nextSibling);
                console.log('Auth: User menu inserted successfully');
                
                // Setup click handlers for the new user menu
                this.setupUserMenuEvents(userMenu);
            } else {
                console.log('Auth: User menu already exists, updating content and making it visible');
                // Update existing user menu content
                const userNameEl = userMenu.querySelector('.user-name');
                if (userNameEl) {
                    userNameEl.textContent = `Hi, ${this.currentUser.first_name}`;
                }
                userMenu.style.display = 'block';
                userMenu.style.visibility = 'visible';
                userMenu.style.opacity = '1';
                userMenu.removeAttribute('hidden');
            }
        } else {
            // Show auth buttons and hide user menu
            console.log('Auth: User not authenticated, showing auth buttons');
            authButtons.style.display = 'flex';
            authButtons.style.visibility = 'visible';
            authButtons.style.opacity = '1';
            authButtons.removeAttribute('hidden');
            authButtons.classList.remove('auth-hidden');
            
            // Remove user menu if it exists
            const existingUserMenu = document.querySelector('.user-menu');
            if (existingUserMenu) {
                existingUserMenu.remove();
                console.log('Auth: Removed existing user menu');
            }
        }
    }
    
    updateUserContent() {
        // Update any user-specific content on the page
        const userElements = document.querySelectorAll('[data-user-content]');
        userElements.forEach(element => {
            if (this.isAuthenticated && this.currentUser) {
                element.style.display = 'block';
                // Update with user data if needed
                if (element.dataset.userContent === 'name') {
                    element.textContent = this.currentUser.full_name;
                }
            } else {
                element.style.display = 'none';
            }
        });
    }
    
    // Setup event listeners
    setupEventListeners() {
        // Handle auth button clicks
        document.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            
            switch (action) {
                case 'login':
                    this.showLoginModal();
                    break;
                case 'register':
                    this.showRegisterModal();
                    break;
                case 'logout':
                    e.preventDefault();
                    this.logout();
                    break;
                case 'profile':
                    e.preventDefault();
                    this.showProfileModal();
                    break;
            }
        });
        
        // Handle user menu toggle - only for dynamically created menus
        document.addEventListener('click', (e) => {
            // Only handle if it's a dynamically created user menu
            const userBtn = e.target.closest('.user-btn');
            if (userBtn && userBtn.closest('.user-menu')) {
                e.preventDefault();
                const dropdown = userBtn.closest('.user-menu').querySelector('.user-dropdown');
                if (dropdown) {
                    const isVisible = dropdown.style.display !== 'none';
                    dropdown.style.display = isVisible ? 'none' : 'block';
                }
            } else if (!e.target.closest('.user-menu')) {
                // Close dropdown when clicking outside
                const dropdowns = document.querySelectorAll('.user-dropdown');
                dropdowns.forEach(dropdown => dropdown.style.display = 'none');
            }
        });
    }
    
    // Setup events specifically for a user menu
    setupUserMenuEvents(userMenu) {
        const userBtn = userMenu.querySelector('.user-btn');
        const dropdown = userMenu.querySelector('.user-dropdown');
        
        if (userBtn && dropdown) {
            userBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const isVisible = dropdown.style.display !== 'none';
                // Close all other dropdowns first
                document.querySelectorAll('.user-dropdown').forEach(d => d.style.display = 'none');
                // Toggle this dropdown
                dropdown.style.display = isVisible ? 'none' : 'block';
            });
        }
    }
    
    // Show login modal
    showLoginModal() {
        this.showAuthModal('login');
    }
    
    // Show register modal
    showRegisterModal() {
        this.showAuthModal('register');
    }
    
    // Show profile modal
    showProfileModal() {
        if (!this.isAuthenticated) {
            this.showLoginModal();
            return;
        }
        
        // For now, just show a simple alert. Later we can create a proper modal
        this.showNotification('Profile page coming soon!', 'info');
    }
    
    // Generic auth modal
    showAuthModal(type) {
        // Remove existing modal
        const existingModal = document.querySelector('.auth-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'auth-modal';
        modal.innerHTML = this.getModalHTML(type);
        
        document.body.appendChild(modal);
        
        // Setup modal events
        this.setupModalEvents(modal, type);
        
        // Show modal
        setTimeout(() => modal.classList.add('show'), 10);
    }
    
    getModalHTML(type) {
        if (type === 'login') {
            return `
                <div class="modal-overlay">
                    <div class="modal-content">
                        <h2>Welcome Back</h2>
                        <form class="auth-form" data-type="login">
                            <div class="form-group">
                                <label for="login-email">Email</label>
                                <input type="email" id="login-email" name="email" required>
                            </div>
                            <div class="form-group">
                                <label for="login-password">Password</label>
                                <input type="password" id="login-password" name="password" required>
                            </div>
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" name="remember_me">
                                    Remember me
                                </label>
                            </div>
                            <button type="submit" class="submit-btn">Login</button>
                        </form>
                        <p class="switch-auth">
                            Don't have an account? 
                            <a href="#" data-switch="register">Register here</a>
                        </p>
                        <button class="close-modal">&times;</button>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="modal-overlay">
                    <div class="modal-content">
                        <h2>Join GAOJIE</h2>
                        <form class="auth-form" data-type="register">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="register-first-name">First Name</label>
                                    <input type="text" id="register-first-name" name="first_name" required>
                                </div>
                                <div class="form-group">
                                    <label for="register-last-name">Last Name</label>
                                    <input type="text" id="register-last-name" name="last_name" required>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="register-email">Email</label>
                                <input type="email" id="register-email" name="email" required>
                            </div>
                            <div class="form-group">
                                <label for="register-phone">Phone (Optional)</label>
                                <input type="tel" id="register-phone" name="phone">
                            </div>
                            <div class="form-group">
                                <label for="register-password">Password</label>
                                <input type="password" id="register-password" name="password" required>
                                <small>At least 8 characters with uppercase, lowercase, and number</small>
                            </div>
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" name="newsletter">
                                    Subscribe to newsletter for 15% off
                                </label>
                            </div>
                            <button type="submit" class="submit-btn">Create Account</button>
                        </form>
                        <p class="switch-auth">
                            Already have an account? 
                            <a href="#" data-switch="login">Login here</a>
                        </p>
                        <button class="close-modal">&times;</button>
                    </div>
                </div>
            `;
        }
    }
    
    setupModalEvents(modal, type) {
        // Close modal
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        });
        
        // Close on overlay click
        modal.querySelector('.modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                modal.classList.remove('show');
                setTimeout(() => modal.remove(), 300);
            }
        });
        
        // Switch between login/register
        const switchLink = modal.querySelector('[data-switch]');
        if (switchLink) {
            switchLink.addEventListener('click', (e) => {
                e.preventDefault();
                modal.remove();
                this.showAuthModal(switchLink.dataset.switch);
            });
        }
        
        // Handle form submission
        const form = modal.querySelector('.auth-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Convert checkbox values
            data.remember_me = formData.has('remember_me');
            data.newsletter = formData.has('newsletter');
            
            const submitBtn = form.querySelector('.submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Processing...';
            submitBtn.disabled = true;
            
            let result;
            if (type === 'login') {
                result = await this.login(data);
            } else {
                result = await this.register(data);
            }
            
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            
            if (result.success) {
                modal.classList.remove('show');
                setTimeout(() => modal.remove(), 300);
            }
        });
    }
    
    showNotification(message, type = 'info') {
        // Use the GaojieUtils notification system
        if (typeof GaojieUtils !== 'undefined' && GaojieUtils.showNotification) {
            GaojieUtils.showNotification(message, type);
        } else {
            console.log(`${type}: ${message}`);
        }
    }
}

// Initialize auth manager when DOM is loaded
let authManager;

// Function to initialize auth manager
function initializeAuthManager() {
    console.log('Auth: Initializing AuthManager');
    if (!authManager) {
        authManager = new AuthManager();
        // Make auth manager globally available after initialization
        window.authManager = authManager;
        console.log('Auth: AuthManager initialized successfully');
    } else {
        console.log('Auth: AuthManager already exists');
    }
}

// Global function to force auth check and UI update
window.forceAuthUpdate = async function() {
    console.log('=== FORCE AUTH UPDATE CALLED ===');
    if (window.authManager) {
        console.log('AuthManager exists, forcing check and update');
        await window.authManager.checkAuthStatus();
        window.authManager.updateUI();
        console.log('Force update completed');
    } else {
        console.log('AuthManager not found, initializing...');
        initializeAuthManager();
        if (window.authManager) {
            await window.authManager.checkAuthStatus();
            window.authManager.updateUI();
        }
    }
};

document.addEventListener('DOMContentLoaded', initializeAuthManager);

// Also initialize if DOM is already loaded (in case the script loads late)
if (document.readyState === 'loading') {
    // DOM is still loading, event listener will handle it
    console.log('Auth: DOM still loading, waiting for DOMContentLoaded');
} else {
    // DOM already loaded, initialize immediately
    console.log('Auth: DOM already loaded, initializing immediately');
    initializeAuthManager();
}