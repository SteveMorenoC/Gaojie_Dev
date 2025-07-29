// Authentication functionality for GAOJIE Skincare

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }
    
    async init() {
        // Check if user is already logged in
        await this.checkAuthStatus();
        this.setupEventListeners();
        this.updateUI();
    }
    
    // Check current authentication status
    async checkAuthStatus() {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/check`, {
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                this.isAuthenticated = data.authenticated;
                this.currentUser = data.user;
                return data;
            }
            
        } catch (error) {
            console.error('Auth check failed:', error);
            this.isAuthenticated = false;
            this.currentUser = null;
        }
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
    
    updateHeaderActions() {
        const headerActions = document.querySelector('.header-actions');
        if (!headerActions) return;
        
        // Remove existing auth buttons
        const existingAuthButtons = headerActions.querySelectorAll('.auth-btn, .user-menu');
        existingAuthButtons.forEach(btn => btn.remove());
        
        if (this.isAuthenticated && this.currentUser) {
            // Show user menu
            const userMenu = document.createElement('div');
            userMenu.className = 'user-menu';
            userMenu.innerHTML = `
                <button class="user-btn auth-btn" aria-label="User menu">
                    <span class="user-name">Hi, ${this.currentUser.first_name}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </button>
                <div class="user-dropdown" style="display: none;">
                    <a href="#" class="dropdown-item" data-action="profile">My Profile</a>
                    <a href="#" class="dropdown-item" data-action="orders">My Orders</a>
                    <a href="#" class="dropdown-item" data-action="logout">Logout</a>
                </div>
            `;
            
            // Insert before the influencers link
            const influencerLink = headerActions.querySelector('.influencer-link');
            if (influencerLink) {
                headerActions.insertBefore(userMenu, influencerLink);
            } else {
                headerActions.appendChild(userMenu);
            }
            
        } else {
            // Show login/register buttons
            const authButtons = document.createElement('div');
            authButtons.className = 'auth-buttons';
            authButtons.innerHTML = `
                <button class="login-btn auth-btn" data-action="login">Login</button>
                <button class="register-btn auth-btn" data-action="register">Register</button>
            `;
            
            // Insert before the influencers link
            const influencerLink = headerActions.querySelector('.influencer-link');
            if (influencerLink) {
                headerActions.insertBefore(authButtons, influencerLink);
            } else {
                headerActions.appendChild(authButtons);
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
        
        // Handle user menu toggle
        document.addEventListener('click', (e) => {
            if (e.target.closest('.user-btn')) {
                e.preventDefault();
                const dropdown = e.target.closest('.user-menu').querySelector('.user-dropdown');
                dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
            } else {
                // Close dropdown when clicking outside
                const dropdowns = document.querySelectorAll('.user-dropdown');
                dropdowns.forEach(dropdown => dropdown.style.display = 'none');
            }
        });
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
        // Use the existing notification system
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            console.log(`${type}: ${message}`);
        }
    }
}

// Initialize auth manager when DOM is loaded
let authManager;
document.addEventListener('DOMContentLoaded', () => {
    authManager = new AuthManager();
});

// Make auth manager globally available
window.authManager = authManager;