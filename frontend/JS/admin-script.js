// Admin Panel JavaScript

// Initialize admin functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initAdminPanel();
});

// Main admin initialization
function initAdminPanel() {
    // Initialize common functionality
    initAdminNavigation();
    initAdminModals();
    initAdminNotifications();
    
    // Initialize page-specific functionality based on current page
    const currentPage = getCurrentPage();
    
    switch(currentPage) {
        case 'dashboard':
            initDashboard();
            break;
        case 'orders':
            initOrdersPage();
            break;
        case 'products':
            initProductsPage();
            break;
        case 'analytics':
            initAnalyticsPage();
            break;
    }
}

// Get current page from URL or body class
function getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('admin-dashboard')) return 'dashboard';
    if (path.includes('admin-orders')) return 'orders';
    if (path.includes('admin-products')) return 'products';
    if (path.includes('admin-analytics')) return 'analytics';
    return 'dashboard'; // default
}

// Admin Navigation
function initAdminNavigation() {
    // Logout functionality
    const logoutBtn = document.querySelector('.admin-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Mobile menu functionality (reuse existing mobile menu logic)
    if (typeof initMobileMenu === 'function') {
        initMobileMenu();
    }
}

// Handle admin logout
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        // In a real app, this would make an API call to logout
        showAdminNotification('Logging out...', 'info');
        setTimeout(() => {
            window.location.href = '/admin-login';
        }, 1000);
    }
}

// ===== DASHBOARD FUNCTIONALITY =====

function initDashboard() {
    console.log('Initializing admin dashboard...');
    
    // Initialize quick actions
    initQuickActions();
    
    // Auto-refresh dashboard data every 5 minutes
    setInterval(refreshDashboardData, 5 * 60 * 1000);
}

function initQuickActions() {
    // Quick action buttons
    const quickActionBtns = document.querySelectorAll('.admin-action-btn');
    quickActionBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            if (href) {
                window.location.href = href;
            }
        });
    });
}

function refreshDashboardData() {
    // In a real app, this would fetch fresh data from the API
    console.log('Refreshing dashboard data...');
    showAdminNotification('Dashboard data updated', 'success', 2000);
}

// ===== ORDERS FUNCTIONALITY =====

function initOrdersPage() {
    console.log('Initializing orders page...');
    
    // Initialize order filters
    initOrderFilters();
    
    // Initialize order search
    initOrderSearch();
    
    // Initialize order table functionality
    initOrderTable();
    
    // Initialize bulk actions
    initBulkActions();
    
    // Initialize export functionality
    initOrderExport();
}

function initOrderFilters() {
    const filterTabs = document.querySelectorAll('.admin-filter-tab');
    
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Update active tab
            filterTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Filter orders
            const status = this.getAttribute('data-status');
            filterOrdersByStatus(status);
        });
    });
    
    // Date range filter
    const dateRangeSelect = document.getElementById('date-range');
    if (dateRangeSelect) {
        dateRangeSelect.addEventListener('change', function() {
            filterOrdersByDate(this.value);
        });
    }
}

function filterOrdersByStatus(status) {
    const orderRows = document.querySelectorAll('.admin-order-row');
    
    orderRows.forEach(row => {
        if (status === 'all') {
            row.style.display = '';
        } else {
            const rowStatus = row.getAttribute('data-status');
            row.style.display = rowStatus === status ? '' : 'none';
        }
    });
    
    updateOrderCount();
}

function filterOrdersByDate(dateRange) {
    // In a real app, this would filter by actual dates
    console.log('Filtering orders by date range:', dateRange);
    showAdminNotification(`Filtering orders by ${dateRange}`, 'info', 2000);
}

function initOrderSearch() {
    const searchInput = document.getElementById('orders-search');
    if (!searchInput) return;
    
    let searchTimeout;
    
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchOrders(this.value.toLowerCase().trim());
        }, 300);
    });
}

