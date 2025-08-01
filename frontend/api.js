// API Configuration
const API_BASE_URL = `${window.location.protocol}//${window.location.host}/api`;

// API utility functions for GAOJIE Skincare
class SkincareAPI {
    
    // Generic fetch method with error handling
    async fetchAPI(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                credentials: 'include',
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
    
    // Get all products with optional filters
    async getProducts(filters = {}) {
        const params = new URLSearchParams();
        
        Object.keys(filters).forEach(key => {
            if (filters[key] !== undefined && filters[key] !== null) {
                params.append(key, filters[key]);
            }
        });
        
        const queryString = params.toString();
        const endpoint = `/products${queryString ? '?' + queryString : ''}`;
        
        return await this.fetchAPI(endpoint);
    }
    
    // Get featured products
    async getFeaturedProducts(limit = 4) {
        return await this.fetchAPI(`/products/featured?limit=${limit}`);
    }
    
    // Get bestselling products
    async getBestsellers(limit = 4) {
        return await this.fetchAPI(`/products/bestsellers?limit=${limit}`);
    }
    
    // Get new products
    async getNewProducts(limit = 4) {
        return await this.fetchAPI(`/products/new?limit=${limit}`);
    }
    
    // Get products by category
    async getProductsByCategory(category, limit = 4) {
        return await this.fetchAPI(`/products?category=${category}&limit=${limit}`);
    }
    
    // Get single product by ID
    async getProduct(productId) {
        return await this.fetchAPI(`/products/${productId}`);
    }
    
    // Get single product by slug
    async getProductBySlug(slug) {
        return await this.fetchAPI(`/products/slug/${slug}`);
    }
    
    // Search products
    async searchProducts(searchTerm, filters = {}) {
        const searchFilters = { search: searchTerm, ...filters };
        return await this.getProducts(searchFilters);
    }
    
    // Get all categories
    async getCategories() {
        return await this.fetchAPI('/products/categories');
    }
}

// Create global API instance
const api = new SkincareAPI();

// Product display utility functions
class ProductDisplay {
    
    // Format price in Thai Baht
    static formatPrice(price, originalPrice = null) {
        const formattedPrice = `฿${price.toLocaleString()}`;
        
        if (originalPrice && originalPrice > price) {
            const formattedOriginal = `฿${originalPrice.toLocaleString()}`;
            return `${formattedPrice} <span class="original-price">${formattedOriginal}</span>`;
        }
        
        return formattedPrice;
    }
    
    // Create product card HTML
    static createProductCard(product) {
        const discountBadge = product.is_on_sale ? 
            `<span class="badge badge-promotion">SAVE ${product.discount_percentage}%</span>` : '';
        
        const promoClass = product.is_bestseller ? 'badge-bestseller' : 
                          product.is_new ? 'badge-new' : 
                          product.is_on_sale ? 'badge-promotion' : '';
        
        const promoText = product.is_bestseller ? 'BESTSELLER' : 
                         product.is_new ? 'NEW' : 
                         product.is_on_sale ? `SAVE ${product.discount_percentage}%` : '';
        
        const categoryClass = `badge-${product.category.toLowerCase().replace(' ', '-')}`;
        
        return `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image-container">
                    ${promoText ? `<div class="product-badges-promo">
                        <span class="badge ${promoClass}">${promoText}</span>
                    </div>` : ''}
                    <div class="product-badges-category">
                        <span class="badge ${categoryClass}">${product.category}</span>
                    </div>
                    <div class="product-images">
                        <img src="${product.primary_image}" alt="${product.name}" class="product-image primary" loading="lazy">
                        ${product.secondary_image ? `<img src="${product.secondary_image}" alt="${product.name} in use" class="product-image secondary" loading="lazy">` : ''}
                    </div>
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-description">${product.short_description}</p>
                    <div class="product-price">
                        ${this.formatPrice(product.price, product.original_price)}
                    </div>
                    <button class="add-to-bag-btn" data-product-id="${product.id}">Add to Bag</button>
                </div>
            </div>
        `;
    }
    
    // Create category card HTML (simpler version)
    static createCategoryCard(product) {
        const promoClass = product.is_bestseller ? 'badge-bestseller' : 
                          product.is_new ? 'badge-new' : 
                          product.is_on_sale ? 'badge-promotion' : '';
        
        const promoText = product.is_bestseller ? 'BESTSELLER' : 
                         product.is_new ? 'NEW' : 
                         product.is_on_sale ? `SAVE ${product.discount_percentage}%` : '';
        
        return `
            <div class="category-card" data-product-id="${product.id}">
                <div class="category-image-container">
                    ${promoText ? `<div class="category-badges-promo">
                        <span class="badge ${promoClass}">${promoText}</span>
                    </div>` : ''}
                    <div class="category-images">
                        <img src="${product.primary_image}" alt="${product.name}" class="category-image" loading="lazy">
                    </div>
                </div>
                <div class="category-info">
                    <h3 class="category-product-title">${product.name}</h3>
                    <p class="category-price">${this.formatPrice(product.price, product.original_price)}</p>
                </div>
            </div>
        `;
    }
    
    // Display loading state
    static showLoading(container) {
        container.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Loading products...</p>
            </div>
        `;
    }
    
    // Display error state
    static showError(container, message = 'Failed to load products') {
        container.innerHTML = `
            <div class="error-state">
                <p>${message}</p>
                <button onclick="location.reload()" class="retry-btn">Try Again</button>
            </div>
        `;
    }
}

// Main page load functionality
document.addEventListener('DOMContentLoaded', function() {
    loadMainPageProducts();
});

// Load products for the main page
async function loadMainPageProducts() {
    try {
        // Load featured products
        await loadFeaturedProducts();
        
        // Load category sections
        await loadCategoryProducts();
        
        console.log('All products loaded successfully!');
        
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Load featured products in the main products section
async function loadFeaturedProducts() {
    const productsGrid = document.querySelector('.products-grid');
    if (!productsGrid) return;
    
    try {
        ProductDisplay.showLoading(productsGrid);
        
        const response = await api.getFeaturedProducts(4);
        
        if (response.status === 'success' && response.products) {
            productsGrid.innerHTML = response.products
                .map(product => ProductDisplay.createProductCard(product))
                .join('');
        } else {
            ProductDisplay.showError(productsGrid);
        }
        
    } catch (error) {
        console.error('Error loading featured products:', error);
        ProductDisplay.showError(productsGrid);
    }
}

// Load products for category sections
async function loadCategoryProducts() {
    
    // Load cleansers
    await loadCategorySection('cleanser', '.category-section:nth-of-type(1) .category-grid');
    
    // Load moisturizers
    await loadCategorySection('moisturiser', '.category-section:nth-of-type(2) .category-grid');
    
    // Load serums (for serums & protection section)
    await loadCategorySection('serum', '.category-section:nth-of-type(3) .category-grid');
}

// Load products for a specific category section
async function loadCategorySection(category, selector) {
    const categoryGrid = document.querySelector(selector);
    if (!categoryGrid) return;
    
    try {
        const response = await api.getProductsByCategory(category, 4);
        
        if (response.status === 'success' && response.products) {
            categoryGrid.innerHTML = response.products
                .map(product => ProductDisplay.createCategoryCard(product))
                .join('');
        }
        
    } catch (error) {
        console.error(`Error loading ${category} products:`, error);
    }
}