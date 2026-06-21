import { calcBubbleSizeFromText, calcBubbleTailDirection } from './layoutCalculator.js';

const DIALOGUE_PATTERNS = [
  /^【(.+?)】[：:](.*)$/m,
  /^([A-Za-z\u4e00-\u9fa5]{1,20})[：:](.*)$/m,
  /^"([^"]+)"[：:](.*)$/m,
  /^「([^」]+)」[：:](.*)$/m,
  /^『([^』]+)』[：:](.*)$/m
];

const SCENE_HEADER_PATTERNS = [
  /^第[一二三四五六七八九十百千\d]+[场次回章幕][、.．]\s*(.*)$/im,
  /^[【\[](内|外|室内|室外|外景|内景).*?[】\]]\s*(.*)$/im,
  /^SCENE\s*\d+[：:.-]\s*(.*)$/im,
  /^场景[：:]\s*(.*)$/im,
  /^-{3,}\s*(.*?)\s*-{3,}$/m
];

const ACTION_PATTERNS = [
  /^\((.+?)\)$/,
  /^\[(.+?)\]$/,
  /^\*(\*.+?\*|\*.+?)$/,
  /^（(.+?)）$/
];

const NARRATION_PATTERNS = [
  /^【旁白】[：:](.*)$/im,
  /^[【\[](旁白|解说|OS|VO|Narrator)[】\]][：:](.*)$/im,
  /^(\([^)]*\))\s*$/m
];

const EMOTION_KEYWORDS = {
  happy: ['笑', '哈', '嘻', '快乐', '开心', '高兴', '^^', '哈哈', '嘿嘿'],
  sad: ['哭', '泪', '伤心', '难过', '呜', '痛', '悲伤'],
  angry: ['怒', '恨', '气', '火', '吼', '骂', '该死'],
  surprised: ['啊', '什么', '咦', '哎', '哇', '竟然', '居然'],
  fear: ['怕', '惧', '怕怕', '危险', '小心', '恐怖'],
  love: ['爱', '喜欢', '心', '恋', '想你', '亲爱的'],
  determined: ['一定', '必须', '誓', '无论如何', '决不', '坚持']
};

const BUBBLE_STYLES = {
  happy: 'round',
  sad: 'soft-cloud',
  angry: 'spiky',
  surprised: 'burst',
  fear: 'trembling',
  love: 'heart-shaped',
  determined: 'bold-square',
  neutral: 'round'
};

const BUBBLE_POSITIONS = [
  { x: 20, y: 75 },
  { x: 75, y: 75 },
  { x: 50, y: 60 },
  { x: 20, y: 45 },
  { x: 75, y: 45 },
  { x: 50, y: 30 }
];

function _uid() {
  return 'id_' + Math.random().toString(36).slice(2, 10);
}

export function parseScript(content, format = 'auto') {
  const lines = content.split(/\r?\n/).map(l => l.trim());
  const scenes = [];
  let currentScene = _createScene('开场', 1);
  let lineIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine) continue;

    lineIndex++;
    const lineNumber = i + 1;

    const sceneMatch = _matchSceneHeader(rawLine);
    if (sceneMatch) {
      if (currentScene.elements.length > 0) {
        scenes.push(currentScene);
      }
      currentScene = _createScene(sceneMatch.title, scenes.length + 1);
      continue;
    }

    const narrationMatch = _matchNarration(rawLine);
    if (narrationMatch) {
      currentScene.elements.push({
        id: `el_${scenes.length}_${lineIndex}_${_uid()}`,
        type: 'narration',
        content: narrationMatch.content,
        lineNumber,
        rawText: rawLine
      });
      continue;
    }

    const dialogueMatch = _matchDialogue(rawLine);
    if (dialogueMatch) {
      const dialogue = {
        id: `el_${scenes.length}_${lineIndex}_${_uid()}`,
        type: 'dialogue',
        character: dialogueMatch.character,
        content: dialogueMatch.content,
        lineNumber,
        rawText: rawLine,
        emotion: _detectEmotion(dialogueMatch.content),
        tone: _detectTone(dialogueMatch.content)
      };

      let lookahead = i + 1;
      while (lookahead < lines.length && lines[lookahead] && !_isElementBoundary(lines[lookahead])) {
        dialogue.content += '\n' + lines[lookahead].trim();
        dialogue.rawText += '\n' + lines[lookahead];
        i = lookahead;
        lookahead++;
      }
      dialogue.content = _stripWrappedMarkers(dialogue.content);
      dialogue.emotion = _detectEmotion(dialogue.content);

      currentScene.elements.push(dialogue);
      continue;
    }

    const actionMatch = _matchAction(rawLine);
    if (actionMatch) {
      currentScene.elements.push({
        id: `el_${scenes.length}_${lineIndex}_${_uid()}`,
        type: 'action',
        content: actionMatch.content,
        lineNumber,
        rawText: rawLine
      });
      continue;
    }

    if (currentScene.elements.length > 0) {
      const last = currentScene.elements[currentScene.elements.length - 1];
      if (last.type === 'dialogue') {
        last.content += '\n' + rawLine;
        last.rawText += '\n' + rawLine;
        last.emotion = _detectEmotion(last.content);
        continue;
      }
    }

    currentScene.elements.push({
      id: `el_${scenes.length}_${lineIndex}_${_uid()}`,
      type: 'description',
      content: rawLine,
      lineNumber,
      rawText: rawLine
    });
  }

  if (currentScene.elements.length > 0) {
    scenes.push(currentScene);
  }

  const characters = _extractCharacters(scenes);
  const statistics = _computeStatistics(scenes, characters);

  return {
    format: format === 'auto' ? _detectFormat(content) : format,
    scenes,
    characters,
    statistics,
    rawLineCount: lines.filter(l => l).length,
    totalScenes: scenes.length
  };
}

