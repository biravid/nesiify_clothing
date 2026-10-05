/**
 * ===================================================
 * NESIIFY CLOTHING — PRODUCT MANAGER (ADMIN TOOL)
 * Standalone frontend utility to generate product JSON
 * ===================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  initAdminManager();
});

function initAdminManager() {
  // State
  const sessionGeneratedIds = new Set();
  const knownExistingIds = new Set(['NC001', 'NC002', 'NC003', 'NC004', 'NC005', 'NC006', 'NC007', 'NC008']);
  let activeColors = [];
  let lastGeneratedProduct = null;
  let lastGeneratedJsonStr = '';

  // DOM Elements - Form
  const form = document.getElementById('productForm');
  const codeInput = document.getElementById('productCode');
  const nameInput = document.getElementById('productName');
  const priceInput = document.getElementById('productPrice');
  const categorySelect = document.getElementById('productCategory');
  const ageRangeSelect = document.getElementById('productAgeRange');
  const sizeCheckboxes = document.querySelectorAll('input[name="productSizes"]');
  const descTextarea = document.getElementById('productDescription');
  const isNewArrivalCheckbox = document.getElementById('isNewArrival');
  const isSampleCheckbox = document.getElementById('isSampleProduct');
  const btnReset = document.getElementById('btnReset');

  // DOM Elements - Image Inputs
  const imageInputs = [
    { input: document.getElementById('image1'), preview: document.getElementById('previewPath1'), error: document.getElementById('image1Error') },
    { input: document.getElementById('image2'), preview: document.getElementById('previewPath2'), error: document.getElementById('image2Error') },
    { input: document.getElementById('image3'), preview: document.getElementById('previewPath3'), error: document.getElementById('image3Error') },
    { input: document.getElementById('image4'), preview: document.getElementById('previewPath4'), error: document.getElementById('image4Error') }
  ];

  // DOM Elements - Colors
  const colorTagContainer = document.getElementById('colorTagsContainer');
  const colorTagInput = document.getElementById('colorTagInput');
  const quickAddButtons = document.querySelectorAll('.admin-suggested-btn');

  // DOM Elements - Error Display
  const banner = document.getElementById('adminFormBanner');
  const bannerMsg = document.getElementById('adminBannerMsg');
  const bannerIcon = document.getElementById('adminBannerIcon');
  const codeError = document.getElementById('productCodeError');
  const nameError = document.getElementById('productNameError');
  const priceError = document.getElementById('productPriceError');
  const categoryError = document.getElementById('productCategoryError');
  const ageRangeError = document.getElementById('productAgeRangeError');
  const sizesError = document.getElementById('productSizesError');
  const descError = document.getElementById('productDescriptionError');

  // DOM Elements - Output & Actions
  const codeOutput = document.getElementById('jsonCodeOutput');
  const btnCopy = document.getElementById('btnCopyJson');
  const btnCopyLabel = document.getElementById('btnCopyLabel');
  const btnDownload = document.getElementById('btnDownloadJson');
  const targetFilenameLabel = document.getElementById('jsonTargetFilename');
  const sessionHistoryTags = document.getElementById('sessionHistoryTags');

  // Try to load any additional existing IDs from data/products.json if available
  fetch('../data/products.json')
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
        data.forEach(item => {
          if (item && item.id) knownExistingIds.add(item.id.toUpperCase());
        });
      }
    })
    .catch(() => {
      // Standalone mode / fetch error - fallback known set already populated
    });

  // ----------------------------------------------------
  // Image Path Helpers & Live Preview
  // ----------------------------------------------------
  const VALID_IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|svg)$/i;

  function cleanImageFilename(rawVal) {
    if (!rawVal) return '';
    let val = rawVal.trim();
    // Strip leading "assets/products/" if user accidentally typed or pasted full path
    val = val.replace(/^assets\/products\//i, '');
    val = val.replace(/^products\//i, '');
    val = val.replace(/^\/+/, '');
    return val;
  }

  function formatImageAssetPath(rawVal) {
    const filename = cleanImageFilename(rawVal);
    if (!filename) return '';
    return `assets/products/${filename}`;
  }

  function updateImagePreviews() {
    imageInputs.forEach(item => {
      if (!item.input || !item.preview) return;
      const cleanName = cleanImageFilename(item.input.value);
      if (cleanName) {
        item.preview.textContent = `assets/products/${cleanName}`;
      } else {
        item.preview.innerHTML = `assets/products/&mdash;`;
      }
    });
  }

  imageInputs.forEach(item => {
    if (item.input) {
      item.input.addEventListener('input', () => {
        updateImagePreviews();
        hideError(item.input, item.error);
      });
    }
  });

  // ----------------------------------------------------
  // Colors Tag/Chip System
  // ----------------------------------------------------
  function renderColorChips() {
    // Remove existing chips
    const existingChips = colorTagContainer.querySelectorAll('.admin-tag-chip');
    existingChips.forEach(chip => chip.remove());

    // Insert chips before the input
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
    const trimmed = colorName.trim();
    if (!trimmed) return;
    // Check if color already in list (case-insensitive)
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

  // Clear errors on input
  codeInput.addEventListener('input', () => hideError(codeInput, codeError));
  nameInput.addEventListener('input', () => hideError(nameInput, nameError));
  priceInput.addEventListener('input', () => hideError(priceInput, priceError));
  categorySelect.addEventListener('change', () => hideError(categorySelect, categoryError));
  ageRangeSelect.addEventListener('change', () => hideError(ageRangeSelect, ageRangeError));
  descTextarea.addEventListener('input', () => hideError(descTextarea, descError));

  // ----------------------------------------------------
  // Form Validation & Generation
  // ----------------------------------------------------
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    hideBanner();

    let isValid = true;
    let firstErrorElement = null;

    // 1. Product Code
    const rawCode = codeInput.value.trim().toUpperCase();
    if (!rawCode) {
      showError(codeInput, codeError, 'Product Code is required (e.g. NC009).');
      isValid = false;
      if (!firstErrorElement) firstErrorElement = codeInput;
    } else if (sessionGeneratedIds.has(rawCode)) {
      showError(codeInput, codeError, `Product Code "${rawCode}" was already generated in this session. Please use a unique ID.`);
      isValid = false;
      if (!firstErrorElement) firstErrorElement = codeInput;
    } else if (knownExistingIds.has(rawCode)) {
      // Warning for existing catalogue ID
      showError(codeInput, codeError, `Warning: "${rawCode}" already exists in the catalogue. Please use a new code (e.g. NC009).`);
      isValid = false;
      if (!firstErrorElement) firstErrorElement = codeInput;
    } else {
      hideError(codeInput, codeError);
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

    // 8. Images Validation
    const processedImages = [];
    
    // Image 1 is required
    const img1Val = cleanImageFilename(imageInputs[0].input.value);
    if (!img1Val) {
      showError(imageInputs[0].input, imageInputs[0].error, 'Image 1 (Primary image) is required.');
      isValid = false;
      if (!firstErrorElement) firstErrorElement = imageInputs[0].input;
    } else if (!VALID_IMAGE_EXTENSIONS.test(img1Val)) {
      showError(imageInputs[0].input, imageInputs[0].error, 'Filename must have a valid extension: .jpg, .jpeg, .png, .webp, or .svg');
      isValid = false;
      if (!firstErrorElement) firstErrorElement = imageInputs[0].input;
    } else {
      hideError(imageInputs[0].input, imageInputs[0].error);
      processedImages.push(formatImageAssetPath(img1Val));
    }

    // Optional Images (2, 3, 4)
    for (let i = 1; i < imageInputs.length; i++) {
      const field = imageInputs[i];
      const val = cleanImageFilename(field.input.value);
      if (val) {
        if (!VALID_IMAGE_EXTENSIONS.test(val)) {
          showError(field.input, field.error, 'Filename must have a valid extension: .jpg, .jpeg, .png, .webp, or .svg');
          isValid = false;
          if (!firstErrorElement) firstErrorElement = field.input;
        } else {
          hideError(field.input, field.error);
          processedImages.push(formatImageAssetPath(val));
        }
      } else {
        hideError(field.input, field.error);
      }
    }

    // Abort if invalid
    if (!isValid) {
      showBanner('Please correct the highlighted fields before generating.', 'error');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (typeof firstErrorElement.focus === 'function') firstErrorElement.focus();
      }
      return;
    }

    // ----------------------------------------------------
    // Construct Product Object Matching Existing Schema
    // ----------------------------------------------------
    const productObject = {
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

    lastGeneratedProduct = productObject;
    lastGeneratedJsonStr = JSON.stringify(productObject, null, 2);

    // Track session ID
    sessionGeneratedIds.add(rawCode);
    updateSessionHistoryDisplay();

    // Render Preview
    renderJsonPreview(lastGeneratedJsonStr, rawCode);

    // Enable action buttons
    btnCopy.disabled = false;
    btnDownload.disabled = false;

    // Show Success Banner
    showBanner(`Product JSON for "${rawCode}" generated successfully! Use COPY JSON or DOWNLOAD JSON.`, 'success');
  });

  // ----------------------------------------------------
  // Output Rendering & Actions
  // ----------------------------------------------------
  function renderJsonPreview(jsonStr, code) {
    codeOutput.textContent = jsonStr;
    targetFilenameLabel.textContent = `${code}-product.json`;
  }

  function updateSessionHistoryDisplay() {
    if (sessionGeneratedIds.size === 0) return;
    sessionHistoryTags.innerHTML = '';
    sessionGeneratedIds.forEach(id => {
      const tag = document.createElement('span');
      tag.className = 'admin-session-code';
      tag.textContent = id;
      sessionHistoryTags.appendChild(tag);
    });
  }

  // Copy to Clipboard
  btnCopy.addEventListener('click', async () => {
    if (!lastGeneratedJsonStr) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(lastGeneratedJsonStr);
      } else {
        // Fallback for older environments
        const textArea = document.createElement('textarea');
        textArea.value = lastGeneratedJsonStr;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      // Visual feedback
      btnCopyLabel.textContent = 'COPIED!';
      btnCopy.classList.add('is-copied');
      setTimeout(() => {
        btnCopyLabel.textContent = 'COPY JSON';
        btnCopy.classList.remove('is-copied');
      }, 2000);
    } catch (err) {
      console.error('Failed to copy JSON:', err);
      showBanner('Failed to copy to clipboard. Please copy manually from the preview.', 'error');
    }
  });

  // Download JSON File
  btnDownload.addEventListener('click', () => {
    if (!lastGeneratedProduct || !lastGeneratedJsonStr) return;

    const filename = `${lastGeneratedProduct.id}-product.json`;
    const blob = new Blob([lastGeneratedJsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  // Clear Form
  btnReset.addEventListener('click', () => {
    form.reset();
    activeColors = [];
    renderColorChips();
    updateImagePreviews();
    hideAllErrors();
    hideBanner();
    sizeCheckboxes.forEach(cb => {
      const label = cb.closest('.admin-checkbox-label');
      if (label) label.classList.remove('is-checked');
    });
    codeInput.focus();
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
    bannerMsg.textContent = msg;
    bannerIcon.textContent = type === 'success' ? '✓' : '⚠️';
  }

  function hideBanner() {
    banner.className = 'admin-banner';
    banner.style.display = 'none';
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Initialize view
  updateImagePreviews();
}
