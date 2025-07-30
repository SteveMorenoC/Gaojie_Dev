// Debug cart.js - replace entire file

document.addEventListener('DOMContentLoaded', function() {
    console.log('Cart page loaded');
    loadCartFromLocalStorage();
    setupEventListeners();
});

function loadCartFromLocalStorage() {
    const cart = JSON.parse(localStorage.getItem('gaojie_cart')) || [];
    console.log('Loading cart:', cart);
    
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartCountEl = document.querySelector('.cart-count');
    
    if (cart.length === 0) {
        showEmptyCart();
        return;
    }
    
    // Clear existing content
    if (cartItemsContainer) {
        cartItemsContainer.innerHTML = '';
        
        // Add each item
        cart.forEach(item => {
            console.log('Adding item to DOM:', item);
            const itemElement = createCartItemElement(item);
            cartItemsContainer.appendChild(itemElement);
        });
    }
    
    // Update cart count
    if (cartCountEl) {
        cartCountEl.textContent = `${cart.length} items`;
    }
    
    // Update totals
    updateAllTotals();
}

function createCartItemElement(item) {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.dataset.itemId = item.id;
    
    console.log('Creating element for item:', item.id, 'type:', typeof item.id);
    
    div.innerHTML = `
        <div class="item-image">
            <img src="${item.image || 'https://via.placeholder.com/150'}" alt="${item.name}" loading="lazy">
        </div>
        <div class="item-details">
            <h3 class="item-title">${item.name}</h3>
            <p class="item-description">Premium skincare product</p>
            <div class="item-features">
                <span class="feature-item">✓ Free Returns</span>
                <span class="feature-item">✓ Dermatologist Tested</span>
            </div>
        </div>
        <div class="item-actions">
            <div class="quantity-controls">
                <button class="qty-btn" onclick="changeQuantity('${item.id}', -1)">−</button>
                <input type="number" value="${item.quantity}" min="1" class="qty-input" readonly>
                <button class="qty-btn" onclick="changeQuantity('${item.id}', 1)">+</button>
            </div>
            <div class="item-pricing">
                <div class="price-info">
                    <span class="current-price">฿${item.price.toLocaleString()}</span>
                </div>
                <div class="item-total">
                    Total: ฿${(item.price * item.quantity).toLocaleString()}
                </div>
                <button class="remove-btn" onclick="removeItem('${item.id}')">Remove</button>
            </div>
        </div>
    `;
    
    return div;
}

function changeQuantity(itemId, change) {
    console.log('=== CHANGE QUANTITY DEBUG ===');
    console.log('Changing quantity for', itemId, 'by', change);
    console.log('itemId type:', typeof itemId);
    
    let cart = JSON.parse(localStorage.getItem('gaojie_cart')) || [];
    console.log('Current cart:', cart);
    
    // Debug: log all item IDs and their types
    cart.forEach((item, index) => {
        console.log(`Item ${index}: id = "${item.id}" (type: ${typeof item.id})`);
    });
    
    // Try both string and number comparison
    let itemIndex = cart.findIndex(item => item.id === itemId);
    console.log('String comparison result:', itemIndex);
    
    if (itemIndex === -1) {
        // Try converting to number
        itemIndex = cart.findIndex(item => item.id == itemId); // == instead of ===
        console.log('Loose comparison result:', itemIndex);
    }
    
    if (itemIndex === -1) {
        // Try converting itemId to number
        const numericItemId = parseInt(itemId);
        itemIndex = cart.findIndex(item => item.id === numericItemId);
        console.log('Numeric comparison result:', itemIndex);
    }
    
    if (itemIndex !== -1) {
        console.log('Found item at index:', itemIndex);
        console.log('Current quantity:', cart[itemIndex].quantity);
        
        cart[itemIndex].quantity += change;
        console.log('New quantity:', cart[itemIndex].quantity);
        
        if (cart[itemIndex].quantity <= 0) {
            console.log('Removing item (quantity <= 0)');
            cart.splice(itemIndex, 1);
        }
        
        localStorage.setItem('gaojie_cart', JSON.stringify(cart));
        console.log('Saved to localStorage:', cart);
        
        // Instead of reloading, let's update the display directly
        updateCartDisplay();
    } else {
        console.log('ERROR: Item not found in cart!');
        console.log('Looking for itemId:', itemId, 'type:', typeof itemId);
        console.log('Available items:', cart.map(item => ({ id: item.id, type: typeof item.id })));
    }
}

