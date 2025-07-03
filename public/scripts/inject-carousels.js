// inject-carousels.js
// Dynamically generates homepage carousels from offers_sheet.csv
// Now with left/right chevrons and 2-cards-at-a-time scrolling per category

// Add this script to your index.html: <script src="inject-carousels.js"></script>
// Make sure you have a <div id="carousels"></div> in your HTML

// Uses PapaParse for CSV parsing (add <script src="https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js"></script> in your HTML)

console.log("inject-carousels.js loaded");

document.addEventListener('DOMContentLoaded', function () {
  Promise.all([
    fetch('/pages/offers/generated_offers.json').then(r => r.json()),
    fetch('/data/offers_sheet.csv').then(r => r.text())
  ]).then(([manifest, csvText]) => {
    console.log("Fetched manifest and CSV", manifest, csvText.slice(0, 200));
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    // Only include offers whose File (normalized) is in the manifest
    const manifestSet = new Set(manifest.map(f => f.toLowerCase()));
    const records = parsed.data.filter(row => {
      const file = (row['File'] || '').trim().toLowerCase().replace(/\.html$/, '');
      return manifestSet.has(file);
    });
    // Group by category
    const categories = {};
    records.forEach(row => {
      const cat = (row['Category'] || 'Other').trim();
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(row);
    });
    // Sort categories
    const sortedCats = Object.keys(categories).sort((a, b) => a.localeCompare(b));
    // Preset gradients for categories (vivid two-tone style)
    const categoryGradients = {
      'Banking': 'linear-gradient(135deg, #e3f0ff 0%, #1976d2 100%)', // blue
      'Business Tools': 'linear-gradient(135deg, #ffe3e3 0%, #d32f2f 100%)', // red
      'Cashback': 'linear-gradient(135deg, #e3fff3 0%, #009688 100%)', // teal
      'Media': 'linear-gradient(135deg, #f3e3ff 0%, #8e24aa 100%)', // purple
      'Networks': 'linear-gradient(135deg, #fffde3 0%, #ffd600 100%)', // yellow
      'Shopping': 'linear-gradient(135deg, #ffe0b2 0%, #e65100 100%)', // orange
      'Other': 'linear-gradient(135deg, #f0f0f0 0%, #757575 100%)', // gray
    };
    // Preset border/header/chevron colors for categories
    const categoryHeaderColors = {
      'Banking': '#1a237e',
      'Business Tools': '#b71c1c',
      'Cashback': '#00695c',
      'Media': '#7b1fa2',
      'Networks': '#bfa600',
      'Shopping': '#e65100', // vibrant orange
      'Other': '#444',
    };
    // Brand gradients for offer cards (add/adjust as needed)
    const brandGradients = {
      'brand-monzo': 'linear-gradient(135deg, #ffe082 0%, #ff8a65 100%)',
      'brand-giffgaff': 'linear-gradient(135deg, #fffde7 0%, #ffd600 100%)',
      'brand-virgin': 'linear-gradient(135deg, #ffe3e3 0%, #d32f2f 100%)',
      'brand-shein': 'linear-gradient(135deg, #fceabb 0%, #f8b500 100%)',
      'brand-amazonprimevideo': 'linear-gradient(135deg, #e3f0ff 0%, #1976d2 100%)',
      'brand-baremetrics': 'linear-gradient(135deg, #e3e3ff 0%, #7b1fa2 100%)',
      'brand-engagebay': 'linear-gradient(135deg, #ffe3e3 0%, #b71c1c 100%)',
      'brand-befrugal': 'linear-gradient(135deg, #e3fff3 0%, #009688 100%)',
      'brand-cashbackcouk': 'linear-gradient(135deg, #e3fff3 0%, #009688 100%)',
      // Add more as needed
    };
    // Build carousels
    const carouselsHtml = sortedCats.map((cat, catIdx) => {
      const offers = categories[cat].sort((a, b) => (a['Brand']||'').localeCompare(b['Brand']||''));
      const gradient = categoryGradients[cat] || categoryGradients['Other'];
      const headerColor = categoryHeaderColors[cat] || categoryHeaderColors['Other'];
      const catClass = cat.replace(/\s+/g, '').toLowerCase();
      const rowId = `offers-row-${catClass}`;
      const cards = offers.map((row, i) => {
        const brand = row['Brand'] || '';
        const subheadline = row['Subheadline'] || '';
        const file = (row['File'] || '').replace(/.html$/i, '');
        const brandClass = row['Brand Class'] || '';
        const brandGradient = brandGradients[brandClass] || 'linear-gradient(135deg, #fff, #f5f5f5 100%)';
        // Only first 2 visible by default
        return `<div class="offer-card ${brandClass} ${i < 2 ? 'visible' : 'hidden'}" style="margin: 0 12px; --category-border: ${headerColor};">
          <div class="offer-title">${brand}</div>
          <div class="offer-desc">${subheadline}</div>
          <a href="/pages/offers/${file}/" class="cta-button cta-button-${brandClass.replace('brand-','')}">View ${brand} Offer</a>
          <div class="mini-card" style="--mini-card-border: ${headerColor}; display:none;"></div>
        </div>`;
      }).join('\n');
      // Chevrons (only if more than 2 cards)
      const chevrons = offers.length > 2 ? `
        <button class="scroll-btn left" aria-label="Scroll left" style="left:0; color: ${headerColor};">
          <svg width="32" height="32" viewBox="0 0 32 32"><polygon points="20,8 12,16 20,24" fill="currentColor"/></svg>
        </button>
        <button class="scroll-btn right" aria-label="Scroll right" style="right:0; color: ${headerColor};">
          <svg width="32" height="32" viewBox="0 0 32 32"><polygon points="12,8 20,16 12,24" fill="currentColor"/></svg>
        </button>
      ` : '';
      return `<div class="category-section ${catClass}" style="background: ${gradient}; border: 3px solid ${headerColor}; position:relative;">
        <div class="category-title" style="color: ${headerColor};">${cat}</div>
        <div class="offers-row" id="${rowId}" style="display:flex; gap:24px; justify-content:center; align-items:stretch; position:relative;">
          ${chevrons}
          ${cards}
        </div>
      </div>`;
    }).join('\n');
    // Insert into #carousels
    const carouselsDiv = document.getElementById('carousels');
    if (carouselsDiv) carouselsDiv.innerHTML = carouselsHtml;

    // Carousel logic for each row
    sortedCats.forEach(cat => {
      const catClass = cat.replace(/\s+/g, '').toLowerCase();
      const rowId = `offers-row-${catClass}`;
      const row = document.getElementById(rowId);
      if (!row) return;
      const cards = Array.from(row.getElementsByClassName('offer-card'));
      let start = 0;
      function getMaxVisible() {
        return window.matchMedia('(max-width: 700px)').matches ? 1 : Math.min(2, cards.length);
      }
      function update() {
        const maxVisible = getMaxVisible();
        cards.forEach((card, i) => {
          if (i >= start && i < start + maxVisible) {
            card.classList.add('visible');
            card.classList.remove('hidden');
          } else {
            card.classList.remove('visible');
            card.classList.add('hidden');
          }
        });
        // Show/hide scroll buttons
        const leftBtn = row.querySelector('.scroll-btn.left');
        const rightBtn = row.querySelector('.scroll-btn.right');
        if (leftBtn) leftBtn.classList.toggle('hidden', start === 0);
        if (rightBtn) rightBtn.classList.toggle('hidden', start >= cards.length - maxVisible);
      }
      const leftBtn = row.querySelector('.scroll-btn.left');
      const rightBtn = row.querySelector('.scroll-btn.right');
      if (leftBtn) leftBtn.onclick = function() {
        if (start > 0) { start--; update(); }
      };
      if (rightBtn) rightBtn.onclick = function() {
        const maxVisible = getMaxVisible();
        if (start < cards.length - maxVisible) { start++; update(); }
      };
      // Update on resize
      window.addEventListener('resize', update);
      update();
    });
  });

  // ---
  // To do the same for the navbar, add similar logic here:
  // 1. Fetch and parse offers_sheet.csv
  // 2. Group by category and build nav HTML
  // 3. Insert into a navbar container
  // ---
}); 