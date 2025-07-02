// inject-navbar.js
// Dynamically generates the navbar from offers_sheet.csv
// Add this script to your HTML after PapaParse is loaded

document.addEventListener('DOMContentLoaded', function () {
  Promise.all([
    fetch('/pages/offers/generated_offers.json').then(r => r.json()),
    fetch('/data/offers_sheet.csv').then(r => r.text())
  ]).then(([manifest, csvText]) => {
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    // Only include offers whose File (normalized) is in the manifest
    const manifestSet = new Set(manifest.map(f => f.toLowerCase()));
    const records = parsed.data.filter(row => {
      const file = (row['File'] || '').trim().toLowerCase();
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
    // Build nav HTML
    const navCats = sortedCats.map(cat => {
      const offers = categories[cat].sort((a, b) => (a['Brand']||'').localeCompare(b['Brand']||''));
      const links = offers.map(row => {
        const file = (row['File'] || '').replace(/.html$/i, '');
        const brand = row['Brand'] || '';
        return `<li><a href="/pages/offers/${file}/" class="navbar-link">${brand}</a></li>`;
      }).join('\n');
      return `<div class="nav-category">
        <button type="button" class="brand-nav-btn">${cat}</button>
        <div class="nav-dropdown">
          <ul>
${links}
          </ul>
        </div>
      </div>`;
    }).join('\n');
    // Header buttons (keep as-is)
    const headerButtons = `
    <button class="nav-hamburger" aria-label="Open navigation">&#9776;</button>
    <div class="navbar-links" style="justify-content:center; width:100%; display:flex;">
`;
    // Close navbar-links
    const navHtml = `<nav class="navbar">
${headerButtons}${navCats}
    </div>
</nav>`;
    // Insert into #navbar
    const navbarDiv = document.getElementById('navbar');
    if (navbarDiv) navbarDiv.innerHTML = navHtml;
    // --- Dropdown and active logic (copied from old code) ---
    setTimeout(function() {
      const nav = document.querySelector('.navbar');
      const hamburger = document.querySelector('.nav-hamburger');
      if (nav && hamburger) {
        hamburger.addEventListener('click', function() {
          nav.classList.toggle('open');
        });
      }
      // Set active class on nav button (only for category nav, not top nav)
      const navBtns = document.querySelectorAll('.navbar-links .brand-nav-btn');
      const path = window.location.pathname;
      navBtns.forEach(btn => {
        const href = btn.getAttribute('href');
        if (href && path.includes(href.replace('/pages/offers/', '').replace('/', ''))) {
          btn.classList.add('active');
        }
      });
      // Remove .active from top nav links if present
      const topNavLinks = document.querySelectorAll('.navbar > a, .navbar > button');
      topNavLinks.forEach(link => link.classList.remove('active'));
      // Dropdown click-to-toggle for mobile
      const navCategories = document.querySelectorAll('.nav-category');
      navCategories.forEach(cat => {
        const btn = cat.querySelector('.brand-nav-btn');
        if (btn) {
          btn.addEventListener('click', function(e) {
            e.stopPropagation();
            navCategories.forEach(c => { if (c !== cat) c.classList.remove('open'); });
            cat.classList.toggle('open');
          });
        }
      });
      document.addEventListener('click', () => {
        navCategories.forEach(cat => cat.classList.remove('open'));
      });
      // Bold the current brand in the dropdown
      const dropdownLinks = document.querySelectorAll('.navbar-link');
      dropdownLinks.forEach(link => {
        if (window.location.pathname === link.getAttribute('href')) {
          link.style.fontWeight = 'bold';
        }
      });
    }, 100);
    // ---
  });
}); 