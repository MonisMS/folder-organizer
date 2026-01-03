const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// This script helps generate icons
// You can also use online tools like:
// - https://www.xiconeditor.com/ (for .ico)
// - https://cloudconvert.com/svg-to-icns (for .icns)
// - https://convertio.co/svg-png/ (for PNG)

console.log(`
=====================================================
ICON GENERATION INSTRUCTIONS
=====================================================

Your SVG icon is at: resources/icon.svg

To generate icons for all platforms:

Option 1: Use Online Converters (Easiest)
-----------------------------------------
1. Go to https://cloudconvert.com/svg-to-png
2. Upload resources/icon.svg
3. Set size to 512x512, download as icon.png

4. Go to https://www.xiconeditor.com/
5. Upload the 512x512 PNG
6. Export as icon.ico (multi-size)
7. Save to resources/icon.ico

5. For Mac, use https://cloudconvert.com/png-to-icns
6. Save to resources/icon.icns

7. For Linux, create resources/icons/ folder with:
   - 16x16.png, 32x32.png, 48x48.png
   - 64x64.png, 128x128.png, 256x256.png
   (resize the 512x512 PNG)

Option 2: Use electron-icon-maker (if you have a 1024x1024 PNG)
---------------------------------------------------------------
1. Create a 1024x1024 PNG named input.png
2. Run: electron-icon-maker --input=input.png --output=./resources

=====================================================
`);

// Create Linux icons folder
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
  console.log('Created resources/icons/ folder for Linux icons');
}
