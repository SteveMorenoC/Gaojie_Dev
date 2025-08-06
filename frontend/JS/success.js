// Simplified Success Page JavaScript - Asian E-commerce Style

document.addEventListener('DOMContentLoaded', function() {
    initializeOrderSuccess();
    loadOrderData();
});

function initializeOrderSuccess() {
    // Setup button interactions
    setupButtonStates();
    
    // Mobile menu functionality (inherited from main page)
    setupMobileMenu();
    
    // Order number copy functionality
    setupOrderCopy();
    
    // Animate timeline completion
    animateTimeline();
}

// Setup button loading states
function setupButtonStates() {
    const trackBtn = document.querySelector('.order-btn-primary');
    const shopBtn = document.querySelector('.order-btn-secondary');
    
    if (trackBtn) {
        trackBtn.addEventListener('click', function(e) {
            // Add loading state for better UX
            const originalText = this.textContent;
            this.textContent = 'Loading...';
            this.disabled = true;
            
            // Restore after brief delay (navigation will happen via href)
            setTimeout(() => {
                this.textContent = originalText;
                this.disabled = false;
            }, 1000);
        });
    }
}

// Order number copy to clipboard
function setupOrderCopy() {
    const orderNumber = document.querySelector('.order-info-row .order-value');
    
    if (orderNumber && orderNumber.textContent.includes('#GAO-')) {
        orderNumber.style.cursor = 'pointer';
        orderNumber.title = 'Tap to copy order number';
        
        orderNumber.addEventListener('click', function() {
            const orderNum = this.textContent.trim();
            
            // Try to copy to clipboard
            if (navigator.clipboard) {
                navigator.clipboard.writeText(orderNum).then(() => {
                    showCopySuccess(this);
                }).catch(() => {
                    fallbackCopy(orderNum);
                });
            } else {
                fallbackCopy(orderNum);
            }
        });
    }
}

// Show copy success feedback
function showCopySuccess(element) {
    const original = element.textContent;
    element.textContent = 'Copied!';
    element.style.color = '#10B981';
    
    setTimeout(() => {
        element.textContent = original;
        element.style.color = '';
    }, 1500);
}

// Fallback copy method
function fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
        document.execCommand('copy');
        console.log('Order number copied');
    } catch (err) {
        console.log('Copy not supported');
    }
    
    document.body.removeChild(textArea);
}

// Animate timeline progression
function animateTimeline() {
    const completedSteps = document.querySelectorAll('.timeline-step.completed');
    
    completedSteps.forEach((step, index) => {
        setTimeout(() => {
            step.style.animation = `timeline-complete 0.5s ease-out ${index * 0.2}s both`;
        }, 500);
    });
}

// Mobile menu setup (inherited from main page)
function setupMobileMenu() {
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const nav = document.getElementById('main-nav');
    
    if (mobileToggle && nav) {
        mobileToggle.addEventListener('click', function() {
            const isOpen = nav.classList.contains('nav-open');
            
            if (isOpen) {
                nav.classList.remove('nav-open');
                this.setAttribute('aria-expanded', 'false');
            } else {
                nav.classList.add('nav-open');
                this.setAttribute('aria-expanded', 'true');
            }
        });
    }
}

// Add timeline animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes timeline-complete {
        0% {
            opacity: 0;
            transform: translateX(-10px);
        }
        100% {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style);

// Simple utility functions
const OrderUtils = {
    // Format Thai currency
    formatThai: function(amount) {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB'
        }).format(amount);
    },
    
    // Simple sharing if supported
    shareOrder: function() {
        if (navigator.share) {
            navigator.share({
                title: 'GAOJIE Order',
                text: 'My skincare order is on the way!',
                url: window.location.href
            });
        }
    }
};

// Keyboard shortcuts (simplified)
document.addEventListener('keydown', function(e) {
    // Press 'T' to track order (mobile-friendly)
    if ((e.key === 't' || e.key === 'T') && !e.target.matches('input')) {
        e.preventDefault();
        const trackBtn = document.querySelector('.order-btn-primary');
        if (trackBtn) trackBtn.click();
    }
});

// Dynamic Order Loading System
async function loadOrderData() {
    try {
        // Get order number from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const orderNumber = urlParams.get('order');
        
        if (!orderNumber) {
            console.error('No order number found in URL');
            showOrderError('Order information not found');
            return;
        }
        
        console.log('Loading order data for:', orderNumber);
        
        // Fetch order data from API
        const response = await fetch(`/api/orders/${orderNumber}`);
        const data = await response.json();
        
        if (data.status === 'success' && data.order) {
            populateOrderData(data.order);
        } else {
            throw new Error(data.message || 'Failed to load order data');
        }
        
    } catch (error) {
        console.error('Error loading order data:', error);
        showOrderError('Unable to load order information');
    }
}

