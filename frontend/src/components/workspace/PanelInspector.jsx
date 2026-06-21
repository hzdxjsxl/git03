import React, { useState } from 'react';
import { useComicStore } from '../../store/comicStore.js';
import { generateApi } from '../../services/api.js';
import './PanelInspector.css';

const SCENE_TYPES = [
  { value: 'interior', label: '室内', emoji: '🏠' },
  { value: 'exterior', label: '室外', emoji: '🌳' },
  { value: 'dialogue', label: '对话', emoji: '💬' },
  { value: 'action', label: '动作', emoji: '💥' },
  { value: 'closeup', label: '特写', emoji: '👀' },
  { value: 'wideshot', label: '远景', emoji: '🏞️' },
  { value: 'establishing', label: '空镜', emoji: '🌅' }
];

const BUBBLE_STYLES = [
  { value: 'round', label: '圆润', preview: '●' },
  { value: 'spiky', label: '爆炸', preview: '✸' },
  { value: 'soft-cloud', label: '云朵', preview: '☁' },
  { value: 'bold-square', label: '方形', preview: '■' },
  { value: 'burst', label: '爆发', preview: '✦' }
];

export default function PanelInspector({ panel, panels }) {
  const {
    updatePanel,
    updateBubble,
    selectedBubbleId,
    setSelectedBubbleId,
    addBubble,
    deleteBubble,
    setGeneratedPanel,
    setProcessing,
    setError,
    comicStyle
  } = useComicStore();

  const [regenerating, setRegenerating] = useState(false);

  if (!panel) {
    return (
      <div className="panel inspector-panel">
        <div className="panel-header">🔍 分镜检查器</div>
        <div className="panel-body">
          <div className="empty-state" style={{ padding: '32px 16px' }}>
            <div className="empty-state-icon" style={{ fontSize: 36 }}>👆</div>
            <div className="empty-state-title">选择一个分镜</div>
            <div className="empty-state-desc">
              点击左侧漫画中的任意分镜格，即可在此查看和编辑详细信息。
            </div>
          </div>

          <div className="divider" />

          <div className="summary-section">
            <div className="section-subtitle">📊 项目概况</div>
            <div className="summary-item">
              <span>分镜总数</span>
              <strong>{panels.length}</strong>
            </div>
            <div className="summary-item">
              <span>角色对话</span>
              <strong>{panels.reduce((acc, p) => acc + (p.defaultBubbles?.filter(b => b.type === 'speech').length || 0), 0)}</strong>
            </div>
            <div className="summary-item">
              <span>旁白框</span>
              <strong>{panels.reduce((acc, p) => acc + (p.defaultBubbles?.filter(b => b.type === 'narration').length || 0), 0)}</strong>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const generated = useComicStore((s) => s.generatedPanels[panel.id]);
  const selectedBubble = panel.defaultBubbles?.find((b) => b.id === selectedBubbleId);

  const handleRegenerate = async () => {
    setRegenerating(true);
    setProcessing(true);
    try {
      const result = await generateApi.generatePanel({
        prompt: panel.prompt,
        sceneType: panel.sceneType,
        style: comicStyle,
        size: panel.suggestedSize || 'standard'
      });
      setGeneratedPanel(panel.id, result.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setRegenerating(false);
      setProcessing(false);
    }
  };

  return (
    <div className="panel inspector-panel">
      <div className="panel-header">
        <span>🔍 分镜 #{panel.index + 1}</span>
        <span className="badge">{panel.sceneTitle || '未命名场景'}</span>
      </div>

      <div className="panel-body" style={{ padding: 0 }}>
        <div className="inspector-section">
          <div className="section-subtitle">🎨 分镜图像</div>
          <div className="panel-preview">
            {generated ? (
              <img src={generated.imageUrl} alt="预览" />
            ) : (
              <div className="preview-placeholder">
                <div style={{ fontSize: 32, opacity: 0.4 }}>🖼️</div>
                <div>未生成</div>
              </div>
            )}
          </div>
          <button
            className="btn btn-sm w-full"
            onClick={handleRegenerate}
            disabled={regenerating}
            style={{ marginTop: 8 }}
          >
            {regenerating ? '⏳ 重新生成中...' : '🔄 重新生成图像'}
          </button>
        </div>

        <div className="inspector-section">
          <div className="section-subtitle">✏️ 画面提示词</div>
          <textarea
            className="input-control"
            value={panel.prompt || ''}
            onChange={(e) => updatePanel(panel.id, { prompt: e.target.value })}
            rows={3}
            style={{ resize: 'vertical', fontSize: 12 }}
          />
        </div>

        <div className="inspector-section">
          <div className="section-subtitle">🏷️ 场景类型</div>
          <div className="scene-type-grid">
            {SCENE_TYPES.map((st) => (
              <button
                key={st.value}
                className={`scene-type-btn ${panel.sceneType === st.value ? 'active' : ''}`}
                onClick={() => updatePanel(panel.id, { sceneType: st.value })}
                title={st.label}
              >
                <span className="st-emoji">{st.emoji}</span>
                <span className="st-label">{st.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="inspector-section">
          <div className="section-subtitle-row">
            <span>💬 气泡框 ({panel.defaultBubbles?.length || 0})</span>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => {
                const newId = addBubble(panel.id, {
                  type: 'speech',
                  character: '角色',
                  text: '新对话',
                  emotion: 'neutral'
                });
                if (newId) setSelectedBubbleId(newId);
              }}
            >
              ➕ 添加
            </button>
          </div>

          <div className="bubbles-list">
            {panel.defaultBubbles?.length === 0 && (
              <div className="empty-list-hint">暂无气泡，点击「添加」新建</div>
            )}
            {panel.defaultBubbles?.map((bubble) => (
              <div
                key={bubble.id}
                className={`bubble-list-item ${selectedBubbleId === bubble.id ? 'active' : ''}`}
                onClick={() => setSelectedBubbleId(bubble.id)}
              >
                <div className="bli-left">
                  <span className={`bli-type bli-type-${bubble.type}`}>
                    {bubble.type === 'narration' ? '旁白' : bubble.emotion || '对话'}
                  </span>
                  <span className="bli-text">
                    <strong>{bubble.character ? `${bubble.character}:` : ''}</strong>
                    {(bubble.text || '').substring(0, 25)}
                    {(bubble.text || '').length > 25 ? '...' : ''}
                  </span>
                </div>
                <button
                  className="bli-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('删除此气泡？')) deleteBubble(panel.id, bubble.id);
                  }}
                  title="删除"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {selectedBubble && (
          <div className="inspector-section bubble-editor">
            <div className="section-subtitle">✏️ 编辑气泡</div>
            
            <div className="field-group">
              <label>角色名</label>
              <input
                className="input-control"
                value={selectedBubble.character || ''}
                onChange={(e) => updateBubble(panel.id, selectedBubble.id, { character: e.target.value })}
                placeholder="留空则不显示"
              />
            </div>

            <div className="field-group">
              <label>文本内容</label>
              <textarea
                className="input-control"
                value={selectedBubble.text || ''}
                onChange={(e) => updateBubble(panel.id, selectedBubble.id, { text: e.target.value })}
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="field-group">
              <label>气泡样式</label>
              <div className="style-picker">
                {BUBBLE_STYLES.map((s) => (
                  <button
                    key={s.value}
                    className={`style-btn ${(selectedBubble.style || 'round') === s.value ? 'active' : ''}`}
                    onClick={() => updateBubble(panel.id, selectedBubble.id, { style: s.value })}
                    title={s.label}
                  >
                    <span className="style-preview">{s.preview}</span>
                    <span className="style-label">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="field-group">
              <label>情绪</label>
              <select
                className="select-control"
                value={selectedBubble.emotion || 'neutral'}
                onChange={(e) => updateBubble(panel.id, selectedBubble.id, { emotion: e.target.value })}
              >
                <option value="neutral">😐 中性</option>
                <option value="happy">😊 开心</option>
                <option value="sad">😢 悲伤</option>
                <option value="angry">😠 愤怒</option>
                <option value="surprised">😲 惊讶</option>
                <option value="fear">😨 恐惧</option>
                <option value="love">😍 喜爱</option>
                <option value="determined">💪 坚定</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
