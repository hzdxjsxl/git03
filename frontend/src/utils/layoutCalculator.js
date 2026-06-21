export const GRID_LAYOUTS = {
  standard: [
    { cols: 2, rows: 3, ratio: 1.33 },
    { cols: 3, rows: 2, ratio: 1.5 }
  ],
  cinematic: [
    { cols: 1, rows: 2, ratio: 2.4 },
    { cols: 2, rows: 2, ratio: 1.78 }
  ],
  manga4koma: [
    { cols: 1, rows: 4, ratio: 1.0 }
  ],
  mixed: [
    { cols: 2, rows: 2, ratio: 1.4 }
  ]
};

export const calcGridLayout = (
  totalPanels,
  pageWidth = 1100,
  pageHeight = 1400,
  mode = 'auto',
  gap = 12,
  pagePadding = 24
) => {
  if (totalPanels <= 0) return [];
  
  const usableW = pageWidth - pagePadding * 2;
  const usableH = pageHeight - pagePadding * 2;
  
  const layoutConfigs = mode === 'auto'
    ? _autoLayoutConfigs(totalPanels)
    : (GRID_LAYOUTS[mode] || GRID_LAYOUTS.standard);

  const pages = [];
  let panelIdx = 0;

  while (panelIdx < totalPanels) {
    const layout = layoutConfigs[pages.length % layoutConfigs.length];
    const totalCells = layout.cols * layout.rows;
    const remaining = totalPanels - panelIdx;
    
    const cellW = (usableW - gap * (layout.cols - 1)) / layout.cols;
    const cellH = (usableH - gap * (layout.rows - 1)) / layout.rows;
    
    const occupied = Array.from({ length: layout.rows }, () =>
      Array(layout.cols).fill(false)
    );
    
    const positions = [];
    let placedOnPage = 0;
    let globalCellIdx = 0;
    
    const canPlaceAt = (r, c, sC, sR) => {
      if (r + sR > layout.rows || c + sC > layout.cols) return false;
      for (let rr = r; rr < r + sR; rr++) {
        for (let cc = c; cc < c + sC; cc++) {
          if (occupied[rr][cc]) return false;
        }
      }
      return true;
    };
    
    const markOccupied = (r, c, sC, sR) => {
      for (let rr = r; rr < r + sR; rr++) {
        for (let cc = c; cc < c + sC; cc++) {
          occupied[rr][cc] = true;
        }
      }
    };
    
    while (placedOnPage < remaining && globalCellIdx < totalCells) {
      const row = Math.floor(globalCellIdx / layout.cols);
      const col = globalCellIdx % layout.cols;
      
      if (occupied[row][col]) {
        globalCellIdx++;
        continue;
      }
      
      let spanCols = 1;
      let spanRows = 1;
      
      const needsSpan = (mode === 'mixed' || mode === 'auto') && placedOnPage < remaining - 1;
      if (needsSpan) {
        const seed = (panelIdx + placedOnPage + pages.length * 7) % 11;
        
        if (seed === 0 && canPlaceAt(row, col, 2, 1)) {
          spanCols = 2;
        } else if (seed === 3 && canPlaceAt(row, col, 1, 2)) {
          spanRows = 2;
        } else if (seed === 7 && canPlaceAt(row, col, 2, 2)) {
          spanCols = 2;
          spanRows = 2;
        } else if (seed === 5 && col === 0 && canPlaceAt(row, col, layout.cols, 1)) {
          spanCols = layout.cols;
        }
      }
      
      spanCols = Math.min(spanCols, layout.cols - col);
      spanRows = Math.min(spanRows, layout.rows - row);
      
      markOccupied(row, col, spanCols, spanRows);
      
      const w = cellW * spanCols + gap * (spanCols - 1);
      const h = cellH * spanRows + gap * (spanRows - 1);
      const x = pagePadding + col * (cellW + gap);
      const y = pagePadding + row * (cellH + gap);
      
      positions.push({
        panelIndex: panelIdx + placedOnPage,
        pageIndex: pages.length,
        positionOnPage: placedOnPage,
        gridX: x,
        gridY: y,
        gridWidth: w,
        gridHeight: h,
        spanCols,
        spanRows,
        gridRow: row,
        gridCol: col
      });
      
      placedOnPage++;
      globalCellIdx++;
    }
    
    pages.push({
      index: pages.length,
      layout,
      width: pageWidth,
      height: pageHeight,
      panels: positions
    });
    
    panelIdx += placedOnPage;
  }

  return pages;
};

const _autoLayoutConfigs = (totalPanels) => {
  if (totalPanels <= 2) return [{ cols: 1, rows: 2, ratio: 1.5 }];
  if (totalPanels <= 4) return [{ cols: 2, rows: 2, ratio: 1.4 }];
  if (totalPanels <= 6) return [{ cols: 2, rows: 3, ratio: 1.33 }];
  return GRID_LAYOUTS.standard;
};

