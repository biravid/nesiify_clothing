/**
 * ===================================================
 * PRODUCT DETAIL PAGE CONTROLLER
 * ===================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  initProductDetailPage();
});

let currentProduct = null;
let selectedSize = null;
let selectedColor = null;
let selectedQuantity = 1;

async function initProductDetailPage() {
  const container = document.getElementById('productDetailContainer');
  if (!container) return;

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  if (!productId) {
    renderProductNotFound("No product selected.");
    return;
  }

  try {
    const product = await getProductById(productId);
    if (!product) {
      renderProductNotFound("Product not found.");
      return;
    }

    currentProduct = product;
    renderProductDetails(product);
  } catch (error) {
    console.error('Failed to load product:', error);
    renderProductNotFound("Could not load product details. Please try again.");
  }
}

/**
 * Render not-found state with BACK TO SHOP button
 */
function renderProductNotFound(msg = "Product not found.") {
  const container = document.getElementById('productDetailContainer');
  const breadcrumbItem = document.getElementById('breadcrumbProductName');
  
  if (breadcrumbItem) {
    breadcrumbItem.textContent = "Not Found";
  }

  if (container) {
    container.innerHTML = `
      <div class="state-message" style="padding: 80px 20px;">
        <h2>${msg}</h2>
        <p>The piece you are looking for might have been moved or is currently unavailable.</p>
        <a href="shop.html" class="btn btn-primary" style="margin-top: 16px;">BACK TO SHOP</a>
      </div>
    `;
  }
}

/**
 * Render complete product detail interface
 * @param {Object} p 
 */
