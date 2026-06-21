import React from 'react';
import ComicPanel from './ComicPanel.jsx';

export default function ComicPage({
  page,
  panels,
  onSelectPanel,
  selectedPanelId,
  onDeletePanel,
  onReorderPanels
}) {
  const pageStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  };

  return (
    <div className="page-container">
      <div className="page-label">第 {page.index + 1} 页</div>
      <div className="comic-page">
        <div className="comic-page-inner">
          <div style={pageStyle}>
            {page.panels.map((pos) => {
              const panel = panels[pos.panelIndex];
              if (!panel) return null;
              
              const style = {
                left: `${(pos.gridX / 1052) * 100}%`,
                top: `${(pos.gridY / 1344) * 100}%`,
                width: `${(pos.gridWidth / 1052) * 100}%`,
                height: `${(pos.gridHeight / 1344) * 100}%`
              };

              return (
                <div
                  key={pos.panelIndex}
                  className={`panel-wrapper ${selectedPanelId === panel.id ? 'selected' : ''}`}
                  style={style}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPanel(panel.id);
                  }}
                >
                  <ComicPanel
                    panel={panel}
                    panelIndex={pos.panelIndex}
                    onDelete={() => onDeletePanel(panel.id)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