export function convertToPanels(parsedScript, layoutPreference = 'balanced') {
  const panels = [];
  let panelIndex = 0;

  for (const scene of parsedScript.scenes) {
    const scenePanels = _sceneToPanels(scene, panelIndex, layoutPreference);
    panels.push(...scenePanels);
    panelIndex += scenePanels.length;
  }

  return panels.map((panel, idx) => ({
    ...panel,
    index: idx,
    pageNumber: Math.floor(idx / 6) + 1,
    positionOnPage: idx % 6
  }));
}

export function runScriptToPanels(content, layoutPreference = 'balanced', format = 'auto') {
  const parsed = parseScript(content, format);
  const panels = convertToPanels(parsed, layoutPreference);
  return { parsedScript: parsed, panels };
}

function _createScene(title, index) {
  return {
    id: `scene_${index}`,
    title,
    index,
    elements: [],
    location: _extractLocation(title),
    timeOfDay: _extractTimeOfDay(title)
  };
}

function _matchSceneHeader(line) {
  for (const pattern of SCENE_HEADER_PATTERNS) {
    const match = line.match(pattern);
    if (match) {
      return { title: (match[1] || match[2] || line).trim() };
    }
  }
  return null;
}

function _matchDialogue(line) {
  for (const pattern of DIALOGUE_PATTERNS) {
    const match = line.match(pattern);
    if (match) {
      return {
        character: match[1].trim(),
        content: (match[2] || '').trim()
      };
    }
  }
  return null;
}

function _matchNarration(line) {
  for (const pattern of NARRATION_PATTERNS) {
    const match = line.match(pattern);
    if (match) {
      return { content: (match[1] || match[2] || line).trim() };
    }
  }
  return null;
}

function _matchAction(line) {
  for (const pattern of ACTION_PATTERNS) {
    const match = line.match(pattern);
    if (match) {
      return { content: match[1].trim() };
    }
  }
  return null;
}

function _isElementBoundary(line) {
  return _matchSceneHeader(line) ||
    _matchDialogue(line) ||
    _matchNarration(line) ||
    _matchAction(line);
}