function renderProductDetails(p) {
  // Update document title and breadcrumb
  document.title = `${p.name} | ${typeof SITE_CONFIG !== 'undefined' ? SITE_CONFIG.brandName : 'Brand Name'}`;
  
  const breadcrumbCategory = document.getElementById('breadcrumbCategory');
  const breadcrumbProduct = document.getElementById('breadcrumbProductName');
  if (breadcrumbCategory) {
    breadcrumbCategory.textContent = p.category || 'Shop';
    breadcrumbCategory.href = `shop.html?category=${encodeURIComponent(p.category || 'all')}`;
  }
  if (breadcrumbProduct) {
    breadcrumbProduct.textContent = p.name;
  }

  // Pre-select first color if available
  if (Array.isArray(p.colors) && p.colors.length > 0) {
    selectedColor = p.colors[0];
  } else {
    selectedColor = null;
  }

  // Reset state
  selectedSize = null;
  selectedQuantity = 1;

  // Build Image Gallery HTML
  const primaryImg = (p.images && p.images[0]) ? p.images[0] : 'assets/products/nc001-1.jpg';
  const hasMultipleImages = Array.isArray(p.images) && p.images.length > 1;

  const thumbnailsHTML = hasMultipleImages ? `
    <div class="gallery-thumbnails" role="tablist" aria-label="Product thumbnails">
      ${p.images.map((img, idx) => `
        <button class="gallery-thumb ${idx === 0 ? 'is-active' : ''}" data-src="${img}" aria-label="View image ${idx + 1}" type="button">
          <img src="${img}" alt="${p.name} view ${idx + 1}" loading="lazy">
        </button>
      `).join('')}
    </div>
  ` : '';

  // Build Size Selector HTML
  const hasSizes = Array.isArray(p.sizes) && p.sizes.length > 0;
  const sizeSelectorHTML = hasSizes ? `
    <div class="selector-group">
      <div class="selector-label">
        <span>Select Size (Kidswear)</span>
        <span class="selector-selected-val" id="selectedSizeLabel">Select a size</span>
      </div>
      <div class="size-options" role="radiogroup" aria-label="Select size">
        ${p.sizes.map(size => `
          <button type="button" class="size-pill" data-size="${size}" aria-label="Size ${size}" role="radio" aria-checked="false">${size}</button>
        `).join('')}
      </div>
    </div>
  ` : '';

  // Build Colour Selector HTML
  const hasColors = Array.isArray(p.colors) && p.colors.length > 0;
  const colorSelectorHTML = hasColors ? `
    <div class="selector-group">
      <div class="selector-label">
        <span>Colour</span>
        <span class="selector-selected-val" id="selectedColorLabel">${selectedColor}</span>
      </div>
      <div class="color-options" role="radiogroup" aria-label="Select colour">
        ${p.colors.map((col, idx) => `
          <button type="button" class="color-pill ${idx === 0 ? 'is-selected' : ''}" data-color="${col}" aria-label="Colour ${col}" role="radio" aria-checked="${idx === 0 ? 'true' : 'false'}">${col}</button>
        `).join('')}
      </div>
    </div>
  ` : '';

  // Details List
  const detailsListHTML = Array.isArray(p.details) && p.details.length > 0 
    ? `<ul>${p.details.map(d => `<li>${d}</li>`).join('')}</ul>` 
    : `<p>Crafted with soft, breathable cotton fabrics for everyday play and movement.</p>`;

  const container = document.getElementById('productDetailContainer');
  container.innerHTML = `
    <div class="product-detail-layout">
      <!-- Left Column: Gallery -->
      <div class="product-gallery">
        <div class="gallery-main-image">
          <img id="mainProductImg" src="${primaryImg}" alt="${p.name}" width="600" height="750">
        </div>
        ${thumbnailsHTML}
      </div>

      <!-- Right Column: Product Information -->
      <div class="product-info-panel">
        <div class="product-meta-header">
          <div class="product-badge-row">
            ${p.isNew ? '<span class="badge badge-new">New Arrival</span>' : ''}
            <span class="product-code-tag">CODE: ${p.id}</span>
          </div>
          ${p.ageRange ? `<div class="product-age-badge"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="display:inline-block;vertical-align:-2px;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg> Suitable for ages ${p.ageRange}</div>` : ''}
          <h1 class="product-title">${p.name}</h1>
          <div class="product-price-row">
            <span class="product-price">${formatPrice(p.price)}</span>
            <span class="product-tax-note">Inclusive of all taxes</span>
          </div>
        </div>

        <p class="product-description-text">${p.description || ''}</p>

        <!-- Variants & Selectors Form -->
        <form id="orderForm" onsubmit="return false;">
          ${colorSelectorHTML}
          ${sizeSelectorHTML}

          <!-- Quantity Selector -->
          <div class="selector-group">
            <div class="selector-label">
              <span>Quantity</span>
            </div>
            <div class="quantity-stepper">
              <button type="button" class="qty-btn" id="qtyDecrement" aria-label="Decrease quantity">&minus;</button>
              <input type="number" id="qtyInput" class="qty-input" value="1" min="1" max="10" readonly aria-label="Quantity">
              <button type="button" class="qty-btn" id="qtyIncrement" aria-label="Increase quantity">&plus;</button>
            </div>
          </div>

          <!-- Inline Validation Message -->
          <div id="inlineValidationMessage" class="form-message" role="alert"></div>

          <!-- Order On WhatsApp CTA -->
          <div class="product-actions-box">
            <button type="button" id="btnOrderWhatsApp" class="btn btn-order-wa">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.8 14.15c-.24.68-1.2 1.25-1.72 1.33-.48.07-1.1.1-3.21-.78-2.69-1.12-4.43-3.84-4.57-4.02-.13-.18-1.1-1.46-1.1-2.79 0-1.33.7-1.98.95-2.25.24-.26.54-.33.72-.33.18 0 .36 0 .52.01.17.01.4.06.61.56.24.58.82 2 .89 2.15.07.15.11.33.02.53-.1.19-.15.31-.3.48-.15.18-.31.39-.44.52-.15.15-.31.31-.13.62.18.31.78 1.29 1.68 2.09 1.15 1.03 2.13 1.35 2.43 1.5.3.15.48.13.66-.08.18-.21.78-.91.99-1.22.21-.31.42-.26.7-.16.29.1 1.83.86 2.14 1.02.31.15.52.23.6.36.07.12.07.72-.17 1.4z"/></svg>
              <span>ORDER ON WHATSAPP</span>
            </button>
            <div class="wa-order-note">
              <span>💬 Opens WhatsApp with pre-filled product & size details</span>
            </div>
          </div>
        </form>

        <!-- Information Accordions -->
        <div class="product-info-accordions">
          <div class="accordion-item is-open">
            <button type="button" class="accordion-header">
              <span>Product Specifications</span>
              <span class="accordion-icon">+</span>
            </button>
            <div class="accordion-content">
              ${detailsListHTML}
            </div>
          </div>

          <div class="accordion-item">
            <button type="button" class="accordion-header">
              <span>Kids Sizing Guide</span>
              <span class="accordion-icon">+</span>
            </button>
            <div class="accordion-content">
              <p>Designed for children aged 2 to 12 years. If your child is between sizes or you prefer a roomier fit for growth, we recommend selecting one size up. You can also message us directly on WhatsApp for chest, waist, and length measurements!</p>
            </div>
          </div>

          <div class="accordion-item">
            <button type="button" class="accordion-header">
              <span>Shipping & Easy Exchanges</span>
              <span class="accordion-icon">+</span>
            </button>
            <div class="accordion-content">
              <p>Standard delivery takes 3-7 business days across India. Orders are confirmed directly on WhatsApp. We offer easy size exchanges if you need an alternate size for your child.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  bindProductDetailInteractions(p);
}

