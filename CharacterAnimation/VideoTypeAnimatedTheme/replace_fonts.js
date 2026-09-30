
const fs = require('fs');

function processFile(path) {
    let content = fs.readFileSync(path, 'utf8');

    // 1. replace font-size: clamp(..., mid, ...)
    content = content.replace(/font-size:\s*clamp\([^,]+,\s*([^,]+)(vw|cqw),\s*[^)]+\)/g, (match, val, unit) => {
        return 'font-size: ' + val + 'cqw';
    });

    // 2. replace font-size: Xrem
    content = content.replace(/font-size:\s*([0-9.]+)rem/g, (match, val) => {
        const num = parseFloat(val) * 4.26;
        return 'font-size: ' + num.toFixed(2) + 'cqw';
    });

    // 3. replace font-size: Xpx
    content = content.replace(/font-size:\s*([0-9.]+)px/g, (match, val) => {
        const num = parseFloat(val) / 3.75;
        return 'font-size: ' + num.toFixed(2) + 'cqw';
    });

    // Also replace width and height in clamp if present to simplify them to their mid cqw value (useful for bells/elephants)
    content = content.replace(/(width|height|padding|bottom):\s*clamp\([^,]+,\s*([^,]+)(vw|cqw),\s*[^)]+\)/g, (match, prop, val, unit) => {
        return prop + ': ' + val + 'cqw';
    });

    fs.writeFileSync(path, content, 'utf8');
}

processFile('styles.css');
processFile('index.html');
console.log('Done!');

