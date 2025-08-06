// Category Page JavaScript - Enhanced with Conversion Optimization

class CategoryPage {
    constructor() {
        this.filters = {
            skinType: [],
            ingredient: [],
            size: [],
            priceMin: 0,
            priceMax: 3000
        };
        this.currentSort = 'featured';
        this.cart = JSON.parse(localStorage.getItem('gaojie_cart') || '[]');
        this.isFiltersOpen = false;
        this.products = [];
        this.filteredProducts = [];
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadProducts();
        this.updateCartCount();
        this.handleURLParams();
        this.initMobileMenu();
    }

    bindEvents() {
        // Filter events
        const filtersToggle = document.getElementById('filters-toggle');
        const filtersClose = document.getElementById('filters-close');
        const filtersSidebar = document.getElementById('filters-sidebar');
        const clearFilters = document.getElementById('clear-filters');
        const applyFilters = document.getElementById('apply-filters');

        filtersToggle?.addEventListener('click', () => this.toggleFilters());
        filtersClose?.addEventListener('click', () => this.closeFilters());
        clearFilters?.addEventListener('click', () => this.clearAllFilters());
        applyFilters?.addEventListener('click', () => this.applyFilters());

        // Sort events
        const sortSelect = document.getElementById('sort-select');
        sortSelect?.addEventListener('change', (e) => this.handleSort(e.target.value));

        // Filter checkboxes
        document.querySelectorAll('input[data-filter]').forEach(input => {
            input.addEventListener('change', () => this.handleFilterChange());
        });

        // Price range
        const priceRange = document.getElementById('price-range');
        const priceMin = document.getElementById('price-min');
        const priceMax = document.getElementById('price-max');

        priceRange?.addEventListener('input', (e) => this.handlePriceRange(e.target.value));
        priceMin?.addEventListener('change', (e) => this.handlePriceInput('min', e.target.value));
        priceMax?.addEventListener('change', (e) => this.handlePriceInput('max', e.target.value));

        // Product actions
        document.addEventListener('click', (e) => this.handleProductActions(e));

        // Modal events
        const modal = document.getElementById('quick-view-modal');
        const modalOverlay = document.getElementById('modal-overlay');
        const modalClose = document.getElementById('modal-close');

        modalOverlay?.addEventListener('click', () => this.closeModal());
        modalClose?.addEventListener('click', () => this.closeModal());

        // Load more
        const loadMore = document.getElementById('load-more');
        loadMore?.addEventListener('click', () => this.loadMoreProducts());

        // Close filters when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isFiltersOpen && !filtersSidebar?.contains(e.target) && !filtersToggle?.contains(e.target)) {
                this.closeFilters();
            }
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeFilters();
                this.closeModal();
            }
        });
    }

    initMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mainNav = document.getElementById('main-nav');

        mobileMenuToggle?.addEventListener('click', () => {
            mainNav?.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
        });
    }

    loadProducts() {
        // In a real app, this would be an API call
        this.products = this.getAllProductsFromDOM();
        this.filteredProducts = [...this.products];
        this.updateProductsDisplay();
    }

    getAllProductsFromDOM() {
        const productCards = document.querySelectorAll('.category-product-card');
        return Array.from(productCards).map(card => ({
            id: card.querySelector('.add-to-cart-btn')?.dataset.product,
            element: card,
            title: card.querySelector('.product-title')?.textContent,
            price: parseInt(card.dataset.price) || 0,
            skinType: card.dataset.skinType?.split(',') || [],
            ingredient: card.dataset.ingredient?.split(',') || [],
            size: card.dataset.size,
            rating: parseFloat(card.querySelector('.stars')?.textContent) || 0,
            isNew: card.querySelector('.badge-new') !== null,
            isBestseller: card.querySelector('.badge-bestseller') !== null
        }));
    }

    toggleFilters() {
        const sidebar = document.getElementById('filters-sidebar');
        this.isFiltersOpen = !this.isFiltersOpen;
        
        if (this.isFiltersOpen) {
            sidebar?.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            sidebar?.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    closeFilters() {
        const sidebar = document.getElementById('filters-sidebar');
        this.isFiltersOpen = false;
        sidebar?.classList.remove('active');
        document.body.style.overflow = '';
    }

    handleFilterChange() {
        // Reset filters
        this.filters = {
            skinType: [],
            ingredient: [],
            size: [],
            priceMin: this.filters.priceMin,
            priceMax: this.filters.priceMax
        };

        // Collect checked filters
        document.querySelectorAll('input[data-filter]:checked').forEach(input => {
            const filterType = input.dataset.filter;
            const value = input.value;

            if (this.filters[filterType]) {
                this.filters[filterType].push(value);
            }
        });

        this.updateActiveFiltersCount();
    }

    handlePriceRange(value) {
        this.filters.priceMax = parseInt(value);
        document.getElementById('price-max').value = value;
        this.updateActiveFiltersCount();
    }

    handlePriceInput(type, value) {
        const numValue = parseInt(value) || 0;
        if (type === 'min') {
            this.filters.priceMin = numValue;
        } else {
            this.filters.priceMax = numValue;
            document.getElementById('price-range').value = numValue;
        }
        this.updateActiveFiltersCount();
    }

    updateActiveFiltersCount() {
        const activeCount = this.getActiveFiltersCount();
        const countElement = document.getElementById('active-filters');
        
        if (countElement) {
            countElement.textContent = activeCount;
            countElement.classList.toggle('show', activeCount > 0);
        }
    }

    getActiveFiltersCount() {
        let count = 0;
        count += this.filters.skinType.length;
        count += this.filters.ingredient.length;
        count += this.filters.size.length;
        
        if (this.filters.priceMin > 0 || this.filters.priceMax < 3000) {
            count += 1;
        }
        
        return count;
    }

    clearAllFilters() {
        // Reset filter object
        this.filters = {
            skinType: [],
            ingredient: [],
            size: [],
            priceMin: 0,
            priceMax: 3000
        };

        // Uncheck all checkboxes
        document.querySelectorAll('input[data-filter]').forEach(input => {
            input.checked = false;
        });

        // Reset price inputs
        document.getElementById('price-min').value = '';
        document.getElementById('price-max').value = '';
        document.getElementById('price-range').value = 3000;

        this.updateActiveFiltersCount();
        this.applyFilters();
    }

    applyFilters() {
        this.filteredProducts = this.products.filter(product => {
            // Skin type filter
            if (this.filters.skinType.length > 0) {
                const hasMatchingSkinType = this.filters.skinType.some(type => 
                    product.skinType.includes(type)
                );
                if (!hasMatchingSkinType) return false;
            }

            // Ingredient filter
            if (this.filters.ingredient.length > 0) {
                const hasMatchingIngredient = this.filters.ingredient.some(ingredient => 
                    product.ingredient.includes(ingredient)
                );
                if (!hasMatchingIngredient) return false;
            }

            // Size filter
            if (this.filters.size.length > 0) {
                if (!this.filters.size.includes(product.size)) return false;
            }

            // Price filter
            if (product.price < this.filters.priceMin || product.price > this.filters.priceMax) {
                return false;
            }

            return true;
        });

        this.sortProducts();
        this.updateProductsDisplay();
        this.closeFilters();
        this.updateURL();
    }

    handleSort(sortValue) {
        this.currentSort = sortValue;
        this.sortProducts();
        this.updateProductsDisplay();
    }

    sortProducts() {
        switch (this.currentSort) {
            case 'price-low':
                this.filteredProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                this.filteredProducts.sort((a, b) => b.price - a.price);
                break;
            case 'rating':
                this.filteredProducts.sort((a, b) => b.rating - a.rating);
                break;
            case 'newest':
                this.filteredProducts.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
                break;
            case 'bestselling':
                this.filteredProducts.sort((a, b) => (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0));
                break;
            default: // featured
                // Keep original order or implement custom featured logic
                break;
        }
    }

    updateProductsDisplay() {
        const grid = document.getElementById('products-grid');
        const resultsCount = document.querySelector('.results-count');

        if (grid) {
            // Hide all products first
            this.products.forEach(product => {
                product.element.style.display = 'none';
            });

            // Show filtered products
            this.filteredProducts.forEach((product, index) => {
                product.element.style.display = 'block';
                product.element.style.order = index;
                product.element.classList.add('fade-in');
            });
        }

        if (resultsCount) {
            resultsCount.innerHTML = `Showing <strong>${this.filteredProducts.length}</strong> products`;
        }

        // Update load more button visibility
        this.updateLoadMoreButton();
    }

    updateLoadMoreButton() {
        const loadMoreBtn = document.getElementById('load-more');
        // In a real app, you'd check if there are more products to load from the server
        if (loadMoreBtn) {
            loadMoreBtn.style.display = 'none'; // Hide for now since we're showing all products
        }
    }

    handleProductActions(e) {
        const target = e.target.closest('button');
        if (!target) return;

        if (target.classList.contains('quick-view-btn')) {
            const productId = target.dataset.product;
            this.openQuickView(productId);
        } else if (target.classList.contains('add-to-cart-btn')) {
            const productId = target.dataset.product;
            this.addToCart(productId, target);
        }
    }

    openQuickView(productId) {
        const modal = document.getElementById('quick-view-modal');
        const modalBody = document.getElementById('modal-body');

        // Find product data
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        // Create quick view content
        modalBody.innerHTML = this.generateQuickViewHTML(product);

        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Bind quick view events
        this.bindQuickViewEvents(productId);
    }

    generateQuickViewHTML(product) {
        return `
            <div class="quick-view-content">
                <div class="quick-view-grid">
                    <div class="quick-view-images">
                        <img src="${product.element.querySelector('.product-image').src}" alt="${product.title}" class="quick-view-main-image">
                    </div>
                    <div class="quick-view-info">
                        <h2 class="quick-view-title">${product.title}</h2>
                        <div class="quick-view-rating">
                            <span class="stars">${product.rating}★</span>
                            <span class="rating-text">(${Math.floor(Math.random() * 200) + 50} reviews)</span>
                        </div>
                        <div class="quick-view-price">
                            <span class="price-current">฿${product.price.toLocaleString()}</span>
                        </div>
                        <div class="quick-view-description">
                            <p>Experience the perfect balance of gentle cleansing and nourishing care with our scientifically formulated cleanser.</p>
                        </div>
                        <div class="quick-view-features">
                            <h4>Key Benefits:</h4>
                            <ul>
                                <li>Gentle yet effective cleansing</li>
                                <li>Maintains skin's natural pH balance</li>
                                <li>Suitable for daily use</li>
                                <li>Dermatologist tested</li>
                            </ul>
                        </div>
                        <div class="quick-view-actions">
                            <button class="add-to-cart-btn-modal" data-product="${product.id}">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M3 7H13L12 13H4L3 7Z" stroke="currentColor" stroke-width="1.5"/>
                                    <path d="M6 7V5C6 3.9 6.9 3 8 3S10 3.9 10 5V7" stroke="currentColor" stroke-width="1.5"/>
                                </svg>
                                Add to Cart - ฿${product.price.toLocaleString()}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <style>
                .quick-view-content { padding: 0; }
                .quick-view-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
                .quick-view-main-image { width: 100%; height: 400px; object-fit: cover; border-radius: 8px; }
                .quick-view-title { font-size: 1.5rem; font-weight: 600; margin-bottom: 1rem; color: var(--color-primary); }
                .quick-view-rating { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; }
                .quick-view-price { margin-bottom: 1.5rem; }
                .quick-view-price .price-current { font-size: 1.5rem; font-weight: 700; color: var(--color-primary); }
                .quick-view-description { margin-bottom: 1.5rem; line-height: 1.6; color: var(--color-secondary); }
                .quick-view-features h4 { margin-bottom: 0.5rem; color: var(--color-primary); }
                .quick-view-features ul { margin-bottom: 2rem; padding-left: 1.5rem; }
                .quick-view-features li { margin-bottom: 0.25rem; color: var(--color-secondary); }
                .quick-view-actions { display: flex; flex-direction: column; gap: 1rem; }
                .add-to-cart-btn-modal { padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); color: white; border: none; font-size: 1rem; }
                .add-to-cart-btn-modal:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(255, 107, 53, 0.4); }
                @media (max-width: 768px) {
                    .quick-view-grid { grid-template-columns: 1fr; gap: 1.5rem; }
                    .quick-view-main-image { height: 300px; }
                }
            </style>
        `;
    }

    bindQuickViewEvents(productId) {
        const addToCartBtn = document.querySelector('.add-to-cart-btn-modal');

        addToCartBtn?.addEventListener('click', (e) => {
            this.addToCart(productId, e.target);
        });
    }

    closeModal() {
        const modal = document.getElementById('quick-view-modal');
        modal?.classList.remove('active');
        document.body.style.overflow = '';
    }

    addToCart(productId, button) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        // Check if already in cart
        const existingItem = this.cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                id: productId,
                title: product.title,
                price: product.price,
                quantity: 1,
                image: product.element.querySelector('.product-image').src
            });
        }

        localStorage.setItem('gaojie_cart', JSON.stringify(this.cart));
        this.updateCartCount();
        
        // Button animation
        const originalText = button.innerHTML;
        button.innerHTML = '✓ Added!';
        button.style.background = '#10B981';
        button.disabled = true;

        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.background = '';
            button.disabled = false;
        }, 2000);

        this.showNotification('Added to cart! 🛒', 'success');
        
        // Close modal if open
        if (button.classList.contains('add-to-cart-btn-modal')) {
            setTimeout(() => this.closeModal(), 1500);
        }
    }

    updateCartCount() {
        const cartCount = this.cart.reduce((total, item) => total + item.quantity, 0);
        const bagCount = document.querySelector('.bag-count');
        if (bagCount) {
            bagCount.textContent = cartCount;
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">×</button>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            z-index: 1001;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
            font-weight: 500;
        `;

        // Add animation keyframes
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
                .notification-content { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
                .notification-close { background: none; border: none; color: white; font-size: 1.25rem; cursor: pointer; padding: 0; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; }
                .notification-close:hover { opacity: 0.8; }
            `;
            document.head.appendChild(style);
        }

        // Add to DOM
        document.body.appendChild(notification);

        // Auto remove after 4 seconds
        const timer = setTimeout(() => {
            this.removeNotification(notification);
        }, 4000);

        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            clearTimeout(timer);
            this.removeNotification(notification);
        });
    }

    removeNotification(notification) {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    loadMoreProducts() {
        // In a real app, this would load more products from the server
        this.showNotification('All products loaded!', 'info');
        document.getElementById('load-more').style.display = 'none';
    }

    updateURL() {
        // Update URL with current filters (for bookmarking/sharing)
        const params = new URLSearchParams();
        
        if (this.filters.skinType.length) params.set('skin', this.filters.skinType.join(','));
        if (this.filters.ingredient.length) params.set('ingredient', this.filters.ingredient.join(','));
        if (this.filters.size.length) params.set('size', this.filters.size.join(','));
        if (this.filters.priceMin > 0) params.set('minPrice', this.filters.priceMin);
        if (this.filters.priceMax < 3000) params.set('maxPrice', this.filters.priceMax);
        if (this.currentSort !== 'featured') params.set('sort', this.currentSort);

        const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
        window.history.replaceState({}, '', newURL);
    }

    handleURLParams() {
        // Load filters from URL parameters
        const params = new URLSearchParams(window.location.search);
        
        if (params.has('skin')) {
            this.filters.skinType = params.get('skin').split(',');
        }
        if (params.has('ingredient')) {
            this.filters.ingredient = params.get('ingredient').split(',');
        }
        if (params.has('size')) {
            this.filters.size = params.get('size').split(',');
        }
        if (params.has('minPrice')) {
            this.filters.priceMin = parseInt(params.get('minPrice'));
        }
        if (params.has('maxPrice')) {
            this.filters.priceMax = parseInt(params.get('maxPrice'));
        }
        if (params.has('sort')) {
            this.currentSort = params.get('sort');
            document.getElementById('sort-select').value = this.currentSort;
        }

        // Apply URL filters to UI
        this.applyURLFiltersToUI();
        this.applyFilters();
    }

    applyURLFiltersToUI() {
        // Check appropriate checkboxes
        document.querySelectorAll('input[data-filter]').forEach(input => {
            const filterType = input.dataset.filter;
            const value = input.value;
            
            if (this.filters[filterType] && this.filters[filterType].includes(value)) {
                input.checked = true;
            }
        });

        // Set price inputs
        if (this.filters.priceMin > 0) {
            document.getElementById('price-min').value = this.filters.priceMin;
        }
        if (this.filters.priceMax < 3000) {
            document.getElementById('price-max').value = this.filters.priceMax;
            document.getElementById('price-range').value = this.filters.priceMax;
        }

        this.updateActiveFiltersCount();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new CategoryPage();
});

// Handle mobile menu from main.html script
document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mainNav = document.getElementById('main-nav');

    if (mobileMenuToggle && mainNav) {
        mobileMenuToggle.addEventListener('click', function() {
            mainNav.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
            
            // Toggle hamburger animation
            const lines = mobileMenuToggle.querySelectorAll('.hamburger-line');
            lines.forEach((line, index) => {
                if (mainNav.classList.contains('active')) {
                    if (index === 0) line.style.transform = 'rotate(45deg) translate(5px, 5px)';
                    if (index === 1) line.style.opacity = '0';
                    if (index === 2) line.style.transform = 'rotate(-45deg) translate(7px, -6px)';
                } else {
                    line.style.transform = '';
                    line.style.opacity = '';
                }
            });
        });
    }

    // Close mobile menu when clicking nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            mainNav?.classList.remove('active');
            mobileMenuToggle?.classList.remove('active');
            
            // Reset hamburger
            const lines = mobileMenuToggle?.querySelectorAll('.hamburger-line');
            lines?.forEach(line => {
                line.style.transform = '';
                line.style.opacity = '';
            });
        });
    });
});