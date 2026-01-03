// Simple script to generate a basic app icon
const fs = require('fs');
const path = require('path');

// Create a simple 256x256 PNG file using raw pixel data
// This is a placeholder - replace with your actual icon

const size = 256;
const channels = 4; // RGBA

// Create PNG header and IHDR chunk
function createPNG(width, height, pixels) {
    const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    
    // For a simple approach, let's create a base64 encoded PNG
    // Using a solid color icon as placeholder
    const { createCanvas } = require('canvas');
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Background - purple gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#6366f1');
    gradient.addColorStop(1, '#8b5cf6');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 50);
    ctx.fill();
    
    // Folder shape - yellow
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(50, 90);
    ctx.lineTo(50, 190);
    ctx.quadraticCurveTo(50, 200, 60, 200);
    ctx.lineTo(196, 200);
    ctx.quadraticCurveTo(206, 200, 206, 190);
    ctx.lineTo(206, 110);
    ctx.quadraticCurveTo(206, 100, 196, 100);
    ctx.lineTo(140, 100);
    ctx.lineTo(125, 85);
    ctx.quadraticCurveTo(120, 80, 110, 80);
    ctx.lineTo(60, 80);
    ctx.quadraticCurveTo(50, 80, 50, 90);
    ctx.fill();
    
    // White lines (files indicator)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.roundRect(70, 130, 90, 12, 6);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.roundRect(70, 150, 70, 12, 6);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.roundRect(70, 170, 100, 12, 6);
    ctx.fill();
    
    return canvas.toBuffer('image/png');
}

try {
    const pngBuffer = createPNG(256, 256);
    fs.writeFileSync(path.join(__dirname, 'icon.png'), pngBuffer);
    console.log('Created icon.png');
} catch (e) {
    console.log('Canvas not available. Please install canvas: npm install canvas');
    console.log('Or manually create a 1024x1024 PNG icon and save it as resources/icon.png');
}
