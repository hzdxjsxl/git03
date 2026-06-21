const fs = require('fs');
const path = require('path');

class LibraryService {
  constructor() {
    this.libraryDir = path.join(__dirname, '..', 'data', 'library');
    this._ensureLibraryDir();
    this._initializeTemplates();
  }

  _ensureLibraryDir() {
    if (!fs.existsSync(this.libraryDir)) {
      fs.mkdirSync(this.libraryDir, { recursive: true });
    }
    const subdirs = ['templates', 'backgrounds', 'characters', 'props'];
    subdirs.forEach(sub => {
      const dir = path.join(this.libraryDir, sub);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  _generateTemplateSVG(template) {
    const { width, height, category, sceneType, id } = template;
    const hash = template.id.length;
    
    const colorMap = {
      interior: { bg: [30, 25, 35], accent: 45 },
      exterior: { bg: [200, 30, 40], accent: 50 },
      action: { bg: [350, 50, 30], accent: 25 },
      dialogue: { bg: [260, 30, 35], accent: 290 },
      closeup: { bg: [340, 40, 35], accent: 360 },
      wideshot: { bg: [150, 25, 35], accent: 180 },
      establishing: { bg: [210, 35, 35], accent: 240 }
    };
    const colors = colorMap[sceneType] || { bg: [0, 0, 30], accent: 0 };
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="hsl(${colors.bg[0]}, ${colors.bg[1]}%, ${colors.bg[2] + 10}%)"/>
      <stop offset="100%" stop-color="hsl(${colors.bg[0]}, ${colors.bg[1]}%, ${colors.bg[2] - 10}%)"/>
    </linearGradient>
    <pattern id="sketch" width="20" height="20" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="20" y2="20" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect width="${width}" height="${height}" fill="url(#sketch)"/>
  
  <g opacity="0.3">
    <line x1="0" y1="0" x2="${width}" y2="${height}" stroke="hsl(${colors.accent}, 70%, 60%)" stroke-width="1"/>
    <line x1="${width}" y1="0" x2="0" y2="${height}" stroke="hsl(${colors.accent}, 70%, 60%)" stroke-width="1"/>
    <rect x="20" y="20" width="${width - 40}" height="${height - 40}" fill="none" stroke="hsl(${colors.accent}, 70%, 60%)" stroke-width="2" stroke-dasharray="10,5"/>
  </g>
  
  <g transform="translate(${width / 2}, ${height / 2})">
    <rect x="${-width * 0.2}" y="${-height * 0.1}" width="${width * 0.4}" height="${height * 0.2}" rx="8" fill="hsl(${colors.accent}, 60%, 50%)" opacity="0.5"/>
    <text text-anchor="middle" y="8" font-family="sans-serif" font-size="${Math.min(width / 20, 24)}" font-weight="bold" fill="white">${sceneType.toUpperCase()}</text>
  </g>
  
  <text x="20" y="${height - 20}" font-family="monospace" font-size="12" fill="rgba(255,255,255,0.6)">${id} | ${category}</text>
</svg>`;
  }

  _initializeTemplates() {
    const manifestPath = path.join(this.libraryDir, 'manifest.json');
    
    if (!fs.existsSync(manifestPath)) {
      const templates = this._generateDefaultTemplates();
      
      templates.forEach(tpl => {
        const svg = this._generateTemplateSVG(tpl);
        const filePath = path.join(this.libraryDir, 'templates', `${tpl.id}.svg`);
        fs.writeFileSync(filePath, svg, 'utf-8');
        tpl.filePath = `/static/templates/${tpl.id}.svg`;
        tpl.url = `/static/templates/${tpl.id}.svg`;
      });

      const manifest = {
        version: '1.0.0',
        generatedAt: new Date().toISOString(),
        templates,
        categories: this._extractCategories(templates),
        sceneTypes: this._extractSceneTypes(templates)
      };
      
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
      this._manifest = manifest;
    } else {
      this._manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    }
  }

  _generateDefaultTemplates() {
    const templates = [];
    const categories = ['室内场景', '室外场景', '对话场景', '动作场景', '特写镜头', '远景镜头', '空镜转场'];
    const sceneTypes = ['interior', 'exterior', 'dialogue', 'action', 'closeup', 'wideshot', 'establishing'];
    const sizes = [
      { name: 'standard', width: 640, height: 480 },
      { name: 'wide', width: 960, height: 400 },
      { name: 'tall', width: 400, height: 640 },
      { name: 'square', width: 560, height: 560 }
    ];

    let idCounter = 1;
    
    categories.forEach((cat, catIdx) => {
      sizes.forEach((size, sizeIdx) => {
        for (let variant = 1; variant <= 3; variant++) {
          const id = `tpl_${String(idCounter).padStart(4, '0')}`;
          templates.push({
            id,
            name: `${cat} - ${size.name} #${variant}`,
            category: cat,
            sceneType: sceneTypes[catIdx],
            size: size.name,
            width: size.width,
            height: size.height,
            aspectRatio: (size.width / size.height).toFixed(2),
            tags: this._generateTags(cat, size.name, variant),
            popularity: Math.floor(Math.random() * 100) + 1,
            usageCount: Math.floor(Math.random() * 500),
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 3600 * 1000).toISOString(),
            recommendedLayout: this._getRecommendedLayout(size.name)
          });
          idCounter++;
        }
      });
    });

    return templates;
  }

  _generateTags(category, size, variant) {
    const baseTags = {
      '室内场景': ['室内', '房间', '建筑', '封闭空间'],
      '室外场景': ['室外', '自然', '城市', '开阔'],
      '对话场景': ['对话', '交流', '人物', '情感'],
      '动作场景': ['动作', '紧张', '战斗', '追逐'],
      '特写镜头': ['特写', '细节', '表情', '强调'],
      '远景镜头': ['远景', '全景', '环境', '氛围'],
      '空镜转场': ['空镜', '转场', '过渡', '意境']
    };
    const sizeTags = { standard: ['标准'], wide: ['宽屏', '横向'], tall: ['竖屏', '纵向'], square: ['方形'] };
    return [...(baseTags[category] || []), ...(sizeTags[size] || []), `v${variant}`];
  }

  _getRecommendedLayout(sizeName) {
    const layouts = {
      standard: ['top-bubbles', 'bottom-bubbles', 'side-bubbles'],
      wide: ['top-bubbles', 'bottom-bubbles', 'split-bubbles'],
      tall: ['right-bubbles', 'bottom-bubbles', 'stacked-bubbles'],
      square: ['center-bubbles', 'corner-bubbles', 'top-bubbles']
    };
    return layouts[sizeName] || layouts.standard;
  }

  _extractCategories(templates) {
    const categoryMap = {};
    templates.forEach(t => {
      if (!categoryMap[t.category]) {
        categoryMap[t.category] = {
          name: t.category,
          sceneType: t.sceneType,
          count: 0,
          previewUrl: t.url || `/static/templates/${t.id}.svg`
        };
      }
      categoryMap[t.category].count++;
    });
    return Object.values(categoryMap);
  }

  _extractSceneTypes(templates) {
    const typeMap = {};
    templates.forEach(t => {
      if (!typeMap[t.sceneType]) {
        typeMap[t.sceneType] = {
          type: t.sceneType,
          label: this._getSceneTypeLabel(t.sceneType),
          count: 0,
          categories: new Set()
        };
      }
      typeMap[t.sceneType].count++;
      typeMap[t.sceneType].categories.add(t.category);
    });
    return Object.values(typeMap).map(t => ({
      ...t,
      categories: Array.from(t.categories)
    }));
  }

  _getSceneTypeLabel(type) {
    const labels = {
      interior: '室内场景',
      exterior: '室外场景',
      dialogue: '对话场景',
      action: '动作场景',
      closeup: '特写镜头',
      wideshot: '远景镜头',
      establishing: '空镜转场'
    };
    return labels[type] || type;
  }

  _loadManifest() {
    if (!this._manifest) {
      const manifestPath = path.join(this.libraryDir, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        this._manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      }
    }
    return this._manifest;
  }

  async getTemplates({ category, sceneType, keyword, limit = 50, offset = 0 } = {}) {
    const manifest = this._loadManifest();
    let templates = [...manifest.templates];

    if (category) {
      templates = templates.filter(t => t.category === category);
    }
    if (sceneType) {
      templates = templates.filter(t => t.sceneType === sceneType);
    }
    if (keyword) {
      const kw = keyword.toLowerCase();
      templates = templates.filter(t => 
        t.name.toLowerCase().includes(kw) ||
        t.tags.some(tag => tag.toLowerCase().includes(kw)) ||
        t.sceneType.toLowerCase().includes(kw)
      );
    }

    templates.sort((a, b) => b.popularity - a.popularity);

    const total = templates.length;
    const paged = templates.slice(offset, offset + limit).map(t => ({
      ...t,
      url: t.url || `/static/templates/${t.id}.svg`
    }));

    return {
      items: paged,
      total,
      offset,
      limit,
      hasMore: offset + limit < total
    };
  }

  async getTemplateById(id) {
    const manifest = this._loadManifest();
    const template = manifest.templates.find(t => t.id === id);
    if (!template) return null;
    return {
      ...template,
      url: template.url || `/static/templates/${template.id}.svg`
    };
  }

  async getCategories() {
    const manifest = this._loadManifest();
    return manifest.categories || [];
  }

  async getSceneTypes() {
    const manifest = this._loadManifest();
    return manifest.sceneTypes || [];
  }
}

module.exports = new LibraryService();
