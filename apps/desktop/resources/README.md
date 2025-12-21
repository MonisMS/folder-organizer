# Desktop App Resources

Place your app icons here:

## Required Icons

### Windows
- `icon.ico` - 256x256 multi-size ICO file

### macOS  
- `icon.icns` - ICNS format with multiple sizes (16, 32, 64, 128, 256, 512, 1024)

### Linux
Create an `icons/` folder with PNG files at various sizes:
- `icons/16x16.png`
- `icons/32x32.png`
- `icons/48x48.png`
- `icons/64x64.png`
- `icons/128x128.png`
- `icons/256x256.png`
- `icons/512x512.png`

## Icon Generation Tools

You can use these tools to generate icons from a single high-resolution PNG:

- **electron-icon-maker**: `npx electron-icon-maker --input=icon.png --output=./`
- **png2icons**: Online converters
- **ImageMagick**: `convert icon.png -define icon:auto-resize icon.ico`

## Placeholder

For development, you can use a placeholder. The app will still work without icons.
