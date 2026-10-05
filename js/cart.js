/**
 * ===================================================
 * NESIIFY CLOTHING — BROWSER-BASED CART SYSTEM (VANILLA JS)
 * ===================================================
 * 
 * Persistent cart storage via localStorage.
 * Auto-injects Cart Drawer and Badges across all pages.
 * Seamless multi-item WhatsApp checkout integration.
 */

const Cart = (() => {
  const STORAGE_KEY = 'nesiify_cart_v1';
  const CUSTOMER_KEY = 'nesiify_customer_v1';

  let _items = [];
  let _customer = { name: '', city: '' };

  /**
   * Load cart from localStorage
   */
  function loadCart() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      _items = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(_items)) _items = [];
    } catch (e) {
      console.warn('Failed to parse cart storage:', e);
      _items = [];
    }

    try {
      const cust = localStorage.getItem(CUSTOMER_KEY);
      if (cust) {
        _customer = JSON.parse(cust);
      }
    } catch (e) {
      _customer = { name: '', city: '' };
    }
  }

  /**
   * Save cart to localStorage and notify UI
   */
  function saveCart() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(_items));
    } catch (e) {
      console.error('Failed to save cart:', e);
    }
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: { count: getCount(), items: _items } }));
    updateCartUI();
  }

  /**
   * Save customer notes
   */
  function saveCustomer(name, city) {
    _customer = { name: name || '', city: city || '' };
    try {
      localStorage.setItem(CUSTOMER_KEY, JSON.stringify(_customer));
    } catch (e) {}
  }

  /**
   * Calculate total quantity in cart
   */
  function getCount() {
    return _items.reduce((total, item) => total + (Number(item.quantity) || 1), 0);
  }

  /**
   * Calculate subtotal in Rupees
   */
  function getSubtotal() {
    return _items.reduce((total, item) => total + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);
  }

  /**
   * Generate unique variant key
   */
  function makeItemKey(id, size, color) {
    const s = (size || 'std').toString().trim().toLowerCase();
    const c = (color || 'std').toString().trim().toLowerCase();
    return `${id}_${s}_${c}`;
  }

  /**
   * Add product to cart
   * @param {Object} product { id, name, price, images, ageRange, category }
   * @param {Object} selection { size, color, quantity }
   */
  function addItem(product, selection = {}) {
    if (!product || !product.id) return false;

    const size = selection.size || (product.sizes && product.sizes[0]) || 'Standard';
    const color = selection.color || (product.colors && product.colors[0]) || 'Standard';
    const quantity = Math.max(1, parseInt(selection.quantity, 10) || 1);
    const key = makeItemKey(product.id, size, color);

    const primaryImg = (product.images && product.images[0]) 
      ? product.images[0] 
      : 'assets/products/nc001-1.jpg';

    const existingIndex = _items.findIndex(i => i.key === key);

    if (existingIndex > -1) {
      _items[existingIndex].quantity = Math.min(10, _items[existingIndex].quantity + quantity);
    } else {
      _items.push({
        key,
        id: product.id,
        name: product.name,
        price: Number(product.price) || 0,
        image: primaryImg,
        size,
        color,
        ageRange: product.ageRange || '',
        category: product.category || 'Kids',
        quantity
      });
    }

    saveCart();
    showToast(`Added ${product.name} (${size}) to Bag!`, 'VIEW BAG', () => openDrawer());
    return true;
  }

  /**
   * Update quantity of an item
   */
  function updateQty(key, newQty) {
    const qty = parseInt(newQty, 10);
    const index = _items.findIndex(i => i.key === key);
    if (index === -1) return;

    if (isNaN(qty) || qty <= 0) {
      _items.splice(index, 1);
    } else {
      _items[index].quantity = Math.min(10, qty);
    }
    saveCart();
  }

  /**
   * Remove item from cart
   */
  function removeItem(key) {
    _items = _items.filter(i => i.key !== key);
    saveCart();
  }

  /**
   * Clear entire cart
   */
  function clearCart() {
    if (_items.length === 0) return;
    if (confirm('Are you sure you want to clear your shopping bag?')) {
      _items = [];
      saveCart();
    }
  }

  /**
   * Open Slide-Over Cart Drawer
   */
  function openDrawer() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartDrawerOverlay');
    if (drawer && overlay) {
      drawer.classList.add('is-open');
      overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * Close Slide-Over Cart Drawer
   */
  function closeDrawer() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartDrawerOverlay');
    if (drawer && overlay) {
      drawer.classList.remove('is-open');
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  }

  /**
   * Toggle Drawer
   */
  function toggleDrawer() {
    const drawer = document.getElementById('cartDrawer');
    if (drawer && drawer.classList.contains('is-open')) {
      closeDrawer();
    } else {
      openDrawer();
    }
  }

  /**
   * Format Rupee price
   */
  function formatINR(val) {
    const num = Number(val) || 0;
    const curr = (typeof SITE_CONFIG !== 'undefined' && SITE_CONFIG.currency) ? SITE_CONFIG.currency : '₹';
    return `${curr}${num.toLocaleString('en-IN')}`;
  }

  /**
   * Re-render Cart Drawer and Badge UI
   */
  function updateCartUI() {
    const count = getCount();
    const subtotal = getSubtotal();

    // 1. Update all badges
    document.querySelectorAll('.cart-count-badge').forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-flex' : 'none';
    });

    document.querySelectorAll('.nav-cart-btn').forEach(btn => {
      if (count > 0) {
        btn.classList.add('has-items');
      } else {
        btn.classList.remove('has-items');
      }
    });

    // 2. Update Drawer Header Count
    const headerBadge = document.getElementById('cartHeaderBadge');
    if (headerBadge) {
      headerBadge.textContent = `${count} ${count === 1 ? 'item' : 'items'}`;
    }

    // 3. Render Drawer Body
    const bodyEl = document.getElementById('cartDrawerBody');
    const footerEl = document.getElementById('cartDrawerFooter');

    if (!bodyEl) return;

    if (_items.length === 0) {
      bodyEl.innerHTML = `
        <div class="cart-empty-state">
          <div class="cart-empty-icon">
            <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
          </div>
          <h3 class="cart-empty-title">Your Bag is Empty</h3>
          <p class="cart-empty-desc">Explore comfortable, everyday kidswear crafted for play and movement (Ages 2–12).</p>
          <a href="shop.html" class="btn btn-primary" onclick="Cart.closeDrawer()">EXPLORE COLLECTION</a>
        </div>
      `;
      if (footerEl) footerEl.style.display = 'none';
      return;
    }

    if (footerEl) footerEl.style.display = 'flex';

    // Render items list
    bodyEl.innerHTML = `
      <div class="cart-items-list">
        ${_items.map(item => {
          const itemTotal = item.price * item.quantity;
          const basePath = (window.location.pathname.includes('/policies/') || window.location.pathname.includes('/admin/')) ? '../' : '';
          const imgSrc = `${basePath}${item.image}`;
          const prodUrl = `${basePath}product.html?id=${encodeURIComponent(item.id)}`;

          return `
            <div class="cart-item" data-key="${item.key}">
              <div class="cart-item-media">
                <a href="${prodUrl}" onclick="Cart.closeDrawer()">
                  <img src="${imgSrc}" alt="${item.name}" loading="lazy" onerror="this.src='${basePath}assets/products/nc001-1.jpg'">
                </a>
              </div>
              <div class="cart-item-info">
                <div class="cart-item-header">
                  <a href="${prodUrl}" class="cart-item-name" onclick="Cart.closeDrawer()">${item.name}</a>
                  <button type="button" class="cart-item-remove-btn" title="Remove item" onclick="Cart.removeItem('${item.key}')">
                    <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
                <div class="cart-item-variants">
                  <span class="cart-variant-tag">Code: <strong>${item.id}</strong></span>
                  <span class="cart-variant-tag">Size: <strong>${item.size}</strong></span>
                  <span class="cart-variant-tag">Color: <strong>${item.color}</strong></span>
                  ${item.ageRange ? `<span class="cart-variant-tag">Age: <strong>${item.ageRange}</strong></span>` : ''}
                </div>
                <div class="cart-item-footer">
                  <div class="cart-qty-stepper">
                    <button type="button" class="cart-qty-btn" onclick="Cart.updateQty('${item.key}', ${item.quantity - 1})" aria-label="Decrease">&minus;</button>
                    <span class="cart-qty-val">${item.quantity}</span>
                    <button type="button" class="cart-qty-btn" onclick="Cart.updateQty('${item.key}', ${item.quantity + 1})" aria-label="Increase">&plus;</button>
                  </div>
                  <div class="cart-item-price-box">
                    <div class="cart-item-total">${formatINR(itemTotal)}</div>
                    <div class="cart-item-unit-price">${formatINR(item.price)} each</div>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // 4. Update Footer Totals & Inputs
    const subtotalEl = document.getElementById('cartSubtotalAmount');
    const totalEl = document.getElementById('cartGrandTotalAmount');
    const btnCheckout = document.getElementById('btnCartCheckoutWA');

    if (subtotalEl) subtotalEl.textContent = formatINR(subtotal);
    if (totalEl) totalEl.textContent = formatINR(subtotal);
    if (btnCheckout) {
      btnCheckout.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.8 14.15c-.24.68-1.2 1.25-1.72 1.33-.48.07-1.1.1-3.21-.78-2.69-1.12-4.43-3.84-4.57-4.02-.13-.18-1.1-1.46-1.1-2.79 0-1.33.7-1.98.95-2.25.24-.26.54-.33.72-.33.18 0 .36 0 .52.01.17.01.4.06.61.56.24.58.82 2 .89 2.15.07.15.11.33.02.53-.1.19-.15.31-.3.48-.15.18-.31.39-.44.52-.15.15-.31.31-.13.62.18.31.78 1.29 1.68 2.09 1.15 1.03 2.13 1.35 2.43 1.5.3.15.48.13.66-.08.18-.21.78-.91.99-1.22.21-.31.42-.26.7-.16.29.1 1.83.86 2.14 1.02.31.15.52.23.6.36.07.12.07.72-.17 1.4z"/></svg>
        <span>ORDER ON WHATSAPP &bull; ${formatINR(subtotal)}</span>
      `;
    }

    // Populate customer input fields if present
    const nameInput = document.getElementById('cartCustomerName');
    const cityInput = document.getElementById('cartCustomerCity');
    if (nameInput && !nameInput.value && _customer.name) nameInput.value = _customer.name;
    if (cityInput && !cityInput.value && _customer.city) cityInput.value = _customer.city;
  }

  /**
   * Execute WhatsApp Multi-Item Checkout
   */
  function checkoutWhatsApp() {
    if (_items.length === 0) {
      alert('Your shopping bag is empty.');
      return;
    }

    // Capture Customer Info
    const nameInput = document.getElementById('cartCustomerName');
    const cityInput = document.getElementById('cartCustomerCity');
    const custName = (nameInput && nameInput.value.trim()) || _customer.name || '';
    const custCity = (cityInput && cityInput.value.trim()) || _customer.city || '';

    saveCustomer(custName, custCity);

    // Call WhatsApp service to trigger checkout
    if (typeof WhatsAppService !== 'undefined' && typeof WhatsAppService.checkoutCartWhatsApp === 'function') {
      WhatsAppService.checkoutCartWhatsApp(_items, { name: custName, city: custCity });
    } else {
      // Fallback generator if service not loaded
      const phone = (typeof SITE_CONFIG !== 'undefined' && SITE_CONFIG.whatsappNumber) 
        ? SITE_CONFIG.whatsappNumber.replace(/[^0-9]/g, '') 
        : '918300947503';
      
      const curr = (typeof SITE_CONFIG !== 'undefined' && SITE_CONFIG.currency) ? SITE_CONFIG.currency : '₹';
      const lines = [
        "🛍️ *NEW ORDER — NESIIFY CLOTHING*",
        "------------------------------------"
      ];

      if (custName || custCity) {
        lines.push(`*Customer:* ${[custName, custCity].filter(Boolean).join(' • ')}`, "");
      }

      lines.push("*Items Ordered:*");
      _items.forEach((item, idx) => {
        lines.push(
          `${idx + 1}️⃣ *${item.name}* (Code: ${item.id})`,
          `   • Size: ${item.size} | Color: ${item.color}`,
          `   • Qty: ${item.quantity} × ${curr}${item.price} = ${curr}${item.price * item.quantity}`
        );
      });

      lines.push(
        "------------------------------------",
        `*Total Items:* ${getCount()}`,
        `*Grand Total:* ${curr}${getSubtotal().toLocaleString('en-IN')}`,
        "------------------------------------",
        "📍 Pan-India Delivery requested",
        "",
        "Hi! Please confirm availability of these items and share dispatch details."
      );

      const msg = lines.join('\n');
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
    }
  }

  /**
   * Display floating toast
   */
  let _toastTimeout = null;
  function showToast(message, actionText, actionCallback) {
    let toast = document.getElementById('cartToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'cartToast';
      toast.className = 'cart-toast';
      document.body.appendChild(toast);
    }

    toast.innerHTML = `
      <span>${message}</span>
      ${actionText ? `<button type="button" class="cart-toast-btn" id="cartToastAction">${actionText}</button>` : ''}
    `;

    if (actionText && actionCallback) {
      const btn = toast.querySelector('#cartToastAction');
      if (btn) {
        btn.onclick = () => {
          toast.classList.remove('is-visible');
          actionCallback();
        };
      }
    }

    toast.classList.add('is-visible');

    if (_toastTimeout) clearTimeout(_toastTimeout);
    _toastTimeout = setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 4000);
  }

  /**
   * Build & Inject Cart Drawer DOM if not already present
   */
  function injectCartDOM() {
    if (document.getElementById('cartDrawer')) return;

    // 1. Overlay
    const overlay = document.createElement('div');
    overlay.id = 'cartDrawerOverlay';
    overlay.className = 'cart-drawer-overlay';
    overlay.addEventListener('click', closeDrawer);
    document.body.appendChild(overlay);

    // 2. Drawer
    const drawer = document.createElement('div');
    drawer.id = 'cartDrawer';
    drawer.className = 'cart-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-label', 'Shopping Bag');

    drawer.innerHTML = `
      <div class="cart-drawer-header">
        <div class="cart-header-title-box">
          <h2 class="cart-drawer-title">Shopping Bag</h2>
          <span class="cart-header-badge" id="cartHeaderBadge">0 items</span>
        </div>
        <button type="button" class="cart-drawer-close" aria-label="Close Shopping Bag" onclick="Cart.closeDrawer()">&times;</button>
      </div>

      <div class="cart-drawer-body" id="cartDrawerBody">
        <!-- Rendered dynamically -->
      </div>

      <div class="cart-drawer-footer" id="cartDrawerFooter" style="display: none;">
        <!-- Optional Customer Info Box -->
        <div class="cart-customer-box">
          <div class="cart-customer-header">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            <span>Your Info (Optional for WhatsApp message)</span>
          </div>
          <div class="cart-customer-inputs">
            <input type="text" id="cartCustomerName" class="cart-customer-input" placeholder="Your Name" autocomplete="name">
            <input type="text" id="cartCustomerCity" class="cart-customer-input" placeholder="City / District" autocomplete="address-level2">
          </div>
        </div>

        <div class="cart-summary-rows">
          <div class="cart-summary-row">
            <span>Bag Subtotal</span>
            <span id="cartSubtotalAmount">₹0</span>
          </div>
          <div class="cart-summary-row">
            <span>Shipping</span>
            <span class="cart-delivery-badge">Pan-India Delivery</span>
          </div>
          <div class="cart-summary-row total-row">
            <span>Total Amount</span>
            <span id="cartGrandTotalAmount">₹0</span>
          </div>
        </div>

        <button type="button" id="btnCartCheckoutWA" class="btn-checkout-wa" onclick="Cart.checkoutWhatsApp()">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.8 14.15c-.24.68-1.2 1.25-1.72 1.33-.48.07-1.1.1-3.21-.78-2.69-1.12-4.43-3.84-4.57-4.02-.13-.18-1.1-1.46-1.1-2.79 0-1.33.7-1.98.95-2.25.24-.26.54-.33.72-.33.18 0 .36 0 .52.01.17.01.4.06.61.56.24.58.82 2 .89 2.15.07.15.11.33.02.53-.1.19-.15.31-.3.48-.15.18-.31.39-.44.52-.15.15-.31.31-.13.62.18.31.78 1.29 1.68 2.09 1.15 1.03 2.13 1.35 2.43 1.5.3.15.48.13.66-.08.18-.21.78-.91.99-1.22.21-.31.42-.26.7-.16.29.1 1.83.86 2.14 1.02.31.15.52.23.6.36.07.12.07.72-.17 1.4z"/></svg>
          <span>ORDER ON WHATSAPP</span>
        </button>

        <div class="cart-footer-links">
          <button type="button" class="cart-clear-btn" onclick="Cart.clearCart()">Clear Bag</button>
          <button type="button" class="cart-continue-btn" onclick="Cart.closeDrawer()">Continue Browsing &rarr;</button>
        </div>
      </div>
    `;

    document.body.appendChild(drawer);

    // Save customer on input blur
    const nameInput = drawer.querySelector('#cartCustomerName');
    const cityInput = drawer.querySelector('#cartCustomerCity');
    if (nameInput && cityInput) {
      const onCustChange = () => saveCustomer(nameInput.value, cityInput.value);
      nameInput.addEventListener('change', onCustChange);
      cityInput.addEventListener('change', onCustChange);
    }

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
        closeDrawer();
      }
    });
  }

  /**
   * Inject Cart trigger buttons in Navigation if not already there
   */
  function injectNavbarCartButtons() {
    // 1. Desktop Navbar action area
    const navActions = document.querySelector('.navbar .nav-actions');
    if (navActions && !navActions.querySelector('.nav-cart-btn')) {
      const desktopCartBtn = document.createElement('button');
      desktopCartBtn.type = 'button';
      desktopCartBtn.className = 'nav-cart-btn desktop-only';
      desktopCartBtn.setAttribute('aria-label', 'Open Shopping Bag');
      desktopCartBtn.innerHTML = `
        <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
        <span>Bag</span>
        <span class="cart-count-badge" style="display: none;">0</span>
      `;
      desktopCartBtn.addEventListener('click', openDrawer);
      navActions.insertBefore(desktopCartBtn, navActions.firstChild);
    }

    // 2. Mobile Header Cart Toggle (next to hamburger)
    if (navActions && !navActions.querySelector('.mobile-cart-toggle')) {
      const mobileToggle = document.createElement('button');
      mobileToggle.type = 'button';
      mobileToggle.className = 'mobile-cart-toggle';
      mobileToggle.setAttribute('aria-label', 'View Bag');
      mobileToggle.innerHTML = `
        <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
        <span class="cart-count-badge" style="display: none;">0</span>
      `;
      mobileToggle.addEventListener('click', openDrawer);
      const menuToggle = navActions.querySelector('.mobile-menu-toggle');
      if (menuToggle) {
        navActions.insertBefore(mobileToggle, menuToggle);
      } else {
        navActions.appendChild(mobileToggle);
      }
    }

    // 3. Mobile Bottom Navigation Bar (Add Bag button)
    const bottomNav = document.querySelector('.bottom-nav-grid');
    if (bottomNav && !bottomNav.querySelector('.bottom-nav-bag-item')) {
      const bottomBagItem = document.createElement('a');
      bottomBagItem.href = '#';
      bottomBagItem.className = 'bottom-nav-item bottom-nav-bag-item';
      bottomBagItem.setAttribute('aria-label', 'Shopping Bag');
      bottomBagItem.innerHTML = `
        <div style="position: relative; display: inline-flex;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
          <span class="cart-count-badge" style="position: absolute; top: -6px; right: -8px; min-width: 16px; height: 16px; font-size: 9px; padding: 0 3px; display: none;">0</span>
        </div>
        <span>Bag</span>
      `;
      bottomBagItem.addEventListener('click', (e) => {
        e.preventDefault();
        openDrawer();
      });
      // Insert before Menu (the last item)
      const lastItem = bottomNav.lastElementChild;
      bottomNav.insertBefore(bottomBagItem, lastItem);
    }
  }

  /**
   * Initialize Cart on Page Load
   */
  function init() {
    loadCart();
    injectCartDOM();
    injectNavbarCartButtons();
    updateCartUI();

    // Hook any element with [data-open-cart]
    document.querySelectorAll('[data-open-cart]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        openDrawer();
      });
    });
  }

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    init,
    getItems: () => [..._items],
    getCount,
    getSubtotal,
    addItem,
    updateQty,
    removeItem,
    clearCart,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    checkoutWhatsApp,
    showToast,
    saveCustomer
  };
})();

// Expose globally
window.Cart = Cart;
