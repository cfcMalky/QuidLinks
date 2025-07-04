const fs = require('fs');
const path = require('path');
let fetchFn;
try {
  fetchFn = fetch; // Node 18+
} catch {
  fetchFn = require('node-fetch');
}

const SHEET_URL = 'https://opensheet.vercel.app/12TFRklj6X_k5gfQVmyrpFpRvteW39IfyIJMiwBSBXxY/Offers';
const SHEET_STYLES_URL = 'https://opensheet.vercel.app/12TFRklj6X_k5gfQVmyrpFpRvteW39IfyIJMiwBSBXxY/styles';
const OFFERS_DIR = path.join(__dirname, '../public/pages/offers');
const PARTIALS_DIR = path.join(__dirname, '../public/partials');

// Banner/Hero section HTML (from original banner.html partial)
const bannerHtml = `
<header class="site-banner">
    <div class="banner-bg">
        <img src="/banner.png" alt="Refer 2 Earn banner" class="banner-img">
        <div class="banner-overlay-bg"></div>
    </div>
    <div class="banner-overlay">
        <div class="banner-title">Refer 2 Earn</div>
        <div class="banner-tagline">Turn Referrals Into Real Rewards</div>
        <nav class="banner-nav-bar-bg">
            <div class="home-nav-bar" style="display: flex; justify-content: center; gap: 18px;">
                <a href="/" class="brand-nav-btn">Home</a>
                <a href="/pages/information.html" class="brand-nav-btn">Information</a>
                <a href="/pages/privacy-policy.html" class="brand-nav-btn">Privacy Policy</a>
                <a href="/pages/terms-of-use.html" class="brand-nav-btn">Terms of Use</a>
            </div>
        </nav>
    </div>
</header>`;

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

// --- BEGIN: Brand normalization mapping ---
const BRAND_CLASS_MAP = {
  'Amazon Prime Video': 'brand-amazonprimevideo',
  'Baremetrics': 'brand-baremetrics',
  'BeFrugal': 'brand-befrugal',
  'Cashback.co.uk': 'brand-cashbackcouk',
  'EngageBay': 'brand-engagebay',
  'Fiverr': 'brand-fiverr',
  'Giffgaff': 'brand-giffgaff',
  'Mail Blaze': 'brand-mailblaze',
  'Monzo': 'brand-monzo',
  'Neuraltext': 'brand-neuraltext',
  'Outseta': 'brand-outseta',
  'Printify': 'brand-printify',
  'Quidco': 'brand-quidco',
  'Raisin': 'brand-raisin',
  'Rakuten': 'brand-rakuten',
  'Sharelytics': 'brand-sharelytics',
  'Shein': 'brand-shein',
  'Super Monitoring': 'brand-supermonitoring',
  'TopCashback': 'brand-topcashback',
  'Userback': 'brand-userback',
  'Virgin': 'brand-virgin',
  'Wise': 'brand-wise',
};
function getBrandClass(brandName) {
  return BRAND_CLASS_MAP[brandName.trim()] || normalizeBrandClass(brandName);
}
// --- END: Brand normalization mapping ---

