const fs = require('fs');
const path = require('path');
let fetchFn;
try {
  fetchFn = fetch; // Node 18+
} catch {
  fetchFn = require('node-fetch');
}

const SHEET_URL = 'https://opensheet.vercel.app/12TFRklj6X_k5gfQVmyrpFpRvteW39IfyIJMiwBSBXxY/Offers';
const OFFERS_DIR = path.join(__dirname, '../public/pages/offers');
const PARTIALS_DIR = path.join(__dirname, '../public/partials');

function getColMap(headers) {
  const map = {};
  headers.forEach(h => {
    map[h.trim().toLowerCase()] = h;
  });
  return map;
}

function getVal(row, col, colMap) {
  return row[colMap[col.trim().toLowerCase()]] || '';
}

function miniCard(title, desc, icon) {
  const safeIcon = icon.replace(/'/g, "&#39;").replace(/"/g, '&quot;');
  return `<div class="mini-card" style="--mini-card-icon-bg: url('data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='64'>${safeIcon}</text></svg>');"><span class="title">${title}</span><span class="desc">${desc}</span></div>`;
}

function shareButtons(refLink, headline) {
  const encodedLink = encodeURIComponent(refLink);
  const encodedHeadline = encodeURIComponent(headline);
  return `
    <div class="share-btn-group">
      <a class="share-btn" href="https://www.facebook.com/sharer/sharer.php?u=${encodedLink}" target="_blank" rel="noopener" aria-label="Share on Facebook">
        <img src="/icons/facebook.png" alt="Facebook" width="32" height="32" class="share-icon-img" />
      </a>
      <a class="share-btn" href="https://twitter.com/intent/tweet?url=${encodedLink}" target="_blank" rel="noopener" aria-label="Share on Twitter">
        <img src="/icons/twitter.png" alt="Twitter" width="32" height="32" class="share-icon-img" />
      </a>
      <a class="share-btn" href="mailto:?subject=${encodedHeadline}&body=${encodedLink}" target="_blank" rel="noopener" aria-label="Share via Email">
        <img src="/icons/email.png" alt="Email" width="32" height="32" class="share-icon-img" />
      </a>
      <a class="share-btn" href="https://www.linkedin.com/shareArticle?mini=true&url=${encodedLink}" target="_blank" rel="noopener" aria-label="Share on LinkedIn">
        <img src="/icons/linkedin.png" alt="LinkedIn" width="32" height="32" class="share-icon-img" />
      </a>
      <a class="share-btn" href="https://wa.me/?text=${encodedHeadline}%20${encodedLink}" target="_blank" rel="noopener" aria-label="Share on WhatsApp">
        <img src="/icons/whatsapp.png" alt="WhatsApp" width="32" height="32" class="share-icon-img" />
      </a>
      <a class="share-btn" href="https://pinterest.com/pin/create/button/?url=${encodedLink}" target="_blank" rel="noopener" aria-label="Share on Pinterest">
        <img src="/icons/pinterest.png" alt="Pinterest" width="32" height="32" class="share-icon-img" />
      </a>
      <button class="share-btn" aria-label="Copy Link" onclick="navigator.clipboard.writeText('${refLink}')">
        <img src="/icons/copy.png" alt="Copy Link" width="32" height="32" class="share-icon-img" />
      </button>
    </div>
  `;
}

function extractEmojiAndTitle(str, fallback) {
  const match = str.match(/^([\p{Emoji_Presentation}\p{Extended_Pictographic}])\s*(.*)$/u);
  if (match) {
    return { emoji: match[1], title: match[2].trim() };
  } else {
    return { emoji: fallback, title: str.trim() };
  }
}

function normalizeBrandClass(str) {
  return 'brand-' + (str || '').toLowerCase().replace(/brand[-_]?/g, '').replace(/[^a-z0-9]/g, '');
}

function getYouTubeEmbedHtml(url) {
  if (!url) return '';
  let videoId = '';
  try {
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|.+\?v=))([\w-]{11})/);
    if (ytMatch) videoId = ytMatch[1];
    else if (url.includes('youtube.com') || url.includes('youtu.be')) videoId = url.split('v=')[1]?.substring(0, 11) || '';
  } catch {}
  if (!videoId) return '';
  return `<div class="video-embed-wrapper card-video-embed">
    <iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" style="position:absolute; top:0; left:0; width:100%; height:100%;" title="YouTube video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
  </div>`;
}

