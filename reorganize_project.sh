#!/bin/bash
# Reorganize Refer2Earn project structure

set -e

# Create directories
mkdir -p public/icons
mkdir -p pages/offers
mkdir -p scripts
mkdir -p data
mkdir -p styles

# Move static assets (images and icons)
mv banner.png public/
[ -d icons ] && mv icons/* public/icons/ && rmdir icons

# Move HTML pages
mv index.html pages/
mv information.html pages/
mv privacy-policy.html pages/
mv terms-of-use.html pages/
mv navbar.html pages/
mv banner.html pages/
# Offers directory (if exists)
[ -d offers ] && mv offers/* pages/offers/ && rmdir offers

# Move scripts (JS and Python)
mv *.js scripts/ 2>/dev/null || true
mv *.py scripts/ 2>/dev/null || true

# Move data
mv offers_sheet.csv data/
mv all-referral-links.txt data/
mv sitemap.xml data/

# Move styles
mv styles.css styles/

# Update references in HTML files
find pages/ -type f -name '*.html' -exec sed -i 's|href="styles.css"|href="/styles/styles.css"|g' {} +
find pages/ -type f -name '*.html' -exec sed -i 's|src="inject-navbar.js"|src="/scripts/inject-navbar.js"|g' {} +
find pages/ -type f -name '*.html' -exec sed -i 's|src="inject-carousels.js"|src="/scripts/inject-carousels.js"|g' {} +
find pages/ -type f -name '*.html' -exec sed -i 's|src="inject-banner.js"|src="/scripts/inject-banner.js"|g' {} +

# Done
printf '\nProject reorganized!\nCheck your HTML/script references and test your site.\n' 