/**
 * ===================================================
 * NESIIFY CLOTHING — PRODUCT MANAGER V2 (ADMIN TOOL)
 * Complete in-memory catalogue management utility:
 * Load, Display, Search, Filter, Edit, Delete, Add,
 * Image Filename Mapping, and Complete JSON Export.
 * ===================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  initAdminManagerV2();
});

function initAdminManagerV2() {
  // ----------------------------------------------------
  // Application State
  // ----------------------------------------------------
  let productsList = [];
  let editingProductId = null; // null = Add Mode, string = ID of item being edited
  let activeColors = [];
  let completeJsonStr = '';
  const sessionActivityLog = [];

  const VALID_IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|svg)$/i;

  // ----------------------------------------------------
  // DOM Elements - Catalogue Table & Filters
  // ----------------------------------------------------
  const catalogCountBadge = document.getElementById('catalogCountBadge');
  const catalogSearchInput = document.getElementById('catalogSearchInput');
  const catalogCategoryFilter = document.getElementById('catalogCategoryFilter');
  const catalogShowingCount = document.getElementById('catalogShowingCount');
  const catalogTotalCount = document.getElementById('catalogTotalCount');
  const catalogTableBody = document.getElementById('catalogTableBody');
  const catalogEmptyState = document.getElementById('catalogEmptyState');
  const btnResetCatalogFilters = document.getElementById('btnResetCatalogFilters');
  const btnScrollToAddProduct = document.getElementById('btnScrollToAddProduct');

  // ----------------------------------------------------
  // DOM Elements - Form & Edit Mode
  // ----------------------------------------------------
  const form = document.getElementById('productForm');
  const editModeBanner = document.getElementById('editModeBanner');
  const editingProductCodeTag = document.getElementById('editingProductCodeTag');
  const btnCancelEditTop = document.getElementById('btnCancelEditTop');
  const formCard1Title = document.getElementById('formCard1Title');
  const formModeBadge = document.getElementById('formModeBadge');

  const codeInput = document.getElementById('productCode');
  const nameInput = document.getElementById('productName');
  const priceInput = document.getElementById('productPrice');
  const categorySelect = document.getElementById('productCategory');
  const ageRangeSelect = document.getElementById('productAgeRange');
  const sizeCheckboxes = document.querySelectorAll('input[name="productSizes"]');
  const descTextarea = document.getElementById('productDescription');
  const isNewArrivalCheckbox = document.getElementById('isNewArrival');
  const isSampleCheckbox = document.getElementById('isSampleProduct');

  // Image section
  const imageInputsList = document.getElementById('imageInputsList');
  const btnAddImageRow = document.getElementById('btnAddImageRow');
  const generalImageError = document.getElementById('generalImageError');

  // Colors section
  const colorTagContainer = document.getElementById('colorTagsContainer');
  const colorTagInput = document.getElementById('colorTagInput');
  const quickAddButtons = document.querySelectorAll('.admin-suggested-btn');

  // Buttons & Banners
  const btnGenerate = document.getElementById('btnGenerate');
  const btnGenerateText = document.getElementById('btnGenerateText');
  const btnCancelEdit = document.getElementById('btnCancelEdit');
  const btnReset = document.getElementById('btnReset');
  const banner = document.getElementById('adminFormBanner');
  const bannerMsg = document.getElementById('adminBannerMsg');
  const bannerIcon = document.getElementById('adminBannerIcon');

  // Error fields
  const codeError = document.getElementById('productCodeError');
  const nameError = document.getElementById('productNameError');
  const priceError = document.getElementById('productPriceError');
  const categoryError = document.getElementById('productCategoryError');
  const ageRangeError = document.getElementById('productAgeRangeError');
  const sizesError = document.getElementById('productSizesError');
  const descError = document.getElementById('productDescriptionError');

  // Preview elements
  const codeOutput = document.getElementById('jsonCodeOutput');
  const btnCopy = document.getElementById('btnCopyJson');
  const btnCopyLabel = document.getElementById('btnCopyLabel');
  const btnDownload = document.getElementById('btnDownloadJson');
  const targetFilenameLabel = document.getElementById('jsonTargetFilename');
  const sessionHistoryTags = document.getElementById('sessionHistoryTags');

  // ----------------------------------------------------
  // Image Filename Helpers
  // ----------------------------------------------------
  function cleanImageFilename(rawVal) {
    if (!rawVal) return '';
    let val = String(rawVal).trim();
    // Strip leading "assets/products/", "products/", slashes or backslashes if user typed/pasted full path
    val = val.replace(/^(assets[\/\\]products[\/\\]|products[\/\\]|[\/\\]+)/i, '');
    return val.trim();
  }

  function formatImageAssetPath(rawVal) {
    const filename = cleanImageFilename(rawVal);
    if (!filename) return '';
    return `assets/products/${filename}`;
  }

  // ----------------------------------------------------
  // Dynamic Image Rows
  // ----------------------------------------------------
  function createImageRowElement(index, initialFilename = '') {
    const cleanInitial = cleanImageFilename(initialFilename);
    const row = document.createElement('div');
    row.className = 'admin-image-row-item';
    row.setAttribute('data-index', index);

    const isPrimary = index === 0;
    const labelText = isPrimary ? 'Image 1 (Primary / Thumbnail)' : `Image ${index + 1} (Additional View)`;
    const requiredAttr = isPrimary ? 'required' : '';
    const labelRequiredClass = isPrimary ? 'admin-label-required' : '';

    row.innerHTML = `
      <div class="admin-image-row-header">
        <label class="admin-label ${labelRequiredClass}">${labelText}</label>
        ${!isPrimary ? `<button type="button" class="admin-btn-remove-image" aria-label="Remove image ${index + 1}">Remove &times;</button>` : ''}
      </div>
      <div class="admin-image-input-group">
        <div class="admin-img-preview-box">
          <img src="" alt="Thumbnail preview" class="admin-img-thumb" style="display: none;">
          <span class="admin-img-placeholder">No image</span>
        </div>
        <div style="flex: 1;">
          <input 
            type="text" 
            class="admin-input image-filename-input" 
            placeholder="e.g. NC009-${index + 1}.jpg" 
            value="${escapeHtml(cleanInitial)}"
            autocomplete="off"
            ${requiredAttr}
          >
          <div class="admin-image-prefix-badge">Path: <strong class="preview-path-text">${cleanInitial ? `assets/products/${escapeHtml(cleanInitial)}` : 'assets/products/&mdash;'}</strong></div>
          <div class="admin-field-error row-image-error"></div>
        </div>
      </div>
    `;

    // Hook up elements
    const input = row.querySelector('.image-filename-input');
    const pathText = row.querySelector('.preview-path-text');
    const imgThumb = row.querySelector('.admin-img-thumb');
    const imgPlaceholder = row.querySelector('.admin-img-placeholder');
    const rowError = row.querySelector('.row-image-error');
    const removeBtn = row.querySelector('.admin-btn-remove-image');

    function updateRowPreview() {
      const cleanName = cleanImageFilename(input.value);
      if (cleanName) {
        pathText.textContent = `assets/products/${cleanName}`;
        imgPlaceholder.textContent = 'Loading...';

        // Relative path from /admin/ to /assets/products/ is ../assets/products/
        imgThumb.src = `../assets/products/${cleanName}`;
        imgThumb.onload = () => {
          imgThumb.style.display = 'block';
          imgPlaceholder.style.display = 'none';
        };
        imgThumb.onerror = () => {
          imgThumb.style.display = 'none';
          imgPlaceholder.style.display = 'block';
          imgPlaceholder.textContent = 'Preview unavailable';
        };
      } else {
        pathText.innerHTML = `assets/products/&mdash;`;
        imgThumb.style.display = 'none';
        imgPlaceholder.style.display = 'block';
        imgPlaceholder.textContent = 'No image';
      }
      hideError(input, rowError);
      hideError(null, generalImageError);
    }

    input.addEventListener('input', updateRowPreview);

    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        row.remove();
        reindexImageRows();
      });
    }

    // Trigger initial preview if initial filename provided
    if (cleanInitial) {
      updateRowPreview();
    }

    return row;
  }

  function reindexImageRows() {
    const rows = imageInputsList.querySelectorAll('.admin-image-row-item');
    rows.forEach((row, idx) => {
      row.setAttribute('data-index', idx);
      const isPrimary = idx === 0;
      const label = row.querySelector('label');
      if (label) {
        label.className = `admin-label ${isPrimary ? 'admin-label-required' : ''}`;
        label.textContent = isPrimary ? 'Image 1 (Primary / Thumbnail)' : `Image ${idx + 1} (Additional View)`;
      }
      const input = row.querySelector('.image-filename-input');
      if (input) {
        input.placeholder = `e.g. NC009-${idx + 1}.jpg`;
        if (isPrimary) input.setAttribute('required', 'required');
        else input.removeAttribute('required');
      }
    });
  }

  function renderImageRows(imagesArray = ['']) {
    imageInputsList.innerHTML = '';
    const list = Array.isArray(imagesArray) && imagesArray.length > 0 ? imagesArray : [''];
    list.forEach((img, idx) => {
      const row = createImageRowElement(idx, img);
      imageInputsList.appendChild(row);
    });
  }

  btnAddImageRow.addEventListener('click', () => {
    const currentCount = imageInputsList.querySelectorAll('.admin-image-row-item').length;
    const newRow = createImageRowElement(currentCount, '');
    imageInputsList.appendChild(newRow);
    const newInput = newRow.querySelector('.image-filename-input');
    if (newInput) newInput.focus();
  });

  // ----------------------------------------------------
  // Colors Tag/Chip System
  // ----------------------------------------------------
  function renderColorChips() {
    const existingChips = colorTagContainer.querySelectorAll('.admin-tag-chip');
    existingChips.forEach(chip => chip.remove());

    activeColors.forEach((color, index) => {
      const chip = document.createElement('span');
      chip.className = 'admin-tag-chip';
      chip.innerHTML = `
        <span>${escapeHtml(color)}</span>
        <button type="button" class="admin-tag-remove" aria-label="Remove ${escapeHtml(color)}" data-index="${index}">&times;</button>
      `;
      colorTagContainer.insertBefore(chip, colorTagInput);
    });
  }

  function addColor(colorName) {
    const trimmed = String(colorName).trim();
    if (!trimmed) return;
    const exists = activeColors.some(c => c.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      activeColors.push(trimmed);
      renderColorChips();
    }
    colorTagInput.value = '';
  }

  function removeColor(index) {
    activeColors.splice(index, 1);
    renderColorChips();
  }

  colorTagContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('admin-tag-remove')) {
      const index = parseInt(e.target.getAttribute('data-index'), 10);
      removeColor(index);
    } else {
      colorTagInput.focus();
    }
  });

  colorTagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addColor(colorTagInput.value);
    } else if (e.key === 'Backspace' && colorTagInput.value === '' && activeColors.length > 0) {
      removeColor(activeColors.length - 1);
    }
  });

  colorTagInput.addEventListener('blur', () => {
    if (colorTagInput.value.trim()) {
      addColor(colorTagInput.value);
    }
  });

  quickAddButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const col = btn.getAttribute('data-color');
      if (col) addColor(col);
    });
  });

  // Size Checkbox Styling Toggle
  sizeCheckboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      const label = cb.closest('.admin-checkbox-label');
      if (label) {
        if (cb.checked) label.classList.add('is-checked');
        else label.classList.remove('is-checked');
      }
      hideError(null, sizesError);
    });
  });

  // Clear errors on field input
  codeInput.addEventListener('input', () => hideError(codeInput, codeError));
  nameInput.addEventListener('input', () => hideError(nameInput, nameError));
  priceInput.addEventListener('input', () => hideError(priceInput, priceError));
  categorySelect.addEventListener('change', () => hideError(categorySelect, categoryError));
  ageRangeSelect.addEventListener('change', () => hideError(ageRangeSelect, ageRangeError));
  descTextarea.addEventListener('input', () => hideError(descTextarea, descError));

  // ----------------------------------------------------
  // Load Existing Products from data/products.json
  // ----------------------------------------------------
  async function loadExistingProducts() {
    try {
      catalogCountBadge.textContent = 'Loading...';
      const response = await fetch('../data/products.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        productsList = data;
        logActivity(`Loaded ${productsList.length} products from data/products.json`);
      } else {
        productsList = [];
      }
    } catch (err) {
      console.warn('Could not load data/products.json via fetch:', err);
      showBanner('Notice: Could not load data/products.json directly via fetch. If viewing via file://, please run server.js (http://localhost:8080/admin/admin.html).', 'error');
      productsList = [];
    }

    renderCatalogTable();
    updateJsonPreview();
  }

  // ----------------------------------------------------
  // Render Catalogue Table & Search / Filter
  // ----------------------------------------------------
  function renderCatalogTable() {
    const searchQuery = (catalogSearchInput.value || '').trim().toLowerCase();
    const categoryFilter = (catalogCategoryFilter.value || 'all').toLowerCase();

    // Filter products
    const filtered = productsList.filter(p => {
      if (!p) return false;
      const matchesCategory = (categoryFilter === 'all') || 
        (p.category && p.category.toLowerCase() === categoryFilter);

      const pId = String(p.id || '').toLowerCase();
      const pName = String(p.name || '').toLowerCase();
      const pCat = String(p.category || '').toLowerCase();

      const matchesSearch = !searchQuery || 
        pId.includes(searchQuery) || 
        pName.includes(searchQuery) || 
        pCat.includes(searchQuery);

      return matchesCategory && matchesSearch;
    });

    // Update count labels
    catalogShowingCount.textContent = filtered.length;
    catalogTotalCount.textContent = productsList.length;
    catalogCountBadge.textContent = `${productsList.length} ${productsList.length === 1 ? 'Product' : 'Products'}`;

    catalogTableBody.innerHTML = '';

    if (filtered.length === 0) {
      catalogProductsTable.style.display = 'none';
      catalogEmptyState.style.display = 'block';
      return;
    }

    catalogProductsTable.style.display = 'table';
    catalogEmptyState.style.display = 'none';

    filtered.forEach(item => {
      const tr = document.createElement('tr');
      tr.className = `catalog-row ${item.id === editingProductId ? 'is-active-edit' : ''}`;

      const primaryImgPath = (item.images && item.images[0]) ? item.images[0] : '';
      const cleanImgName = cleanImageFilename(primaryImgPath);
      const thumbUrl = cleanImgName ? `../assets/products/${cleanImgName}` : '';

      const tagsHtml = [
        item.isNew ? '<span class="catalog-tag catalog-tag-new">New</span>' : '',
        item.isSample ? '<span class="catalog-tag catalog-tag-sample">Sample</span>' : ''
      ].filter(Boolean).join(' ');

      tr.innerHTML = `
        <td style="text-align: center;">
          <div class="catalog-thumb-box">
            ${thumbUrl ? `
              <img 
                src="${escapeHtml(thumbUrl)}" 
                alt="${escapeHtml(item.name || item.id)}" 
                class="catalog-thumb-img" 
                loading="lazy"
                onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
              >
              <span class="catalog-thumb-fallback" style="display: none;">No img</span>
            ` : `
              <span class="catalog-thumb-fallback">No img</span>
            `}
          </div>
        </td>
        <td>
          <span class="catalog-badge-code">${escapeHtml(item.id)}</span>
        </td>
        <td>
          <span class="catalog-item-name">${escapeHtml(item.name || 'Unnamed Product')}</span>
        </td>
        <td>
          <span class="catalog-item-category">${escapeHtml(item.category || '&mdash;')}</span>
        </td>
        <td>
          <span class="catalog-price">₹${Number(item.price || 0).toLocaleString('en-IN')}</span>
        </td>
        <td>
          <span class="catalog-age-badge">${escapeHtml(item.ageRange || '&mdash;')}</span>
        </td>
        <td>
          ${tagsHtml || '<span style="color: var(--admin-text-muted); font-size: 11px;">&mdash;</span>'}
        </td>
        <td>
          <div class="catalog-actions-cell">
            <button type="button" class="catalog-action-pill btn-edit" data-id="${escapeHtml(item.id)}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              <span>Edit</span>
            </button>
            <button type="button" class="catalog-action-pill btn-danger" data-id="${escapeHtml(item.id)}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              <span>Delete</span>
            </button>
          </div>
        </td>
      `;

      catalogTableBody.appendChild(tr);
    });
  }

  // Search & Filter listeners
  catalogSearchInput.addEventListener('input', () => renderCatalogTable());
  catalogCategoryFilter.addEventListener('change', () => renderCatalogTable());

  btnResetCatalogFilters.addEventListener('click', () => {
    catalogSearchInput.value = '';
    catalogCategoryFilter.value = 'all';
    renderCatalogTable();
  });

  // Table action clicks (Edit & Delete delegation)
  catalogTableBody.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.btn-edit');
    const deleteBtn = e.target.closest('.btn-danger');

    if (editBtn) {
      const id = editBtn.getAttribute('data-id');
      startEditingProduct(id);
    } else if (deleteBtn) {
      const id = deleteBtn.getAttribute('data-id');
      confirmDeleteProduct(id);
    }
  });

  // Scroll to Add Product button
  btnScrollToAddProduct.addEventListener('click', (e) => {
    e.preventDefault();
    if (editingProductId !== null) {
      cancelEditingProduct();
    }
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    codeInput.focus();
  });

  // ----------------------------------------------------
  // Edit Product Workflow
  // ----------------------------------------------------
  function startEditingProduct(id) {
    const product = productsList.find(p => p.id === id);
    if (!product) return;

    editingProductId = product.id;

    // Switch UI to Edit Mode
    editModeBanner.style.display = 'flex';
    editingProductCodeTag.textContent = product.id;
    formModeBadge.textContent = 'Edit Mode';
    formModeBadge.className = 'admin-mode-pill is-edit';
    formCard1Title.textContent = `1. Edit Product (${product.id})`;
    btnGenerateText.textContent = '✓ SAVE CHANGES';
    btnCancelEdit.style.display = 'inline-flex';

    // Populate Basic Info
    codeInput.value = product.id;
    nameInput.value = product.name || '';
    priceInput.value = product.price || '';

    // Populate Category & Age Range
    categorySelect.value = product.category || '';
    ageRangeSelect.value = product.ageRange || '';

    // Populate Sizes
    sizeCheckboxes.forEach(cb => {
      const label = cb.closest('.admin-checkbox-label');
      const isSelected = Array.isArray(product.sizes) && product.sizes.includes(cb.value);
      cb.checked = isSelected;
      if (label) {
        if (isSelected) label.classList.add('is-checked');
        else label.classList.remove('is-checked');
      }
    });

    // Populate Colors
    activeColors = Array.isArray(product.colors) ? [...product.colors] : [];
    renderColorChips();

    // Populate Description
    descTextarea.value = product.description || '';

    // Populate Images
    const rawImages = Array.isArray(product.images) && product.images.length > 0 
      ? product.images.map(img => cleanImageFilename(img)) 
      : [''];
    renderImageRows(rawImages);

    // Populate Flags
    isNewArrivalCheckbox.checked = product.isNew !== false;
    isSampleCheckbox.checked = !!product.isSample;

    // Clear previous errors
    hideAllErrors();
    hideBanner();

    // Re-render table to reflect active edit highlight
    renderCatalogTable();

    // Smooth scroll to form
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function cancelEditingProduct() {
    editingProductId = null;

    // Restore Add Mode UI
    editModeBanner.style.display = 'none';
    formModeBadge.textContent = 'Add Mode';
    formModeBadge.className = 'admin-mode-pill is-add';
    formCard1Title.textContent = '1. Basic Product Info';
    btnGenerateText.textContent = 'ADD PRODUCT TO LIST';
    btnCancelEdit.style.display = 'none';

    // Reset Form
    form.reset();
    activeColors = [];
    renderColorChips();
    renderImageRows(['']);

    sizeCheckboxes.forEach(cb => {
      const label = cb.closest('.admin-checkbox-label');
      if (label) label.classList.remove('is-checked');
    });

    hideAllErrors();
    hideBanner();
    renderCatalogTable();
  }

  btnCancelEdit.addEventListener('click', cancelEditingProduct);
  btnCancelEditTop.addEventListener('click', cancelEditingProduct);

  // ----------------------------------------------------
  // Delete Product Workflow
  // ----------------------------------------------------
  function confirmDeleteProduct(id) {
    const product = productsList.find(p => p.id === id);
    if (!product) return;

    const confirmed = window.confirm(`Are you sure you want to remove "${product.id} - ${product.name}" from the generated product data?\n\n(Note: Physical image files in assets/products/ will NOT be touched.)`);
    if (!confirmed) return;

    // If currently editing this item, cancel edit mode
    if (editingProductId === id) {
      cancelEditingProduct();
    }

    productsList = productsList.filter(p => p.id !== id);
    logActivity(`Deleted ${id}`);

    renderCatalogTable();
    updateJsonPreview();
    showBanner(`Product "${id}" removed from the catalogue data. Physical image files remain untouched.`, 'success');
  }

  // ----------------------------------------------------
  // Form Submission (Add or Save Edit)
  // ----------------------------------------------------
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    hideBanner();

    let isValid = true;
    let firstErrorElement = null;

    // 1. Product Code Validation
    const rawCode = codeInput.value.trim().toUpperCase();
    if (!rawCode) {
      showError(codeInput, codeError, 'Product Code is required (e.g. NC009).');
      isValid = false;
      if (!firstErrorElement) firstErrorElement = codeInput;
    } else {
      // Duplicate ID validation
      const isDuplicate = productsList.some(p => {
        if (!p || !p.id) return false;
        // When editing, allow its own original ID
        if (editingProductId !== null && p.id.toUpperCase() === editingProductId.toUpperCase()) {
          return false;
        }
        return p.id.toUpperCase() === rawCode;
      });

      if (isDuplicate) {
        showError(codeInput, codeError, `Product ID "${rawCode}" already exists in the catalogue. Please use a unique code.`);
        isValid = false;
        if (!firstErrorElement) firstErrorElement = codeInput;
      } else {
        hideError(codeInput, codeError);
      }
    }

    // 2. Product Name
    const productName = nameInput.value.trim();
    if (!productName) {
      showError(nameInput, nameError, 'Product Name is required.');
      isValid = false;
      if (!firstErrorElement) firstErrorElement = nameInput;
    } else {
      hideError(nameInput, nameError);
    }

    // 3. Price
    const priceVal = parseFloat(priceInput.value);
    if (isNaN(priceVal) || priceVal <= 0) {
      showError(priceInput, priceError, 'Please enter a valid price greater than 0.');
      isValid = false;
      if (!firstErrorElement) firstErrorElement = priceInput;
    } else {
      hideError(priceInput, priceError);
    }

    // 4. Category
    const category = categorySelect.value;
    if (!category) {
      showError(categorySelect, categoryError, 'Please select a product category.');
      isValid = false;
      if (!firstErrorElement) firstErrorElement = categorySelect;
    } else {
      hideError(categorySelect, categoryError);
    }

    // 5. Age Range
    const ageRange = ageRangeSelect.value;
    if (!ageRange) {
      showError(ageRangeSelect, ageRangeError, 'Please select a suitable age range.');
      isValid = false;
      if (!firstErrorElement) firstErrorElement = ageRangeSelect;
    } else {
      hideError(ageRangeSelect, ageRangeError);
    }

    // 6. Sizes (at least one)
    const selectedSizes = [];
    sizeCheckboxes.forEach(cb => {
      if (cb.checked) selectedSizes.push(cb.value);
    });

    if (selectedSizes.length === 0) {
      showError(null, sizesError, 'Please select at least one available size.');
      isValid = false;
      if (!firstErrorElement) firstErrorElement = document.getElementById('sizesContainer');
    } else {
      hideError(null, sizesError);
    }

    // 7. Description
    const description = descTextarea.value.trim();
    if (!description) {
      showError(descTextarea, descError, 'Please enter a product description.');
      isValid = false;
      if (!firstErrorElement) firstErrorElement = descTextarea;
    } else {
      hideError(descTextarea, descError);
    }

    // 8. Dynamic Images Validation
    const processedImages = [];
    const imageRows = imageInputsList.querySelectorAll('.admin-image-row-item');

    let hasPrimaryImage = false;

    imageRows.forEach((row, idx) => {
      const input = row.querySelector('.image-filename-input');
      const rowErr = row.querySelector('.row-image-error');
      const rawVal = input ? input.value : '';
      const cleanName = cleanImageFilename(rawVal);

      if (idx === 0) {
        // Image 1 is strictly required
        if (!cleanName) {
          showError(input, rowErr, 'Image 1 (Primary image filename) is required.');
          isValid = false;
          if (!firstErrorElement) firstErrorElement = input;
        } else if (!VALID_IMAGE_EXTENSIONS.test(cleanName)) {
          showError(input, rowErr, 'Invalid image extension. Supported: .jpg, .jpeg, .png, .webp, .svg');
          isValid = false;
          if (!firstErrorElement) firstErrorElement = input;
        } else {
          hideError(input, rowErr);
          processedImages.push(formatImageAssetPath(cleanName));
          hasPrimaryImage = true;
        }
      } else {
        // Additional images are optional if left blank
        if (cleanName) {
          if (!VALID_IMAGE_EXTENSIONS.test(cleanName)) {
            showError(input, rowErr, 'Invalid image extension. Supported: .jpg, .jpeg, .png, .webp, .svg');
            isValid = false;
            if (!firstErrorElement) firstErrorElement = input;
          } else {
            hideError(input, rowErr);
            processedImages.push(formatImageAssetPath(cleanName));
          }
        } else {
          hideError(input, rowErr);
        }
      }
    });

    if (!hasPrimaryImage && isValid) {
      showError(null, generalImageError, 'Please provide at least one valid image filename.');
      isValid = false;
    } else {
      hideError(null, generalImageError);
    }

    // Abort if invalid
    if (!isValid) {
      showBanner('Please correct the highlighted fields before saving.', 'error');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (typeof firstErrorElement.focus === 'function') firstErrorElement.focus();
      }
      return;
    }

    // ----------------------------------------------------
    // Update or Insert Product in In-Memory List
    // ----------------------------------------------------
    if (editingProductId !== null) {
      // EDIT MODE: Update existing item, preserving any extra fields (e.g. details, isSample)
      const existingIndex = productsList.findIndex(p => p.id === editingProductId);
      const originalProduct = existingIndex > -1 ? productsList[existingIndex] : {};

      const updatedProduct = {
        ...originalProduct,
        id: rawCode,
        name: productName,
        price: Math.round(priceVal),
        category: category,
        ageRange: ageRange,
        images: processedImages,
        sizes: selectedSizes,
        colors: activeColors.length > 0 ? activeColors : ["Standard"],
        description: description,
        isNew: isNewArrivalCheckbox.checked,
        isSample: isSampleCheckbox.checked
      };

      if (existingIndex > -1) {
        productsList[existingIndex] = updatedProduct;
      } else {
        productsList.push(updatedProduct);
      }

      logActivity(`Updated ${rawCode}`);
      showBanner(`Product "${rawCode}" saved successfully in the catalogue!`, 'success');
      cancelEditingProduct();

    } else {
      // ADD MODE: Create new product object
      const newProduct = {
        id: rawCode,
        name: productName,
        price: Math.round(priceVal),
        category: category,
        ageRange: ageRange,
        images: processedImages,
        sizes: selectedSizes,
        colors: activeColors.length > 0 ? activeColors : ["Standard"],
        description: description,
        isNew: isNewArrivalCheckbox.checked,
        isSample: isSampleCheckbox.checked
      };

      productsList.push(newProduct);
      logActivity(`Added ${rawCode}`);
      showBanner(`Product "${rawCode}" added to catalogue successfully!`, 'success');

      // Reset form for next entry
      form.reset();
      activeColors = [];
      renderColorChips();
      renderImageRows(['']);
      sizeCheckboxes.forEach(cb => {
        const label = cb.closest('.admin-checkbox-label');
        if (label) label.classList.remove('is-checked');
      });
      codeInput.focus();
    }

    // Refresh catalogue table & JSON output
    renderCatalogTable();
    updateJsonPreview();
  });

  // ----------------------------------------------------
  // JSON Preview & Export Functionality
  // ----------------------------------------------------
  function updateJsonPreview() {
    completeJsonStr = JSON.stringify(productsList, null, 2);
    codeOutput.textContent = completeJsonStr;
    targetFilenameLabel.textContent = 'products.json';

    const hasItems = productsList.length > 0;
    btnCopy.disabled = !hasItems;
    btnDownload.disabled = !hasItems;
  }

  function logActivity(text) {
    sessionActivityLog.unshift(`${new Date().toLocaleTimeString()} &bull; ${text}`);
    if (sessionActivityLog.length > 8) sessionActivityLog.pop();
    updateSessionHistoryDisplay();
  }

  function updateSessionHistoryDisplay() {
    if (sessionActivityLog.length === 0) return;
    sessionHistoryTags.innerHTML = sessionActivityLog.map(item => `
      <div style="font-size: 11px; color: var(--admin-charcoal); line-height: 1.6;">${item}</div>
    `).join('');
  }

  // Copy Complete JSON to Clipboard
  btnCopy.addEventListener('click', async () => {
    if (!completeJsonStr) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(completeJsonStr);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = completeJsonStr;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      btnCopyLabel.textContent = 'COPIED!';
      btnCopy.classList.add('is-copied');
      showBanner(`Products JSON copied successfully (${productsList.length} items). Ready to paste into data/products.json.`, 'success');

      setTimeout(() => {
        btnCopyLabel.textContent = 'COPY COMPLETE JSON';
        btnCopy.classList.remove('is-copied');
      }, 2500);
    } catch (err) {
      console.error('Failed to copy JSON:', err);
      showBanner('Failed to copy to clipboard automatically. Please copy manually from the preview.', 'error');
    }
  });

  // Download complete products.json File
  btnDownload.addEventListener('click', () => {
    if (!completeJsonStr) return;

    const filename = 'products.json';
    const blob = new Blob([completeJsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showBanner(`Downloaded "${filename}" with ${productsList.length} products.`, 'success');
  });

  // Clear Form Button
  btnReset.addEventListener('click', () => {
    if (editingProductId !== null) {
      cancelEditingProduct();
    } else {
      form.reset();
      activeColors = [];
      renderColorChips();
      renderImageRows(['']);
      hideAllErrors();
      hideBanner();
      sizeCheckboxes.forEach(cb => {
        const label = cb.closest('.admin-checkbox-label');
        if (label) label.classList.remove('is-checked');
      });
      codeInput.focus();
    }
  });

  // ----------------------------------------------------
  // Error UI Helpers
  // ----------------------------------------------------
  function showError(inputEl, errorEl, msg) {
    if (inputEl) inputEl.classList.add('has-error');
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.classList.add('is-visible');
    }
  }

  function hideError(inputEl, errorEl) {
    if (inputEl) inputEl.classList.remove('has-error');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('is-visible');
    }
  }

  function hideAllErrors() {
    document.querySelectorAll('.admin-input, .admin-select, .admin-textarea').forEach(el => el.classList.remove('has-error'));
    document.querySelectorAll('.admin-field-error').forEach(el => {
      el.textContent = '';
      el.classList.remove('is-visible');
    });
  }

  function showBanner(msg, type = 'error') {
    banner.className = `admin-banner is-${type}`;
    banner.style.display = 'flex';
    bannerMsg.textContent = msg;
    bannerIcon.textContent = type === 'success' ? '✓' : '⚠️';
  }

  function hideBanner() {
    banner.className = 'admin-banner';
    banner.style.display = 'none';
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ----------------------------------------------------
  // Initial Boot
  // ----------------------------------------------------
  renderImageRows(['']);
  loadExistingProducts();
}