function searchOrders(searchTerm) {
    const orderRows = document.querySelectorAll('.admin-order-row');
    
    orderRows.forEach(row => {
        if (searchTerm === '') {
            row.style.display = '';
        } else {
            const orderId = row.querySelector('.admin-order-id')?.textContent.toLowerCase() || '';
            const customerName = row.querySelector('.admin-customer-name')?.textContent.toLowerCase() || '';
            const customerEmail = row.querySelector('.admin-customer-email')?.textContent.toLowerCase() || '';
            const productName = row.querySelector('.admin-product-name')?.textContent.toLowerCase() || '';
            
            const matches = orderId.includes(searchTerm) || 
                          customerName.includes(searchTerm) || 
                          customerEmail.includes(searchTerm) || 
                          productName.includes(searchTerm);
            
            row.style.display = matches ? '' : 'none';
        }
    });
    
    updateOrderCount();
}

function initOrderTable() {
    // Table sorting
    const sortableHeaders = document.querySelectorAll('.admin-table-sortable');
    sortableHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const sortBy = this.getAttribute('data-sort');
            sortOrderTable(sortBy);
        });
    });
    
    // Select all checkbox
    const selectAllCheckbox = document.getElementById('select-all-orders');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const orderCheckboxes = document.querySelectorAll('.order-checkbox');
            orderCheckboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
            updateBulkActionButtons();
        });
    }
    
    // Individual order checkboxes
    const orderCheckboxes = document.querySelectorAll('.order-checkbox');
    orderCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateBulkActionButtons);
    });
    
    // Status selects
    const statusSelects = document.querySelectorAll('.admin-status-select');
    statusSelects.forEach(select => {
        select.addEventListener('change', function() {
            const orderId = this.getAttribute('data-order');
            const newStatus = this.value;
            updateOrderStatus(orderId, newStatus, this);
        });
    });
}

function sortOrderTable(sortBy) {
    console.log('Sorting orders by:', sortBy);
    // In a real app, this would sort the table
    showAdminNotification(`Sorting by ${sortBy}`, 'info', 2000);
}

function updateOrderStatus(orderId, newStatus, selectElement) {
    // Update visual status
    selectElement.className = `admin-status-select ${newStatus}`;
    
    // In a real app, this would make an API call
    console.log(`Updating order ${orderId} to status: ${newStatus}`);
    showAdminNotification(`Order ${orderId} status updated to ${newStatus}`, 'success');
}

function initBulkActions() {
    const bulkActionSelect = document.getElementById('bulk-action');
    const applyBulkBtn = document.getElementById('apply-bulk-action');
    
    if (applyBulkBtn) {
        applyBulkBtn.addEventListener('click', function() {
            const action = bulkActionSelect.value;
            const selectedOrders = getSelectedOrders();
            
            if (action && selectedOrders.length > 0) {
                executeBulkAction(action, selectedOrders);
            }
        });
    }
}

function updateBulkActionButtons() {
    const selectedOrders = getSelectedOrders();
    const bulkActionSelect = document.getElementById('bulk-action');
    const applyBulkBtn = document.getElementById('apply-bulk-action');
    
    const hasSelection = selectedOrders.length > 0;
    
    if (bulkActionSelect) bulkActionSelect.disabled = !hasSelection;
    if (applyBulkBtn) applyBulkBtn.disabled = !hasSelection;
}

function getSelectedOrders() {
    const selectedCheckboxes = document.querySelectorAll('.order-checkbox:checked');
    return Array.from(selectedCheckboxes).map(cb => cb.value);
}

function executeBulkAction(action, orderIds) {
    console.log(`Executing bulk action: ${action} on orders:`, orderIds);
    
    switch(action) {
        case 'update-status':
            // In a real app, this would show a status selection modal
            showAdminNotification(`Updating status for ${orderIds.length} orders`, 'info');
            break;
        case 'print-labels':
            showAdminNotification(`Printing shipping labels for ${orderIds.length} orders`, 'info');
            break;
        case 'export-selected':
            exportSelectedOrders(orderIds);
            break;
    }
}

function initOrderExport() {
    const exportBtn = document.getElementById('export-orders');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            exportAllOrders();
        });
    }
}

