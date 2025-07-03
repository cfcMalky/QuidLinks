const fs = require('fs');
const path = require('path');
const parse = require('csv-parse/sync');

const OFFERS_DIR = path.join(__dirname, '../public/pages/offers');
const CSV_PATH = path.join(__dirname, '../public/data/offers_sheet.csv');

// Read and parse CSV
const csvContent = fs.readFileSync(CSV_PATH, 'utf8');
const records = parse.parse(csvContent, { columns: true, skip_empty_lines: true });
const headers = Object.keys(records[0]);
const csvMap = {};

// Helper: Normalize column names for robust access
function getColMap(headers) {
  const map = {};
  headers.forEach(h => {
    map[h.trim().toLowerCase()] = h;
  });
  return map;
}

const colMap = getColMap(headers);

function getVal(row, col) {
  // col: normalized (lowercase, trimmed)
  return row[colMap[col.trim().toLowerCase()]] || '';
}

records.forEach(row => {
  csvMap[getVal(row, 'File').trim().toLowerCase()] = row;
});

// Helper: Generate mini-card HTML
function miniCard(title, desc, icon) {
  // Escape quotes for SVG
  const safeIcon = icon.replace(/'/g, "&#39;").replace(/"/g, '&quot;');
  return `<div class="mini-card" style="--mini-card-icon-bg: url('data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='64'>${safeIcon}</text></svg>');"><span class="title">${title}</span><span class="desc">${desc}</span></div>`;
}

// Helper: Generate share buttons
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

// Helper: Extract emoji from start of string
function extractEmojiAndTitle(str, fallback) {
  // Regex for emoji at start
  const match = str.match(/^([\p{Emoji_Presentation}\p{Extended_Pictographic}])\s*(.*)$/u);
  if (match) {
    return { emoji: match[1], title: match[2].trim() };
  } else {
    return { emoji: fallback, title: str.trim() };
  }
}

function normalizeBrandClass(str) {
  // Remove 'brand-' if present, remove non-alphanum, lowercase, then prepend 'brand-'
  return 'brand-' + (str || '').toLowerCase().replace(/brand[-_]?/g, '').replace(/[^a-z0-9]/g, '');
}

// Offer page HTML template (Monzo structure)
function offerTemplate(offer) {
  const rawBrandClass = getVal(offer, 'Brand Class').trim();
  const brandClass = normalizeBrandClass(rawBrandClass);
  const headline = getVal(offer, 'Headline') || '';
  const subheadline = getVal(offer, 'Subheadline') || '';
  const refLink = getVal(offer, 'Referral Link') || '#';
  const howItWorks = (getVal(offer, 'How It Works') || '').split('|').map(s => s.trim()).filter(Boolean);
  const whyChoose = (getVal(offer, 'Why Choose') || '').split('|').map(s => s.trim()).filter(Boolean);
  const features = (getVal(offer, 'Features') || '').split('|').map(s => s.trim()).filter(Boolean);
  const disclaimer = getVal(offer, 'Disclaimer') || '';
  const brandName = getVal(offer, 'Brand') || '';
  // Mini-card icons
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
    <script src="https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js"></script>
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
        <div class="card offer-video-card"><div class="headline">A Little About ${brandName}</div><div id="offer-video"></div></div>
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
      <script src="/scripts/inject-offer-video.js"></script>
</body>
</html>
`;
}

// Ensure offers directory exists
if (!fs.existsSync(OFFERS_DIR)) {
  fs.mkdirSync(OFFERS_DIR, { recursive: true });
}

// Always (re)generate all offer pages from CSV
let created = 0;
const generatedFiles = [];
records.forEach(row => {
  const file = (getVal(row, 'File') || '').trim().toLowerCase();
  if (!file) return;
  const folderName = file.replace(/\.html$/i, '');
  const offerDir = path.join(OFFERS_DIR, folderName);
  if (!fs.existsSync(offerDir)) {
    fs.mkdirSync(offerDir, { recursive: true });
  }
  const filePath = path.join(offerDir, 'index.html');
  fs.writeFileSync(filePath, offerTemplate(row));
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