/**
 * Bind event listeners for thumbnails, variants, quantity and WhatsApp button
 */
function bindProductDetailInteractions(p) {
  const mainImg = document.getElementById('mainProductImg');
  const thumbs = document.querySelectorAll('.gallery-thumb');
  const sizePills = document.querySelectorAll('.size-pill');
  const colorPills = document.querySelectorAll('.color-pill');
  const sizeLabel = document.getElementById('selectedSizeLabel');
  const colorLabel = document.getElementById('selectedColorLabel');
  const qtyInput = document.getElementById('qtyInput');
  const btnDecrement = document.getElementById('qtyDecrement');
  const btnIncrement = document.getElementById('qtyIncrement');
  const btnOrderWA = document.getElementById('btnOrderWhatsApp');
  const validationMsg = document.getElementById('inlineValidationMessage');

  // Thumbnail Clicker
  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      const src = thumb.getAttribute('data-src');
      if (mainImg && src) {
        mainImg.style.opacity = '0.4';
        setTimeout(() => {
          mainImg.src = src;
          mainImg.style.opacity = '1';
        }, 150);
      }
      thumbs.forEach(t => t.classList.remove('is-active'));
      thumb.classList.add('is-active');
    });
  });

  // Size Pill Selection
  sizePills.forEach(pill => {
    pill.addEventListener('click', () => {
      selectedSize = pill.getAttribute('data-size');
      sizePills.forEach(sp => {
        sp.classList.remove('is-selected');
        sp.setAttribute('aria-checked', 'false');
      });
      pill.classList.add('is-selected');
      pill.setAttribute('aria-checked', 'true');
      
      if (sizeLabel) {
        sizeLabel.textContent = selectedSize;
      }
      // Clear error message if size was missing
      if (validationMsg) {
        validationMsg.textContent = '';
        validationMsg.style.display = 'none';
      }
    });
  });

  // Colour Pill Selection
  colorPills.forEach(pill => {
    pill.addEventListener('click', () => {
      selectedColor = pill.getAttribute('data-color');
      colorPills.forEach(cp => {
        cp.classList.remove('is-selected');
        cp.setAttribute('aria-checked', 'false');
      });
      pill.classList.add('is-selected');
      pill.setAttribute('aria-checked', 'true');

      if (colorLabel) {
        colorLabel.textContent = selectedColor;
      }
      if (validationMsg) {
        validationMsg.textContent = '';
        validationMsg.style.display = 'none';
      }
    });
  });

  // Quantity Stepper
  if (btnDecrement && btnIncrement && qtyInput) {
    btnDecrement.addEventListener('click', () => {
      let currentVal = parseInt(qtyInput.value, 10) || 1;
      if (currentVal > 1) {
        currentVal -= 1;
        qtyInput.value = currentVal;
        selectedQuantity = currentVal;
      }
    });

    btnIncrement.addEventListener('click', () => {
      let currentVal = parseInt(qtyInput.value, 10) || 1;
      if (currentVal < 10) {
        currentVal += 1;
        qtyInput.value = currentVal;
        selectedQuantity = currentVal;
      }
    });
  }

  // ORDER ON WHATSAPP Button Click
  if (btnOrderWA) {
    btnOrderWA.addEventListener('click', () => {
      const selection = {
        size: selectedSize,
        color: selectedColor,
        quantity: selectedQuantity
      };

      WhatsAppService.orderProduct(p, selection, validationMsg);
    });
  }

  // Accordion Toggle
  const accordions = document.querySelectorAll('.accordion-header');
  accordions.forEach(header => {
    header.addEventListener('click', () => {
      const item = header.closest('.accordion-item');
      if (item) {
        item.classList.toggle('is-open');
      }
    });
  });
}