function exportAllOrders() {
    showAdminNotification('Preparing orders export...', 'info');
    // In a real app, this would generate and download a CSV/Excel file
    setTimeout(() => {
        showAdminNotification('Orders exported successfully!', 'success');
    }, 2000);
}

function exportSelectedOrders(orderIds) {
    showAdminNotification(`Exporting ${orderIds.length} selected orders...`, 'info');
    setTimeout(() => {
        showAdminNotification('Selected orders exported successfully!', 'success');
    }, 1500);
}

function updateOrderCount() {
    const visibleRows = document.querySelectorAll('.admin-order-row[style=""], .admin-order-row:not([style])');
    const paginationInfo = document.querySelector('.admin-pagination-info');
    if (paginationInfo) {
        paginationInfo.textContent = `Showing ${visibleRows.length} orders`;
    }
}

// Order action functions (called from HTML)
function viewOrderDetails(orderId) {
    window.location.href = `/order-details?id=${orderId}`;
}

function printInvoice(orderId) {
    showAdminNotification(`Printing invoice for order ${orderId}`, 'info');
    // In a real app, this would open a print dialog or generate PDF
}

function trackPackage(orderId) {
    showAdminNotification(`Opening tracking for order ${orderId}`, 'info');
    // In a real app, this would open tracking modal or redirect
}

// ===== PRODUCTS FUNCTIONALITY =====

function initProductsPage() {
    console.log('Initializing products page...');
    
    // Initialize product filters
    initProductFilters();
    
    // Initialize product search
    initProductSearch();
    
    // Initialize product grid functionality
    initProductGrid();
    
    // Initialize product modal
    initProductModal();
    
    // Initialize import functionality
    initProductImport();
}

function initProductFilters() {
    const filterTabs = document.querySelectorAll('.admin-filter-tab');
    
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Update active tab
            filterTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Filter products
            const category = this.getAttribute('data-category');
            filterProductsByCategory(category);
        });
    });
    
    // Stock filter
    const stockFilter = document.getElementById('stock-filter');
    if (stockFilter) {
        stockFilter.addEventListener('change', function() {
            filterProductsByStock(this.value);
        });
    }
    
    // Status filter
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            filterProductsByStatus(this.value);
        });
    }
}

function filterProductsByCategory(category) {
    const productCards = document.querySelectorAll('.admin-product-card');
    
    productCards.forEach(card => {
        if (category === 'all') {
            card.style.display = '';
        } else {
            const cardCategory = card.getAttribute('data-category');
            card.style.display = cardCategory === category ? '' : 'none';
        }
    });
    
    updateProductCount();
}

function filterProductsByStock(stockLevel) {
    const productCards = document.querySelectorAll('.admin-product-card');
    
    productCards.forEach(card => {
        if (stockLevel === 'all') {
            card.style.display = '';
        } else {
            const cardStock = card.getAttribute('data-stock');
            card.style.display = cardStock === stockLevel ? '' : 'none';
        }
    });
    
    updateProductCount();
}

function filterProductsByStatus(status) {
    const productCards = document.querySelectorAll('.admin-product-card');
    
    productCards.forEach(card => {
        const statusElement = card.querySelector('.admin-product-status');
        if (status === 'all') {
            card.style.display = '';
        } else {
            const cardStatus = statusElement?.textContent.toLowerCase().trim();
            card.style.display = cardStatus === status ? '' : 'none';
        }
    });
    
    updateProductCount();
}

function initProductSearch() {
    const searchInput = document.getElementById('products-search');
    if (!searchInput) return;
    
    let searchTimeout;
    
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchProducts(this.value.toLowerCase().trim());
        }, 300);
    });
}

function searchProducts(searchTerm) {
    const productCards = document.querySelectorAll('.admin-product-card');
    
    productCards.forEach(card => {
        if (searchTerm === '') {
            card.style.display = '';
        } else {
            const productName = card.querySelector('.admin-product-name')?.textContent.toLowerCase() || '';
            const productSku = card.querySelector('.admin-product-sku')?.textContent.toLowerCase() || '';
            const productCategory = card.querySelector('.admin-product-category')?.textContent.toLowerCase() || '';
            
            const matches = productName.includes(searchTerm) || 
                          productSku.includes(searchTerm) || 
                          productCategory.includes(searchTerm);
            
            card.style.display = matches ? '' : 'none';
        }
    });
    
    updateProductCount();
}

