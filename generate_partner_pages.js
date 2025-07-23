// generate_partner_pages.js
// Usage: node generate_partner_pages.js
// Requires: npm install csv-parse

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const csvPath = path.join(__dirname, 'partners.csv');
const outputDir = path.join(__dirname, 'public', 'programs');
const styleHref = '../style.css';

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function isYouTube(url) {
  return /youtube\.com|youtu\.be/.test(url);
}

function getVideoEmbed(videoUrl, programName) {
  if (!videoUrl) return '';
  const wrapper = '<div style="width:100%;max-width:100%;aspect-ratio:16/9;margin:16px 0;">';
  if (isYouTube(videoUrl)) {
    // Extract YouTube video ID
    let id = '';
    const ytMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    if (ytMatch) id = ytMatch[1];
    else {
      // Try to extract v= param
      const vMatch = videoUrl.match(/[?&]v=([\w-]+)/);
      if (vMatch) id = vMatch[1];
    }
    if (!id) return '';
    return `${wrapper}<iframe src="https://www.youtube.com/embed/${id}" title="${programName} Overview" frameborder="0" allowfullscreen style="width:100%;height:100%;border-radius:12px;"></iframe></div>`;
  } else {
    return `${wrapper}<video src="${videoUrl}" controls style="width:100%;height:100%;border-radius:12px;"></video></div>`;
  }
}

function htmlTemplate(partner) {
  const slug = slugify(partner['Affiliate Program']);
  const videoEmbed = getVideoEmbed(partner['Video'], partner['Affiliate Program']);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${partner['Affiliate Program']} Affiliate Program | QuidLinks</title>
  <meta name="description" content="${(partner['Description'] || '').split(/\.|\n/)[0].replace(/"/g, '&quot;')}">
  <link rel="stylesheet" href="${styleHref}">
</head>
<body>
  <header>
    <h1>QuidLinks</h1>
    <nav>
      <ul>
        <li><a href="../index.html">Home</a></li>
      </ul>
    </nav>
  </header>
  <main>
    <div class="hero centered">
      <h2>${partner['Affiliate Program']} Affiliate Program</h2>
      <p><b>Category:</b> ${partner['Category']}</p>
      ${videoEmbed}
      <p><b>Commission:</b> ${partner['Commission']} per sale</p>
      <p><b>Avg Commission Per Sale:</b> ${partner['Avg Commission Per Sale']}</p>
      <p><b>Avg Deal Value:</b> ${partner['Avg Deal Value ()']}</p>
      <p><b>Payout Threshold:</b> ${partner['Payout Threshold ()']}</p>
      <p><b>Cookie Expiration:</b> ${partner['Cookie Expiration']}</p>
      <p><b>Paid Ads Policy:</b> ${partner['Paid Ads Policy']}</p>
      <a href="${partner['Referral Link']}" target="_blank" rel="noopener" style="display:inline-block;margin:24px 0 12px 0;padding:14px 32px;background:#a084e8;color:#fff;font-weight:700;border-radius:8px;text-decoration:none;box-shadow:0 2px 8px rgba(80,60,120,0.13);font-size:1.2em;">Join &amp; Earn with ${partner['Affiliate Program']}</a>
      <div style="margin-top:24px;text-align:left;">
        <h3>About ${partner['Affiliate Program']}</h3>
        <p>${(partner['Description'] || '').replace(/\n/g, '</p><p>')}</p>
      </div>
    </div>
  </main>
  <footer>
    &copy; 2024 QuidLinks. All rights reserved.
  </footer>
</body>
</html>`;
}

function main() {
  if (!fs.existsSync(csvPath)) {
    console.error('partners.csv not found!');
    process.exit(1);
  }
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const csv = fs.readFileSync(csvPath, 'utf8');
  const records = parse(csv, { columns: true, skip_empty_lines: true });
  records.forEach(partner => {
    const slug = slugify(partner['Affiliate Program']);
    const filePath = path.join(outputDir, `${slug}.html`);
    fs.writeFileSync(filePath, htmlTemplate(partner), 'utf8');
    console.log(`Generated: ${filePath}`);
  });
  console.log('All partner pages generated!');
}

main(); 