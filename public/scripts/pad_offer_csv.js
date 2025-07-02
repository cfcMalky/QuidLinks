const fs = require('fs');
const path = require('path');
const parse = require('csv-parse/sync');
const stringify = require('csv-stringify/sync');

const CSV_PATH = path.join(__dirname, 'offers_sheet.csv');
const BACKUP_PATH = path.join(__dirname, 'offers_sheet_backup.csv');

// Read and backup CSV
const csvContent = fs.readFileSync(CSV_PATH, 'utf8');
fs.writeFileSync(BACKUP_PATH, csvContent);

const records = parse.parse(csvContent, { columns: true, skip_empty_lines: false });
const headers = Object.keys(records[0]);

function padOrTrim(str, count) {
  const arr = (str || '').split('|').map(s => s.trim());
  while (arr.length < count) arr.push('');
  if (arr.length > count) arr.length = count;
  return arr.join(' | ');
}

const newRecords = records.map(row => {
  row['How It Works'] = padOrTrim(row['How It Works'], 3);
  row['Why Choose'] = padOrTrim(row['Why Choose'], 6);
  row['Features'] = padOrTrim(row['Features'], 6);
  return row;
});

const output = stringify.stringify(newRecords, { header: true, columns: headers });
fs.writeFileSync(CSV_PATH, output);

console.log('offers_sheet.csv padded/truncated for consistent mini-card counts. Backup saved as offers_sheet_backup.csv.'); 