function initProductGrid() {
    // Load more functionality
    const loadMoreBtn = document.getElementById('load-more-products');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            loadMoreProducts();
        });
    }
}

function loadMoreProducts() {
    const btn = document.getElementById('load-more-products');
    const originalText = btn.textContent;
    
    btn.textContent = 'Loading...';
    btn.disabled = true;
    
    // Simulate loading more products
    setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
        showAdminNotification('More products loaded', 'success', 2000);
        updateProductCount();
    }, 1500);
}

function initProductModal() {
    const addProductBtn = document.getElementById('add-new-product');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', function() {
            openProductModal();
        });
    }
    
    // File upload handling
    const fileInput = document.getElementById('product-images');
    const fileUploadArea = document.querySelector('.admin-file-upload-area');
    
    if (fileInput && fileUploadArea) {
        fileUploadArea.addEventListener('click', () => fileInput.click());
        
        fileInput.addEventListener('change', function() {
            handleFileUpload(this.files);
        });
        
        // Drag and drop
        fileUploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.parentElement.style.borderColor = 'var(--admin-primary)';
            this.parentElement.style.background = '#f8f9fa';
        });
        
        fileUploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.parentElement.style.borderColor = '#dee2e6';
            this.parentElement.style.background = '';
        });
        
        fileUploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.parentElement.style.borderColor = '#dee2e6';
            this.parentElement.style.background = '';
            handleFileUpload(e.dataTransfer.files);
        });
    }
}

// Enhanced Image Management System
class ProductImageManager {
    constructor() {
        this.images = [];
        this.videos = [];
        this.maxImages = 10;
        this.maxVideos = 3;
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        // Image upload
        const imageInput = document.getElementById('product-images');
        if (imageInput) {
            imageInput.addEventListener('change', (e) => this.handleImageUpload(e.target.files));
        }
        
        // Video upload
        const videoInput = document.getElementById('product-videos');
        if (videoInput) {
            videoInput.addEventListener('change', (e) => this.handleVideoUpload(e.target.files));
        }
        
        // Drag and drop
        this.setupDragAndDrop();
    }
    
    handleImageUpload(files) {
        if (this.images.length >= this.maxImages) {
            showAdminNotification(`Maximum ${this.maxImages} images allowed`, 'warning');
            return;
        }
        
        Array.from(files).forEach((file, index) => {
            if (this.images.length >= this.maxImages) return;
            
            if (!file.type.startsWith('image/')) {
                showAdminNotification(`${file.name} is not a valid image`, 'error');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                showAdminNotification(`${file.name} is too large (max 5MB)`, 'error');
                return;
            }
            
            this.addImage(file, index);
        });
        
        this.renderImages();
    }
    
    handleVideoUpload(files) {
        if (this.videos.length >= this.maxVideos) {
            showAdminNotification(`Maximum ${this.maxVideos} videos allowed`, 'warning');
            return;
        }
        
        Array.from(files).forEach((file, index) => {
            if (this.videos.length >= this.maxVideos) return;
            
            if (!file.type.startsWith('video/')) {
                showAdminNotification(`${file.name} is not a valid video`, 'error');
                return;
            }
            
            if (file.size > 50 * 1024 * 1024) { // 50MB limit
                showAdminNotification(`${file.name} is too large (max 50MB)`, 'error');
                return;
            }
            
            this.addVideo(file, index);
        });
        
        this.renderVideos();
    }
    
    addImage(file, index) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = {
                id: `img_${Date.now()}_${index}`,
                file: file,
                url: e.target.result,
                name: file.name,
                type: this.images.length === 0 ? 'primary' : 'gallery', // First image is primary
                order: this.images.length + 1
            };
            
