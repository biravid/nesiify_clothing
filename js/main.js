/**
 * ===================================================
 * GLOBAL APPLICATION CONTROLLER & CONFIG INJECTOR
 * ===================================================
 * 
 * Runs on every page to inject central configuration,
 * wire up global WhatsApp triggers, and initialize UI helpers.
 */

document.addEventListener('DOMContentLoaded', () => {
  applyGlobalConfig();
  initGlobalWhatsAppTriggers();
  initFloatingWhatsApp();
});

/**
 * Replace placeholders in DOM with values from js/config.js
 */
function applyGlobalConfig() {
  if (typeof SITE_CONFIG === 'undefined') return;

  // Brand Name
  document.querySelectorAll('[data-config="brandName"]').forEach(el => {
    el.textContent = SITE_CONFIG.brandName;
  });

  // Tagline
  document.querySelectorAll('[data-config="tagline"]').forEach(el => {
    el.textContent = SITE_CONFIG.tagline;
  });

  // Description
  document.querySelectorAll('[data-config="description"]').forEach(el => {
    el.textContent = SITE_CONFIG.description;
  });

  // Business Hours
  document.querySelectorAll('[data-config="businessHours"]').forEach(el => {
    el.textContent = SITE_CONFIG.businessHours;
  });

  // Email
  document.querySelectorAll('[data-config="email"]').forEach(el => {
    el.textContent = SITE_CONFIG.email;
    if (el.tagName.toLowerCase() === 'a') {
      el.href = `mailto:${SITE_CONFIG.email}`;
    }
  });

  // Instagram URL
  document.querySelectorAll('[data-config="instagramUrl"]').forEach(el => {
    if (el.tagName.toLowerCase() === 'a') {
      el.href = SITE_CONFIG.instagramUrl;
      el.target = "_blank";
      el.rel = "noopener noreferrer";
    }
  });

  // Copyright Year
  document.querySelectorAll('[data-config="copyrightYear"]').forEach(el => {
    el.textContent = SITE_CONFIG.copyrightYear || new Date().getFullYear();
  });
}

/**
 * Wire up all buttons that trigger general WhatsApp chats
 */
function initGlobalWhatsAppTriggers() {
  // Any element with .btn-whatsapp-chat or [data-trigger-whatsapp]
  document.querySelectorAll('.btn-whatsapp-chat, [data-trigger-whatsapp]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const customMsg = btn.getAttribute('data-whatsapp-msg') || "Hi! I have a question about your clothing brand.";
      if (typeof WhatsAppService !== 'undefined') {
        WhatsAppService.openGeneralChat(customMsg);
      } else {
        const phone = (typeof SITE_CONFIG !== 'undefined') ? SITE_CONFIG.whatsappNumber : "918300947503";
        window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(customMsg)}`, '_blank');
      }
    });
  });
}

/**
 * Setup Floating WhatsApp button behavior and links
 */
function initFloatingWhatsApp() {
  const floatingBtn = document.querySelector('.floating-whatsapp');
  if (!floatingBtn) return;

  floatingBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (typeof WhatsAppService !== 'undefined') {
      WhatsAppService.openGeneralChat("Hi! I'm browsing your website and would like some assistance.");
    }
  });
}
