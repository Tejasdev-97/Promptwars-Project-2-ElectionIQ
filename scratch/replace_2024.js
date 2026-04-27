const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'index.html',
  'modules/results.js',
  'modules/timeline.js',
  'modules/maps.js',
  'data/glossary.json',
  'data/faq-offline.json',
  'data/elections-india.json',
  'data/elections-global.json'
];

for (const file of filesToUpdate) {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const newContent = content.replace(/2024/g, '2026');
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated ${file}`);
  } else {
    console.log(`File not found: ${file}`);
  }
}