            this.images.push(imageData);
            this.renderImages();
        };
        reader.readAsDataURL(file);
    }
    
    addVideo(file, index) {
        const videoData = {
            id: `vid_${Date.now()}_${index}`,
            file: file,
            name: file.name,
            type: 'demo',
            order: this.videos.length + 1
        };
        
        this.videos.push(videoData);
        this.renderVideos();
    }
    
    renderImages() {
        const container = document.getElementById('image-manager');
        if (!container) return;
        
        container.innerHTML = this.images.map(image => `
            <div class="admin-image-item" data-image-id="${image.id}">
                <div class="admin-image-type-indicator ${image.type}">${image.type.toUpperCase()}</div>
                <img src="${image.url}" alt="${image.name}" class="admin-image-preview">
                <div class="admin-image-controls">
                    <select class="admin-image-type-select" onchange="imageManager.updateImageType('${image.id}', this.value)">
                        <option value="primary" ${image.type === 'primary' ? 'selected' : ''}>Primary (Card Main)</option>
                        <option value="secondary" ${image.type === 'secondary' ? 'selected' : ''}>Secondary (Card Hover)</option>
                        <option value="gallery" ${image.type === 'gallery' ? 'selected' : ''}>Gallery (Detail Page)</option>
                        <option value="hero" ${image.type === 'hero' ? 'selected' : ''}>Hero (Featured)</option>
                    </select>
                    <div class="admin-image-actions">
                        <button class="admin-image-action" onclick="imageManager.moveImageUp('${image.id}')" ${image.order === 1 ? 'disabled' : ''}>↑</button>
                        <button class="admin-image-action" onclick="imageManager.moveImageDown('${image.id}')" ${image.order === this.images.length ? 'disabled' : ''}>↓</button>
                        <button class="admin-image-action delete" onclick="imageManager.removeImage('${image.id}')">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
        
        this.updateImageTypeIndicators();
    }
    
    renderVideos() {
        const container = document.getElementById('video-manager');
        if (!container) return;
        
        container.innerHTML = this.videos.map(video => `
            <div class="admin-video-item" data-video-id="${video.id}">
                <div class="admin-video-preview">
                    <div style="color: white; display: flex; align-items: center; justify-content: center; height: 100%; font-size: 0.875rem;">
                        📹 ${video.name}
                    </div>
                </div>
                <div class="admin-image-controls">
                    <div class="admin-image-actions">
                        <button class="admin-image-action" onclick="imageManager.moveVideoUp('${video.id}')" ${video.order === 1 ? 'disabled' : ''}>↑</button>
                        <button class="admin-image-action" onclick="imageManager.moveVideoDown('${video.id}')" ${video.order === this.videos.length ? 'disabled' : ''}>↓</button>
                        <button class="admin-image-action delete" onclick="imageManager.removeVideo('${video.id}')">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    updateImageType(imageId, newType) {
        // If setting as primary, remove primary from others
        if (newType === 'primary') {
            this.images.forEach(img => {
                if (img.type === 'primary' && img.id !== imageId) {
                    img.type = 'gallery';
                }
            });
        }
        
        // If setting as secondary, remove secondary from others  
        if (newType === 'secondary') {
            this.images.forEach(img => {
                if (img.type === 'secondary' && img.id !== imageId) {
                    img.type = 'gallery';
                }
            });
        }
        
        // Update the target image
        const image = this.images.find(img => img.id === imageId);
        if (image) {
            image.type = newType;
        }
        
        this.renderImages();
        showAdminNotification(`Image type updated to ${newType}`, 'success', 2000);
    }
    
    removeImage(imageId) {
        this.images = this.images.filter(img => img.id !== imageId);
        this.reorderImages();
        this.renderImages();
        showAdminNotification('Image removed', 'success', 2000);
    }
    
    removeVideo(videoId) {
        this.videos = this.videos.filter(vid => vid.id !== videoId);
        this.reorderVideos();
        this.renderVideos();
        showAdminNotification('Video removed', 'success', 2000);
    }
    
    moveImageUp(imageId) {
        const index = this.images.findIndex(img => img.id === imageId);
        if (index > 0) {
            [this.images[index], this.images[index - 1]] = [this.images[index - 1], this.images[index]];
            this.reorderImages();
            this.renderImages();
        }
    }
    
    moveImageDown(imageId) {
        const index = this.images.findIndex(img => img.id === imageId);
        if (index < this.images.length - 1) {
            [this.images[index], this.images[index + 1]] = [this.images[index + 1], this.images[index]];
            this.reorderImages();
            this.renderImages();
        }
    }
    
    moveVideoUp(videoId) {
        const index = this.videos.findIndex(vid => vid.id === videoId);
        if (index > 0) {
            [this.videos[index], this.videos[index - 1]] = [this.videos[index - 1], this.videos[index]];
            this.reorderVideos();
            this.renderVideos();
        }
    }
    
    moveVideoDown(videoId) {
        const index = this.videos.findIndex(vid => vid.id === videoId);
        if (index < this.videos.length - 1) {
            [this.videos[index], this.videos[index + 1]] = [this.videos[index + 1], this.videos[index]];
            this.reorderVideos();
            this.renderVideos();
        }
    }
    
    reorderImages() {
        this.images.forEach((img, index) => {
            img.order = index + 1;
        });
    }
    
    reorderVideos() {
        this.videos.forEach((vid, index) => {
            vid.order = index + 1;
        });
    }
    
    updateImageTypeIndicators() {
        const indicators = document.querySelectorAll('.admin-image-type-indicator');
        indicators.forEach(indicator => {
            const imageItem = indicator.closest('.admin-image-item');
            const imageId = imageItem.getAttribute('data-image-id');
            const image = this.images.find(img => img.id === imageId);
            
            if (image) {
                indicator.className = `admin-image-type-indicator ${image.type}`;
                indicator.textContent = image.type.toUpperCase();
            }
        });
    }
    
    setupDragAndDrop() {
        const container = document.getElementById('image-manager');
        if (!container) return;
        
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            container.classList.add('drag-over');
        });
        
        container.addEventListener('dragleave', (e) => {
            e.preventDefault();
            container.classList.remove('drag-over');
        });
        
        container.addEventListener('drop', (e) => {
            e.preventDefault();
            container.classList.remove('drag-over');
            this.handleImageUpload(e.dataTransfer.files);
        });
    }
    
    getImagesByType(type) {
        return this.images.filter(img => img.type === type).sort((a, b) => a.order - b.order);
    }
    
    getProductData() {
        return {
            images: this.images.map(img => ({
                id: img.id,
                type: img.type,
                name: img.name,
                order: img.order,
                file: img.file
            })),
            videos: this.videos.map(vid => ({
                id: vid.id,
                type: vid.type,
                name: vid.name,
                order: vid.order,
                file: vid.file
            }))
        };
    }
}

