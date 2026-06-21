const fs = require('fs');
const path = require('path');

class ImageGenerator {
  constructor() {
    this.stylePresets = {
      manga: { filter: 'manga', palette: 'black-white', lineWeight: 'medium' },
      anime: { filter: 'anime', palette: 'vibrant', lineWeight: 'thin' },
      sketch: { filter: 'sketch', palette: 'monochrome', lineWeight: 'heavy' },
      realistic: { filter: 'realistic', palette: 'full-color', lineWeight: 'none' },
      cartoon: { filter: 'cartoon', palette: 'bright', lineWeight: 'thick' },
      watercolor: { filter: 'watercolor', palette: 'soft', lineWeight: 'light' }
    };

    this.sizePresets = {
      thumbnail: { width: 320, height: 240 },
      standard: { width: 640, height: 480 },
      large: { width: 1024, height: 768 },
      wide: { width: 1280, height: 540 },
      tall: { width: 540, height: 960 },
      square: { width: 720, height: 720 }
    };
  }

  _hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  _generatePlaceholderSVG({ prompt, style, size, index = 0 }) {
    const { width, height } = this.sizePresets[size] || this.sizePresets.standard;
    const preset = this.stylePresets[style] || this.stylePresets.manga;
    const hash = this._hashString(prompt + index);
    
    const hues = [200, 340, 30, 160, 280, 50, 260, 120];
    const bgHue = hues[hash % hues.length];
    const accentHue = (bgHue + 60 + (hash % 60)) % 360;
    
    const patterns = ['dots', 'lines', 'crosshatch', 'diagonal', 'grid', 'radiating'];
    const pattern = patterns[hash % patterns.length];

    let patternDef = '';
    if (pattern === 'dots') {
      patternDef = `<pattern id="p" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="2" fill="rgba(255,255,255,0.15)"/></pattern>`;
    } else if (pattern === 'lines') {
      patternDef = `<pattern id="p" width="10" height="10" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="10" y2="10" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></pattern>`;
    } else if (pattern === 'crosshatch') {
      patternDef = `<pattern id="p" width="14" height="14" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="14" y2="14" stroke="rgba(255,255,255,0.08)" stroke-width="1"/><line x1="14" y1="0" x2="0" y2="14" stroke="rgba(255,255,255,0.08)" stroke-width="1"/></pattern>`;
    } else if (pattern === 'diagonal') {
      patternDef = `<pattern id="p" width="8" height="8" patternUnits="userSpaceOnUse"><line x1="0" y1="8" x2="8" y2="0" stroke="rgba(0,0,0,0.1)" stroke-width="1"/></pattern>`;
    } else if (pattern === 'grid') {
      patternDef = `<pattern id="p" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1"/></pattern>`;
    } else {
      patternDef = `<radialGradient id="p" cx="50%" cy="50%"><stop offset="0%" stop-color="rgba(255,255,255,0.2)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/></radialGradient>`;
    }

    const sceneIcons = [
      { x: '50%', y: '45%', r: Math.min(width, height) * 0.2, type: 'landscape' },
      { x: '50%', y: '50%', r: Math.min(width, height) * 0.22, type: 'portrait' },
      { x: '50%', y: '50%', r: Math.min(width, height) * 0.18, type: 'dialogue' },
      { x: '50%', y: '45%', r: Math.min(width, height) * 0.2, type: 'action' }
    ];
    const icon = sceneIcons[hash % sceneIcons.length];

    const displayPrompt = prompt.length > 40 ? prompt.substring(0, 37) + '...' : prompt;
    const fontSize = Math.max(12, Math.min(18, width / 35));
    const subFontSize = Math.max(10, fontSize - 3);

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    ${patternDef}
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="hsl(${bgHue}, 50%, 35%)"/>
      <stop offset="50%" stop-color="hsl(${(bgHue + 30) % 360}, 45%, 28%)"/>
      <stop offset="100%" stop-color="hsl(${(bgHue + 60) % 360}, 55%, 20%)"/>
    </linearGradient>
    <filter id="rough" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="${hash % 1000}"/>
      <feDisplacementMap in="SourceGraphic" scale="2"/>
    </filter>
  </defs>
  
  <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>
  <rect width="${width}" height="${height}" fill="${pattern === 'radiating' ? 'url(#p)' : 'url(#p)'}"/>
  
  <g transform="translate(${width * 0.05}, ${height * 0.05})">
    <rect width="${width * 0.9}" height="${height * 0.9}" fill="none" stroke="hsl(${accentHue}, 80%, 65%)" stroke-width="3" stroke-dasharray="8,4" opacity="0.6" rx="8"/>
  </g>

  <g transform="translate(${icon.x === '50%' ? width / 2 : icon.x}, ${icon.y === '45%' ? height * 0.45 : height / 2})">
    ${icon.type === 'landscape' ? `
      <ellipse cx="0" cy="${icon.r * 0.5}" rx="${icon.r * 1.2}" ry="${icon.r * 0.4}" fill="hsl(${accentHue}, 60%, 50%)" opacity="0.6"/>
      <polygon points="${-icon.r * 0.8},${icon.r * 0.3} ${-icon.r * 0.3},${-icon.r * 0.5} ${0},${icon.r * 0.1} ${icon.r * 0.4},${-icon.r * 0.3} ${icon.r * 0.8},${icon.r * 0.3}" fill="hsl(${accentHue}, 55%, 45%)" opacity="0.7"/>
      <circle cx="${-icon.r * 0.5}" cy="${-icon.r * 0.6}" r="${icon.r * 0.15}" fill="hsl(${accentHue}, 90%, 75%)" opacity="0.9"/>
    ` : icon.type === 'portrait' ? `
      <circle cx="0" cy="${-icon.r * 0.2}" r="${icon.r * 0.45}" fill="hsl(${accentHue}, 70%, 60%)" opacity="0.8"/>
      <path d="M ${-icon.r * 0.7} ${icon.r * 0.9} Q 0 ${icon.r * 0.2} ${icon.r * 0.7} ${icon.r * 0.9} Z" fill="hsl(${accentHue}, 60%, 45%)" opacity="0.7"/>
    ` : icon.type === 'dialogue' ? `
      <ellipse cx="0" cy="0" rx="${icon.r * 0.9}" ry="${icon.r * 0.55}" fill="white" opacity="0.95" stroke="hsl(${accentHue}, 80%, 40%)" stroke-width="2"/>
      <polygon points="${icon.r * 0.3},${icon.r * 0.4} ${icon.r * 0.6},${icon.r * 0.8} ${icon.r * 0.1},${icon.r * 0.55}" fill="white" stroke="hsl(${accentHue}, 80%, 40%)" stroke-width="2"/>
      <line x1="${-icon.r * 0.5}" y1="${-icon.r * 0.15}" x2="${icon.r * 0.5}" y2="${-icon.r * 0.15}" stroke="hsl(${accentHue}, 60%, 40%)" stroke-width="2" stroke-linecap="round"/>
      <line x1="${-icon.r * 0.5}" y1="${icon.r * 0.05}" x2="${icon.r * 0.3}" y2="${icon.r * 0.05}" stroke="hsl(${accentHue}, 60%, 40%)" stroke-width="2" stroke-linecap="round"/>
    ` : `
      <line x1="${-icon.r}" y1="${-icon.r * 0.3}" x2="${icon.r}" y2="${-icon.r * 0.3}" stroke="hsl(${accentHue}, 90%, 70%)" stroke-width="4" stroke-linecap="round" opacity="0.9"/>
      <line x1="${-icon.r * 0.6}" y1="${icon.r * 0.2}" x2="${icon.r * 0.6}" y2="${icon.r * 0.2}" stroke="hsl(${accentHue}, 90%, 60%)" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
      <polygon points="${icon.r * 0.5},${-icon.r * 0.6} ${icon.r * 0.9},${-icon.r * 0.3} ${icon.r * 0.5},0" fill="hsl(${accentHue}, 85%, 65%)" opacity="0.9"/>
      <path d="M ${-icon.r * 0.8} ${icon.r * 0.5} Q ${-icon.r * 0.4} ${-icon.r * 0.1} 0 ${icon.r * 0.5} T ${icon.r * 0.8} ${icon.r * 0.5}" fill="none" stroke="hsl(${accentHue}, 90%, 70%)" stroke-width="3" stroke-linecap="round" opacity="0.85"/>
    `}
  </g>

  <g transform="translate(${width / 2}, ${height * 0.82})">
    <rect x="${-width * 0.42}" y="${-subFontSize * 2.5}" width="${width * 0.84}" height="${subFontSize * 4}" rx="6" fill="rgba(0,0,0,0.55)"/>
    <text text-anchor="middle" y="${-subFontSize * 0.3}" font-family="sans-serif" font-size="${fontSize}" font-weight="600" fill="white" opacity="0.95">${displayPrompt.replace(/[&<>"']/g, '')}</text>
    <text text-anchor="middle" y="${subFontSize * 1.5}" font-family="sans-serif" font-size="${subFontSize}" fill="hsl(${accentHue}, 80%, 75%)" opacity="0.9">[${style.toUpperCase()}] ${width}×${height}px</text>
  </g>
</svg>`;
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generatePanel({ prompt, sceneType = 'default', style = 'manga', size = 'standard' }) {
    await this._delay(300 + Math.random() * 500);
    
    const { width, height } = this.sizePresets[size] || this.sizePresets.standard;
    const svg = this._generatePlaceholderSVG({ prompt, style, size });
    const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    
    const id = 'panel_' + Date.now() + '_' + this._hashString(prompt + style).toString(36);
    
    return {
      id,
      prompt,
      sceneType,
      style,
      size,
      dimensions: { width, height },
      imageUrl: svgDataUrl,
      svgContent: svg,
      metadata: {
        stylePreset: this.stylePresets[style],
        generatedAt: new Date().toISOString(),
        generationTime: 300 + Math.random() * 500
      }
    };
  }

  async generateBatch(panels, style = 'manga') {
    const results = [];
    
    for (let i = 0; i < panels.length; i++) {
      const panel = panels[i];
      const result = await this.generatePanel({
        prompt: panel.prompt,
        sceneType: panel.sceneType || 'default',
        style: panel.style || style,
        size: panel.size || 'standard'
      });
      results.push({
        ...result,
        originalIndex: panel.originalIndex ?? i,
        panelMetadata: panel.metadata || {}
      });
    }
    
    return results;
  }
}

module.exports = new ImageGenerator();