function _stripWrappedMarkers(text) {
  return text
    .replace(/^[「『【\["']/, '')
    .replace(/[」』】\]"']$/, '')
    .trim();
}

function _detectEmotion(text) {
  const scores = {};
  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    scores[emotion] = keywords.reduce((sum, kw) => sum + (text.includes(kw) ? 1 : 0), 0);
  }
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return sorted[0][1] > 0 ? sorted[0][0] : 'neutral';
}

function _detectTone(text) {
  if (/[！!？?]{2,}/.test(text)) return 'excited';
  if (/[……\.\.\.]{2,}/.test(text)) return 'hesitant';
  if (/^[小声|低声|轻声]/.test(text)) return 'quiet';
  if (/[吼|喊|叫|咆哮|厉声]/.test(text)) return 'loud';
  if (/[调侃|玩笑|哈哈|嘻嘻]/.test(text)) return 'playful';
  return 'normal';
}

function _extractLocation(title) {
  if (/室内|房间|屋里|家|学校|教室|办公室|餐厅|咖啡馆|商店|车内|船内/.test(title)) return 'interior';
  if (/室外|外面|街道|公园|森林|山|海|河|天空|战场|城市/.test(title)) return 'exterior';
  return 'unspecified';
}

function _extractTimeOfDay(title) {
  if (/早晨|早上|清晨|黎明|日出/.test(title)) return 'morning';
  if (/下午|正午|中午|白天/.test(title)) return 'afternoon';
  if (/傍晚|黄昏|日落|夕阳/.test(title)) return 'evening';
  if (/夜晚|晚上|深夜|夜里|夜间|月光/.test(title)) return 'night';
  return 'any';
}

function _extractCharacters(scenes) {
  const characterMap = {};
  scenes.forEach(scene => {
    scene.elements.forEach(el => {
      if (el.type === 'dialogue') {
        const name = el.character;
        if (!characterMap[name]) {
          characterMap[name] = {
            id: `char_${name}_${_uid()}`,
            name,
            lineCount: 0,
            scenes: new Set(),
            emotions: {}
          };
        }
        characterMap[name].lineCount++;
        characterMap[name].scenes.add(scene.id);
        characterMap[name].emotions[el.emotion] = (characterMap[name].emotions[el.emotion] || 0) + 1;
      }
    });
  });
  return Object.values(characterMap).map(c => ({
    ...c,
    sceneCount: c.scenes.size,
    scenes: Array.from(c.scenes),
    dominantEmotion: Object.entries(c.emotions).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral'
  }));
}

function _computeStatistics(scenes, characters) {
  let dialogueCount = 0, narrationCount = 0, actionCount = 0, descriptionCount = 0, totalWords = 0;
  scenes.forEach(scene => {
    scene.elements.forEach(el => {
      if (el.type === 'dialogue') dialogueCount++;
      else if (el.type === 'narration') narrationCount++;
      else if (el.type === 'action') actionCount++;
      else descriptionCount++;
      if (el.content) totalWords += el.content.replace(/\s/g, '').length;
    });
  });
  const totalEl = dialogueCount + narrationCount + actionCount + descriptionCount;
  return {
    totalElements: totalEl,
    dialogueCount, narrationCount, actionCount, descriptionCount,
    characterCount: characters.length,
    totalWords,
    avgWordsPerElement: totalWords / Math.max(1, totalEl),
    avgDialoguesPerScene: dialogueCount / Math.max(1, scenes.length)
  };
}

function _detectFormat(content) {
  if (SCENE_HEADER_PATTERNS.some(p => p.test(content))) {
    if (/【.+?】：/.test(content) || /^[A-Za-z\u4e00-\u9fa5]{1,20}：/m.test(content)) return 'standard_script';
    return 'scene_based';
  }
  if (/第[一二三四五六七八九十百千\d]+[场次回章幕]/.test(content)) return 'chapter_based';
  return 'plain_text';
}

function _sceneToPanels(scene, startIndex, layoutPreference) {
  const panels = [];
  const elements = [...scene.elements];
  let buffer = [];
  let bufferCharCount = 0;
  const maxCharsPerPanel = layoutPreference === 'dense' ? 200 : layoutPreference === 'sparse' ? 80 : 140;
  const maxElementsPerPanel = layoutPreference === 'dense' ? 5 : layoutPreference === 'sparse' ? 2 : 3;

  const pushPanel = (elementsInPanel, isEstablishing = false) => {
    panels.push(_createPanelFromElements(scene, elementsInPanel, startIndex + panels.length, isEstablishing));
  };

  if (elements.length > 0 && (elements[0].type === 'description' || elements[0].type === 'action')) {
    pushPanel([elements.shift()], true);
  }

  for (const element of elements) {
    const charCount = (element.content || '').replace(/\s/g, '').length;
    if (buffer.length > 0 && (
      bufferCharCount + charCount > maxCharsPerPanel ||
      buffer.length >= maxElementsPerPanel ||
      (element.type === 'action' && buffer.length > 0) ||
      (buffer[buffer.length - 1].type === 'action' && buffer.length >= 1)
    )) {
      pushPanel(buffer);
      buffer = [];
      bufferCharCount = 0;
    }
    buffer.push(element);
    bufferCharCount += charCount;
  }
  if (buffer.length > 0) pushPanel(buffer);

  if (panels.length === 0) {
    pushPanel([{
      id: `el_empty_${scene.id}_${_uid()}`,
      type: 'description', content: scene.title, lineNumber: 0, rawText: scene.title
    }], true);
  }
  return panels;
}

function _createPanelFromElements(scene, elements, panelIdx, isEstablishing) {
  const dialogues = elements.filter(e => e.type === 'dialogue');
  const narrations = elements.filter(e => e.type === 'narration');
  const actions = elements.filter(e => e.type === 'action');
  const descriptions = elements.filter(e => e.type === 'description');
  const promptParts = [];

  if (isEstablishing) promptParts.push(`${scene.title}全景镜头`);
  if (descriptions.length > 0) promptParts.push(descriptions.map(d => d.content).join(' '));
  if (actions.length > 0) promptParts.push(actions.map(a => a.content).join(' '));
  if (dialogues.length > 0) {
    promptParts.push(`${dialogues.length}人对话场景`);
    promptParts.push(`人物: ${[...new Set(dialogues.map(d => d.character))].join('和')}`);
  }
  if (scene.location !== 'unspecified') promptParts.push(_locationLabel(scene.location));

  const sceneType = isEstablishing ? 'establishing'
    : actions.length > 0 ? 'action'
    : dialogues.length >= 2 ? 'dialogue'
    : dialogues.length === 1 && descriptions.length === 0 ? 'closeup'
    : scene.location === 'exterior' ? 'wideshot'
    : 'interior';

  return {
    id: `panel_${Date.now()}_${String(panelIdx + 1).padStart(3, '0')}`,
    sceneId: scene.id,
    sceneTitle: scene.title,
    sourceElements: elements.map(e => ({ id: e.id, type: e.type, lineNumber: e.lineNumber })),
    content: {
      dialogues: dialogues.map(d => ({
        id: d.id, character: d.character, text: d.content, emotion: d.emotion, tone: d.tone
      })),
      narrations: narrations.map(n => ({ id: n.id, text: n.content })),
      actions: actions.map(a => ({ id: a.id, text: a.content })),
      descriptions: descriptions.map(d => ({ id: d.id, text: d.content }))
    },
    prompt: promptParts.join(' | '),
    sceneType,
    isEstablishing,
    characters: dialogues.length > 0 ? [...new Set(dialogues.map(d => d.character))] : [],
    suggestedSize: _suggestPanelSize(sceneType, dialogues.length),
    layoutHints: _generateLayoutHints(sceneType, dialogues.length, narrations.length),
    defaultBubbles: _generateDefaultBubbles(dialogues, narrations)
  };
}

function _locationLabel(loc) {
  return { interior: '室内场景', exterior: '室外场景', unspecified: '' }[loc] || '';
}

function _suggestPanelSize(sceneType, dialogueCount) {
  if (sceneType === 'establishing' || sceneType === 'wideshot') return 'wide';
  if (sceneType === 'closeup') return 'square';
  if (dialogueCount >= 3) return 'tall';
  return 'standard';
}

function _generateLayoutHints(sceneType, dialogueCount, narrationCount) {
  const hints = [];
  if (narrationCount > 0) hints.push({ type: 'narration-box', position: 'top' });
  if (dialogueCount === 1) hints.push({ type: 'single-bubble', position: sceneType === 'closeup' ? 'bottom' : 'right' });
  else if (dialogueCount === 2) hints.push({ type: 'dual-bubbles', arrangement: 'opposite' });
  else if (dialogueCount > 2) hints.push({ type: 'stacked-bubbles', arrangement: 'vertical' });
  if (sceneType === 'action') hints.push({ type: 'speed-lines', intensity: 'high' });
  return hints;
}

function _generateDefaultBubbles(dialogues, narrations) {
  const bubbles = [];
  narrations.forEach((n, i) => {
    const size = calcBubbleSizeFromText(n.content, null, 'narration');
    bubbles.push({
      id: `bubble_nar_${i}_${_uid()}`,
      type: 'narration',
      text: n.content,
      defaultPosition: {
        x: 50,
        y: 8 + i * 12,
        width: size.width,
        height: size.height
      },
      style: 'box'
    });
  });
  dialogues.forEach((d, i) => {
    const pos = BUBBLE_POSITIONS[i % BUBBLE_POSITIONS.length];
    const size = calcBubbleSizeFromText(d.content, d.character, 'speech');
    const tailDirection = calcBubbleTailDirection(pos.x, pos.y, size.width, size.height);
    bubbles.push({
      id: `bubble_dia_${i}_${_uid()}`,
      type: 'speech',
      character: d.character,
      text: d.content,
      emotion: d.emotion,
      defaultPosition: {
        x: pos.x,
        y: pos.y,
        width: size.width,
        height: size.height,
        tailDirection
      },
      style: BUBBLE_STYLES[d.emotion] || 'round'
    });
  });
  return bubbles;
}

export const scriptProcessor = {
  parseScript,
  convertToPanels,
  runScriptToPanels
};

export default scriptProcessor;