function offerTemplate(offer, colMap) {
  const rawBrandClass = getVal(offer, 'Brand Class', colMap).trim();
  const brandClass = normalizeBrandClass(rawBrandClass);
  const headline = getVal(offer, 'Headline', colMap) || '';
  const subheadline = getVal(offer, 'Subheadline', colMap) || '';
  const refLink = getVal(offer, 'Referral Link', colMap) || '#';
  const howItWorks = (getVal(offer, 'How It Works', colMap) || '').split('|').map(s => s.trim()).filter(Boolean);
  const whyChoose = (getVal(offer, 'Why Choose', colMap) || '').split('|').map(s => s.trim()).filter(Boolean);
  const features = (getVal(offer, 'Features', colMap) || '').split('|').map(s => s.trim()).filter(Boolean);
  const disclaimer = getVal(offer, 'Disclaimer', colMap) || '';
  const brandName = getVal(offer, 'Brand', colMap) || '';
  const ytUrl = getVal(offer, 'YouTube Video', colMap) || '';
  const ytEmbed = getYouTubeEmbedHtml(ytUrl);
  const numberEmojis = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
  const defaultIcon = '💡';
  const featureIcon = '⭐';
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${headline}</title>
    <meta name="description" content="${subheadline}">
    <link rel="stylesheet" href="/styles/styles.css">
</head>
<body class="${brandClass}">
    <nav id="navbar"></nav>
    <script src="/scripts/inject-banner.js"></script>
    <script src="/scripts/inject-navbar.js"></script>
    <div class="container">
        <div class="card">
            <div class="headline">${headline}</div>
            <div class="subheadline">${subheadline}</div>
            <div class="cta-share-row">
                <div class="cta-share-row-inner">
                    <a href="${refLink}" class="cta-button cta-button-${brandClass.replace('brand-','')}" target="_blank" rel="noopener">Sign Up</a>
                    ${shareButtons(refLink, headline)}
                </div>
            </div>
        </div>
        ${howItWorks.length ? `<div class="card"><div class="headline">How It Works</div><div class="card-grid">${howItWorks.map((step, i) => {
          const [title, ...descArr] = step.split(':');
          const desc = descArr.join(':').trim();
          const { emoji, title: cleanTitle } = extractEmojiAndTitle(title.trim(), numberEmojis[i] || numberEmojis[numberEmojis.length-1]);
          return miniCard(cleanTitle, desc, emoji);
        }).join('')}</div></div>` : ''}
        <div class="card offer-video-card"><div class="headline">A Little About ${brandName}</div><div id="offer-video">${ytEmbed}</div></div>
        ${whyChoose.length ? `<div class="card"><div class="headline">Why Choose ${brandName}?</div><div class="card-grid">${whyChoose.map((item) => {
          const [title, ...descArr] = item.split(':');
          const desc = descArr.join(':').trim();
          const { emoji, title: cleanTitle } = extractEmojiAndTitle(title.trim(), defaultIcon);
          return miniCard(cleanTitle, desc, emoji);
        }).join('')}</div></div>` : ''}
      </div>
      <div class="cta-bottom-row" style="display:flex; justify-content:center; align-items:center; width:100%; margin: 32px 0 0 0;">
        <a href="${refLink}" class="cta-button cta-button-${brandClass.replace('brand-','')} cta-bottom-wide" target="_blank" rel="noopener" style="width:80%; max-width:700px; text-align:center; font-size:1.15em; margin:0 auto; padding-left:24px; padding-right:24px; padding-top:28px; padding-bottom:28px;">
          Sign up now – it only takes a few minutes!
        </a>
      </div>
      ${features.length ? `<div class="container"><div class="card"><div class="headline">Popular Features</div><div class="card-grid">${features.map((item) => {
        const [title, ...descArr] = item.split(':');
        const desc = descArr.join(':').trim();
        const { emoji, title: cleanTitle } = extractEmojiAndTitle(title.trim(), featureIcon);
        return miniCard(cleanTitle, desc, emoji);
      }).join('')}</div></div></div>` : ''}
      <div class="container"><div class="card" style="text-align:center; font-size:0.95rem; color:#888;">${disclaimer}</div></div>
</body>
</html>
`;
}

function buildNavbar(records, colMap) {
  // Group by category
  const categories = {};
  records.forEach(row => {
    const cat = (getVal(row, 'Category', colMap) || 'Other').trim();
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(row);
  });
  // Sort categories
  const sortedCats = Object.keys(categories).sort((a, b) => a.localeCompare(b));
  // Category color and gradient maps
  const categoryHeaderColors = {
    'Banking': '#1a237e',
    'Business Tools': '#b71c1c',
    'Cashback': '#00695c',
    'Media': '#7b1fa2',
    'Networks': '#bfa600',
    'Shopping': '#e65100',
    'Other': '#444',
  };
  const categoryGradients = {
    'Banking': 'linear-gradient(135deg, #e3f0ff 0%, #1976d2 100%)',
    'Business Tools': 'linear-gradient(135deg, #ffe3e3 0%, #d32f2f 100%)',
    'Cashback': 'linear-gradient(135deg, #e3fff3 0%, #009688 100%)',
    'Media': 'linear-gradient(135deg, #f3e3ff 0%, #8e24aa 100%)',
    'Networks': 'linear-gradient(135deg, #fffde3 0%, #ffd600 100%)',
    'Shopping': 'linear-gradient(135deg, #ffe0b2 0%, #e65100 100%)',
    'Other': 'linear-gradient(135deg, #f0f0f0 0%, #757575 100%)',
  };
  // Build nav HTML
  const navCats = sortedCats.map(cat => {
    const offers = categories[cat].sort((a, b) => (getVal(a, 'Brand', colMap)||'').localeCompare(getVal(b, 'Brand', colMap)||''));
    const catClass = cat.replace(/\s+/g, '').toLowerCase();
    const headerColor = categoryHeaderColors[cat] || categoryHeaderColors['Other'];
    const gradientClass = `gradient-text-${catClass}`;
    const links = offers.map(row => {
      const file = (getVal(row, 'File', colMap) || '').replace(/.html$/i, '');
      const brand = getVal(row, 'Brand', colMap) || '';
      return `<li><a href="/pages/offers/${file}/" class="navbar-link">${brand}</a></li>`;
    }).join('\n');
    return `<div class="nav-category">
      <button type="button" class="brand-nav-btn category-nav-btn">${cat}</button>
      <div class="nav-dropdown" style="border: 2px solid ${headerColor};">
        <ul>
${links}
        </ul>
      </div>
    </div>`;
  }).join('\n');
  const headerButtons = `
  <button class="nav-hamburger" aria-label="Open navigation">&#9776;</button>
  <div class="navbar-links" style="justify-content:center; width:100%; display:flex;">
`;
  const navHtml = `<nav class="navbar">
${headerButtons}${navCats}
  </div>
</nav>`;
  return navHtml;
}

function buildCarousels(records, colMap) {
  // Group by category
  const categories = {};
  records.forEach(row => {
    const cat = (getVal(row, 'Category', colMap) || 'Other').trim();
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(row);
  });
  // Sort categories
  const sortedCats = Object.keys(categories).sort((a, b) => a.localeCompare(b));
  // Preset gradients for categories
  const categoryGradients = {
    'Banking': 'linear-gradient(135deg, #e3f0ff 0%, #1976d2 100%)',
    'Business Tools': 'linear-gradient(135deg, #ffe3e3 0%, #d32f2f 100%)',
    'Cashback': 'linear-gradient(135deg, #e3fff3 0%, #009688 100%)',
    'Media': 'linear-gradient(135deg, #f3e3ff 0%, #8e24aa 100%)',
    'Networks': 'linear-gradient(135deg, #fffde3 0%, #ffd600 100%)',
    'Shopping': 'linear-gradient(135deg, #ffe0b2 0%, #e65100 100%)',
    'Other': 'linear-gradient(135deg, #f0f0f0 0%, #757575 100%)',
  };
  const categoryHeaderColors = {
    'Banking': '#1a237e',
    'Business Tools': '#b71c1c',
    'Cashback': '#00695c',
    'Media': '#7b1fa2',
    'Networks': '#bfa600',
    'Shopping': '#e65100',
    'Other': '#444',
  };
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
  };
  function normalizeBrandClass(str) {
    return 'brand-' + (str || '').toLowerCase().replace(/brand[-_]?/g, '').replace(/[^a-z0-9]/g, '');
  }
  const carouselsHtml = sortedCats.map((cat, catIdx) => {
    const offers = categories[cat].sort((a, b) => (getVal(a, 'Brand', colMap)||'').localeCompare(getVal(b, 'Brand', colMap)||''));
    const gradient = categoryGradients[cat] || categoryGradients['Other'];
    const headerColor = categoryHeaderColors[cat] || categoryHeaderColors['Other'];
    const catClass = cat.replace(/\s+/g, '').toLowerCase();
    const rowId = `offers-row-${catClass}`;
    const cards = offers.map((row, i) => {
      const brand = getVal(row, 'Brand', colMap) || '';
      const subheadline = getVal(row, 'Subheadline', colMap) || '';
      const file = (getVal(row, 'File', colMap) || '').replace(/.html$/i, '');
      const brandClass = normalizeBrandClass(getVal(row, 'Brand Class', colMap) || '');
      const brandGradient = brandGradients[brandClass] || 'linear-gradient(135deg, #fff, #f5f5f5 100%)';
      return `<div class="offer-card ${brandClass} ${i < 2 ? 'visible' : 'hidden'}" style="margin: 0 12px; --category-border: ${headerColor};">
        <div class="offer-title">${brand}</div>
        <div class="offer-desc">${subheadline}</div>
        <a href="/pages/offers/${file}/" class="cta-button cta-button-${brandClass.replace('brand-','')}">View ${brand} Offer</a>
        <div class="mini-card" style="--mini-card-border: ${headerColor}; display:none;"></div>
      </div>`;
    }).join('\n');
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
  return carouselsHtml;
}

async function main() {
  const response = await fetchFn(SHEET_URL);
  const records = await response.json();
  if (!records.length) {
    console.log('No offers found.');
    return;
  }
  const headers = Object.keys(records[0]);
  const colMap = getColMap(headers);

  // Generate offer pages
  if (!fs.existsSync(OFFERS_DIR)) {
    fs.mkdirSync(OFFERS_DIR, { recursive: true });
  }
  let created = 0;
  const generatedFiles = [];
  records.forEach(row => {
    const file = (getVal(row, 'File', colMap) || '').trim().toLowerCase();
    if (!file) return;
    const folderName = file.replace(/\.html$/i, '');
    const offerDir = path.join(OFFERS_DIR, folderName);
    if (!fs.existsSync(offerDir)) {
      fs.mkdirSync(offerDir, { recursive: true });
    }
    const filePath = path.join(offerDir, 'index.html');
    fs.writeFileSync(filePath, offerTemplate(row, colMap));
    generatedFiles.push(folderName);
    console.log(`Generated: pages/offers/${folderName}/index.html`);
    created++;
  });
  // Write generated_offers.json manifest
  const manifestPath = path.join(OFFERS_DIR, 'generated_offers.json');
  fs.writeFileSync(manifestPath, JSON.stringify(generatedFiles, null, 2));
  console.log(`Generated: pages/offers/generated_offers.json`);

  // Generate navbar and carousels partials
  if (!fs.existsSync(PARTIALS_DIR)) {
    fs.mkdirSync(PARTIALS_DIR, { recursive: true });
  }
  const navbarHtml = buildNavbar(records, colMap);
  fs.writeFileSync(path.join(PARTIALS_DIR, 'navbar.html'), navbarHtml);
  console.log('Generated: partials/navbar.html');

  const carouselsHtml = buildCarousels(records, colMap);
  fs.writeFileSync(path.join(PARTIALS_DIR, 'carousels.html'), carouselsHtml);
  console.log('Generated: partials/carousels.html');

  if (created === 0) {
    console.log('No offer pages generated.');
  } else {
    console.log(`Done! ${created} offer page(s) generated.`);
  }
}

main(); 