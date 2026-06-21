import React, { useState, useMemo } from 'react';
import { useComicStore } from '../../store/comicStore.js';
import './LibraryPanel.css';

const SCENE_LABELS = {
  interior: '室内场景',
  exterior: '室外场景',
  dialogue: '对话场景',
  action: '动作场景',
  closeup: '特写镜头',
  wideshot: '远景镜头',
  establishing: '空镜转场'
};

const SIZE_LABELS = {
  standard: '标准 4:3',
  wide: '宽屏 12:5',
  tall: '竖屏 5:8',
  square: '方形 1:1'
};

export default function LibraryPanel() {
  const {
    libraryTemplates,
    libraryCategories,
    setActiveTab,
    panels,
    addPanel,
    updatePanel
  } = useComicStore();

  const [filterCategory, setFilterCategory] = useState('');
  const [filterSceneType, setFilterSceneType] = useState('');
  const [filterSize, setFilterSize] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const filteredTemplates = useMemo(() => {
    let result = [...libraryTemplates];

    if (filterCategory) {
      result = result.filter(t => t.category === filterCategory);
    }
    if (filterSceneType) {
      result = result.filter(t => t.sceneType === filterSceneType);
    }
    if (filterSize) {
      result = result.filter(t => t.size === filterSize);
    }
    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(kw) ||
        t.tags.some(tag => tag.toLowerCase().includes(kw))
      );
    }

    return result;
  }, [libraryTemplates, filterCategory, filterSceneType, filterSize, searchKeyword]);

  const sizeOptions = ['standard', 'wide', 'tall', 'square'];
  const sceneOptions = Object.entries(SCENE_LABELS).map(([v, l]) => ({ value: v, label: l }));

  const applyTemplateToPanel = () => {
    if (!selectedTemplate) return;
    if (panels.length === 0) {
      const newIdx = addPanel();
      setTimeout(() => {
        const store = useComicStore.getState();
        const lastPanel = store.panels[store.panels.length - 1];
        if (lastPanel) {
          updatePanel(lastPanel.id, {
            sceneType: selectedTemplate.sceneType,
            suggestedSize: selectedTemplate.size,
            prompt: selectedTemplate.name
          });
        }
      }, 50);
    } else {
      const selectedPanelId = useComicStore.getState().selectedPanelId;
      const targetId = selectedPanelId || panels[panels.length - 1].id;
      updatePanel(targetId, {
        sceneType: selectedTemplate.sceneType,
        suggestedSize: selectedTemplate.size,
        prompt: `${selectedTemplate.name} | ${selectedTemplate.category}`
      });
    }
    setActiveTab('workspace');
  };

  return (
    <div className="library-page">
      <aside className="library-sidebar">
        <div className="panel">
          <div className="panel-header">🗂️ 筛选</div>
          <div className="panel-body">
            <div className="filter-group">
              <label>🔍 关键词搜索</label>
              <input
                className="input-control"
                placeholder="输入模板名或标签..."
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>📂 类别</label>
              <div className="filter-chips">
                <button
                  className={`chip ${!filterCategory ? 'active' : ''}`}
                  onClick={() => setFilterCategory('')}
                >全部</button>
                {libraryCategories.map(cat => (
                  <button
                    key={cat.name}
                    className={`chip ${filterCategory === cat.name ? 'active' : ''}`}
                    onClick={() => setFilterCategory(cat.name)}
                  >
                    {cat.name} <span className="chip-count">{cat.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label>🎬 场景类型</label>
              <select
                className="select-control"
                value={filterSceneType}
                onChange={e => setFilterSceneType(e.target.value)}
              >
                <option value="">全部场景</option>
                {sceneOptions.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>📐 画幅尺寸</label>
              <div className="filter-chips">
                <button
                  className={`chip ${!filterSize ? 'active' : ''}`}
                  onClick={() => setFilterSize('')}
                >全部</button>
                {sizeOptions.map(s => (
                  <button
                    key={s}
                    className={`chip ${filterSize === s ? 'active' : ''}`}
                    onClick={() => setFilterSize(s)}
                  >{SIZE_LABELS[s]}</button>
                ))}
              </div>
            </div>

            <div className="stats-row">
              <span className="badge">共 {filteredTemplates.length} 个模板</span>
              <button
                className="btn btn-sm"
                onClick={() => {
                  setFilterCategory('');
                  setFilterSceneType('');
                  setFilterSize('');
                  setSearchKeyword('');
                }}
              >重置筛选</button>
            </div>
          </div>
        </div>

        {selectedTemplate && (
          <div className="panel template-detail">
            <div className="panel-header">
              <span>📋 模板详情</span>
              <button className="btn btn-sm" onClick={() => setSelectedTemplate(null)}>✕</button>
            </div>
            <div className="panel-body">
              <div className="template-preview-large">
                <img src={selectedTemplate.url} alt={selectedTemplate.name} />
              </div>
              <h3 className="template-name">{selectedTemplate.name}</h3>
              
              <div className="detail-rows">
                <div className="detail-row">
                  <span>类别</span>
                  <span className="badge">{selectedTemplate.category}</span>
                </div>
                <div className="detail-row">
                  <span>场景</span>
                  <span className="badge badge-accent">{SCENE_LABELS[selectedTemplate.sceneType]}</span>
                </div>
                <div className="detail-row">
                  <span>尺寸</span>
                  <span>{selectedTemplate.width} × {selectedTemplate.height} px</span>
                </div>
                <div className="detail-row">
                  <span>宽高比</span>
                  <span>{selectedTemplate.aspectRatio}</span>
                </div>
                <div className="detail-row">
                  <span>热度</span>
                  <span>🔥 {selectedTemplate.popularity}</span>
                </div>
                <div className="detail-row">
                  <span>使用次数</span>
                  <span>{selectedTemplate.usageCount} 次</span>
                </div>
              </div>

              <div className="tags-row">
                {selectedTemplate.tags.map(tag => (
                  <span key={tag} className="tag-chip">#{tag}</span>
                ))}
              </div>

              <div className="recommend-layout">
                <div className="recommend-title">💡 推荐气泡布局</div>
                <div className="recommend-items">
                  {selectedTemplate.recommendedLayout.map(l => (
                    <span key={l} className="recommend-chip">{l}</span>
                  ))}
                </div>
              </div>

              <button
                className="btn btn-primary w-full btn-lg"
                onClick={applyTemplateToPanel}
                style={{ marginTop: 16 }}
              >
                ✨ 应用到当前分镜
              </button>
            </div>
          </div>
        )}
      </aside>

      <div className="library-main">
        <div className="library-toolbar">
          <h2 className="section-title">🖼️ 素材图库</h2>
          <div className="toolbar-right">
            <span className="badge badge-accent">{filteredTemplates.length} 个可用模板</span>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => setActiveTab('workspace')}
              disabled={panels.length === 0}
            >
              ← 返回工作台
            </button>
          </div>
        </div>

        {filteredTemplates.length === 0 ? (
          <div className="library-empty">
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-title">没有找到匹配的模板</div>
              <div className="empty-state-desc">试试调整筛选条件或关键词</div>
            </div>
          </div>
        ) : (
          <div className="template-grid">
            {filteredTemplates.map(tpl => (
              <div
                key={tpl.id}
                className={`template-card ${selectedTemplate?.id === tpl.id ? 'selected' : ''}`}
                onClick={() => setSelectedTemplate(tpl)}
              >
                <div className="tpl-image-wrap">
                  <img src={tpl.url} alt={tpl.name} loading="lazy" />
                  <span className="tpl-size-badge">{SIZE_LABELS[tpl.size]}</span>
                  {tpl.popularity > 70 && (
                    <span className="tpl-hot-badge">🔥 热门</span>
                  )}
                </div>
                <div className="tpl-info">
                  <div className="tpl-name" title={tpl.name}>{tpl.name}</div>
                  <div className="tpl-meta">
                    <span className="tpl-category">{tpl.category}</span>
                    <span className="tpl-pop">👁 {tpl.usageCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