function offerTemplate(offer, colMap, navbarHtml, carouselsHtml, bannerHtml) {
  const brandName = getVal(offer, 'Brand', colMap).trim();
  const brandClass = getBrandClass(brandName);
  const headline = getVal(offer, 'Headline', colMap) || '';
  const subheadline = getVal(offer, 'Subheadline', colMap) || '';
  const refLink = getVal(offer, 'Referral Link', colMap) || '#';
  const howItWorks = (getVal(offer, 'How It Works', colMap) || '').split('|').map(s => s.trim()).filter(Boolean);
  const whyChoose = (getVal(offer, 'Why Choose', colMap) || '').split('|').map(s => s.trim()).filter(Boolean);
  const features = (getVal(offer, 'Features', colMap) || '').split('|').map(s => s.trim()).filter(Boolean);
  const disclaimer = getVal(offer, 'Disclaimer', colMap) || '';
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
    <link rel="stylesheet" href="/styles/brand-colors.css">
    <link rel="stylesheet" href="/styles/styles.css">
</head>
<body class="${brandClass}">
    ${bannerHtml || ''}
    ${navbarHtml}
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
</html>`;
}

function getGradientTextColor(gradient) {
  // Simple heuristic: if the gradient's first color is dark, return white; else black
  // Extract first color from gradient string
  const match = gradient.match(/#([0-9a-fA-F]{3,8})/);
  if (!match) return '#111';
  const hex = match[1];
  // Convert hex to RGB
  let r, g, b;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length >= 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else {
    return '#111';
  }
  // Perceived brightness
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 140 ? '#fff' : '#111';
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
  // Build nav HTML
  const navCats = sortedCats.map(cat => {
    const offers = categories[cat].sort((a, b) => (getVal(a, 'Brand', colMap)||'').localeCompare(getVal(b, 'Brand', colMap)||''));
    const catClass = cat.replace(/\s+/g, '').toLowerCase();
    const links = offers.map(row => {
      const file = (getVal(row, 'File', colMap) || '').replace(/.html$/i, '');
      const brand = getVal(row, 'Brand', colMap) || '';
      return `<li><a href="/pages/offers/${file}/" class="navbar-link">${brand}</a></li>`;
    }).join('\n');
    return `<div class=\"nav-category\">\n      <button type=\"button\" class=\"brand-nav-btn category-nav-btn\">${cat}</button>\n      <div class=\"nav-dropdown\">\n        <ul>\n${links}\n        </ul>\n      </div>\n    </div>`;
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
      const brandClass = getBrandClass(brand);
      const subheadline = getVal(row, 'Subheadline', colMap) || '';
      const file = (getVal(row, 'File', colMap) || '').replace(/.html$/i, '');
      return `<div class="${brandClass}"><div class="mini-card carousel-mini-card">
        <div class="caro-offer-title">${brand}</div>
        <div class="caro-offer-desc">${subheadline}</div>
        <a href="/pages/offers/${file}/" class="carousel-cta-button cta-button-${brandClass.replace('brand-','')}">
          <span class="carousel-cta-gradient-text">View ${brand} Offer</span>
        </a>
      </div></div>`;
    }).join('');
    // Carousel wrapper for 2 cards at a time, just wide enough for 2 cards + spacing
    const carouselWrapper = `<div class="carousel-cards-wrapper" id="${rowId}" style="display:flex; overflow:hidden; width:600px; margin:0 auto; position:relative;">${cards}</div>`;
    // Chevrons
    const chevrons = offers.length > 2 ? `
      <button class="carousel-chevron left" data-carousel="${rowId}" aria-label="Scroll left" style="position:absolute; left:-48px; top:50%; transform:translateY(-50%); background:none; border:none; color:${headerColor}; font-size:2.5rem; cursor:pointer; z-index:2;">&#8249;</button>
      <button class="carousel-chevron right" data-carousel="${rowId}" aria-label="Scroll right" style="position:absolute; right:-48px; top:50%; transform:translateY(-50%); background:none; border:none; color:${headerColor}; font-size:2.5rem; cursor:pointer; z-index:2;">&#8250;</button>
    ` : '';
    return `<div class="category-section ${catClass}" style="background: ${gradient}; border: 3px solid ${headerColor}; position:relative; border-radius:28px; margin-bottom:48px; padding:32px 0 48px 0; box-shadow:0 2px 16px rgba(26,35,126,0.06);">
      <div class="category-title" style="color: ${headerColor}; text-align:center; font-size:2.1rem; font-weight:900; text-decoration:underline; margin-bottom:24px;">${cat}</div>
      <div style="position:relative; display:flex; align-items:center; justify-content:center;">
        ${chevrons}
        ${carouselWrapper}
      </div>
    </div>`;
  }).join('\n');
  // Add CSS for new carousel/mini-card/button styles
  const carouselStyle = `<style>
.carousel-cards-wrapper { gap: 0; }
.carousel-mini-card { transition: box-shadow 0.2s, background 0.2s; box-sizing: border-box; }
.carousel-mini-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.13); }
.carousel-cta-button { font-weight: 700; border-radius: 24px; text-align: center; font-size: 1.05rem; box-shadow: none; border: none; transition: box-shadow 0.2s; min-width: 120px; max-width: 180px; padding: 10px 0; position:relative; overflow:hidden; background:#111; }
.carousel-cta-button:hover { box-shadow: 0 2px 12px rgba(25,118,210,0.18); }
.carousel-cta-gradient-text { background-clip: text; -webkit-background-clip: text; color: transparent; -webkit-text-fill-color: transparent; display:inline-block; width:100%; }
</style>`;
  // Add JS for carousel navigation
  const carouselScript = `<script>
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.carousel-chevron').forEach(function(btn) {
      btn.addEventListener('click', function() {
        const rowId = btn.getAttribute('data-carousel');
        const wrapper = document.getElementById(rowId);
        if (!wrapper) return;
        const card = wrapper.querySelector('.mini-card');
        if (!card) return;
        const cardWidth = card.offsetWidth + 16; // card + margin
        const scrollAmount = cardWidth * 2; // show 2 cards at a time
        if (btn.classList.contains('left')) {
          wrapper.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        } else {
          wrapper.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      });
    });
  });
  </script>`;
  return carouselsHtml + carouselStyle + carouselScript;
}

