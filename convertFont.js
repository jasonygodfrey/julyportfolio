const fs = require('fs');
const opentype = require('opentype.js');

const fontPath = 'path/to/your-font.ttf';
const outputPath = 'path/to/output-font.json';

opentype.load(fontPath, (err, font) => {
  if (err) {
    console.error(`Could not load font: ${err}`);
  } else {
    const fontData = font.toJSON();
    fs.writeFileSync(outputPath, JSON.stringify(fontData, null, 2));
    console.log(`Font successfully converted to JSON and saved to ${outputPath}`);
  }
});
