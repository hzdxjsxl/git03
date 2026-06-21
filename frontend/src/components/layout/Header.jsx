import React from 'react';
import { useComicStore } from '../../store/comicStore.js';
import './Header.css';

export default function Header({ onGenerate, progress, progressText }) {
  const {
    rawScript,
    panels,
    isProcessing,
    error,
    layoutStyle,
    setLayoutStyle,
    comicStyle,
    setComicStyle,
    undo,
    redo,
    clearAll
  } = useComicStore();

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="logo">
          <span className="logo-icon">🎨</span>
          <span className="logo-text">剧本转漫画</span>
          <span className="logo-sub">Storyboard Generator</span>
        </div>
      </div>

      <div className="header-center">
        {progress > 0 && (
          <div className="progress-wrap">
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="progress-label">{progressText} {progress}%</span>
          </div>
        )}
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}
      </div>

      <div className="header-right">
        <div className="header-controls">
          <label className="control-group">
            <span>排版密度</span>
            <select
              className="select-control"
              value={layoutStyle}
              onChange={e => setLayoutStyle(e.target.value)}
              disabled={isProcessing}
            >
              <option value="sparse">宽松</option>
              <option value="balanced">均衡</option>
              <option value="dense">紧凑</option>
            </select>
          </label>

          <label className="control-group">
            <span>画风</span>
            <select
              className="select-control"
              value={comicStyle}
              onChange={e => setComicStyle(e.target.value)}
              disabled={isProcessing}
            >
              <option value="manga">日式漫画</option>
              <option value="anime">动画风</option>
              <option value="sketch">素描</option>
              <option value="realistic">写实</option>
              <option value="cartoon">卡通</option>
              <option value="watercolor">水彩</option>
            </select>
          </label>

          <div className="header-divider" />

          <button
            className="btn btn-sm"
            onClick={undo}
            disabled={isProcessing}
            title="撤销"
          >
            ↶ 撤销
          </button>
          <button
            className="btn btn-sm"
            onClick={redo}
            disabled={isProcessing}
            title="重做"
          >
            ↷ 重做
          </button>
          <button
            className="btn btn-sm btn-danger"
            onClick={clearAll}
            disabled={isProcessing || panels.length === 0}
            title="清空"
          >
            🗑 清空
          </button>

          <div className="header-divider" />

          <button
            className="btn btn-primary btn-lg"
            onClick={onGenerate}
            disabled={isProcessing || !rawScript.trim()}
          >
            {isProcessing ? '⏳ 生成中...' : '✨ 一键生成漫画'}
          </button>
        </div>
      </div>
    </header>
  );
}
