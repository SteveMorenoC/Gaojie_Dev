// Returns & Refunds Page JavaScript - Add to your existing script.js

document.addEventListener('DOMContentLoaded', function() {
    // Language Toggle Functionality
    const langButtons = document.querySelectorAll('.lang-btn');
    const contentEn = document.getElementById('content-en');
    const contentTh = document.getElementById('content-th');
    
    if (langButtons.length > 0 && contentEn && contentTh) {
        langButtons.forEach(button => {
            button.addEventListener('click', function() {
                const selectedLang = this.getAttribute('data-lang');
                
                // Update active button
                langButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Show/hide content
                if (selectedLang === 'en') {
                    contentEn.style.display = 'block';
                    contentTh.style.display = 'none';
                } else {
                    contentEn.style.display = 'none';
                    contentTh.style.display = 'block';
                }
                
                // Optional: Save language preference
                localStorage.setItem('returns-language', selectedLang);
            });
        });
        
        // Load saved language preference (optional)
        const savedLang = localStorage.getItem('returns-language');
        if (savedLang) {
            const targetButton = document.querySelector(`[data-lang="${savedLang}"]`);
            if (targetButton) {
                targetButton.click();
            }
        }
    }
    
    // Mobile menu functionality (if not already in your main script.js)
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('.nav');
    
    if (mobileToggle && nav) {
        mobileToggle.addEventListener('click', function() {
            nav.classList.toggle('active');
        });
    }
    
    // Smooth scroll to contact section when clicking email/phone links
    const contactLinks = document.querySelectorAll('a[href^="mailto:"], a[href^="tel:"]');
    contactLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Let the default action happen (open email/phone app)
            // But also scroll to contact section smoothly
            setTimeout(() => {
                const contactSection = document.querySelector('.contact-section');
                if (contactSection) {
                    contactSection.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'center'
                    });
                }
            }, 100);
        });
    });
    
    // Add fade-in animation for content sections
    function addFadeInAnimation() {
        const sections = document.querySelectorAll('.policy-section, .contact-section');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        sections.forEach(section => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(20px)';
            section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(section);
        });
    }
    
    // Initialize animations
    addFadeInAnimation();
});