function removeItem(itemId) {
    console.log('=== REMOVE ITEM DEBUG ===');
    console.log('Removing item:', itemId);
    console.log('itemId type:', typeof itemId);
    
    let cart = JSON.parse(localStorage.getItem('gaojie_cart')) || [];
    console.log('Cart before removal:', cart);
    
    // Try different comparison methods
    const originalLength = cart.length;
    cart = cart.filter(item => item.id != itemId); // Use != for loose comparison
    
    console.log('Items removed:', originalLength - cart.length);
    console.log('Cart after removal:', cart);
    
    localStorage.setItem('gaojie_cart', JSON.stringify(cart));
    
    // Update display instead of reloading
    updateCartDisplay();
}

function updateCartDisplay() {
    console.log('Updating cart display...');
    
    const cart = JSON.parse(localStorage.getItem('gaojie_cart')) || [];
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartCountEl = document.querySelector('.cart-count');
    
    if (cart.length === 0) {
        showEmptyCart();
        return;
    }
    
    // Clear and rebuild
    if (cartItemsContainer) {
        cartItemsContainer.innerHTML = '';
        
        cart.forEach(item => {
            const itemElement = createCartItemElement(item);
            cartItemsContainer.appendChild(itemElement);
        });
    }
    
    // Update cart count
    if (cartCountEl) {
        cartCountEl.textContent = `${cart.length} items`;
    }
    
    // Update totals
    updateAllTotals();
    
    console.log('Cart display updated successfully');
}

function updateAllTotals() {
    const cart = JSON.parse(localStorage.getItem('gaojie_cart')) || [];
    let subtotal = 0;
    
    cart.forEach(item => {
        subtotal += item.price * item.quantity;
    });
    
    const shipping = subtotal >= 999 ? 0 : 100;
    const tax = subtotal * 0.07;
    const total = subtotal + shipping + tax;
    
    console.log('Updating totals:', { subtotal, shipping, tax, total });
    
    // Update all summary elements
    const subtotalEl = document.querySelector('.detail-row:first-child span:last-child');
    const shippingEl = document.querySelector('.detail-row:nth-child(3) span:last-child'); // Adjust index if needed
    const taxEl = document.querySelector('.detail-row.tax span:last-child');
    const totalElement = document.querySelector('.detail-row.total span:last-child');
    
    if (subtotalEl) {
        subtotalEl.textContent = `฿${subtotal.toLocaleString()}`;
        console.log('Updated subtotal');
    }
    
    if (shippingEl) {
        shippingEl.textContent = shipping === 0 ? 'FREE' : `฿${shipping}`;
        console.log('Updated shipping');
    }
    
    if (taxEl) {
        taxEl.textContent = `฿${Math.round(tax).toLocaleString()}`;
        console.log('Updated tax');
    }
    
    if (totalElement) {
        totalElement.textContent = `฿${Math.round(total).toLocaleString()}`;
        console.log('Updated total');
    }
    
    // Update header cart count
    const bagCounts = document.querySelectorAll('.bag-count');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    bagCounts.forEach(count => {
        count.textContent = totalItems;
    });
}

function showEmptyCart() {
    const cartItemsContainer = document.querySelector('.cart-items');
    if (cartItemsContainer) {
        cartItemsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <h3>Your cart is empty</h3>
                <p>Browse our products and add items to your cart.</p>
                <a href="main.html" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #31e230; color: white; text-decoration: none; border-radius: 6px;">Continue Shopping</a>
            </div>
        `;
    }
}

function setupEventListeners() {
    // Checkout button
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            const cart = JSON.parse(localStorage.getItem('gaojie_cart')) || [];
            if (cart.length === 0) {
                alert('Your cart is empty!');
                return;
            }
            window.location.href = 'checkout.html';
        });
    }
}

// Global functions for onclick handlers
window.changeQuantity = changeQuantity;
window.removeItem = removeItem;