function openProductModal(productId = null) {
    const modal = document.getElementById('product-modal');
    const modalTitle = document.getElementById('modal-title');
    
    if (productId) {
        modalTitle.textContent = 'Edit Product';
        // In a real app, this would populate the form with product data
        populateProductForm(productId);
    } else {
        modalTitle.textContent = 'Add New Product';
        clearProductForm();
    }
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeProductModal() {
    const modal = document.getElementById('product-modal');
    modal.style.display = 'none';
    document.body.style.overflow = '';
    clearProductForm();
}

function populateProductForm(productId) {
    // In a real app, this would fetch product data and populate the form
    console.log('Populating form for product:', productId);
}

function clearProductForm() {
    const form = document.getElementById('product-form');
    if (form) {
        form.reset();
    }
    
    // Clear image manager if it exists
    if (imageManager) {
        imageManager.images = [];
        imageManager.videos = [];
        imageManager.renderImages();
        imageManager.renderVideos();
    }
}

// ADD this new function for draft saving:
function saveProductDraft() {
    showAdminNotification('Product saved as draft', 'info');
}

function saveProduct() {
    const form = document.getElementById('product-form');
    
    // Basic validation
    const requiredFields = ['product-name', 'product-sku', 'product-category', 'product-price', 'product-stock'];
    let isValid = true;
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field || !field.value.trim()) {
            if (field) field.style.borderColor = 'var(--admin-danger)';
            isValid = false;
        } else {
            field.style.borderColor = '#dee2e6';
        }
    });
    
    if (!isValid) {
        showAdminNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Get product data including images and videos
    const productData = imageManager ? imageManager.getProductData() : { images: [], videos: [] };
    const formData = new FormData(form);
    
    // Add form fields
    formData.append('name', document.getElementById('product-name').value);
    formData.append('sku', document.getElementById('product-sku').value);
    formData.append('category', document.getElementById('product-category').value);
    formData.append('price', document.getElementById('product-price').value);
    formData.append('stock', document.getElementById('product-stock').value);
    
    // Add images with metadata
    productData.images.forEach((image, index) => {
        formData.append(`images[${index}]`, image.file);
        formData.append(`imageTypes[${index}]`, image.type);
        formData.append(`imageOrders[${index}]`, image.order);
    });
    
    // Add videos
    productData.videos.forEach((video, index) => {
        formData.append(`videos[${index}]`, video.file);
        formData.append(`videoOrders[${index}]`, video.order);
    });
    
    // In a real app, this would make an API call to save the product
    console.log('Saving product with media:', productData);
    
    showAdminNotification('Product with images saved successfully!', 'success');
    closeProductModal();
    
    // Refresh product grid (in a real app, this would reload data)
    setTimeout(() => {
        updateProductCount();
    }, 500);
}