export const estimateTextSize = (text, fontSize = 14, fontFamily = 'sans-serif', maxWidthRatio = 0.85) => {
  if (!text) return { width: 0, height: 0, lines: 0 };
  
  const chars = Array.from(text);
  let totalWidth = 0;
  let lineWidth = 0;
  let lines = 1;
  const maxLineWidth = 30;
  let maxLineWidthPx = 0;
  
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const isCJK = /[\u4e00-\u9fa5]/.test(ch);
    const isNewLine = ch === '\n';
    const charWidth = isCJK ? fontSize : fontSize * 0.55;
    
    if (isNewLine) {
      lines++;
      maxLineWidthPx = Math.max(maxLineWidthPx, lineWidth);
      lineWidth = 0;
      continue;
    }
    
    if (lineWidth + charWidth > maxLineWidth * fontSize * 0.55) {
      lines++;
      maxLineWidthPx = Math.max(maxLineWidthPx, lineWidth);
      lineWidth = 0;
    }
    
    lineWidth += charWidth;
    totalWidth += charWidth;
  }
  maxLineWidthPx = Math.max(maxLineWidthPx, lineWidth);
  
  const paddingX = fontSize * 2;
  const paddingY = fontSize * 1.2;
  const lineHeight = fontSize * 1.4;
  
  return {
    width: maxLineWidthPx + paddingX,
    height: lines * lineHeight + paddingY,
    lines,
    maxLineWidth: maxLineWidthPx,
    lineHeight
  };
};

export const getBubblePath = (
  bubbleX,
  bubbleY,
  bubbleW,
  bubbleH,
  style = 'round',
  tailDirection = 'bottom',
  tailOffset = 0.3,
  tailSize = 0.15
) => {
  const r = style === 'bold-square' ? 4 : style === 'spiky' ? 8 : 16;
  const x = bubbleX;
  const y = bubbleY;
  const w = bubbleW;
  const h = bubbleH;
  const maxR = Math.min(r, w / 2, h / 2);
  
  let tail = '';
  const tSize = Math.min(w, h) * tailSize;
  const tOffset = (tailDirection === 'top' || tailDirection === 'bottom')
    ? w * tailOffset
    : h * tailOffset;
  
  if (tailDirection === 'bottom') {
    tail = ` L ${x + tOffset + tSize} ${y + h} L ${x + tOffset} ${y + h + tSize} L ${x + tOffset - tSize} ${y + h} Z`;
  } else if (tailDirection === 'top') {
    tail = ` L ${x + tOffset - tSize} ${y} L ${x + tOffset} ${y - tSize} L ${x + tOffset + tSize} ${y} Z`;
  } else if (tailDirection === 'left') {
    tail = ` L ${x} ${y + tOffset + tSize} L ${x - tSize} ${y + tOffset} L ${x} ${y + tOffset - tSize} Z`;
  } else if (tailDirection === 'right') {
    tail = ` L ${x + w} ${y + tOffset - tSize} L ${x + w + tSize} ${y + tOffset} L ${x + w} ${y + tOffset + tSize} Z`;
  }
  
  const startY = tailDirection === 'top' ? y + tSize : y;
  const startX = tailDirection === 'left' ? x + tSize : x;
  const endRightX = tailDirection === 'right' ? x + w - tSize : x + w;
  const endBottomY = tailDirection === 'bottom' ? y + h - tSize : y + h;
  
  if (style === 'spiky') {
    return buildSpikyPath(x, y, w, h, tSize);
  }
  
  return [
    `M ${startX + maxR} ${startY}`,
    `L ${endRightX - maxR} ${startY}`,
    `Q ${endRightX} ${startY} ${endRightX} ${startY + maxR}`,
    `L ${endRightX} ${endBottomY - maxR}`,
    `Q ${endRightX} ${endBottomY} ${endRightX - maxR} ${endBottomY}`,
    tail,
    `L ${startX + maxR} ${endBottomY}`,
    `Q ${startX} ${endBottomY} ${startX} ${endBottomY - maxR}`,
    `L ${startX} ${startY + maxR}`,
    `Q ${startX} ${startY} ${startX + maxR} ${startY}`,
    'Z'
  ].join(' ');
};

const buildSpikyPath = (x, y, w, h, tSize) => {
  const points = [];
  const spikeCount = 12;
  const baseSpike = Math.min(w, h) * 0.04;
  
  for (let i = 0; i < spikeCount; i++) {
    const t = i / spikeCount;
    let px, py;
    
    if (t < 0.25) {
      const lt = t / 0.25;
      px = x + w * lt;
      py = y;
    } else if (t < 0.5) {
      const lt = (t - 0.25) / 0.25;
      px = x + w;
      py = y + h * lt;
    } else if (t < 0.75) {
      const lt = (t - 0.5) / 0.25;
      px = x + w * (1 - lt);
      py = y + h;
    } else {
      const lt = (t - 0.75) / 0.25;
      px = x;
      py = y + h * (1 - lt);
    }
    
    const isSpike = i % 2 === 0;
    const offset = isSpike ? baseSpike : 0;
    
    if (t < 0.25) py -= offset;
    else if (t < 0.5) px += offset;
    else if (t < 0.75) py += offset;
    else px -= offset;
    
    points.push(`${px.toFixed(1)} ${py.toFixed(1)}`);
  }
  
  points.push(`L ${x + w * 0.7} ${y + h}`);
  points.push(`L ${x + w * 0.65} ${y + h + tSize}`);
  points.push(`L ${x + w * 0.6} ${y + h}`);
  
  return `M ${points[0]} L ${points.slice(1).join(' L ')} Z`;
};

