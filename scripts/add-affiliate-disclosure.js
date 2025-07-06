const fs = require('fs');
const path = require('path');

// Function to recursively find all HTML files in offer directories
function findOfferPages(dir) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            // Check if this is an offer directory (contains index.html)
            const indexPath = path.join(fullPath, 'index.html');
            if (fs.existsSync(indexPath)) {
                files.push(indexPath);
            }
        }
    }
    
    return files;
}

// Function to add affiliate disclosure to a single HTML file
function addAffiliateDisclosure(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Check if affiliate disclosure already exists
        if (content.includes('affiliate-disclosure')) {
            console.log(`Skipping ${filePath} - already has affiliate disclosure`);
            return;
        }
        
        // Find the container div and add disclosure after it
        const containerPattern = /<div class="container">/;
        if (containerPattern.test(content)) {
            const disclosureHtml = `
        <!-- Affiliate Disclosure Banner -->
        <div class="affiliate-disclosure">
            This page contains affiliate links. We may earn a commission if you sign up or make a purchase through our links. 
            <a href="/pages/information.html#affiliate-disclosure">Learn more about our affiliate relationships</a>.
        </div>
        
        `;
            
            content = content.replace(containerPattern, `$&${disclosureHtml}`);
            
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✓ Added affiliate disclosure to ${filePath}`);
        } else {
            console.log(`⚠ Could not find container div in ${filePath}`);
        }
    } catch (error) {
        console.error(`✗ Error processing ${filePath}:`, error.message);
    }
}

// Main execution
function main() {
    const offersDir = path.join(__dirname, '..', 'public', 'pages', 'offers');
    
    if (!fs.existsSync(offersDir)) {
        console.error('Offers directory not found:', offersDir);
        process.exit(1);
    }
    
    console.log('Finding offer pages...');
    const offerPages = findOfferPages(offersDir);
    
    console.log(`Found ${offerPages.length} offer pages`);
    console.log('Adding affiliate disclosure banners...\n');
    
    for (const page of offerPages) {
        addAffiliateDisclosure(page);
    }
    
    console.log('\n✓ Completed adding affiliate disclosures');
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { addAffiliateDisclosure, findOfferPages }; 