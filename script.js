// ========================================
// VELORA - Complete JavaScript
// Luxury Watches Store
// ========================================

// ========== 1. SHOPPING CART SYSTEM ==========

let cart = [];
let cartCount = 0;

// Load cart from localStorage
function loadCart() {
    const savedCart = localStorage.getItem('veloraCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    }
    updateCartCount();
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('veloraCart', JSON.stringify(cart));
    cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    updateCartCount();
}

// Update cart count display
function updateCartCount() {
    const cartCountElement = document.querySelector('.cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = cartCount;
        cartCountElement.style.display = cartCount > 0 ? 'inline-block' : 'inline-block';
    }
}

// Add to cart
function addToCart(productName, productImage, price = 299) {
    const existingItem = cart.find(item => item.name === productName);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: Date.now(),
            name: productName,
            image: productImage,
            price: price,
            quantity: 1
        });
    }
    
    saveCart();
    showNotification(`✅ "${productName}" added to cart!`, 'success');
}

// Show cart details
function showCartDetails() {
    if (cart.length === 0) {
        alert('🛒 Your cart is currently empty.');
        return;
    }
    
    let cartMessage = '🛍️ Your Cart:\n\n';
    let total = 0;
    
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        cartMessage += `${index + 1}. ${item.name}\n   Quantity: ${item.quantity} × $${item.price} = $${itemTotal}\n\n`;
    });
    
    cartMessage += `━━━━━━━━━━━━━━━━\n💰 Total: $${total}\n━━━━━━━━━━━━━━━━\n\n`;
    cartMessage += `✅ Click OK to proceed to checkout`;
    
    if (confirm(cartMessage + '\n\nDo you want to complete your purchase?')) {
        checkout();
    }
}

// ========== 2. CHECKOUT SYSTEM ==========

function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty.');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Collect customer info
    const customerName = prompt('📝 Enter your full name:', '');
    if (!customerName) return;
    
    const customerPhone = prompt('📱 Enter your phone number:', '');
    if (!customerPhone) return;
    
    const customerEmail = prompt('📧 Enter your email address:', '');
    if (!customerEmail) return;
    
    const deliveryAddress = prompt('📍 Enter your delivery address:', '');
    if (!deliveryAddress) return;
    
    // Create order
    const order = {
        id: 'ORD-' + Date.now(),
        customer: {
            name: customerName,
            phone: customerPhone,
            email: customerEmail,
            address: deliveryAddress
        },
        items: [...cart],
        total: total,
        date: new Date().toLocaleString(),
        status: 'confirmed'
    };
    
    // Save order
    let orders = JSON.parse(localStorage.getItem('veloraOrders') || '[]');
    orders.push(order);
    localStorage.setItem('veloraOrders', JSON.stringify(orders));
    
    // Clear cart
    cart = [];
    saveCart();
    
    // Send WhatsApp confirmation
    sendWhatsAppConfirmation(order);
    
    alert(`✅ Order confirmed!\n\nOrder Number: ${order.id}\nTotal: $${total}\n\nA WhatsApp confirmation has been sent.`);
    showNotification(`🎉 Thank you ${customerName}! Order confirmed.`, 'success');
}

// ========== 3. WHATSAPP CONFIRMATION ==========

function sendWhatsAppConfirmation(order) {
    const customerPhone = order.customer.phone;
    
    if (!customerPhone) {
        showNotification('⚠️ No phone number provided.', 'error');
        return;
    }
    
    // Clean phone number
    let cleanPhone = customerPhone.toString().replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
        cleanPhone = cleanPhone.substring(1);
    }
    
    // Build message
    const orderItems = order.items.map(item => 
        `• ${item.name} (${item.quantity} × $${item.price} = $${item.price * item.quantity})`
    ).join('\n');
    
    const message = `⌚ *VELORA* ⌚
    
━━━━━━━━━━━━━━━━━━━━
*✅ ORDER CONFIRMATION*
━━━━━━━━━━━━━━━━━━━━

👤 *Customer:* ${order.customer.name}
📦 *Order #:* ${order.id}
📅 *Date:* ${order.date}

*🛒 Products:*
${orderItems}

━━━━━━━━━━━━━━━━━━━━
💰 *Total:* $${order.total}
━━━━━━━━━━━━━━━━━━━━

📍 *Delivery:* ${order.customer.address}

*Thank you for shopping at VELORA!* ⌚

We will deliver your order soon.`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
}

// ========== 4. FAVORITES SYSTEM ==========

