import React from 'react';
import { useComicStore } from '../../store/comicStore.js';
import SpeechBubble from '../bubbles/SpeechBubble.jsx';
import { calcBestBubblePositions } from '../../utils/layoutCalculator.js';

const SCENE_TYPE_LABELS = {
  interior: '室内',
  exterior: '室外',
  dialogue: '对话',
  action: '动作',
  closeup: '特写',
  wideshot: '远景',
  establishing: '空镜'
};

export default function ComicPanel({ panel, panelIndex, onDelete }) {
  const generated = useComicStore((s) => s.generatedPanels[panel.id]);
  const selectedPanelId = useComicStore((s) => s.selectedPanelId);
  const selectedBubbleId = useComicStore((s) => s.selectedBubbleId);
  const updateBubble = useComicStore((s) => s.updateBubble);
  const setSelectedBubbleId = useComicStore((s) => s.setSelectedBubbleId);

  const isSelected = selectedPanelId === panel.id;
  const bubbles = calcBestBubblePositions(
    panel.defaultBubbles || [],
    100,
    100
  );

  return (
    <div className="panel-frame">
      <div className="panel-index-badge">#{panelIndex + 1}</div>
      {panel.sceneType && (
        <div className="panel-type-badge">{SCENE_TYPE_LABELS[panel.sceneType] || panel.sceneType}</div>
      )}

      <div className="panel-actions">
        <button
          className="btn btn-sm btn-danger"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('确定删除此分镜？')) onDelete();
          }}
          title="删除分镜"
        >
          ✕
        </button>
      </div>

      <div className="panel-image-wrap">
        {generated ? (
          <img
            src={generated.imageUrl || generated.url}
            alt={panel.prompt || '分镜图像'}
            draggable={false}
          />
        ) : (
          <div className="panel-loading">
            <div className="panel-loading-spinner" />
            <div className="panel-loading-text">等待生成...</div>
            <div style={{ fontSize: 10, opacity: 0.6, maxWidth: '85%', textAlign: 'center', padding: '0 10px' }}>
              {(panel.prompt || '未命名分镜').substring(0, 50)}
            </div>
          </div>
        )}

        {isSelected && bubbles.length > 0 && (
          <div className="panel-bubbles-layer" onClick={(e) => e.stopPropagation()}>
            {bubbles.map((bubble) => (
              <SpeechBubble
                key={bubble.id}
                bubble={bubble}
                panelId={panel.id}
                isSelected={selectedBubbleId === bubble.id}
                onSelect={() => setSelectedBubbleId(bubble.id)}
                onChange={(updates) => updateBubble(panel.id, bubble.id, updates)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
