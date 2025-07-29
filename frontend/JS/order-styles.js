// Orders Page JavaScript

// Tab functionality for orders page
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tabs functionality
    initOrdersTabs();
    
    // Initialize search functionality
    initOrdersSearch();
    
    // Initialize mobile menu (if exists from main script)
    if (typeof initMobileMenu === 'function') {
        initMobileMenu();
    }
});

// Orders tabs functionality
function initOrdersTabs() {
    const tabs = document.querySelectorAll('.orders-tab');
    const orderCards = document.querySelectorAll('.order-card');
    
    if (tabs.length === 0) return;
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabType = this.getAttribute('data-tab');
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Filter orders based on tab
            filterOrdersByTab(tabType, orderCards);
        });
    });
}

// Filter orders based on selected tab
function filterOrdersByTab(tabType, orderCards) {
    const ordersList = document.querySelector('.orders-list');
    const emptyState = document.querySelector('.orders-empty');
    
    if (!orderCards.length) return;
    
    let visibleCount = 0;
    
    orderCards.forEach(card => {
        const statusElement = card.querySelector('.order-status');
        if (!statusElement) return;
        
        const status = statusElement.textContent.toLowerCase().trim();
        let shouldShow = false;
        
        switch(tabType) {
            case 'all':
                shouldShow = true;
                break;
            case 'to-pay':
                shouldShow = status.includes('pending') || status.includes('payment');
                break;
            case 'to-ship':
                shouldShow = status.includes('processing') || status.includes('confirmed');
                break;
            case 'to-receive':
                shouldShow = status.includes('shipped') || status.includes('transit');
                break;
            case 'to-review':
                shouldShow = status.includes('delivered') && !card.querySelector('.review-written');
                break;
            default:
                shouldShow = true;
        }
        
        if (shouldShow) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    // Show/hide empty state
    if (emptyState) {
        if (visibleCount === 0) {
            ordersList.style.display = 'none';
            emptyState.style.display = 'block';
            
            // Update empty state message based on tab
            const emptyTitle = emptyState.querySelector('.empty-title');
            const emptyDescription = emptyState.querySelector('.empty-description');
            
            if (emptyTitle && emptyDescription) {
                switch(tabType) {
                    case 'to-pay':
                        emptyTitle.textContent = 'No pending payments';
                        emptyDescription.textContent = 'All your orders are paid for';
                        break;
                    case 'to-ship':
                        emptyTitle.textContent = 'No orders to ship';
                        emptyDescription.textContent = 'Your orders are being prepared';
                        break;
                    case 'to-receive':
                        emptyTitle.textContent = 'No orders in transit';
                        emptyDescription.textContent = 'Nothing currently being delivered';
                        break;
                    case 'to-review':
                        emptyTitle.textContent = 'No orders to review';
                        emptyDescription.textContent = 'Write reviews after receiving your orders';
                        break;
                    default:
                        emptyTitle.textContent = 'No orders found';
                        emptyDescription.textContent = 'Start shopping to see your orders here';
                }
            }
        } else {
            ordersList.style.display = 'flex';
            emptyState.style.display = 'none';
        }
    }
}

// Search functionality
function initOrdersSearch() {
    const searchInput = document.querySelector('.orders-search-input');
    
    if (!searchInput) return;
    
    // Debounce search to avoid too many calls
    let searchTimeout;
    
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performOrdersSearch(this.value.toLowerCase().trim());
        }, 300);
    });
}