let favorites = [];

function loadFavorites() {
    const savedFavorites = localStorage.getItem('veloraFavorites');
    if (savedFavorites) {
        favorites = JSON.parse(savedFavorites);
    }
    updateFavoritesUI();
}

function saveFavorites() {
    localStorage.setItem('veloraFavorites', JSON.stringify(favorites));
}

function updateFavoritesUI() {
    const heartIcons = document.querySelectorAll('.work-layer .fa-heart');
    heartIcons.forEach(heart => {
        const workLayer = heart.closest('.work-layer');
        const productName = workLayer?.querySelector('h3')?.textContent;
        
        if (productName && favorites.includes(productName)) {
            heart.classList.add('liked');
            heart.style.color = '#e91e63';
        } else {
            heart.classList.remove('liked');
            heart.style.color = '';
        }
    });
}

function addLikeInteractions() {
    const heartIcons = document.querySelectorAll('.work-layer .fa-heart');
    
    heartIcons.forEach(heart => {
        heart.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const workLayer = this.closest('.work-layer');
            const productName = workLayer?.querySelector('h3')?.textContent || 'Product';
            
            if (this.classList.contains('liked')) {
                this.classList.remove('liked');
                this.style.color = '';
                favorites = favorites.filter(f => f !== productName);
                showNotification('❤️ Removed from favorites', 'info');
            } else {
                this.classList.add('liked');
                this.style.color = '#e91e63';
                if (productName && !favorites.includes(productName)) {
                    favorites.push(productName);
                }
                showNotification('💖 Added to favorites!', 'success');
            }
            
            saveFavorites();
        });
    });
}

// ========== 5. PURCHASE BUTTONS ==========

function addPurchaseButtons() {
    const productImages = document.querySelectorAll('.work-item img');
    
    productImages.forEach(img => {
        // Make image clickable to add to cart
        img.addEventListener('dblclick', function(e) {
            e.preventDefault();
            
            const workItem = this.closest('.work-item');
            const productName = workItem?.querySelector('.work-layer h3')?.textContent || 'Watch';
            const productImage = this.src;
            const price = 299; // Default price
            
            addToCart(productName, productImage, price);
            setTimeout(() => showCartDetails(), 800);
        });
        
        // Add tooltip for double click
        img.title = 'Double click to add to cart';
    });
}

// ========== 6. SEARCH FUNCTIONALITY ==========

function setupSearch() {
    const searchInput = document.querySelector('.header input');
    const searchIcon = document.querySelector('.searchicon');
    
    if (searchIcon && searchInput) {
        searchIcon.addEventListener('click', function() {
            const searchTerm = searchInput.value.trim().toLowerCase();
            if (searchTerm === '') {
                alert('🔍 Please enter a watch name or category to search.');
            } else {
                alert(`🔍 Searching for: "${searchTerm}"\n\nTry: Men's Watches, Women's Watches, Luxury, Sport, Classic, Automatic, Quartz`);
            }
        });
        
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchIcon.click();
            }
        });
    }
}

// ========== 7. SHOP NOW / BUTTON FUNCTIONALITY ==========

