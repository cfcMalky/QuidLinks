const fs = require('fs');
const path = require('path');
const parse = require('csv-parse/sync');
const stringify = require('csv-stringify/sync');

const INPUT_PATH = path.join(__dirname, '../public/data/offers_sheet.csv');
const OUTPUT_PATH = path.join(__dirname, '../public/data/offers_sheet_clean.csv');

// Read and parse the CSV, allowing inconsistent columns
const csvContent = fs.readFileSync(INPUT_PATH, 'utf8');
const rows = csvContent.split(/\r?\n/);
const header = rows[0];
const numCols = header.split(',').length;
const fixedRows = [header];

for (let i = 1; i < rows.length; i++) {
  let row = rows[i];
  if (!row.trim()) continue;
  let parts = [];
  let current = '';
  let inQuotes = false;
  for (let j = 0; j < row.length; j++) {
    const char = row[j];
    if (char === '"') inQuotes = !inQuotes;
    if (char === ',' && !inQuotes) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current);
  // If too many columns, join extras into the last column
  if (parts.length > numCols) {
    parts = parts.slice(0, numCols - 1).concat([parts.slice(numCols - 1).join(',')]);
  }
  // If too few columns, pad with empty
  while (parts.length < numCols) parts.push('');
  // Quote all fields and escape double quotes
  const quoted = parts.map(f => '"' + f.replace(/"/g, '""') + '"');
  fixedRows.push(quoted.join(','));
}

fs.writeFileSync(OUTPUT_PATH, fixedRows.join('\n'), 'utf8');
console.log('Cleaned CSV written to', OUTPUT_PATH); 