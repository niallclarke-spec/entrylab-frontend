// Generate PNG favicons from SVG using Canvas
// Run: node scripts/generate-favicons.js

const fs = require('fs');
const path = require('path');

// Create simple PNG favicons with EntryLab branding
const createFavicon = (size) => {
  // Simple base64 PNG data for a purple square with white "E"
  // This is a placeholder - in production, use proper image generation
  const canvas = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${size * 0.1875}" fill="#8B5CF6"/>
    <path d="M${size * 0.28125} ${size * 0.28125}h${size * 0.4375}v${size * 0.09375}H${size * 0.375}v${size * 0.125}h${size * 0.28}v${size * 0.09375}h-${size * 0.28}v${size * 0.125}h${size * 0.34375}v${size * 0.09375}H${size * 0.28125}V${size * 0.28125}z" fill="#FFF"/>
  </svg>`;
  
  return canvas;
};

// Generate sizes
const sizes = [16, 32, 180];
const publicDir = path.join(__dirname, '..', 'client', 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

sizes.forEach(size => {
  const svg = createFavicon(size);
  const filename = size === 180 ? 'apple-touch-icon.svg' : `favicon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(publicDir, filename), svg);
  console.log(`Created ${filename}`);
});

console.log('✓ Favicons generated successfully!');
