/**
 * ===================================================
 * CENTRAL BRAND & BUSINESS CONFIGURATION
 * ===================================================
 * 
 * IMPORTANT: 
 * Update these placeholder values with your actual business
 * details before deploying to production.
 * 
 * All pages dynamically read from this single source of truth!
 */

const SITE_CONFIG = {
  // Brand Identity — Nesiify Clothing
  brandName: "Nesiify Clothing",
  tagline: "Daily wear with comfort",
  positioning: "Genuine Quality",
  description: "Comfortable everyday clothing for kids aged 2–12.",
  ageRange: "Age 2–12",
  logoUrl: "assets/logo/nesiify_logo.jpeg",

  // Primary Categories
  categories: [
    "T-Shirts",
    "Pyjamas",
    "Shorts",
    "Sets"
  ],

  // Primary WhatsApp Business Contact (Placeholder until real phone is provided)
  // Format: country code + 10-digit number without spaces or symbols (e.g., "919876543210")
  whatsappNumber: "91XXXXXXXXXX",

  // Social & Web Links
  instagramUrl: "https://instagram.com/nesiify_clothing",
  email: "contact@nesiifyclothing.com",
  
  // Operational Details
  businessHours: "Mon - Sat: 10:00 AM - 7:00 PM IST",
  shippingLocation: "Pan-India Shipping",

  // Store Currency Symbol
  currency: "₹",

  // Copyright Year
  copyrightYear: 2026
};

// Freeze object to avoid accidental mutation
if (typeof Object.freeze === 'function') {
  Object.freeze(SITE_CONFIG);
}
