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

// --- SITE BRANDING VARIABLES ---
const SITE_NAME = 'QuidLinks';
const SITE_DOMAIN = 'quidlinks.com';
const BASE_URL = `https://${SITE_DOMAIN}`; // Used throughout for canonical/meta
const DEFAULT_IMAGE = `${BASE_URL}/banner.png`;

// Banner/Hero section HTML (from original banner.html partial)
const bannerHtml = `
<header class="site-banner">
    <div class="banner-bg">
        <img src="/banner.png" alt="Refer 2 Earn banner" class="banner-img">
        <div class="banner-overlay-bg"></div>
    </div>
    <div class="banner-overlay">
        <div class="banner-title">${SITE_NAME}</div>
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
      <a class="share-btn" href="https://twitter.com/intent/tweet?text=${encodedHeadline}&url=${encodedLink}" target="_blank" rel="noopener" aria-label="Share on Twitter">
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
        <img src="/icons/pinterest.png" alt="Pinterest" width="34" height="34" class="share-icon-img" />
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

function offerTemplate(offer, colMap, navbarHtml, carouselsHtml, bannerHtml, metaTitle, metaDesc, canonical, image) {
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
  const metaTags = getMetaTags({
    title: metaTitle || headline,
    description: metaDesc || subheadline,
    url: canonical,
    image: image || DEFAULT_IMAGE,
  });
  
  // Add affiliate disclosure
  const affiliateDisclosure = `<div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 12px; margin: 16px 0; font-size: 0.9rem; color: #666; text-align: center;">
    <strong>Affiliate Disclosure:</strong> This referral program is managed by ${brandName}. Terms and conditions apply. ${SITE_NAME} may earn a commission for successful referrals.
  </div>`;
  
  // Add video introduction text
  const videoIntro = ytUrl ? `<div style="margin-bottom: 12px; color: #555; font-size: 0.95rem;">
    Learn more about ${brandName}'s services and benefits in this quick video:
  </div>` : '';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${headline}</title>
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="icon" type="image/png" href="/favicon.png" sizes="48x48">
    <link rel="stylesheet" href="/styles/brand-colors.css">
    <link rel="stylesheet" href="/styles/styles.css">
    <link rel="canonical" href="${canonical}">
    ${metaTags}
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
            ${affiliateDisclosure}
        </div>
        ${howItWorks.length ? `<div class="card"><div class="headline">How It Works</div><div class="card-grid">${howItWorks.map((step, i) => {
          const [title, ...descArr] = step.split(':');
          const desc = descArr.join(':').trim();
          const { emoji, title: cleanTitle } = extractEmojiAndTitle(title.trim(), numberEmojis[i] || numberEmojis[numberEmojis.length-1]);
          return miniCard(cleanTitle, desc, emoji);
        }).join('')}</div></div>` : ''}
        <div class="card offer-video-card">
          <div class="headline">A Little About ${brandName}</div>
          ${videoIntro}
          <div id="offer-video">${ytEmbed}</div>
        </div>
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
    const cardWidth = 340;
    const gap = 36;
    const visibleCards = 2;
    const rowMaxWidth = cardWidth * visibleCards + gap;
    const cardsHtml = offers.map((row, i) => {
      const brand = getVal(row, 'Brand', colMap) || '';
      const brandClass = getBrandClass(brand);
      const subheadline = getVal(row, 'Subheadline', colMap) || '';
      const file = (getVal(row, 'File', colMap) || '').replace(/.html$/i, '');
      // Add right margin to last card for border visibility
      const isLast = i === offers.length - 1;
      return `<div class="${brandClass}"><div class="mini-card carousel-mini-card" style="width:${cardWidth}px; display: flex; flex-direction: column; justify-content: space-between; align-items: stretch;${isLast ? ' margin-right:8px;' : ''}">
        <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-start;">
          <div class="caro-offer-title">${brand}</div>
          <div class="caro-offer-desc">${subheadline}</div>
        </div>
        <div style="width:100%; display:flex; justify-content:center; align-items:flex-end; margin-top:auto;">
          <a href="/pages/offers/${file}/" class="carousel-cta-button cta-button-${brandClass.replace('brand-','')}"><span class="carousel-cta-gradient-text">View offer</span></a>
        </div>
      </div></div>`;
    }).join('');
    const isSingleCard = offers.length === 1;
    const isDoubleCard = offers.length === 2;
    const showChevrons = offers.length > 2;
    const carouselRowClass = `carousel-row${isSingleCard ? ' single-card' : ''}${isDoubleCard ? ' double-card' : ''}`;
    const windowWidth = cardWidth * 2 + gap;
    const carouselWrapper = `
      <div class="${carouselRowClass}" style="display:flex; align-items:center; justify-content:center; width:auto; max-width:none; margin:0 auto; position:relative;">
        ${showChevrons ? `<button class="carousel-chevron left" data-carousel="${rowId}" aria-label="Scroll left" style="margin-right:8px;">&#8249;</button>` : ''}
        <div class="carousel-window" style="overflow:hidden; width:${windowWidth}px;">
          <div class="carousel-track" style="display:flex; gap:${gap}px; transition: transform 0.4s cubic-bezier(.4,0,.2,1); will-change: transform;">
            ${cardsHtml}
          </div>
        </div>
        ${showChevrons ? `<button class="carousel-chevron right" data-carousel="${rowId}" aria-label="Scroll right" style="margin-left:8px;">&#8250;</button>` : ''}
      </div>
    `;

  const carouselStyle = `<style>
