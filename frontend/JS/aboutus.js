// Simple About Us JavaScript - Add to your existing script.js

// Mobile menu functionality (if not already in your main script.js)
document.addEventListener('DOMContentLoaded', function() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('.nav');
    
    if (mobileToggle && nav) {
        mobileToggle.addEventListener('click', function() {
            nav.classList.toggle('active');
        });
    }

    // Platform button click tracking (optional)
    const platformButtons = document.querySelectorAll('.platform-btn');
    platformButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const platform = this.textContent.trim();
            console.log(`Clicked on ${platform}`);
            
            // You can add analytics tracking here if needed
            // Example: gtag('event', 'platform_click', { 'platform': platform });
        });
    });
});