function handleFileUpload(files) {
    if (files.length === 0) return;
    
    const fileList = Array.from(files);
    const validFiles = fileList.filter(file => {
        return file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024; // 5MB limit
    });
    
    if (validFiles.length !== fileList.length) {
        showAdminNotification('Some files were skipped (only images under 5MB are allowed)', 'warning');
    }
    
    if (validFiles.length > 0) {
        showAdminNotification(`${validFiles.length} image(s) uploaded successfully`, 'success');
    }
}

function initProductImport() {
    const importBtn = document.getElementById('import-products');
    if (importBtn) {
        importBtn.addEventListener('click', function() {
            // In a real app, this would open a file import dialog
            showAdminNotification('Product import functionality would open here', 'info');
        });
    }
}

function updateProductCount() {
    const visibleCards = document.querySelectorAll('.admin-product-card[style=""], .admin-product-card:not([style])');
    const productCount = document.querySelector('.admin-products-count');
    if (productCount) {
        productCount.textContent = `Showing ${visibleCards.length} products`;
    }
}

// Product action functions (called from HTML)
function editProduct(productId) {
    openProductModal(productId);
}

function duplicateProduct(productId) {
    if (confirm('Are you sure you want to duplicate this product?')) {
        // In a real app, this would duplicate the product
        showAdminNotification(`Product ${productId} duplicated successfully`, 'success');
    }
}

function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
        // In a real app, this would delete the product
        showAdminNotification(`Product ${productId} deleted successfully`, 'success');
        
        // Remove the product card from the UI
        const productCard = document.querySelector(`[onclick*="${productId}"]`)?.closest('.admin-product-card');
        if (productCard) {
            productCard.remove();
            updateProductCount();
        }
    }
}

// ===== ANALYTICS FUNCTIONALITY =====

function initAnalyticsPage() {
    console.log('Initializing analytics page...');
    
    // Initialize analytics controls
    initAnalyticsControls();
    
    // Initialize chart interactions
    initChartInteractions();
    
    // Initialize export functionality
    initAnalyticsExport();
    
    // Auto-refresh analytics every 10 minutes
    setInterval(refreshAnalyticsData, 10 * 60 * 1000);
}

function initAnalyticsControls() {
    const periodSelect = document.getElementById('analytics-period');
    if (periodSelect) {
        periodSelect.addEventListener('change', function() {
            updateAnalyticsPeriod(this.value);
        });
    }
}

function updateAnalyticsPeriod(period) {
    console.log('Updating analytics period to:', period);
    showAdminNotification(`Analytics updated for ${period} days`, 'info', 2000);
    
    // In a real app, this would fetch new data and update all charts/metrics
    refreshAnalyticsData();
}

