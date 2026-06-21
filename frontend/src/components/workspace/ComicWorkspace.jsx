import React, { useMemo } from 'react';
import { useComicStore } from '../../store/comicStore.js';
import { calcGridLayout } from '../../utils/layoutCalculator.js';
import ComicPage from './ComicPage.jsx';
import PanelInspector from './PanelInspector.jsx';
import './ComicWorkspace.css';

export default function ComicWorkspace() {
  const {
    panels,
    gridMode,
    selectedPanelId,
    setSelectedPanelId,
    setActiveTab,
    addPanel,
    deletePanel,
    reorderPanels
  } = useComicStore();

  const pages = useMemo(() => {
    return calcGridLayout(panels.length, 1100, 1400, gridMode, 14, 28);
  }, [panels.length, gridMode]);

  const selectedPanel = panels.find(p => p.id === selectedPanelId);

  if (panels.length === 0) {
    return (
      <div className="workspace-empty">
        <div className="empty-state">
          <div className="empty-state-icon">🎬</div>
          <div className="empty-state-title">还没有分镜内容</div>
          <div className="empty-state-desc">
            请先在「剧本编辑器」中输入剧本并点击「一键生成漫画」，
            <br />或点击下方按钮手动创建分镜。
          </div>
          <div className="empty-actions">
            <button className="btn btn-primary btn-lg" onClick={() => setActiveTab('editor')}>
              📝 前往剧本编辑器
            </button>
            <button className="btn btn-lg" onClick={() => addPanel()}>
              ➕ 手动添加分镜
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-container">
      <div className="workspace-toolbar">
        <div className="toolbar-left">
          <h2 className="section-title">🎬 漫画工作台</h2>
          <span className="badge">{pages.length} 页</span>
          <span className="badge badge-accent">{panels.length} 格分镜</span>
        </div>
        <div className="workspace-actions">
          <button className="btn btn-sm" onClick={() => addPanel()}>➕ 添加分镜</button>
        </div>
      </div>

      <div className="workspace-body">
        <div className="workspace-canvas-area">
          <div className="pages-scroll">
            {pages.map((page) => (
              <ComicPage
                key={page.index}
                page={page}
                panels={panels}
                onSelectPanel={setSelectedPanelId}
                selectedPanelId={selectedPanelId}
                onDeletePanel={deletePanel}
                onReorderPanels={reorderPanels}
              />
            ))}
          </div>
        </div>

        <aside className="workspace-inspector">
          <PanelInspector
            panel={selectedPanel}
            panels={panels}
          />
        </aside>
      </div>
    </div>
  );
}