export const snapToGrid = (value, gridSize = 5) => {
  return Math.round(value / gridSize) * gridSize;
};

export const constrainToBounds = (value, min, max) => {
  return Math.max(min, Math.min(max, value));
};

export const calcBestBubblePositions = (bubbles, panelWidth, panelHeight) => {
  if (!bubbles || bubbles.length === 0) return [];
  
  const positions = [];
  const usedZones = [];
  
  const zones = [
    { x: 10, y: 5, w: 80, h: 20 },
    { x: 10, y: 75, w: 80, h: 20 },
    { x: 5, y: 40, w: 35, h: 30 },
    { x: 60, y: 40, w: 35, h: 30 },
    { x: 10, y: 30, w: 80, h: 18 },
    { x: 10, y: 55, w: 80, h: 18 }
  ];
  
  bubbles.forEach((bubble, i) => {
    const zone = zones[i % zones.length];
    const size = estimateTextSize(bubble.text || bubble.character || '文本');
    const aspect = size.width / size.height;
    
    let bubbleW = zone.w;
    let bubbleH = zone.h;
    if (aspect > 0.1) {
      bubbleH = Math.max(zone.h, bubbleW / Math.max(0.8, aspect));
      if (bubbleH > 25) {
        bubbleH = 25;
        bubbleW = bubbleH * aspect;
      }
    }
    
    let bubbleX = zone.x + (zone.w - bubbleW) / 2;
    let bubbleY = zone.y + (zone.h - bubbleH) / 2;
    
    bubbleX = constrainToBounds(bubbleX, 2, 98 - bubbleW);
    bubbleY = constrainToBounds(bubbleY, 2, 98 - bubbleH);
    
    const tailDirection = bubbleY < 30 ? 'bottom' : bubbleY > 60 ? 'top' : bubbleX < 40 ? 'right' : 'left';
    
    positions.push({
      ...bubble,
      calculatedPosition: {
        x: bubbleX,
        y: bubbleY,
        width: bubbleW,
        height: bubbleH,
        tailDirection,
        ...(bubble.defaultPosition || {})
      }
    });
  });
  
  return positions;
};

const _REF_PANEL_WIDTH = 300;
const _REF_PANEL_HEIGHT = 200;

export const calcBubbleSizeFromText = (text, character, type = 'speech') => {
  const charLabel = character ? character + '：' : '';
  const fullText = charLabel + (text || '');
  const fontSize = type === 'narration' ? 13 : 14;
  const size = estimateTextSize(fullText, fontSize);

  const wRatio = size.width / _REF_PANEL_WIDTH;
  const hRatio = size.height / _REF_PANEL_HEIGHT;

  let widthPct = 10 + wRatio * 70;
  let heightPct = 8 + hRatio * 45;

  if (type === 'narration') {
    widthPct = Math.min(90, 40 + wRatio * 50);
    heightPct = Math.max(8, 10 + hRatio * 30);
  }

  widthPct = constrainToBounds(widthPct, type === 'narration' ? 40 : 15, 85);
  heightPct = constrainToBounds(heightPct, type === 'narration' ? 8 : 10, type === 'narration' ? 30 : 45);

  return {
    width: Math.round(widthPct * 10) / 10,
    height: Math.round(heightPct * 10) / 10
  };
};

export const calcBubbleTailDirection = (x, y, width, height) => {
  const centerY = y + height / 2;
  const centerX = x + width / 2;
  if (y < 8) return 'bottom';
  if (y + height > 92) return 'top';
  if (x < 12) return 'right';
  if (x + width > 88) return 'left';
  if (centerY < 25) return 'bottom';
  if (centerY > 75) return 'top';
  if (centerX < 35) return 'right';
  return 'left';
};

export const recalcBubbleDimensions = (bubble) => {
  const pos = bubble.defaultPosition || bubble.calculatedPosition || { x: 50, y: 50, width: 30, height: 15 };
  const { width, height } = calcBubbleSizeFromText(bubble.text, bubble.character, bubble.type);
  const tailDirection = calcBubbleTailDirection(pos.x, pos.y, width, height);
  return {
    ...bubble,
    defaultPosition: {
      ...pos,
      width,
      height,
      tailDirection
    }
  };
};

export default {
  GRID_LAYOUTS,
  calcGridLayout,
  estimateTextSize,
  getBubblePath,
  snapToGrid,
  constrainToBounds,
  calcBestBubblePositions,
  calcBubbleSizeFromText,
  calcBubbleTailDirection,
  recalcBubbleDimensions
};