// Perform search filtering
function performOrdersSearch(searchTerm) {
    const orderCards = document.querySelectorAll('.order-card');
    const ordersList = document.querySelector('.orders-list');
    const emptyState = document.querySelector('.orders-empty');
    
    if (!orderCards.length) return;
    
    let visibleCount = 0;
    
    if (searchTerm === '') {
        // Show all orders if search is empty
        orderCards.forEach(card => {
            card.style.display = 'block';
            visibleCount++;
        });
    } else {
        // Filter orders based on search term
        orderCards.forEach(card => {
            const productName = card.querySelector('.order-product-name')?.textContent.toLowerCase() || '';
            const brandName = card.querySelector('.brand-name')?.textContent.toLowerCase() || '';
            const productVariant = card.querySelector('.order-product-variant')?.textContent.toLowerCase() || '';
            
            const matchesSearch = productName.includes(searchTerm) || 
                                brandName.includes(searchTerm) || 
                                productVariant.includes(searchTerm);
            
            if (matchesSearch) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    // Show/hide empty state for search
    if (emptyState) {
        if (visibleCount === 0 && searchTerm !== '') {
            ordersList.style.display = 'none';
            emptyState.style.display = 'block';
            
            // Update empty state for search
            const emptyTitle = emptyState.querySelector('.empty-title');
            const emptyDescription = emptyState.querySelector('.empty-description');
            
            if (emptyTitle && emptyDescription) {
                emptyTitle.textContent = 'No orders found';
                emptyDescription.textContent = `No orders match "${searchTerm}"`;
            }
        } else {
            ordersList.style.display = 'flex';
            emptyState.style.display = 'none';
        }
    }
}

// Utility function for smooth scrolling (if needed)
function smoothScrollTo(element) {
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Handle dynamic order status updates (for real applications)
function updateOrderStatus(orderId, newStatus) {
    const orderCard = document.querySelector(`[data-order-id="${orderId}"]`);
    if (!orderCard) return;
    
    const statusElement = orderCard.querySelector('.order-status');
    if (statusElement) {
        // Remove old status classes
        statusElement.classList.remove('delivered', 'processing', 'pending');
        
        // Update status text and add new class
        statusElement.textContent = newStatus;
        statusElement.classList.add(newStatus.toLowerCase().replace(' ', '-'));
    }
    
    // Update available actions based on new status
    updateOrderActions(orderCard, newStatus);
}

// Update order actions based on status
function updateOrderActions(orderCard, status) {
    const actionsContainer = orderCard.querySelector('.order-actions');
    if (!actionsContainer) return;
    
    // Clear existing actions
    actionsContainer.innerHTML = '';
    
    // Add appropriate actions based on status
    switch(status.toLowerCase()) {
        case 'delivered':
            actionsContainer.innerHTML = `
                <a href="/order-details?id=${orderCard.dataset.orderId}" class="order-action-btn primary">View Details</a>
                <button class="order-action-btn secondary">Write Review</button>
                <button class="order-action-btn secondary">Buy Again</button>
            `;
            break;
        case 'processing':
            actionsContainer.innerHTML = `
                <a href="/order-details?id=${orderCard.dataset.orderId}" class="order-action-btn primary">Track Package</a>
                <button class="order-action-btn secondary">Contact Support</button>
            `;
            break;
        case 'payment pending':
            actionsContainer.innerHTML = `
                <button class="order-action-btn primary urgent">Complete Payment</button>
                <a href="/order-details?id=${orderCard.dataset.orderId}" class="order-action-btn secondary">View Details</a>
            `;
            break;
        default:
            actionsContainer.innerHTML = `
                <a href="/order-details?id=${orderCard.dataset.orderId}" class="order-action-btn primary">View Details</a>
                <button class="order-action-btn secondary">Contact Support</button>
            `;
    }
}

// Animation helper for better UX
function animateElement(element, animationClass, duration = 1000) {
    if (!element) return;
    
    element.classList.add(animationClass);
    
    setTimeout(() => {
        element.classList.remove(animationClass);
    }, duration);
}

// Order Details Page specific functionality
function initOrderDetailsPage() {
    // Track package button functionality
    const trackButton = document.querySelector('.track-package-btn');
    if (trackButton) {
        trackButton.addEventListener('click', function() {
            // In a real app, this would open tracking modal or redirect to tracking page
            alert('Opening package tracking...');
        });
    }
    
    // Buy again buttons
    const buyAgainButtons = document.querySelectorAll('.order-action-btn:contains("Buy Again"), .order-details-action-btn:contains("Buy Again")');
    buyAgainButtons.forEach(button => {
        button.addEventListener('click', function() {
            // In a real app, this would add items to cart
            animateElement(this, 'animate-pulse');
            // Optionally show success message
            showNotification('Item added to cart!', 'success');
        });
    });
    
    // Review buttons
    const reviewButtons = document.querySelectorAll('.review-btn, .order-action-btn:contains("Review")');
    reviewButtons.forEach(button => {
        button.addEventListener('click', function() {
            // In a real app, this would open review modal
            showNotification('Review form would open here', 'info');
        });
    });
}

// Simple notification system
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '8px',
        color: 'white',
        fontSize: '14px',
        fontWeight: '500',
        zIndex: '9999',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease'
    });
    
    // Set background color based on type
    switch(type) {
        case 'success':
            notification.style.background = '#10b981';
            break;
        case 'error':
            notification.style.background = '#ef4444';
            break;
        case 'warning':
            notification.style.background = '#f59e0b';
            break;
        default:
            notification.style.background = '#3b82f6';
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Initialize order details page if we're on that page
if (window.location.pathname.includes('order-details')) {
    document.addEventListener('DOMContentLoaded', initOrderDetailsPage);
}