// Simplified Success Page JavaScript - Asian E-commerce Style

document.addEventListener('DOMContentLoaded', function() {
    initializeOrderSuccess();
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