import React from 'react';
import { useComicStore } from '../../store/comicStore.js';
import './Sidebar.css';

const tabs = [
  { id: 'editor', icon: '📝', label: '剧本编辑器', desc: '输入剧本' },
  { id: 'workspace', icon: '🎬', label: '漫画工作台', desc: '分镜编排' },
  { id: 'library', icon: '🖼️', label: '素材图库', desc: '模板底图' }
];

export default function Sidebar() {
  const {
    activeTab,
    setActiveTab,
    panels,
    generatedPanels,
    parsedScript,
    isProcessing
  } = useComicStore();

  const generatedCount = Object.keys(generatedPanels).length;

  return (
    <aside className="app-sidebar">
      <nav className="sidebar-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`sidebar-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <div className="tab-info">
              <span className="tab-label">{tab.label}</span>
              <span className="tab-desc">{tab.desc}</span>
            </div>
            {tab.id === 'workspace' && panels.length > 0 && (
              <span className="tab-badge">{panels.length}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-stats">
        <div className="stats-title">项目状态</div>
        
        <div className="stat-item">
          <span className="stat-label">分镜总数</span>
          <span className="stat-value">{panels.length}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">已生成图像</span>
          <span className={`stat-value ${generatedCount > 0 ? 'success' : ''}`}>
            {generatedCount}
            {panels.length > 0 && ` / ${panels.length}`}
          </span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">角色数量</span>
          <span className="stat-value">
            {parsedScript?.characters?.length || 0}
          </span>
        </div>

        <div className="stat-item">
          <span className="stat-label">状态</span>
          <span className={`stat-value ${isProcessing ? 'processing' : 'idle'}`}>
            {isProcessing ? '⚡ 处理中' : panels.length > 0 ? '✅ 就绪' : '⏸ 待输入'}
          </span>
        </div>
      </div>

      <div className="sidebar-tips">
        <div className="tips-title">💡 使用提示</div>
        <ul className="tips-list">
          <li>使用【角色名】: 对话 格式标记台词</li>
          <li>用"---"或"第X场"分隔场景</li>
          <li>用(动作描述)标注角色动作</li>
          <li>拖动气泡可调整位置大小</li>
        </ul>
      </div>
    </aside>
  );
}