.carousel-row { display: flex; align-items: center; justify-content: center; max-width: ${rowMaxWidth + 120}px; margin: 0 auto; position: relative; }
.carousel-track { display: flex; gap: 36px; }
.carousel-mini-card { transition: box-shadow 0.2s, background 0.2s; box-sizing: border-box; width: 340px !important; min-width: 340px !important; max-width: 340px !important; flex: 0 0 auto !important; display: flex; flex-direction: column; justify-content: space-between; align-items: stretch; margin: 0; }
.carousel-mini-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.13); }
.carousel-cta-button { font-weight: 700; border-radius: 24px; text-align: center; font-size: 1.05rem; box-shadow: none; border: none; transition: box-shadow 0.2s; min-width: 120px; max-width: 180px; padding: 10px 0; position:relative; overflow:hidden; background: linear-gradient(90deg, var(--carousel-mini-card-btn-grad-1, #111), var(--carousel-mini-card-btn-grad-2, #333)); color: #fff; margin: 0 auto; display: block; }
.carousel-cta-button:hover { box-shadow: 0 2px 12px rgba(25,118,210,0.18); }
.carousel-cta-gradient-text { color: inherit; display:inline-block; width:100%; font-weight:inherit; }
.caro-offer-desc { background: linear-gradient(90deg, var(--carousel-mini-card-text-grad-1, #232f3e), var(--carousel-mini-card-text-grad-2, #232f3e)); background-clip: text; -webkit-background-clip: text; color: transparent; -webkit-text-fill-color: transparent; display: block; }
.carousel-chevron { background: none; border: none; font-size: 2.5rem; cursor: pointer; z-index: 2; color: #222; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: background 0.2s; }
.carousel-chevron:hover { background: #f3f3f3; }
@media (max-width: 900px) { .carousel-row { max-width: 100vw !important; } .carousel-mini-card { min-width: 90vw !important; max-width: 90vw !important; } }
</style>`;
    return `<div class="category-section ${catClass}" style="background: ${gradient}; border: 3px solid ${headerColor}; position:relative; border-radius:28px; margin-bottom:48px; padding:32px 0 48px 0; box-shadow:0 2px 16px rgba(26,35,126,0.06);">
      <div class="category-title" style="color: ${headerColor}; text-align:center; font-size:2.1rem; font-weight:900; text-decoration:underline; margin-bottom:24px;">${cat}</div>
      <div style="position:relative; display:flex; align-items:center; justify-content:center;">
        ${carouselWrapper}
      </div>
    </div>`;
  }).join('\n');
  // Add CSS for new carousel/mini-card/button styles
  const carouselStyle = `<style>
.carousel-viewport { overflow: hidden; position: relative; box-sizing: content-box; }
.carousel-track { display: flex; transition: transform 0.4s cubic-bezier(.4,0,.2,1); will-change: transform; gap: 36px; }
.carousel-mini-card { transition: box-shadow 0.2s, background 0.2s; box-sizing: border-box; width: 340px !important; height: 400px !important; min-width: 340px !important; max-width: 340px !important; flex: 0 0 auto !important; }
.carousel-mini-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.13); }
.carousel-cta-button { font-weight: 700; border-radius: 24px; text-align: center; font-size: 1.05rem; box-shadow: none; border: none; transition: box-shadow 0.2s; min-width: 120px; max-width: 180px; padding: 10px 0; position:relative; overflow:hidden; background: linear-gradient(90deg, var(--carousel-mini-card-btn-grad-1, #111), var(--carousel-mini-card-btn-grad-2, #333)); color: #fff; margin: 0 auto; display: block; }
.carousel-cta-button:hover { box-shadow: 0 2px 12px rgba(25,118,210,0.18); }
.carousel-cta-gradient-text { color: inherit; display:inline-block; width:100%; font-weight:inherit; }
.caro-offer-desc { background: linear-gradient(90deg, var(--carousel-mini-card-text-grad-1, #232f3e), var(--carousel-mini-card-text-grad-2, #232f3e)); background-clip: text; -webkit-background-clip: text; color: transparent; -webkit-text-fill-color: transparent; display: block; }
.carousel-chevron { position: absolute; top: 50%; transform: translateY(-50%); background: none; border: none; font-size: 2.5rem; cursor: pointer; z-index: 2; }
.carousel-chevron.left { left: -32px; }
.carousel-chevron.right { right: -32px; }
@media (max-width: 1200px) { .carousel-viewport { width: 100vw !important; } .carousel-mini-card { min-width: 90vw !important; max-width: 90vw !important; } }
</style>`;
  // Add JS for carousel navigation
  const carouselScript = `<script>
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.carousel-row').forEach(function(row) {
    const windowEl = row.querySelector('.carousel-window');
    const track = windowEl.querySelector('.carousel-track');
    const cards = track.querySelectorAll('.mini-card');
    const cardWidth = 340;
    const gap = 36;
    const visible = 2;
    let current = 0;
    function updateChevrons() {
      const left = row.querySelector('.carousel-chevron.left');
      const right = row.querySelector('.carousel-chevron.right');
      if (!left || !right) return;
      left.disabled = current === 0;
      right.disabled = current >= cards.length - visible;
      left.style.opacity = left.disabled ? 0.3 : 1;
      right.style.opacity = right.disabled ? 0.3 : 1;
      left.style.pointerEvents = left.disabled ? 'none' : 'auto';
      right.style.pointerEvents = right.disabled ? 'none' : 'auto';
    }
    function scrollTo(idx) {
      current = Math.max(0, Math.min(idx, cards.length - visible));
      const offset = (cardWidth + gap) * current;
      track.style.transform = 'translateX(-' + offset + 'px)';
      updateChevrons();
    }
    const leftBtn = row.querySelector('.carousel-chevron.left');
    const rightBtn = row.querySelector('.carousel-chevron.right');
    if (leftBtn) leftBtn.addEventListener('click', function() { scrollTo(current - visible); });
    if (rightBtn) rightBtn.addEventListener('click', function() { scrollTo(current + visible); });
    scrollTo(0);
  });
});
</script>`;
  return carouselsHtml + carouselStyle + carouselScript;
}

function generateStaticPage({ title, headExtras, bodyClass, mainHtml, navbarHtml, carouselsHtml, bannerHtml, description, canonical, image }) {
  const metaTags = getMetaTags({
    title,
    description: description || "Turn referrals into real rewards with the UK's best referral and affiliate offers. Start earning today with Refer 2 Earn.",
    url: canonical || BASE_URL,
    image: image || DEFAULT_IMAGE,
  });
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="icon" type="image/png" href="/favicon.png" sizes="48x48">
    <link rel="stylesheet" href="/styles/brand-colors.css">
    <link rel="stylesheet" href="/styles/styles.css">
    <link rel="canonical" href="${canonical || BASE_URL}">
    ${metaTags}
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
    'Carousel Mini Card Button Grad 1',
    'Carousel Mini Card Button Grad 2',
    'Carousel Mini Card Text Grad 1',
    'Carousel Mini Card Text Grad 2',
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
    'Carousel Mini Card Button Grad 1': '--carousel-mini-card-btn-grad-1',
    'Carousel Mini Card Button Grad 2': '--carousel-mini-card-btn-grad-2',
    'Carousel Mini Card Text Grad 1': '--carousel-mini-card-text-grad-1',
    'Carousel Mini Card Text Grad 2': '--carousel-mini-card-text-grad-2',
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

// --- SITEMAP GENERATION ---
function generateSitemap({ offerFolders, baseUrl }) {
  const staticPages = [
    '/',
    '/pages/information.html',
    '/pages/privacy-policy.html',
    '/pages/terms-of-use.html',
  ];
  const offerPages = offerFolders.map(folder => `/pages/offers/${folder}/`);
  const allUrls = staticPages.concat(offerPages);
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(url => `  <url><loc>${baseUrl}${url.replace(/\\/g, '/')}</loc></url>`).join('\n')}
</urlset>`;
  return sitemap;
}

// --- META TAG HELPERS ---
function getMetaTags({ title, description, url, image }) {
  return `
    <meta name="description" content="${description}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="${image}">
    <meta property="og:site_name" content="${SITE_NAME}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${image}">
  `;
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
    // --- Meta tags for offer pages ---
    const offerTitle = getVal(row, 'Headline', colMap) || '';
    const offerDesc = getVal(row, 'Subheadline', colMap) || '';
    const offerCanonical = `${BASE_URL}/pages/offers/${folderName}/`;
    const offerImage = DEFAULT_IMAGE;
    fs.writeFileSync(filePath, offerTemplate(row, colMap, navbarHtml, carouselsHtml, bannerHtml, offerTitle, offerDesc, offerCanonical, offerImage));
    generatedFiles.push(folderName);
    console.log(`Generated: pages/offers/${folderName}/index.html`);
    created++;
  });
  // Write generated_offers.json manifest
  const manifestPath = path.join(OFFERS_DIR, 'generated_offers.json');
  fs.writeFileSync(manifestPath, JSON.stringify(generatedFiles, null, 2));
  console.log(`Generated: pages/offers/generated_offers.json`);

  // --- SITEMAP ---
  const sitemapXml = generateSitemap({ offerFolders: generatedFiles, baseUrl: BASE_URL });
  fs.writeFileSync(path.join(__dirname, '../public/sitemap.xml'), sitemapXml, 'utf8');
  console.log('Generated: sitemap.xml');

  if (created === 0) {
    console.log('No offer pages generated.');
  } else {
    console.log(`Done! ${created} offer page(s) generated.`);
  }

  // --- STATIC PAGE GENERATION ---
  // 1. INDEX.HTML
  const indexMainHtml = `
    <div class="card hero-card">
      <div class="headline">Welcome to ${SITE_NAME}</div>
      <div class="subheadline">
        Your hub for the UK's best dual-incentive referral and affiliate offers! Whether you're a content creator, blogger, social media influencer, or just someone with a network of friends, this site is designed to help you turn your audience and connections into real, passive side-income.
      </div>
      <ul class="hero-bullets hero-gradient-bullets">
        <li><b>Hand-picked offers:</b> Only the best, most transparent referral and affiliate programs.</li>
        <li><b>Dual rewards:</b> Both you and your friends or followers get rewarded.</li>
        <li><b>Easy to start:</b> Browse, share, and earn – it's that simple!</li>
      </ul>
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
  const faqAccordionHtml = `
    <div class="card hero-card">
      <div class="headline">Frequently Asked Questions (FAQ)</div>
      <div class="faq-list">
        <div class="faq-item">
          <div class="faq-question">What are the best side hustle ideas in the UK for 2024?</div>
          <div class="faq-answer">${SITE_NAME} helps you discover the best referral and affiliate programs to start earning extra money online quickly and easily.</div>
        </div>
        <div class="faq-item">
          <div class="faq-question">How can I make extra money online with referral programs?</div>
          <div class="faq-answer">Sign up for free referral and affiliate programs listed on ${SITE_NAME}, get your unique referral link, and share it with friends, family, or your social media followers. When someone signs up or makes a purchase using your link, you earn a commission or bonus, making it a great side hustle for beginners.</div>
        </div>
        <div class="faq-item">
          <div class="faq-question">Are referral programs a legit way to start a side hustle?</div>
          <div class="faq-answer">Yes! Referral and affiliate programs are legitimate and popular ways to earn side income in the UK. We only list trusted offers from reputable brands, banks, and cashback sites, so you can start your side hustle with confidence.</div>
        </div>
        <div class="faq-item">
          <div class="faq-question">What are some easy side hustles for beginners?</div>
          <div class="faq-answer">Referral programs, affiliate marketing, and cashback offers are some of the easiest side hustles to start. You don't need any special skills or investment—just sign up, share your link, and start earning rewards for every successful referral.</div>
        </div>
        <div class="faq-item">
          <div class="faq-question">How much can I earn from referral and affiliate side hustles?</div>
          <div class="faq-answer">Your earnings depend on the program and how many people you refer. Some offers pay cash bonuses, others offer gift cards or account credit. The more you share your links and promote offers, the more you can earn as a side hustle.</div>
        </div>
        <div class="faq-item">
          <div class="faq-question">Can I do referral side hustles from home?</div>
          <div class="faq-answer">Absolutely! All the referral and affiliate programs listed on ${SITE_NAME} can be done from home, using your phone or computer. Share your links online, through WhatsApp, email, or social media to maximize your side income.</div>
        </div>
        <div class="faq-item">
          <div class="faq-question">How do I track my side hustle earnings and referrals?</div>
          <div class="faq-answer">Each partner site provides a dashboard where you can track your referrals, sign-ups, and earnings. Log in to your account on the partner site to see your progress and manage your side hustle income.</div>
        </div>
        <div class="faq-item">
          <div class="faq-question">Are there any fees to join these side hustle programs?</div>
          <div class="faq-answer">No, all referral and affiliate programs listed on ${SITE_NAME} are free to join. There are no hidden fees or costs to start your side hustle.</div>
        </div>
        <div class="faq-item">
          <div class="faq-question">What if I have a problem with a referral offer or my side hustle payout?</div>
          <div class="faq-answer">If you have any issues with a specific offer or payout, contact the partner site's support team. For questions about ${SITE_NAME} or to suggest new side hustle ideas, feel free to contact us directly.</div>
        </div>
      </div>
    </div>
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        const faqQuestions = document.querySelectorAll('.faq-question');
        faqQuestions.forEach(question => {
          question.addEventListener('click', function() {
            const answer = this.nextElementSibling;
            const isActive = this.classList.contains('active');
            faqQuestions.forEach(q => {
              q.classList.remove('active');
              q.nextElementSibling.classList.remove('active');
            });
            if (!isActive) {
              this.classList.add('active');
              answer.classList.add('active');
            }
          });
        });
      });
    </script>
  <style>
    .faq-list { margin: 0; padding: 0; }
    .faq-item { margin-bottom: 8px; }
    .faq-question {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 16px 20px;
      cursor: pointer;
      font-weight: 600;
      color: #232f3e;
      transition: all 0.3s ease;
      position: relative;
    }
    .faq-question:hover {
      background: #e9ecef;
      border-color: #7c2ae8;
    }
    .faq-question::after {
      content: '+';
      position: absolute;
      right: 20px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 20px;
      font-weight: bold;
      color: #7c2ae8;
      transition: transform 0.3s ease;
    }
    .faq-question.active::after {
      transform: translateY(-50%) rotate(45deg);
    }
    .faq-answer {
      background: #fff;
      border: 1px solid #e9ecef;
      border-top: none;
      border-radius: 0 0 8px 8px;
      padding: 0 20px;
      max-height: 0;
      overflow: hidden;
      transition: all 0.3s ease;
      margin-top: -1px;
    }
    .faq-answer.active {
      padding: 16px 20px;
      max-height: 500px;
    }
  </style>
  `;
  const infoMainHtml = `
        <div class="info-section">
            <div class="card hero-card">
                <div class="headline">How It Works</div>
                <div><b>${SITE_NAME}</b> is your guide to starting a profitable side hustle online in the UK. Here's how you can earn extra money with referral and affiliate programs, even as a complete beginner:</div>
                <ol>
                    <li><b>Discover the Best Side Hustle Offers:</b> Browse our curated list of top UK referral programs, affiliate deals, and cashback offers. We highlight the easiest and most rewarding side hustles for beginners and experienced users alike.</li>
                    <li><b>Sign Up for Free:</b> Choose an offer that fits your interests and sign up for the referral or affiliate program at no cost. All programs listed on ${SITE_NAME} are free to join and require no upfront investment.</li>
                    <li><b>Get Your Unique Referral Link:</b> After joining, you'll receive a personal referral or affiliate link. This link tracks your referrals and ensures you get credit for every sign-up or purchase.</li>
                    <li><b>Share & Promote Your Links:</b> Share your referral links with friends, family, or your audience on social media, WhatsApp, email, or your blog. The more you promote, the more you can earn from your side hustle.</li>
                    <li><b>Earn Cash, Bonuses, or Rewards:</b> When someone uses your link to sign up or make a purchase, you'll earn cash rewards, bonuses, or other incentives—making this one of the easiest ways to make extra money online in the UK.</li>
                    <li><b>Track Your Side Hustle Earnings:</b> Log in to the partner site's dashboard to monitor your referrals, track your earnings, and see your progress as your side hustle grows.</li>
                </ol>
                <div style="margin-top:12px; color:#555; font-size:0.98rem;">Most referral and affiliate offers are open to everyone in the UK, and you can refer as many people as you like. Start your side hustle today and discover how easy it is to earn extra income online with ${SITE_NAME}.</div>
            </div>
            ${faqAccordionHtml}
            <div class="card hero-card">
                <div class="headline">Affiliate & Referral Disclosure</div>
                <div>Some links on ${SITE_NAME} are affiliate or referral links. This means we may earn a commission or bonus if you sign up or make a purchase through our links. This helps keep the site free and supports our work. We only list offers we believe provide genuine value.</div>
                <div style="margin-top:10px;"><b>Transparency matters:</b> We always aim to clearly mark affiliate/referral links and keep our recommendations unbiased.</div>
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
    title: `Information – ${SITE_NAME}`,
    headExtras: infoHeadExtras,
    bodyClass: 'brand-home',
    mainHtml: infoMainHtml,
    navbarHtml,
    bannerHtml
  });
  fs.writeFileSync(path.join(__dirname, '../public/pages/information.html'), infoHtml, 'utf8');

  // 3. PRIVACY-POLICY.HTML
  // LEGAL REVIEW REMINDER: This privacy policy should be reviewed quarterly for GDPR/UK DPA compliance.
  // Key areas to monitor: cookie policy details, data retention periods, user rights, third-party data sharing.
  // Consider adding: cookie consent banner, detailed analytics disclosure, data breach notification procedures.
  const privacyMainHtml = `
        <div class="policy-section">
            <div class="card hero-card">
                <div class="headline">Privacy Policy</div>
                <div><b>${SITE_NAME}</b> is committed to protecting your privacy and ensuring compliance with the General Data Protection Regulation (GDPR) and the UK Data Protection Act 2018. This policy explains how we handle your information when you visit our website.</div>
                <div class="policy-subsection">
                    <h3>Information We Collect</h3>
                    <div><b>Personal Data:</b> We do not collect personal data unless you voluntarily provide it by contacting us. If you choose to reach out, we may collect:</div>
                    <ul>
                        <li>Email address (if you contact us)</li>
                        <li>Name (if provided in your message)</li>
                        <li>Any other information you choose to share in your communication</li>
                    </ul>
                    <div><b>Automatically Collected Data:</b> When you visit our website, we may collect:</div>
                    <ul>
                        <li>IP address and general location data</li>
                        <li>Browser type and version</li>
                        <li>Operating system</li>
                        <li>Pages visited and time spent on site</li>
                        <li>Referring website (if applicable)</li>
                    </ul>
                </div>
                <div class="policy-subsection">
                    <h3>How We Use Your Information</h3>
                    <ul>
                        <li><b>Website Analytics:</b> To understand how visitors use our site and improve user experience</li>
                        <li><b>Communication:</b> To respond to your inquiries and provide customer support</li>
                        <li><b>Site Functionality:</b> To ensure the website operates properly and securely</li>
                        <li><b>Legal Compliance:</b> To meet our legal obligations and protect our rights</li>
                    </ul>
                </div>
                <div class="policy-subsection">
                    <h3>Cookies and Tracking</h3>
                    <div>We use cookies for the following purposes:</div>
                    <ul>
                        <li><b>Essential Cookies:</b> Required for basic site functionality and security</li>
                        <li><b>Analytics Cookies:</b> To understand website usage and improve performance</li>
                        <li><b>Affiliate Tracking:</b> To track referral links and ensure proper attribution</li>
                    </ul>
                    <div style="margin-top: 10px;">You can manage cookie preferences through your browser settings. Please note that disabling certain cookies may affect site functionality.</div>
                </div>
                <div class="policy-subsection">
                    <h3>Third-Party Services</h3>
                    <div>We may use third-party services that process data on our behalf:</div>
                    <ul>
                        <li><b>Analytics Providers:</b> To analyze website traffic and user behavior</li>
                        <li><b>Web Hosting Services:</b> To host and maintain our website</li>
                        <li><b>Affiliate Networks:</b> To track and manage referral programs</li>
                    </ul>
                    <div style="margin-top: 10px;">These services have their own privacy policies, and we encourage you to review them.</div>
                </div>
                <div class="policy-subsection">
                    <h3>Data Retention</h3>
                    <ul>
                        <li><b>Contact Information:</b> We retain email communications for up to 2 years to provide ongoing support</li>
                        <li><b>Analytics Data:</b> Automatically collected data is retained for up to 26 months</li>
                        <li><b>Legal Requirements:</b> We may retain data longer if required by law or to protect our rights</li>
                    </ul>
                </div>
                <div class="policy-subsection">
                    <h3>Your Rights Under GDPR</h3>
                    <div>As a UK resident, you have the following rights:</div>
                    <ul>
                        <li><b>Right to Access:</b> Request a copy of your personal data</li>
                        <li><b>Right to Rectification:</b> Request correction of inaccurate data</li>
                        <li><b>Right to Erasure:</b> Request deletion of your personal data</li>
                        <li><b>Right to Restrict Processing:</b> Request limitation of data processing</li>
                        <li><b>Right to Data Portability:</b> Request transfer of your data</li>
                        <li><b>Right to Object:</b> Object to processing of your data</li>
                        <li><b>Right to Withdraw Consent:</b> Withdraw consent where processing is based on consent</li>
                    </ul>
                </div>
                <div class="policy-subsection">
                    <h3>Data Security</h3>
                    <div>We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.</div>
                </div>
                <div class="policy-subsection">
                    <h3>Third-Party Links</h3>
                    <div>Our website contains links to partner and affiliate sites. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies before providing any personal information.</div>
                </div>
                <div class="policy-subsection">
                    <h3>Changes to This Policy</h3>
                    <div>We may update this privacy policy from time to time. We will notify you of any material changes by posting the updated policy on our website with a new effective date.</div>
                </div>
                <div class="policy-subsection">
                    <h3>Contact Information</h3>
                    <div>If you have any questions about this privacy policy or wish to exercise your rights, please contact us:</div>
                    <ul>
                        <li><b>Email:</b> privacy@${SITE_DOMAIN}</li>
                        <li><b>Response Time:</b> We aim to respond to all privacy-related inquiries within 30 days</li>
                    </ul>
                    <div style="margin-top: 10px;">If you are not satisfied with our response, you have the right to lodge a complaint with the Information Commissioner's Office (ICO) at <a href="https://ico.org.uk" target="_blank">ico.org.uk</a>.</div>
                </div>
                <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e9ecef; color: #666; font-size: 0.9rem;">
                    <b>Last Updated:</b> December 2024<br>
                    <b>Effective Date:</b> December 1, 2024
                </div>
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
        .policy-subsection { margin-top: 20px; }
        .policy-subsection h3 { color: #232f3e; margin-bottom: 10px; font-size: 1.1rem; }
        .policy-subsection ul { margin: 10px 0; padding-left: 20px; }
        .policy-subsection li { margin-bottom: 5px; }
    </style>`;
  const privacyHtml = generateStaticPage({
    title: `Privacy Policy – ${SITE_NAME}`,
    headExtras: privacyHeadExtras,
    bodyClass: 'brand-home',
    mainHtml: privacyMainHtml,
    navbarHtml,
    bannerHtml
  });
  fs.writeFileSync(path.join(__dirname, '../public/pages/privacy-policy.html'), privacyHtml, 'utf8');

  // 4. TERMS-OF-USE.HTML
  // LEGAL REVIEW REMINDER: This terms of use should be reviewed quarterly for legal compliance.
  // Key areas to monitor: affiliate marketing regulations, consumer protection laws, dispute resolution procedures.
  // Consider adding: specific affiliate disclosure requirements, consumer rights under UK law, updated dispute resolution.
  const termsMainHtml = `
        <div class="policy-section">
            <div class="card hero-card">
                <div class="headline">Terms of Use</div>
                <div><b>By accessing and using ${SITE_NAME}, you agree to be bound by these Terms of Use.</b> If you do not agree to these terms, please do not use our website.</div>
                <div class="policy-subsection">
                    <h3>Acceptance of Terms</h3>
                    <div>By using our website, you acknowledge that you have read, understood, and agree to be bound by these Terms of Use. These terms constitute a legally binding agreement between you and ${SITE_NAME}.</div>
                </div>
                <div class="policy-subsection">
                    <h3>Use of Referral and Affiliate Links</h3>
                    <ul>
                        <li>You agree to use referral and affiliate links responsibly and in accordance with applicable laws and regulations</li>
                        <li>Do not misuse, spam, or engage in fraudulent activities with referral links</li>
                        <li>Respect the terms and conditions of individual partner programs</li>
                        <li>Do not attempt to manipulate or artificially inflate referral statistics</li>
                    </ul>
                </div>
                <div class="policy-subsection">
                    <h3>Offer Changes and Availability</h3>
                    <ul>
                        <li>Offers, incentives, and terms may change or be withdrawn at any time by partner sites without notice</li>
                        <li>We are not responsible for changes, errors, or discontinuation of offers on partner sites</li>
                        <li>We do not guarantee the availability or accuracy of any offers listed on our website</li>
                        <li>Always verify current terms and conditions directly with the partner site before proceeding</li>
                    </ul>
                </div>
                <div class="policy-subsection">
                    <h3>Payouts and Rewards</h3>
                    <ul>
                        <li>All payouts, rewards, and bonuses are managed exclusively by the partner sites</li>
                        <li>${SITE_NAME} does not process, guarantee, or have any control over payments</li>
                        <li>Payment terms, minimum thresholds, and processing times are determined by partner sites</li>
                        <li>We are not responsible for delays, disputes, or issues with payments from partner programs</li>
                    </ul>
                </div>
                <div class="policy-subsection">
                    <h3>Content and Information</h3>
                    <ul>
                        <li>While we strive for accuracy, we cannot guarantee that all information on our website is current, complete, or error-free</li>
                        <li>Information about offers, terms, and conditions may become outdated</li>
                        <li>We strongly recommend checking the partner site directly for the most up-to-date information</li>
                        <li>We are not responsible for any decisions made based on information provided on our website</li>
                    </ul>
                </div>
                <div class="policy-subsection">
                    <h3>External Content and Third-Party Sites</h3>
                    <ul>
                        <li>Our website contains links to external websites operated by third parties</li>
                        <li>We do not endorse, control, or have any responsibility for the content, privacy policies, or practices of third-party sites</li>
                        <li>Your use of third-party sites is subject to their respective terms of service and privacy policies</li>
                        <li>We are not liable for any damages or losses arising from your use of third-party sites</li>
                    </ul>
                </div>
                <div class="policy-subsection">
                    <h3>User Conduct</h3>
                    <ul>
                        <li>You agree not to use our website for any unlawful purpose or in any way that could damage, disable, or impair the site</li>
                        <li>Do not attempt to gain unauthorized access to our systems or interfere with site functionality</li>
                        <li>Respect intellectual property rights and do not copy, reproduce, or distribute our content without permission</li>
                        <li>Do not engage in any activity that could harm other users or the reputation of our website</li>
                    </ul>
                </div>
                <div class="policy-subsection">
                    <h3>Limitation of Liability</h3>
                    <div>To the maximum extent permitted by law, ${SITE_NAME} shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from:</div>
                    <ul>
                        <li>Your use of our website or any information provided</li>
                        <li>Your participation in referral or affiliate programs</li>
                        <li>Any issues with partner sites or their services</li>
                        <li>Loss of data, profits, or business opportunities</li>
                        <li>Any other damages related to your use of our services</li>
                    </ul>
                </div>
                <div class="policy-subsection">
                    <h3>Indemnification</h3>
                    <div>You agree to indemnify and hold harmless ${SITE_NAME} from any claims, damages, losses, or expenses arising from your use of our website or violation of these terms.</div>
                </div>
                <div class="policy-subsection">
                    <h3>Termination</h3>
                    <ul>
                        <li>We may terminate or suspend your access to our website at any time, with or without cause</li>
                        <li>Grounds for termination include violation of these terms, fraudulent activity, or any other conduct we deem inappropriate</li>
                        <li>Upon termination, your right to use our website ceases immediately</li>
                        <li>Provisions of these terms that by their nature should survive termination shall remain in effect</li>
                    </ul>
                </div>
                <div class="policy-subsection">
                    <h3>Changes to Terms</h3>
                    <ul>
                        <li>We reserve the right to modify these Terms of Use at any time</li>
                        <li>Changes will be effective immediately upon posting on our website</li>
                        <li>We will notify users of material changes by updating the "Last Updated" date</li>
                        <li>Your continued use of the website after changes constitutes acceptance of the new terms</li>
                        <li>We encourage you to review these terms periodically</li>
                    </ul>
                </div>
                <div class="policy-subsection">
                    <h3>Dispute Resolution</h3>
                    <ul>
                        <li>Any disputes arising from these terms or your use of our website will be resolved through good faith negotiation</li>
                        <li>If negotiation fails, disputes will be resolved through binding arbitration in the UK</li>
                        <li>Arbitration will be conducted by a neutral arbitrator in accordance with UK law</li>
                        <li>You agree to waive any right to a jury trial or class action lawsuit</li>
                    </ul>
                </div>
                <div class="policy-subsection">
                    <h3>Governing Law</h3>
                    <div>These Terms of Use are governed by and construed in accordance with the laws of England and Wales. Any legal proceedings shall be subject to the exclusive jurisdiction of the courts of England and Wales.</div>
                </div>
                <div class="policy-subsection">
                    <h3>Severability</h3>
                    <div>If any provision of these terms is found to be unenforceable or invalid, the remaining provisions will continue in full force and effect.</div>
                </div>
                <div class="policy-subsection">
                    <h3>Contact Information</h3>
                    <div>If you have any questions about these Terms of Use, please contact us:</div>
                    <ul>
                        <li><b>Email:</b> legal@${SITE_DOMAIN}</li>
                        <li><b>Response Time:</b> We aim to respond to all legal inquiries within 14 days</li>
                    </ul>
                </div>
                <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e9ecef; color: #666; font-size: 0.9rem;">
                    <b>Last Updated:</b> December 2024<br>
                    <b>Effective Date:</b> December 1, 2024
                </div>
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
        .policy-subsection { margin-top: 20px; }
        .policy-subsection h3 { color: #232f3e; margin-bottom: 10px; font-size: 1.1rem; }
        .policy-subsection ul { margin: 10px 0; padding-left: 20px; }
        .policy-subsection li { margin-bottom: 5px; }
    </style>`;
  const termsHtml = generateStaticPage({
    title: `Terms of Use – ${SITE_NAME}`,
    headExtras: termsHeadExtras,
    bodyClass: 'brand-home',
    mainHtml: termsMainHtml,
    navbarHtml,
    bannerHtml
  });
  fs.writeFileSync(path.join(__dirname, '../public/pages/terms-of-use.html'), termsHtml, 'utf8');
}

main(); 