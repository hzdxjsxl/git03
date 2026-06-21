import React, { useState } from 'react';
import { ScrollBehavior, UserProfile } from '../types';

interface HeaderProps {
  scrollBehavior: ScrollBehavior;
  userProfile: UserProfile | null;
  onResetProfile: () => void;
  onRerank: () => void;
  isReranked: boolean;
  totalCount: number;
  loadedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  scrollBehavior,
  userProfile,
  onResetProfile,
  onRerank,
  isReranked,
  totalCount,
  loadedCount,
}) => {
  const [showStats, setShowStats] = useState(false);

  const speedIndicator =
    scrollBehavior.avgSpeed < 50
      ? { label: '慢速浏览', color: '#4caf50' }
      : scrollBehavior.avgSpeed < 150
      ? { label: '中速浏览', color: '#ff9800' }
      : { label: '快速浏览', color: '#f44336' };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo-section">
          <h1 className="app-title">🎯 智能推荐</h1>
          <p className="app-subtitle">
            基于实时行为画像的个性化推荐
            {totalCount > 0 && (
              <span style={{ marginLeft: 8, opacity: 0.7, fontSize: 12 }}>
                {loadedCount}/{totalCount}
              </span>
            )}
          </p>
        </div>

        <div className="header-actions">
          <button
            className={`rerank-button ${isReranked ? 'active' : ''}`}
            onClick={onRerank}
          >
            {isReranked ? '🔄 已重排' : '🎯 智能重排'}
          </button>

          <button
            className="stats-toggle"
            onClick={() => setShowStats(!showStats)}
          >
            📊
          </button>

          <button className="reset-button" onClick={onResetProfile}>
            ↺ 重置
          </button>
        </div>
      </div>

      {showStats && (
        <div className="stats-panel">
          <div className="stat-item">
            <span className="stat-label">滑动状态</span>
            <span
              className="stat-value"
              style={{ color: speedIndicator.color }}
            >
              {speedIndicator.label}
            </span>
          </div>

          <div className="stat-item">
            <span className="stat-label">平均速度</span>
            <span className="stat-value">
              {scrollBehavior.avgSpeed.toFixed(0)} px/s
            </span>
          </div>

          <div className="stat-item">
            <span className="stat-label">滑动方向</span>
            <span className="stat-value">
              {scrollBehavior.direction === 'down'
                ? '⬇️ 向下'
                : scrollBehavior.direction === 'up'
                ? '⬆️ 向上'
                : '⏸️ 静止'}
            </span>
          </div>

          <div className="stat-item">
            <span className="stat-label">已加载</span>
            <span className="stat-value">
              {loadedCount} / {totalCount}
            </span>
          </div>

          {userProfile && (
            <>
              <div className="stat-item">
                <span className="stat-label">用户ID</span>
                <span className="stat-value mono">{userProfile.userId.slice(-8)}</span>
              </div>

              <div className="stat-item">
                <span className="stat-label">行为次数</span>
                <span className="stat-value">{userProfile.behaviorCount}</span>
              </div>

              <div className="stat-item full-width">
                <span className="stat-label">偏好品类</span>
                <div className="preferred-categories">
                  {userProfile.preferredCategories.length > 0 ? (
                    userProfile.preferredCategories.map((cat) => (
                      <span key={cat} className="category-tag">
                        {cat}
                      </span>
                    ))
                  ) : (
                    <span className="no-data">暂无偏好，开始浏览吧</span>
                  )}
                </div>
              </div>

              <div className="stat-item full-width">
                <span className="stat-label">兴趣分布</span>
                <div className="interest-bars">
                  {Object.entries(userProfile.interests)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([key, value]) => {
                      const max = Math.max(...Object.values(userProfile.interests), 1);
                      const percent = (value / max) * 100;
                      return (
                        <div key={key} className="interest-item">
                          <span className="interest-label">{key}</span>
                          <div className="interest-bar">
                            <div
                              className="interest-fill"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
};