function generateStaticPage({ title, headExtras, bodyClass, mainHtml, navbarHtml, carouselsHtml, bannerHtml }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="/styles/brand-colors.css">
    <link rel="stylesheet" href="/styles/styles.css">
    ${headExtras || ''}
</head>
<body class="${bodyClass}">
    ${bannerHtml || ''}
    ${navbarHtml}
    <div class="container">
      ${mainHtml}
      ${carouselsHtml ? carouselsHtml : ''}
    </div>
</body>
</html>`;
}

// --- BRAND COLORS CSS GENERATION ---
async function generateBrandColorsCSS(records, colMap) {
  // Define the output path
  const cssPath = path.join(__dirname, '../public/styles/brand-colors.css');
  // Define the color properties to extract from the sheet (must match headers exactly)
  const colorProps = [
    'Card Background Grad 1',
    'Card Background Grad 2',
    'Card Border',
    'Carousel Mini Card Grad 1',
    'Carousel Mini Card Grad 2',
    'CTA Button Grad 1',
    'CTA Button Grad 2',
    'Headline Grad 1',
    'Headline Grad 2',
    'Mini Card Background Grad 1',
    'Mini Card Background Grad 2',
    'Mini Card Border',
    'Mini Card Desc Grad 1',
    'Mini Card Desc Grad 2',
    'Mini Card Title',
    'Nav Button Grad 1',
    'Nav Button Grad 2',
    'Nav Dropdown Border',
    'Nav Dropdown Shadow (rgba)',
    'Share Button Grad 1',
    'Share Button Grad 2',
    'Share Button Text Color'
  ];
  // Map from matrix property to CSS variable name
  const propToVar = {
    'Card Background Grad 1': '--card-bg-grad-1',
    'Card Background Grad 2': '--card-bg-grad-2',
    'Card Border': '--card-border',
    'Carousel Mini Card Grad 1': '--carousel-mini-card-grad-1',
    'Carousel Mini Card Grad 2': '--carousel-mini-card-grad-2',
    'CTA Button Grad 1': '--cta-btn-grad-1',
    'CTA Button Grad 2': '--cta-btn-grad-2',
    'Headline Grad 1': '--headline-grad-1',
    'Headline Grad 2': '--headline-grad-2',
    'Mini Card Background Grad 1': '--mini-card-bg-grad-1',
    'Mini Card Background Grad 2': '--mini-card-bg-grad-2',
    'Mini Card Border': '--mini-card-border',
    'Mini Card Desc Grad 1': '--mini-card-desc-grad-1',
    'Mini Card Desc Grad 2': '--mini-card-desc-grad-2',
    'Mini Card Title': '--mini-card-title',
    'Nav Button Grad 1': '--nav-btn-grad-1',
    'Nav Button Grad 2': '--nav-btn-grad-2',
    'Nav Dropdown Border': '--nav-dropdown-border',
    'Nav Dropdown Shadow (rgba)': '--nav-dropdown-shadow',
    'Share Button Grad 1': '--share-btn-grad-1',
    'Share Button Grad 2': '--share-btn-grad-2',
    'Share Button Text Color': '--share-btn-text-color'
  };
  let css = '/* AUTO-GENERATED BRAND COLORS CSS */\n';
  for (const row of records) {
    const brandName = getVal(row, 'Brand', colMap).trim();
    if (!brandName) continue;
    const brandClass = getBrandClass(brandName);
    let block = `.${brandClass} {\n`;
    let hasAny = false;
    for (const prop of colorProps) {
      const val = getVal(row, prop, colMap).trim();
      if (val && propToVar[prop]) {
        block += `  ${propToVar[prop]}: ${val};\n`;
        hasAny = true;
      }
    }
    block += '}\n\n';
    if (hasAny) css += block;
  }
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('Generated brand-colors.css');
}

async function main() {
  // Fetch styles tab for brand colors
  const stylesResponse = await fetchFn(SHEET_STYLES_URL);
  const stylesRecords = await stylesResponse.json();
  if (!stylesRecords.length) {
    console.log('No styles found.');
    return;
  }
  const stylesColMap = getColMap(Object.keys(stylesRecords[0]));
  // --- Generate brand-colors.css from styles tab ---
  await generateBrandColorsCSS(stylesRecords, stylesColMap);

  // Fetch offers tab for site data
  const response = await fetchFn(SHEET_URL);
  const records = await response.json();
  if (!records.length) {
    console.log('No offers found.');
    return;
  }
  const headers = Object.keys(records[0]);
  const colMap = getColMap(headers);
  console.log('Headers from sheet:', headers);
  console.log('First row:', records[0]);

  // Generate navbar and carousels once
  const navbarHtml = buildNavbar(records, colMap);
  const carouselsHtml = buildCarousels(records, colMap);

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
    fs.writeFileSync(filePath, offerTemplate(row, colMap, navbarHtml, carouselsHtml, bannerHtml));
    generatedFiles.push(folderName);
    console.log(`Generated: pages/offers/${folderName}/index.html`);
    created++;
  });
  // Write generated_offers.json manifest
  const manifestPath = path.join(OFFERS_DIR, 'generated_offers.json');
  fs.writeFileSync(manifestPath, JSON.stringify(generatedFiles, null, 2));
  console.log(`Generated: pages/offers/generated_offers.json`);

  if (created === 0) {
    console.log('No offer pages generated.');
  } else {
    console.log(`Done! ${created} offer page(s) generated.`);
  }

  // --- STATIC PAGE GENERATION ---
  // 1. INDEX.HTML
  const indexMainHtml = `
    <div class="card">
      <div class="headline">Welcome to Refer 2 Earn</div>
      <div class="subheadline">
        Your hub for the UK's best dual-incentive referral and affiliate offers! Whether you're a content creator, blogger, social media influencer, or just someone with a network of friends, this site is designed to help you turn your audience and connections into real, passive side-income.
      </div>
      <ul class="hero-bullets hero-gradient-bullets">
        <li><b>Hand-picked offers:</b> Only the best, most transparent referral and affiliate programs.</li>
        <li><b>Dual rewards:</b> Both you and your friends or followers get rewarded.</li>
        <li><b>Easy to start:</b> Browse, share, and earn – it's that simple!</li>
      </ul>
      <div class="hero-cta-row">
        <a href="#carousels" class="hero-cta-btn hero-gradient-btn">Browse Offers</a>
      </div>
    </div>
  `;
  const indexHeadExtras = '';
  const indexHtml = generateStaticPage({
    title: 'Refer 2 Earn - Turn Referrals Into Real Rewards',
    headExtras: indexHeadExtras,
    bodyClass: 'brand-home',
    mainHtml: indexMainHtml,
    navbarHtml,
    carouselsHtml,
    bannerHtml
  });
  fs.writeFileSync(path.join(__dirname, '../public/index.html'), indexHtml, 'utf8');

  // 2. INFORMATION.HTML
  const infoMainHtml = `
        <div class="info-section">
            <div class="headline">How It Works</div>
            <div class="policy-card gradient-border">
                <b>Refer 2 Earn</b> is your guide to starting a profitable side hustle online in the UK. Here's how you can earn extra money with referral and affiliate programs, even as a complete beginner:
                <ol>
                    <li><b>Explore the Best Side Hustle Offers:</b> Browse our curated list of top UK referral programs, affiliate deals, and cashback offers. We highlight the easiest and most rewarding side hustles for beginners and experienced users alike.</li>
                    <li><b>Sign Up for Free:</b> Choose an offer that fits your interests and sign up for the referral or affiliate program at no cost. All programs listed on Refer 2 Earn are free to join and require no upfront investment.</li>
                    <li><b>Get Your Unique Referral Link:</b> After joining, you'll receive a personal referral or affiliate link. This link tracks your referrals and ensures you get credit for every sign-up or purchase.</li>
                    <li><b>Share & Promote Your Links:</b> Share your referral links with friends, family, or your audience on social media, WhatsApp, email, or your blog. The more you promote, the more you can earn from your side hustle.</li>
                    <li><b>Earn Cash, Bonuses, or Rewards:</b> When someone uses your link to sign up or make a purchase, you'll earn cash rewards, bonuses, or other incentives—making this one of the easiest ways to make extra money online in the UK.</li>
                    <li><b>Track Your Side Hustle Earnings:</b> Log in to the partner site's dashboard to monitor your referrals, track your earnings, and see your progress as your side hustle grows.</li>
                </ol>
                <div style="margin-top:12px; color:#555; font-size:0.98rem;">Most referral and affiliate offers are open to everyone in the UK, and you can refer as many people as you like. Start your side hustle today and discover how easy it is to earn extra income online with Refer 2 Earn.</div>
            </div>
        </div>
        <div class="info-section">
            <div class="headline">Frequently Asked Questions (FAQ)</div>
            <div class="policy-card gradient-border">
                <ul class="faq-list">
                    <li><b>What are the best side hustle ideas in the UK for 2024?</b><br>Some of the top side hustles in the UK include joining referral programs, affiliate marketing, cashback offers, online surveys, and promoting products or services through social media. Refer 2 Earn helps you discover the best referral and affiliate programs to start earning extra money online quickly and easily.</li>
                    <li><b>How can I make extra money online with referral programs?</b><br>Sign up for free referral and affiliate programs listed on Refer 2 Earn, get your unique referral link, and share it with friends, family, or your social media followers. When someone signs up or makes a purchase using your link, you earn a commission or bonus, making it a great side hustle for beginners.</li>
                    <li><b>Are referral programs a legit way to start a side hustle?</b><br>Yes! Referral and affiliate programs are legitimate and popular ways to earn side income in the UK. We only list trusted offers from reputable brands, banks, and cashback sites, so you can start your side hustle with confidence.</li>
                    <li><b>What are some easy side hustles for beginners?</b><br>Referral programs, affiliate marketing, and cashback offers are some of the easiest side hustles to start. You don't need any special skills or investment—just sign up, share your link, and start earning rewards for every successful referral.</li>
                    <li><b>How much can I earn from referral and affiliate side hustles?</b><br>Your earnings depend on the program and how many people you refer. Some offers pay cash bonuses, others offer gift cards or account credit. The more you share your links and promote offers, the more you can earn as a side hustle.</li>
                    <li><b>Can I do referral side hustles from home?</b><br>Absolutely! All the referral and affiliate programs listed on Refer 2 Earn can be done from home, using your phone or computer. Share your links online, through WhatsApp, email, or social media to maximize your side income.</li>
                    <li><b>How do I track my side hustle earnings and referrals?</b><br>Each partner site provides a dashboard where you can track your referrals, sign-ups, and earnings. Log in to your account on the partner site to see your progress and manage your side hustle income.</li>
                    <li><b>Are there any fees to join these side hustle programs?</b><br>No, all referral and affiliate programs listed on Refer 2 Earn are free to join. There are no hidden fees or costs to start your side hustle.</li>
                    <li><b>What if I have a problem with a referral offer or my side hustle payout?</b><br>If you have any issues with a specific offer or payout, contact the partner site's support team. For questions about Refer 2 Earn or to suggest new side hustle ideas, feel free to contact us directly.</li>
                </ul>
            </div>
        </div>
        <div class="info-section">
            <div class="headline">Privacy Policy & Terms</div>
            <div class="policy-card gradient-border">
                <b>Privacy:</b> Refer 2 Earn does not collect personal data unless you contact us. We use cookies only for basic site functionality and analytics. Your use of partner sites is subject to their privacy policies.<br><br>
                <b>Terms:</b> By using this site, you agree to use referral and affiliate links responsibly. We are not responsible for the terms, payouts, or changes made by partner sites. Offers may change or be withdrawn at any time.<br><br>
                For full details, see our <a href="privacy-policy.html" style="color:#1a237e; text-decoration:underline;">Privacy Policy</a> and <a href="terms-of-use.html" style="color:#1a237e; text-decoration:underline;">Terms of Use</a>.
            </div>
        </div>
        <div class="info-section">
            <div class="headline">Affiliate & Referral Disclosure</div>
            <div class="policy-card gradient-border">
                Some links on Refer 2 Earn are affiliate or referral links. This means we may earn a commission or bonus if you sign up or make a purchase through our links. This helps keep the site free and supports our work. We only list offers we believe provide genuine value.<br><br>
                <b>Transparency matters:</b> We always aim to clearly mark affiliate/referral links and keep our recommendations unbiased.
            </div>
        </div>`;
  const infoHeadExtras = `<style>
        .info-section { margin-bottom: 40px; }
        .info-section .headline { margin-bottom: 10px; }
        .faq-list { margin: 0; padding: 0 0 0 18px; }
        .faq-list li { margin-bottom: 12px; }
        .policy-card { background: #fff; border-radius: 18px; box-shadow: 0 4px 16px rgba(0,0,0,0.07); padding: 28px 18px; margin-bottom: 24px; }
        .gradient-border {
            border: 2.5px solid;
            border-image: linear-gradient(90deg, #232f3e, #3a506b, #7c2ae8) 1;
            border-radius: 18px;
        }
    </style>`;
  const infoHtml = generateStaticPage({
    title: 'Information – Refer 2 Earn',
    headExtras: infoHeadExtras,
    bodyClass: 'brand-home',
    mainHtml: infoMainHtml,
    navbarHtml,
    bannerHtml
  });
  fs.writeFileSync(path.join(__dirname, '../public/pages/information.html'), infoHtml, 'utf8');

  // 3. PRIVACY-POLICY.HTML
  const privacyMainHtml = `
        <div class="policy-section">
            <div class="headline">Privacy Policy</div>
            <div class="policy-card gradient-border">
                <b>Refer 2 Earn</b> is committed to protecting your privacy. This policy explains how we handle your information:<br><br>
                <b>What We Collect:</b> We do not collect personal data unless you contact us. We may collect your email address if you choose to reach out.<br><br>
                <b>Cookies:</b> We use cookies only for basic site functionality and analytics. No personal data is stored in cookies. You can disable cookies in your browser settings.<br><br>
                <b>Third-Party Links:</b> Our site contains links to partner and affiliate sites. Your use of those sites is subject to their privacy policies.<br><br>
                <b>Contact:</b> If you have questions about privacy, please email us at [your-email@example.com].
            </div>
        </div>`;
  const privacyHeadExtras = `<style>
        .policy-section { margin-bottom: 40px; }
        .policy-card { background: #fff; border-radius: 18px; box-shadow: 0 4px 16px rgba(0,0,0,0.07); padding: 28px 18px; margin-bottom: 24px; }
        .gradient-border {
            border: 2.5px solid;
            border-image: linear-gradient(90deg, #232f3e, #3a506b, #7c2ae8) 1;
            border-radius: 18px;
        }
    </style>`;
  const privacyHtml = generateStaticPage({
    title: 'Privacy Policy – Refer 2 Earn',
    headExtras: privacyHeadExtras,
    bodyClass: 'brand-home',
    mainHtml: privacyMainHtml,
    navbarHtml,
    bannerHtml
  });
  fs.writeFileSync(path.join(__dirname, '../public/pages/privacy-policy.html'), privacyHtml, 'utf8');

  // 4. TERMS-OF-USE.HTML
  const termsMainHtml = `
        <div class="policy-section">
            <div class="headline">Terms of Use</div>
            <div class="policy-card gradient-border">
                <b>By using Refer 2 Earn, you agree to the following terms:</b><br><br>
                <b>Use of Links:</b> You agree to use referral and affiliate links responsibly. Do not misuse or spam links.<br><br>
                <b>Offer Changes:</b> Offers, incentives, and terms may change or be withdrawn at any time by partner sites. We are not responsible for changes or errors on partner sites.<br><br>
                <b>Payouts:</b> All payouts and rewards are managed by the partner site. Refer 2 Earn does not process or guarantee payments.<br><br>
                <b>Content:</b> We strive for accuracy but cannot guarantee all information is up to date. Always check the partner site for the latest details.<br><br>
                <b>Liability:</b> Refer 2 Earn is not liable for losses or issues arising from use of this site or partner offers.<br><br>
                <b>Contact:</b> For questions about these terms, please email us at [your-email@example.com].
            </div>
        </div>`;
  const termsHeadExtras = `<style>
        .policy-section { margin-bottom: 40px; }
        .policy-card { background: #fff; border-radius: 18px; box-shadow: 0 4px 16px rgba(0,0,0,0.07); padding: 28px 18px; margin-bottom: 24px; }
        .gradient-border {
            border: 2.5px solid;
            border-image: linear-gradient(90deg, #232f3e, #3a506b, #7c2ae8) 1;
            border-radius: 18px;
        }
    </style>`;
  const termsHtml = generateStaticPage({
    title: 'Terms of Use – Refer 2 Earn',
    headExtras: termsHeadExtras,
    bodyClass: 'brand-home',
    mainHtml: termsMainHtml,
    navbarHtml,
    bannerHtml
  });
  fs.writeFileSync(path.join(__dirname, '../public/pages/terms-of-use.html'), termsHtml, 'utf8');
}

main(); 