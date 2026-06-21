import React from 'react';

interface LoadingSpinnerProps {
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text = '加载中...',
}) => {
  return (
    <div className="loading-container">
      <div className="spinner">
        <div className="spinner-ring" />
        <div className="spinner-ring" />
        <div className="spinner-ring" />
      </div>
      <p className="loading-text">{text}</p>
    </div>
  );
};

export const LoadMoreIndicator: React.FC<{ visible: boolean }> = ({ visible }) => {
  if (!visible) return null;
  return (
    <div className="load-more-container">
      <div className="mini-spinner" />
      <span className="load-more-text">加载更多推荐...</span>
    </div>
  );
};

export const EndOfFeed: React.FC = () => {
  return (
    <div className="end-of-feed">
      <span className="end-icon">🎉</span>
      <p className="end-text">已经到底啦，稍后会有更多推荐</p>
    </div>
  );
};
