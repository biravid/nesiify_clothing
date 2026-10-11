/**
 * ===================================================
 * WHATSAPP ORDERING & INQUIRY MODULE
 * ===================================================
 * 
 * Single source of truth for all WhatsApp interactions.
 * Reads phone number strictly from SITE_CONFIG.
 */

const WhatsAppService = {
  /**
   * Normalize phone number to international format digits only
   * e.g. "91XXXXXXXXXX" -> "91XXXXXXXXXX"
   */
  getCleanNumber() {
    const raw = (typeof SITE_CONFIG !== 'undefined' && SITE_CONFIG.whatsappNumber) 
      ? SITE_CONFIG.whatsappNumber 
      : "918300947503";
    return raw.replace(/[^0-9]/g, '');
  },

  /**
   * Construct WhatsApp Web / App universal wa.me link
   * @param {string} messageText 
   * @returns {string} Fully encoded WhatsApp URL
   */
  buildWhatsAppUrl(messageText) {
    const phone = this.getCleanNumber();
    const encoded = encodeURIComponent(messageText);
    return `https://wa.me/${phone}?text=${encoded}`;
  },

  /**
   * Generate formatted product order message matching Section 15
   * @param {Object} product 
   * @param {Object} selection { size, color, quantity }
   * @returns {string} Formatted plain text message
   */
  createOrderMessage(product, selection) {
    const currency = (typeof SITE_CONFIG !== 'undefined' && SITE_CONFIG.currency) ? SITE_CONFIG.currency : '₹';
    const totalPrice = (Number(product.price) || 0) * (Number(selection.quantity) || 1);

    const lines = [
      "Hi! I'm interested in ordering from Nesiify Clothing.",
      "",
      `Product: ${product.name}`,
      `Product Code: ${product.id}`
    ];

    if (product.ageRange) {
      lines.push(`Age: ${product.ageRange}`);
    }

    lines.push(
      `Size: ${selection.size || 'Standard'}`,
      `Colour: ${selection.color || 'Standard'}`,
      `Quantity: ${selection.quantity || 1}`,
      `Price: ${currency}${totalPrice.toLocaleString('en-IN')}`,
      "",
      "Is this available for delivery?"
    );

    return lines.join('\n');
  },

  /**
   * Validate order selections before initiating chat
   * @param {Object} product 
   * @param {Object} selection 
   * @returns {{ isValid: boolean, error?: string }}
   */
  validateOrder(product, selection) {
    if (!product) {
      return { isValid: false, error: "Product details could not be found." };
    }

    // Validate size if product has size variants
    if (Array.isArray(product.sizes) && product.sizes.length > 0) {
      if (!selection.size) {
        return { isValid: false, error: "Please select a size before ordering." };
      }
    }

    // Validate colour if product has colour variants
    if (Array.isArray(product.colors) && product.colors.length > 0) {
      if (!selection.color) {
        return { isValid: false, error: "Please select a colour before ordering." };
      }
    }

    // Validate quantity
    const qty = Number(selection.quantity);
    if (isNaN(qty) || qty < 1) {
      return { isValid: false, error: "Quantity must be at least 1." };
    }

    return { isValid: true };
  },

  /**
   * Trigger WhatsApp product order flow
   * @param {Object} product 
   * @param {Object} selection 
   * @param {HTMLElement} errorElement DOM element to show inline error message
   */
  orderProduct(product, selection, errorElement) {
    const validation = this.validateOrder(product, selection);

    if (!validation.isValid) {
      if (errorElement) {
        errorElement.textContent = validation.error;
        errorElement.className = "form-message is-error";
        errorElement.style.display = "flex";
      }
      return false;
    }

    // Clear error message if present
    if (errorElement) {
      errorElement.textContent = "";
      errorElement.style.display = "none";
    }

    const message = this.createOrderMessage(product, selection);
    const url = this.buildWhatsAppUrl(message);

    // Open WhatsApp in new tab/app
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  },

  /**
   * Format multi-item cart order message for WhatsApp checkout
   * @param {Array} items List of cart item objects
   * @param {Object} customer Customer info { name, city }
   * @returns {string} Formatted WhatsApp message
   */
  createCartOrderMessage(items, customer = {}) {
    const currency = (typeof SITE_CONFIG !== 'undefined' && SITE_CONFIG.currency) ? SITE_CONFIG.currency : '₹';
    let grandTotal = 0;

    const lines = [
      "Hi! I'd like to place an order.",
      ""
    ];

    if (customer && (customer.name || customer.city)) {
      const custInfo = [customer.name, customer.city].filter(Boolean).join(' • ');
      lines.push(`Customer: ${custInfo}`, "");
    }

    lines.push("Order Items:", "");

    items.forEach((item, idx) => {
      const qty = Number(item.quantity) || 1;
      const unitPrice = Number(item.price) || 0;
      const subtotal = qty * unitPrice;
      grandTotal += subtotal;

      lines.push(`${idx + 1}. ${item.name}`);
      lines.push(`Product Code: ${item.id}`);
      if (item.size) lines.push(`Size: ${item.size}`);
      if (item.color) lines.push(`Colour: ${item.color}`);
      lines.push(`Quantity: ${qty}`);
      lines.push(`Price: ${currency}${unitPrice.toLocaleString('en-IN')} each`);
      lines.push(`Subtotal: ${currency}${subtotal.toLocaleString('en-IN')}`);
      lines.push("");
    });

    lines.push("--------------------");
    lines.push(`Total: ${currency}${grandTotal.toLocaleString('en-IN')}`);
    lines.push("--------------------");
    lines.push("");
    lines.push("Please confirm availability and order details.");

    return lines.join('\n');
  },

  /**
   * Execute multi-item cart checkout via WhatsApp
   * @param {Array} items List of cart items
   * @param {Object} customer Customer details { name, city }
   * @returns {boolean} Whether checkout was initiated
   */
  checkoutCartWhatsApp(items, customer = {}) {
    if (!Array.isArray(items) || items.length === 0) {
      if (typeof Cart !== 'undefined' && typeof Cart.showToast === 'function') {
        Cart.showToast("Your bag is empty. Add a product before checkout.");
      } else {
        alert("Your bag is empty. Add a product before checkout.");
      }
      return false;
    }

    const message = this.createCartOrderMessage(items, customer);
    const url = this.buildWhatsAppUrl(message);
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  },

  /**
   * Quick chat trigger for size help or general inquiries
   * @param {string} customInquiry 
   */
  openGeneralChat(customInquiry = "Hi! I have a question about your collection.") {
    const url = this.buildWhatsAppUrl(customInquiry);
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};
