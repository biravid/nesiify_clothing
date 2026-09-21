# Nesiify Clothing — Official Website (Version 1)

A clean, premium, mobile-first product discovery catalogue and WhatsApp direct ordering website created specifically for **Nesiify Clothing** — Kids Clothing (Ages 2–12), based on its official Instagram profile (`@nesiify_clothing`).

> **Tagline**: *"Daily wear with comfort"* &bull; *"Genuine Quality"*

---

## 1. Project Overview

This website is **100% static** (HTML5, Vanilla CSS3, Vanilla JavaScript, JSON product data) with **zero backend**, **no framework dependencies**, and **no server-side build step required**. It is directly deployable to Netlify, GitHub Pages, or any static web host.

### The Conversion Flow:
```
Instagram Profile (@nesiify_clothing)
          ↓
Website Landing / Catalog
          ↓
Browse Kids Daily Wear (T-Shirts, Pyjamas, Shorts, Sets)
          ↓
Open Product Details & Age Range (2–12 Years)
          ↓
Select Size / Colour / Quantity
          ↓
Click "ORDER ON WHATSAPP"
          ↓
WhatsApp chat opens with pre-filled product details & age recommendation
          ↓
Parent / Customer sends message → Nesiify Clothing confirms order directly
```

---

## 2. File & Folder Structure

```
website/
├── index.html                  # Homepage (Hero kids banner, 4 categories, New Arrivals, Featured, Benefits, IG, WA CTA)
├── shop.html                   # Kids catalogue page with dynamic category filters (T-Shirts, Pyjamas, Shorts, Sets)
├── product.html                # Product detail page (gallery, age badges, size guide accordion, WA CTA)
├── about.html                  # Brand story ("Made for Everyday Childhood", Genuine Quality, Comfort)
├── contact.html                # Direct contact channels (WhatsApp, Instagram, Email, Kids Sizing FAQ)
│
├── policies/
│   ├── shipping.html           # Clear shipping & delivery policy
│   ├── returns.html            # 7-day hassle-free kids size exchange & returns policy
│   └── privacy.html            # Privacy policy tailored to WhatsApp ordering
│
├── css/
│   ├── variables.css           # Brand olive green (#616438), warm cream (#FAF6EB), dark (#1E2015)
│   ├── global.css              # Reset, typography (Manrope), buttons, badges, container utilities
│   ├── navbar.css              # Desktop navbar, mobile drawer, brand logo wrapper, floating WA
│   ├── hero.css                # Hero section, editorial featured kids collection banner, benefit blocks
│   ├── products.css            # Category cards, product card (4:5 ratio, age badges, price)
│   ├── product-detail.css      # Desktop 2-column layout, image gallery, age badge, size guide accordion
│   ├── footer.css              # Multi-column footer with authentic logo, social links, copyright
│   └── responsive.css          # Mobile-first breakpoints (320px, 375px, 390px, 430px, 768px, 1024px)
│
├── js/
│   ├── config.js               # Central configuration (Nesiify Clothing, WhatsApp, Instagram, Email, Currency)
│   ├── products.js             # Data fetcher, age badges, helpers (getProducts, getProductById, filterByCategory)
│   ├── shop.js                 # Shop page controller, URL category param handling, filter pills
│   ├── product.js              # Product detail controller, variant selections, qty stepper, validation
│   ├── whatsapp.js             # Single source of truth for WhatsApp message formatting & URL generation
│   ├── navbar.js               # Mobile menu drawer, sticky header, bottom nav active state
│   └── main.js                 # Global initializer (footer dates, dynamic brand links, floating WA button)
│
├── data/
│   └── products.json           # Kids daily wear products (Ages 2-12) across T-Shirts, Pyjamas, Shorts, Sets
│
├── assets/
│   ├── logo/
│   │   ├── nesiify_logo.jpeg   # Authentic original Nesiify Clothing logo (unmodified)
│   │   └── favicon.svg         # Crisp SVG favicon matching Nesiify brand motif
│   ├── products/               # Kids daily wear product images (NC001–NC008)
│   ├── categories/             # 4 SVG categories: t-shirts.svg, pyjamas.svg, shorts.svg, sets.svg
│   ├── banners/                # Real kids hero & featured collection banners
│   ├── instagram/              # Instagram feed showcase tiles for @nesiify_clothing
│   └── icons/                  # Minimal UI icons (Quality, Comfort, Response, Packing, WhatsApp)
│
└── README.md                   # Documentation & guide
```