function initChartInteractions() {
    const chartToggles = document.querySelectorAll('.admin-chart-toggle');
    
    chartToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            // Update active toggle
            chartToggles.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Switch chart data
            const chartType = this.getAttribute('data-chart');
            switchChartData(chartType);
        });
    });
}

function switchChartData(chartType) {
    console.log('Switching chart to:', chartType);
    showAdminNotification(`Displaying ${chartType} data`, 'info', 2000);
    
    // In a real app, this would update the chart with new data
}

function initAnalyticsExport() {
    const exportBtn = document.getElementById('export-report');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            exportAnalyticsReport();
        });
    }
}

function exportAnalyticsReport() {
    showAdminNotification('Preparing analytics report...', 'info');
    
    // In a real app, this would generate and download a comprehensive report
    setTimeout(() => {
        showAdminNotification('Analytics report exported successfully!', 'success');
    }, 2000);
}

function refreshAnalyticsData() {
    console.log('Refreshing analytics data...');
    // In a real app, this would fetch fresh analytics data
}

// ===== MODAL FUNCTIONALITY =====

function initAdminModals() {
    // Close modals when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('admin-modal')) {
            closeProductModal();
        }
    });
    
    // Close modals with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeProductModal();
        }
    });
}

// ===== NOTIFICATION SYSTEM =====

function initAdminNotifications() {
    // Create notification container if it doesn't exist
    if (!document.getElementById('admin-notifications')) {
        const container = document.createElement('div');
        container.id = 'admin-notifications';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }
}

function showAdminNotification(message, type = 'info', duration = 4000) {
    const container = document.getElementById('admin-notifications');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `admin-notification admin-notification-${type}`;
    notification.textContent = message;
    
    // Notification styles
    const colors = {
        success: { bg: '#27ae60', text: 'white' },
        error: { bg: '#e74c3c', text: 'white' },
        warning: { bg: '#f39c12', text: 'white' },
        info: { bg: '#3498db', text: 'white' }
    };
    
    const color = colors[type] || colors.info;
    
    notification.style.cssText = `
        background: ${color.bg};
        color: ${color.text};
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        pointer-events: auto;
        cursor: pointer;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    container.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Click to dismiss
    notification.addEventListener('click', () => {
        dismissNotification(notification);
    });
    
    // Auto dismiss
    setTimeout(() => {
        dismissNotification(notification);
    }, duration);
}

function dismissNotification(notification) {
    if (!notification.parentNode) return;
    
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// ===== UTILITY FUNCTIONS =====

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Format date
function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(new Date(date));
}

// Format number with commas
function formatNumber(number) {
    return new Intl.NumberFormat('en-US').format(number);
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Animation helper
function animateElement(element, animationClass, duration = 1000) {
    if (!element) return;
    
    element.classList.add(animationClass);
    
    setTimeout(() => {
        element.classList.remove(animationClass);
    }, duration);
}

// Local storage helpers (for admin preferences)
function saveAdminPreference(key, value) {
    try {
        localStorage.setItem(`admin_${key}`, JSON.stringify(value));
    } catch (e) {
        console.warn('Could not save admin preference:', e);
    }
}

function getAdminPreference(key, defaultValue = null) {
    try {
        const stored = localStorage.getItem(`admin_${key}`);
        return stored ? JSON.parse(stored) : defaultValue;
    } catch (e) {
        console.warn('Could not retrieve admin preference:', e);
        return defaultValue;
    }
}

// ===== ERROR HANDLING =====

// Global error handler for admin panel
window.addEventListener('error', function(e) {
    console.error('Admin panel error:', e.error);
    showAdminNotification('An error occurred. Please try again.', 'error');
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    showAdminNotification('An error occurred. Please try again.', 'error');
});

// ===== DEVELOPMENT HELPERS =====

// Only available in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Add development utilities
    window.adminDebug = {
        showNotification: showAdminNotification,
        formatCurrency: formatCurrency,
        formatDate: formatDate,
        getCurrentPage: getCurrentPage
    };
    
    console.log('Admin debug utilities available at window.adminDebug');
}

// Export functions for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showAdminNotification,
        formatCurrency,
        formatDate,
        formatNumber
    };
}

let imageManager;