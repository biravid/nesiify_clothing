/**
 * ===================================================
 * SHOP PAGE CONTROLLER & CATEGORY FILTERING
 * ===================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  initShopPage();
});

async function initShopPage() {
  const gridContainer = document.getElementById('shopProductsGrid');
  const countElement = document.getElementById('productCount');
  const filterContainer = document.getElementById('categoryFilters');

  if (!gridContainer) return;

  // Read category from URL query param if present: ?category=dresses
  const urlParams = new URLSearchParams(window.location.search);
  let activeCategory = urlParams.get('category') || 'all';

  // Render products according to activeCategory
  await loadAndFilterProducts(activeCategory);

  // Bind filter button click events
  if (filterContainer) {
    filterContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;

      const selectedCategory = btn.getAttribute('data-category');
      if (!selectedCategory) return;

      // Update URL without page reload
      const newUrl = new URL(window.location);
      if (selectedCategory === 'all') {
        newUrl.searchParams.delete('category');
      } else {
        newUrl.searchParams.set('category', selectedCategory);
      }
      window.history.pushState({}, '', newUrl);

      // Filter products
      loadAndFilterProducts(selectedCategory);
    });
  }

  // Handle browser back/forward buttons
  window.addEventListener('popstate', () => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category') || 'all';
    loadAndFilterProducts(cat);
  });
}

/**
 * Filter and render products into the shop grid
 * @param {string} category 
 */
async function loadAndFilterProducts(category) {
  const gridContainer = document.getElementById('shopProductsGrid');
  const countElement = document.getElementById('productCount');
  const activeTitle = document.getElementById('activeCategoryTitle');
  const filterBtns = document.querySelectorAll('.filter-btn');

  if (!gridContainer) return;

  // Update active state on filter buttons
  filterBtns.forEach(btn => {
    const btnCat = btn.getAttribute('data-category');
    if (btnCat.toLowerCase() === category.toLowerCase()) {
      btn.classList.add('is-active');
    } else {
      btn.classList.remove('is-active');
    }
  });

  // Display loading state
  gridContainer.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--color-text-secondary);">
      <p>Loading products...</p>
    </div>
  `;

  try {
    const products = await getProductsByCategory(category);

    // Update count & active heading
    if (countElement) {
      countElement.textContent = `Showing ${products.length} product${products.length === 1 ? '' : 's'}`;
    }

    if (activeTitle) {
      activeTitle.textContent = category.toLowerCase() === 'all' 
        ? 'All Products' 
        : category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    if (products.length === 0) {
      gridContainer.innerHTML = `
        <div style="grid-column: 1 / -1;" class="state-message">
          <h3>No products found</h3>
          <p>We couldn't find any products in this category right now.</p>
          <a href="shop.html" class="btn btn-secondary">VIEW ALL PRODUCTS</a>
        </div>
      `;
      return;
    }

    // Render cards
    gridContainer.innerHTML = products.map(p => renderProductCard(p)).join('');

  } catch (error) {
    gridContainer.innerHTML = `
      <div style="grid-column: 1 / -1;" class="state-message">
        <h3>Products temporarily unavailable</h3>
        <p>Products are temporarily unavailable. Please try again shortly.</p>
        <button onclick="window.location.reload()" class="btn btn-secondary">RETRY</button>
      </div>
    `;
    if (countElement) countElement.textContent = '0 products';
  }
}