---

## 3. Authentic Brand Identity & Logo

The authentic original logo asset is located at:
`assets/logo/nesiify_logo.jpeg`

It is used directly across:
- Desktop Navigation Bar
- Mobile Navigation Bar & Drawer
- Website Footer

The logo image is seamlessly displayed in a responsive `.brand-logo-wrapper` that preserves the original artwork cleanly across all screens.

---

## 4. Central Configuration

All business-specific information is stored in **ONE** central file: `js/config.js`.

To update your brand details, open `js/config.js`:

```javascript
const SITE_CONFIG = {
  brandName: "Nesiify Clothing",
  tagline: "Daily wear with comfort",
  subTagline: "Genuine Quality",
  description: "Comfortable, premium daily wear for kids aged 2–12 years.",
  
  // WhatsApp Number (Country code + 10-digit number without spaces or symbols)
  whatsappNumber: "919876543210",

  // Social & Contact Links
  instagramUrl: "https://instagram.com/nesiify_clothing",
  instagramHandle: "@nesiify_clothing",
  email: "hello@nesiifyclothing.com",
  
  // Business Hours & Currency
  businessHours: "Mon - Sat: 10:00 AM - 7:00 PM IST",
  currency: "₹",
  copyrightYear: 2026,
  targetAudience: "Kids Clothing (Ages 2–12)",
  
  // Exact 4 Kids Categories
  categories: [
    { id: "all", name: "All Products" },
    { id: "t-shirts", name: "T-Shirts" },
    { id: "pyjamas", name: "Pyjamas" },
    { id: "shorts", name: "Shorts" },
    { id: "sets", name: "Sets" }
  ]
};
```

All 8 pages automatically read from this configuration.

---

## 5. Kids Product Catalogue Structure

Open `data/products.json` to view or update items:

```json
{
  "id": "NC001",
  "name": "Everyday Soft Cotton Tee",
  "price": 399,
  "category": "T-Shirts",
  "ageRange": "2–8 years",
  "images": [
    "assets/products/nc001-1.jpg",
    "assets/products/nc001-2.jpg"
  ],
  "sizes": ["2-3Y", "4-5Y", "6-7Y", "8Y"],
  "colors": ["Olive Green", "Soft Cream", "Mustard"],
  "description": "Ultra-breathable 100% combed cotton daily t-shirt crafted for gentle softness on young skin.",
  "details": [
    "100% Combed Breathable Cotton",
    "Bio-washed for ultimate softness",
    "Non-toxic, kid-safe dyes",
    "Machine washable, colourfast"
  ],
  "isNew": true,
  "isFeatured": true
}
```

### Supported Categories (Kids Only):
- `T-Shirts`
- `Pyjamas`
- `Shorts`
- `Sets`

---

## 6. WhatsApp Order Message Format

When a parent selects kids sizes on the product detail page and clicks **"ORDER ON WHATSAPP"**, the website formats an instant WhatsApp message:

```
Hi Nesiify Clothing! I'd like to order this for my child:

Product: Everyday Soft Cotton Tee
Product Code: NC001
Age: 2–8 years
Size: 4-5Y
Colour: Olive Green
Quantity: 1
Price: ₹399

Is this available?
```

If the parent has not selected a size, the page alerts them:
> *"Please select a size for your child before ordering."*

---

## 7. Local Testing Instructions

Because product data is loaded via `fetch('data/products.json')`, run a local HTTP server:

```powershell
# Using Python
python -m http.server 8080

# Or using Node.js
npx serve -l 8080 .
```

Then open `http://localhost:8080` in your web browser.

---

## 8. Netlify Deployment Instructions

1. **Drag and Drop**:
   - Log in to [Netlify](https://www.netlify.com).
   - Drag and drop the `website` folder directly into the Netlify Sites dashboard.
   - Your site goes live instantly with zero configuration.

2. **Git Repository**:
   - Connect your GitHub repo to Netlify.
   - Build command: *(leave blank)*
   - Publish directory: `.`
