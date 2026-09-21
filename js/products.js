/**
 * ===================================================
 * PRODUCT DATA MODULE & HELPERS
 * ===================================================
 */

let _cachedProducts = null;

/**
 * Determine base path for asset and data links relative to current URL.
 */
function getBasePath() {
  const path = window.location.pathname;
  if (path.includes('/policies/')) {
    return '../';
  }
  return '';
}

/**
 * Fetch products from data/products.json
 * @returns {Promise<Array>} List of products
 */
async function fetchProducts() {
  if (_cachedProducts) {
    return _cachedProducts;
  }

  const basePath = getBasePath();
  const jsonUrl = `${basePath}data/products.json`;

  try {
    const response = await fetch(jsonUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    _cachedProducts = Array.isArray(data) ? data : [];
    return _cachedProducts;
  } catch (error) {
    console.error('Error loading products.json:', error);
    throw error;
  }
}

/**
 * Find single product by its unique ID (case-insensitive)
 * @param {string} id 
 * @returns {Promise<Object|null>}
 */
async function getProductById(id) {
  if (!id) return null;
  const products = await fetchProducts();
  const cleanId = id.toString().trim().toLowerCase();
  return products.find(p => p.id.toString().toLowerCase() === cleanId) || null;
}

/**
 * Filter products by category
 * @param {string} category 
 * @returns {Promise<Array>}
 */
async function getProductsByCategory(category) {
  const products = await fetchProducts();
  if (!category || category.toLowerCase() === 'all') {
    return products;
  }
  if (category.toLowerCase() === 'new arrivals' || category.toLowerCase() === 'new-arrivals') {
    return products.filter(p => p.isNew);
  }
  const cleanCat = category.toLowerCase().replace(/-/g, ' ');
  return products.filter(p => p.category && p.category.toLowerCase() === cleanCat);
}

/**
 * Get New Arrivals list
 * @param {number} limit 
 * @returns {Promise<Array>}
 */
async function getNewArrivals(limit = 4) {
  const products = await fetchProducts();
  const news = products.filter(p => p.isNew);
  // If fewer than limit, pad with remaining products
  const combined = [...news, ...products.filter(p => !p.isNew)];
  return combined.slice(0, limit);
}

/**
 * Format price with currency symbol from SITE_CONFIG
 * @param {number} price 
 * @returns {string} e.g. "₹799"
 */
function formatPrice(price) {
  const currency = typeof SITE_CONFIG !== 'undefined' ? SITE_CONFIG.currency : '₹';
  const num = Number(price) || 0;
  return `${currency}${num.toLocaleString('en-IN')}`;
}

/**
 * Generate reusable HTML for a single product card
 * (Section 10 & 31: Consistent aspect ratio, hover zoom, badges, view CTA)
 * @param {Object} product 
 * @param {string} basePath 
 * @returns {string} HTML string
 */
function renderProductCard(product, basePath = '') {
  const bp = basePath || getBasePath();
  const primaryImg = product.images && product.images[0] 
    ? `${bp}${product.images[0]}` 
    : `${bp}assets/products/nc001-1.jpg`;
  
  const productUrl = `${bp}product.html?id=${encodeURIComponent(product.id)}`;
  const badgeHTML = product.isNew 
    ? `<span class="badge badge-new">New</span>` 
    : '';
  const ageHTML = product.ageRange
    ? `<span class="product-card-age">Age ${product.ageRange}</span>`
    : '';

  return `
    <article class="product-card" data-product-id="${product.id}" data-category="${product.category}">
      <div class="product-card-media">
        <div class="product-badge-container">
          ${badgeHTML}
        </div>
        <a href="${productUrl}" aria-label="View ${product.name}">
          <img src="${primaryImg}" alt="${product.name} in ${product.colors ? product.colors.join(', ') : 'standard'}" loading="lazy" width="300" height="375">
        </a>
      </div>
      <div class="product-card-info">
        <span class="product-card-category">${product.category || 'Kids Collection'}</span>
        ${ageHTML}
        <h3 class="product-card-name">
          <a href="${productUrl}">${product.name}</a>
        </h3>
        <div class="product-card-price">${formatPrice(product.price)}</div>
        <div class="product-card-action">
          <a href="${productUrl}" class="btn btn-secondary" aria-label="View product ${product.name}">VIEW PRODUCT</a>
        </div>
      </div>
    </article>
  `;
}
