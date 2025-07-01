Refer 2 Earn: Method Sheet for Adding New Offers
Follow these steps to add a new offer to the site, ensuring consistency and brand alignment.
1. Create the Offer Page
Duplicate an existing offer HTML file (e.g., offers/baremetrics.html).
Rename the file to match the new offer (e.g., offers/newbrand.html).
Update the following:
Title in the <title> tag.
Brand-specific class in the <body> tag (e.g., brand-newbrand).
Headline, subheadline, and offer details in the body.
Button text and link.
Card colors and accent styles to match the new brand (see step 2 for CSS).
Use the brand's gradient/button class (e.g., .cta-button-newbrand) for all main action buttons and ensure the headline uses the brand's gradient style via the brand class, as seen in other offers.
2. Add Brand-Specific Styles
In styles.css, add a new section for the brand by duplicating an existing brand's section (e.g., Baremetrics) as a template.
Update the color codes and class names to match the new brand's palette.
Include styles for:
.brand-newbrand .headline (gradient headline)
.cta-button-newbrand (main button)
.brand-newbrand .mini-card .title and .mini-card (card accent)
.brand-newbrand .card (card border and shadow)
.brand-newbrand .nav-dropdown and related dropdown styles
.brand-newbrand .nav-category-title (dropdown category title)
Apply these classes to the offer page, buttons, and dropdown for full visual consistency.
3. Update the Navbar
Add the new offer to the appropriate category in navbar.html with the correct link and incentive.
Use the brand-specific class for dropdown styling if needed.
Make sure the nav dropdowns are in alphabetical order
4. Update the Homepage Carousel
Add a new .offer-card for the brand in the relevant section in index.html.
Use the brand-specific class for the card and button.
Make sure the carousel offers are in alphabetical order
5. Add to Referral Links List
Add the new offer's main referral link to all-referral-links.txt in the root folder.
Format: Brand Name: https://referral-link-here.com
Make sure the links list is in alphabetical order
6. Test
Check the new offer page on desktop and mobile.
Test navigation and carousel functionality.
Ensure all brand colors, gradients, borders, and dropdowns match the intended style.
Keep this file up to date for future reference!