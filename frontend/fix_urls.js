const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    let filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(filePath));
    } else { 
      if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) results.push(filePath);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));
let changedCount = 0;

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let original = content;

  // Step 1: Replace the extremely convoluted inner interpolation string:
  let searchTarget = "${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}`}";
  let replacementTarget = "${import.meta.env.VITE_API_URL || 'http://localhost:5000'}";
  
  if (content.includes(searchTarget)) {
      content = content.split(searchTarget).join(replacementTarget);
  }

  // Step 2: Now look for lines that have single quotes wrapped around the placeholder
  // Example: '${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/login'
  // We want to turn them into valid template literals: `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/login`
  content = content.replace(/'\$\{import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:5000'\}([^']*)'/g,
    "\\`\\${import.meta.env.VITE_API_URL || 'http://localhost:5000'}$1\\`");

  if(content !== original) {
    fs.writeFileSync(f, content, 'utf8');
    changedCount++;
    console.log('Fixed:', f);
  }
});
console.log('Total files fixed:', changedCount);