function setupButtons() {
    // Learn More button
    const btn1 = document.querySelector('.btn1');
    if (btn1) {
        btn1.addEventListener('click', function() {
            const featuredSection = document.querySelector('.featured');
            if (featuredSection) {
                featuredSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    // Get Started button
    const btn2 = document.querySelector('.btn2');
    if (btn2) {
        btn2.addEventListener('click', function() {
            const whySection = document.querySelector('.why');
            if (whySection) {
                whySection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    // Explore Our Journey button
    const statBtn = document.querySelector('.stat-btn');
    if (statBtn) {
        statBtn.addEventListener('click', function() {
            const artSection = document.querySelector('.art-time');
            if (artSection) {
                artSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
}

// ========== 8. CART ICON ==========

function setupCartIcon() {
    const cartIcon = document.getElementById('cartIconBtn');
    if (cartIcon) {
        cartIcon.addEventListener('click', function(e) {
            e.preventDefault();
            showCartDetails();
        });
    }
}

// ========== 9. ANIMATED STATISTICS ==========

function animateStats() {
    const statElements = document.querySelectorAll('.stat h3');
    
    // For the "A Legacy That Ticks Beyond Time" text
    statElements.forEach(stat => {
        if (stat.dataset.animated === 'true') return;
        
        // Make it visible with animation
        stat.style.opacity = '1';
        stat.style.transform = 'translateY(0)';
    });
}

// ========== 10. PAGE LOAD ANIMATION ==========

function setupPageLoad() {
    const elements = document.querySelectorAll('.work-item, .info, .stat');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    elements.forEach(el => {
        if (!el.style.opacity || el.style.opacity === '0') {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'all 0.6s ease';
            observer.observe(el);
        }
    });
}

// ========== 11. NOTIFICATION SYSTEM ==========

function showNotification(message, type = 'success') {
    const oldNotification = document.querySelector('.custom-notification');
    if (oldNotification) oldNotification.remove();
    
    const colors = {
        success: '#2ecc71',
        error: '#e74c3c',
        info: '#3498db',
        warning: '#f39c12'
    };
    
    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    notification.innerHTML = `
        <div style="
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${colors[type] || colors.success};
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            z-index: 9999;
            font-family: 'Segoe UI', sans-serif;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease;
            max-width: 380px;
        ">
            ${message}
        </div>
    `;
    
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            .liked {
                color: #e91e63 !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3500);
}

// ========== 12. SCROLL TO TOP BUTTON ==========

function setupScrollToTop() {
    const scrollBtn = document.createElement('button');
    scrollBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    scrollBtn.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: #e91e63;
        color: white;
        border: none;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        font-size: 20px;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 1000;
        box-shadow: 0 4px 15px rgba(233, 30, 99, 0.4);
    `;
    document.body.appendChild(scrollBtn);
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 400) {
            scrollBtn.style.opacity = '1';
            scrollBtn.style.visibility = 'visible';
        } else {
            scrollBtn.style.opacity = '0';
            scrollBtn.style.visibility = 'hidden';
        }
    });
    
    scrollBtn.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ========== 13. SOCIAL MEDIA LINKS ==========

function setupSocialLinks() {
    const socialIcons = document.querySelectorAll('.footer-ul i');
    
    socialIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            const platform = this.className.split('-')[1] || 'social';
            showNotification(`🌐 Connecting to ${platform}...`, 'info');
        });
    });
}

// ========== 14. NEWSLETTER SUBSCRIPTION ==========

function setupNewsletter() {
    // Create a simple newsletter signup
    const footer = document.querySelector('.footer');
    if (footer) {
        const newsletterDiv = document.createElement('div');
        newsletterDiv.style.cssText = `
            text-align: center;
            padding: 20px;
            margin: 20px auto;
            max-width: 500px;
        `;
        newsletterDiv.innerHTML = `
            <h3 style="color: #e91e63;">Subscribe to VELORA</h3>
            <p style="color: #666; margin-bottom: 15px;">Get exclusive offers and new collection updates</p>
            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                <input type="email" placeholder="Enter your email" id="newsletterEmail" style="
                    padding: 10px 15px;
                    border: 2px solid #ddd;
                    border-radius: 25px;
                    flex: 1;
                    min-width: 200px;
                ">
                <button id="newsletterBtn" style="
                    padding: 10px 25px;
                    background: #e91e63;
                    color: white;
                    border: none;
                    border-radius: 25px;
                    cursor: pointer;
                ">Subscribe</button>
            </div>
        `;
        
        // Insert after footer content
        const contentFooter = footer.querySelector('.content-footer');
        if (contentFooter) {
            contentFooter.appendChild(newsletterDiv);
        }
        
        // Add event listener
        const subscribeBtn = document.getElementById('newsletterBtn');
        const emailInput = document.getElementById('newsletterEmail');
        
        if (subscribeBtn && emailInput) {
            subscribeBtn.addEventListener('click', function() {
                const email = emailInput.value.trim();
                if (!email || !email.includes('@')) {
                    alert('Please enter a valid email address.');
                    return;
                }
                
                let subscribers = JSON.parse(localStorage.getItem('veloraSubscribers') || '[]');
                if (!subscribers.includes(email)) {
                    subscribers.push(email);
                    localStorage.setItem('veloraSubscribers', JSON.stringify(subscribers));
                    showNotification(`🎉 Subscribed successfully!`, 'success');
                    emailInput.value = '';
                } else {
                    showNotification('This email is already subscribed!', 'info');
                }
            });
        }
    }
}

// ========== 15. ART OF TIME - INTERACTIVE CARDS ==========

function setupArtCards() {
    const infoCards = document.querySelectorAll('.info');
    
    infoCards.forEach(card => {
        card.addEventListener('click', function() {
            const title = this.querySelector('h4')?.textContent || 'VELORA';
            const desc = this.querySelector('p')?.textContent || '';
            
            alert(`⌚ ${title}\n\n${desc}\n\nLearn more about VELORA craftsmanship.\nVisit our store to experience the quality.`);
        });
        
        // Add hover effect styling
        card.style.cursor = 'pointer';
        card.style.transition = 'all 0.3s ease';
    });
}

// ========== 16. PRODUCT QUICK VIEW ==========

function setupQuickView() {
    const productImages = document.querySelectorAll('.work-item img');
    
    productImages.forEach(img => {
        img.addEventListener('click', function(e) {
            const workItem = this.closest('.work-item');
            const productName = workItem?.querySelector('.work-layer h3')?.textContent || 'VELORA Watch';
            const productImage = this.src;
            const price = 299;
            
            // Show quick view
            const quickView = document.createElement('div');
            quickView.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 30px;
                border-radius: 15px;
                z-index: 10000;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                max-width: 400px;
                width: 90%;
                text-align: center;
            `;
            quickView.innerHTML = `
                <img src="${productImage}" alt="${productName}" style="width: 100%; max-height: 250px; object-fit: contain; border-radius: 10px;">
                <h3 style="margin: 15px 0 5px; color: #333;">${productName}</h3>
                <p style="color: #e91e63; font-size: 24px; font-weight: bold;">$${price}</p>
                <p style="color: #666; font-size: 14px;">Luxury watch with precision movement</p>
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 15px;">
                    <button onclick="closeQuickView(this)" style="padding: 10px 20px; border: none; border-radius: 8px; background: #e91e63; color: white; cursor: pointer;">Add to Cart</button>
                    <button onclick="closeQuickView(this)" style="padding: 10px 20px; border: none; border-radius: 8px; background: #f5f5f5; cursor: pointer;">Close</button>
                </div>
            `;
            
            document.body.appendChild(quickView);
            
            // Add overlay
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 9999;
            `;
            document.body.appendChild(overlay);
            
            // Close on overlay click
            overlay.addEventListener('click', function() {
                this.remove();
                quickView.remove();
            });
            
            // Add to cart from quick view
            const addBtn = quickView.querySelector('button:first-child');
            if (addBtn) {
                addBtn.addEventListener('click', function() {
                    addToCart(productName, productImage, price);
                    overlay.remove();
                    quickView.remove();
                });
            }
            
            // Close button
            const closeBtn = quickView.querySelector('button:last-child');
            if (closeBtn) {
                closeBtn.addEventListener('click', function() {
                    overlay.remove();
                    quickView.remove();
                });
            }
        });
    });
}

// Helper function for closing quick view
function closeQuickView(btn) {
    const quickView = btn.closest('div');
    const overlay = document.querySelector('div[style*="rgba(0,0,0,0.5)"]');
    if (overlay) overlay.remove();
    if (quickView) quickView.remove();
}

// ========== 17. KEYBOARD SHORTCUTS ==========

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Press 'C' to open cart
        if (e.key === 'c' || e.key === 'C') {
            if (!e.ctrlKey && !e.metaKey) {
                showCartDetails();
            }
        }
        
        // Press 'S' to focus search
        if (e.key === 's' || e.key === 'S') {
            if (!e.ctrlKey && !e.metaKey) {
                const searchInput = document.querySelector('.header input');
                if (searchInput) {
                    searchInput.focus();
                    e.preventDefault();
                }
            }
        }
        
        // Press 'Esc' to clear search
        if (e.key === 'Escape') {
            const searchInput = document.querySelector('.header input');
            if (searchInput && document.activeElement === searchInput) {
                searchInput.blur();
                searchInput.value = '';
            }
        }
    });
}

// ========== 18. INITIALIZE ALL FUNCTIONS ==========

document.addEventListener('DOMContentLoaded', function() {
    loadCart();
    loadFavorites();
    setupSearch();
    setupButtons();
    setupCartIcon();
    addPurchaseButtons();
    addLikeInteractions();
    setupSocialLinks();
    animateStats();
    setupPageLoad();
    setupScrollToTop();
    setupArtCards();
    setupQuickView();
    setupKeyboardShortcuts();
    setupNewsletter();
    
    console.log('⌚ VELORA - All functions loaded successfully!');
    console.log(`🛒 Cart items: ${cartCount}`);
    console.log(`❤️ Favorites: ${favorites.length}`);
    console.log('⌨️ Shortcuts: C=Cart, S=Search, Esc=Clear search');
});