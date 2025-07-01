# Refer 2 Earn: Method Sheet for Adding New Offers

Follow these steps to add a new offer to the site, ensuring consistency and brand alignment.

---

## 1. Create the Offer Page
- **Duplicate** an existing offer HTML file (e.g., `offers/baremetrics.html`).
- **Rename** the file to match the new offer (e.g., `offers/newbrand.html`).
- **Update** the following:
  - **Title** in the `<title>` tag.
  - **Brand-specific class** in the `<body>` tag (e.g., `brand-newbrand`).
  - **Headline, subheadline, and offer details** in the body.
  - **Button text and link**.
  - **Card colors and accent styles** to match the new brand (update CSS if needed).
  - Use the brand's gradient/button class (e.g., `.cta-button-brandname`) for all main action buttons and ensure the headline uses the brand's gradient style via the brand class, as seen in other offers.

## 2. Add Brand-Specific Styles
- In `