function populateOrderData(order) {
    try {
        console.log('Populating order data:', order);
        
        // Update order number
        const orderNumberElement = document.querySelector('.order-info-row .order-value');
        if (orderNumberElement && order.order_number) {
            orderNumberElement.textContent = `#${order.order_number}`;
        }
        
        // Update total amount
        const totalElement = document.querySelector('.order-total');
        if (totalElement && order.total_amount) {
            totalElement.textContent = OrderUtils.formatThai(order.total_amount);
        }
        
        // Update delivery information
        const deliveryElement = document.querySelector('.order-value:last-child');
        if (deliveryElement && order.shipping) {
            const shortName = formatShortName(order.shipping.full_name);
            const shortAddress = formatShortAddress(order.shipping);
            deliveryElement.textContent = `${shortName} • ${shortAddress}`;
        }
        
        // Update email in additional info
        const emailInfoElement = document.querySelector('.order-additional-info p:first-child');
        if (emailInfoElement && order.customer && order.customer.email) {
            emailInfoElement.innerHTML = `📧 Order confirmation sent to ${order.customer.email}`;
        }
        
        // Update tracking number (generated by backend)
        if (order.tracking_number) {
            updateTrackingInfo(order.tracking_number);
        }
        
        // Update delivery timeline
        updateDeliveryTimeline(order);
        
        // Update page title
        document.title = `Order ${order.order_number} Confirmed - GAOJIE`;
        
        console.log('Order data populated successfully');
        
    } catch (error) {
        console.error('Error populating order data:', error);
        showOrderError('Error displaying order information');
    }
}

function formatShortName(fullName) {
    if (!fullName) return 'Customer';
    const parts = fullName.split(' ');
    if (parts.length <= 1) return fullName;
    return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}

function formatShortAddress(shipping) {
    if (!shipping) return 'Thailand';
    return `${shipping.city} ${shipping.postal_code}`;
}

// Note: Tracking numbers are now generated on the backend

function updateTrackingInfo(trackingNumber) {
    // Add tracking number to timeline or create a new info element
    const timelineCard = document.querySelector('.delivery-timeline-card');
    if (timelineCard && trackingNumber) {
        const trackingInfo = document.createElement('div');
        trackingInfo.className = 'tracking-info';
        trackingInfo.innerHTML = `
            <div style="margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #10B981;">
                <div style="font-weight: 600; color: #374151; margin-bottom: 0.5rem;">Tracking Number</div>
                <div style="font-family: monospace; font-size: 1.1rem; color: #10B981; cursor: pointer;" onclick="copyTrackingNumber('${trackingNumber}')" title="Click to copy">${trackingNumber}</div>
                <div style="font-size: 0.875rem; color: #6b7280; margin-top: 0.25rem;">Click to copy • Available once shipped</div>
            </div>
        `;
        timelineCard.appendChild(trackingInfo);
    }
}

function copyTrackingNumber(trackingNumber) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(trackingNumber).then(() => {
            showCopySuccess(event.target);
        });
    }
}

function updateDeliveryTimeline(order) {
    try {
        // Calculate estimated delivery dates
        const orderDate = new Date(order.created_at);
        const estimatedDelivery = calculateDeliveryDate(orderDate, order.shipping);
        
        // Update timeline dates
        const deliveryStepTime = document.querySelector('.timeline-step:last-child .timeline-step-time');
        if (deliveryStepTime) {
            deliveryStepTime.textContent = formatDateRange(estimatedDelivery.start, estimatedDelivery.end);
        }
        
        // Update order confirmed time to actual order time
        const confirmedStepTime = document.querySelector('.timeline-step:first-child .timeline-step-time');
        if (confirmedStepTime) {
            confirmedStepTime.textContent = formatOrderTime(orderDate);
        }
        
    } catch (error) {
        console.error('Error updating delivery timeline:', error);
    }
}

function calculateDeliveryDate(orderDate, shipping) {
    const processingDays = 1; // 1 day processing
    const shippingDays = isInBangkok(shipping) ? 1 : 3; // 1-2 days Bangkok, 2-4 days other areas
    
    const startDate = new Date(orderDate);
    startDate.setDate(startDate.getDate() + processingDays + shippingDays);
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    
    return { start: startDate, end: endDate };
}

function isInBangkok(shipping) {
    if (!shipping || !shipping.city) return false;
    const city = shipping.city.toLowerCase();
    return city.includes('bangkok') || city.includes('กรุงเทพ');
}

function formatDateRange(startDate, endDate) {
    const options = { month: 'short', day: 'numeric' };
    const start = startDate.toLocaleDateString('en-US', options);
    const end = endDate.toLocaleDateString('en-US', options);
    return `${start}-${end}`;
}

function formatOrderTime(orderDate) {
    const now = new Date();
    const diffMinutes = Math.floor((now - orderDate) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    return orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function showOrderError(message) {
    // Show error message and hide order details
    const container = document.querySelector('.order-success-container');
    if (container) {
        container.innerHTML = `
            <div class="order-success-header">
                <div class="order-success-icon" style="background: #ef4444;">
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                        <circle cx="32" cy="32" r="32" fill="#ef4444"/>
                        <path d="M22 22L42 42M42 22L22 42" stroke="white" stroke-width="4" stroke-linecap="round"/>
                    </svg>
                </div>
                <h1 class="order-success-title">Order Information Unavailable</h1>
                <p class="order-success-subtitle">${message}</p>
            </div>
            <div class="order-actions">
                <a href="/" class="order-btn order-btn-secondary">Return to Home</a>
                <a href="/contact" class="order-btn order-btn-primary">Contact Support</a>
            </div>
        `;
    }
}