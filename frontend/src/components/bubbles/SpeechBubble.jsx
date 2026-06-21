import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { estimateTextSize, getBubblePath, constrainToBounds, calcBubbleTailDirection } from '../../utils/layoutCalculator.js';
import './SpeechBubble.css';

const BUBBLE_EMOTION_COLORS = {
  happy: { fill: '#FEF3C7', stroke: '#F59E0B' },
  sad: { fill: '#DBEAFE', stroke: '#3B82F6' },
  angry: { fill: '#FEE2E2', stroke: '#EF4444' },
  surprised: { fill: '#E0E7FF', stroke: '#6366F1' },
  fear: { fill: '#E5E7EB', stroke: '#6B7280' },
  love: { fill: '#FCE7F3', stroke: '#EC4899' },
  determined: { fill: '#D1FAE5', stroke: '#10B981' },
  neutral: { fill: '#FFFFFF', stroke: '#1F2937' }
};

export default function SpeechBubble({
  bubble,
  panelId,
  isSelected,
  onSelect,
  onChange
}) {
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(bubble.text || '');
  const dragStartRef = useRef(null);
  const resizeStartRef = useRef(null);

  const position = bubble.calculatedPosition || bubble.defaultPosition || {
    x: 50, y: 50, width: 30, height: 15, tailDirection: 'left'
  };

  const emotion = bubble.emotion || 'neutral';
  const colors = BUBBLE_EMOTION_COLORS[emotion] || BUBBLE_EMOTION_COLORS.neutral;

  const textSize = useMemo(() => {
    return estimateTextSize(bubble.text || bubble.character || '');
  }, [bubble.text, bubble.character]);

  const fontSize = Math.max(10, Math.min(16, Math.floor(position.width * 0.5)));

  const bubbleStyle = {
    left: `${position.x}%`,
    top: `${position.y}%`,
    width: `${position.width}%`,
    height: `${position.height}%`
  };

  const [{ isDnDDragging }, drag, dragPreview] = useDrag(
    () => ({
      type: 'BUBBLE',
      item: { id: bubble.id, panelId, type: 'bubble' },
      canDrag: isSelected,
      collect: (monitor) => ({
        isDnDDragging: monitor.isDragging()
      })
    }),
    [bubble.id, panelId, isSelected]
  );

  const [, drop] = useDrop(() => ({
    accept: 'BUBBLE',
    hover: () => {}
  }));

  useEffect(() => {
    if (isSelected) {
      drag(drop(containerRef));
    } else {
      drop(containerRef);
    }
  }, [isSelected, drag, drop]);

  const handleMouseDown = (e) => {
    if (!isSelected || e.button !== 0) return;
    if (e.target.closest('.bubble-resize-handle')) return;
    if (e.target.closest('.bubble-text-content')) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = containerRef.current.getBoundingClientRect();
    const parentRect = containerRef.current.parentElement.getBoundingClientRect();
    
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startLeft: position.x,
      startTop: position.y,
      parentW: parentRect.width,
      parentH: parentRect.height,
      rectW: rect.width,
      rectH: rect.height
    };
    
    setIsDragging(true);
    
    const handleMove = (moveE) => {
      if (!dragStartRef.current) return;
      const dx = (moveE.clientX - dragStartRef.current.startX) / dragStartRef.current.parentW * 100;
      const dy = (moveE.clientY - dragStartRef.current.startY) / dragStartRef.current.parentH * 100;
      
      let newX = dragStartRef.current.startLeft + dx;
      let newY = dragStartRef.current.startTop + dy;
      
      newX = constrainToBounds(newX, 1, 99 - position.width);
      newY = constrainToBounds(newY, 1, 99 - position.height);
      
      const tailDir = calcBubbleTailDirection(newX, newY, position.width, position.height);
      
      onChange({
        defaultPosition: {
          ...position,
          x: Math.round(newX * 10) / 10,
          y: Math.round(newY * 10) / 10,
          tailDirection: tailDir
        }
      });
    };
    
    const handleUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
    
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  const handleResizeMouseDown = (e) => {
    if (!isSelected) return;
    e.preventDefault();
    e.stopPropagation();
    
    resizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: position.width,
      startH: position.height,
      parentW: e.currentTarget.parentElement.parentElement.getBoundingClientRect().width,
      parentH: e.currentTarget.parentElement.parentElement.getBoundingClientRect().height
    };
    
    setIsResizing(true);
    
    const handleMove = (moveE) => {
      if (!resizeStartRef.current) return;
      const dx = (moveE.clientX - resizeStartRef.current.startX) / resizeStartRef.current.parentW * 100;
      const dy = (moveE.clientY - resizeStartRef.current.startY) / resizeStartRef.current.parentH * 100;
      
      let newW = constrainToBounds(resizeStartRef.current.startW + dx, 10, 95 - position.x);
      let newH = constrainToBounds(resizeStartRef.current.startH + dy, 5, 95 - position.y);
      
      onChange({
        defaultPosition: {
          ...position,
          width: Math.round(newW * 10) / 10,
          height: Math.round(newH * 10) / 10
        }
      });
    };
    
    const handleUp = () => {
      setIsResizing(false);
      resizeStartRef.current = null;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
    
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  const handleDoubleClick = (e) => {
    if (!isSelected) return;
    e.stopPropagation();
    setIsEditing(true);
    setEditText(bubble.text || '');
  };

  const commitEdit = () => {
    onChange({ text: editText });
    setIsEditing(false);
  };

  useEffect(() => {
    const handleClick = () => {
      if (isEditing) commitEdit();
    };
    if (isEditing) {
      setTimeout(() => {
        document.addEventListener('click', handleClick, { once: true });
      }, 100);
    }
    return () => document.removeEventListener('click', handleClick);
  }, [isEditing]);

  const viewboxW = 100;
  const viewboxH = 100;
  const path = getBubblePath(
    4, 4,
    viewboxW - 8, viewboxH - 8,
    bubble.style || 'round',
    position.tailDirection,
    0.4,
    0.12
  );

  const displayChar = bubble.character ? `${bubble.character}：` : '';
  const displayText = bubble.text || '';

  return (
    <div
      ref={containerRef}
      className={`speech-bubble ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} bubble-type-${bubble.type || 'speech'}`}
      style={bubbleStyle}
      onMouseDown={(e) => { onSelect(); handleMouseDown(e); }}
      onDoubleClick={handleDoubleClick}
    >
      <svg
        className="bubble-svg"
        viewBox={`0 0 ${viewboxW} ${viewboxH}`}
        preserveAspectRatio="none"
      >
        <path
          d={path}
          fill={bubble.type === 'narration' ? '#1F2937' : colors.fill}
          stroke={bubble.type === 'narration' ? '#374151' : colors.stroke}
          strokeWidth={bubble.style === 'spiky' ? 2.5 : 1.8}
          opacity={0.97}
        />
        {isSelected && (
          <path
            d={path}
            fill="none"
            stroke="rgba(99, 102, 241, 0.5)"
            strokeWidth="0.8"
            strokeDasharray="3,2"
          />
        )}
      </svg>

      <div className="bubble-text-layer">
        {isEditing ? (
          <textarea
            className="bubble-edit-input"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                commitEdit();
              }
              if (e.key === 'Escape') {
                setIsEditing(false);
                setEditText(bubble.text || '');
              }
            }}
            autoFocus
            style={{
              color: bubble.type === 'narration' ? '#F9FAFB' : '#111827',
              fontSize: `${fontSize}px`
            }}
          />
        ) : (
          <div
            className="bubble-text-content"
            style={{
              color: bubble.type === 'narration' ? '#F9FAFB' : '#111827',
              fontSize: `${fontSize}px`,
              lineHeight: 1.35
            }}
          >
            {bubble.type !== 'narration' && displayChar && (
              <span className="bubble-character-name" style={{ color: colors.stroke }}>
                {displayChar}
              </span>
            )}
            <span>{displayText}</span>
          </div>
        )}
      </div>

      {isSelected && (
        <>
          <div className="bubble-handle bubble-handle-tl" />
          <div className="bubble-handle bubble-handle-tr" />
          <div className="bubble-handle bubble-handle-bl" />
          <div
            className="bubble-handle bubble-handle-br bubble-resize-handle"
            onMouseDown={handleResizeMouseDown}
            title="拖拽调整大小"
          />
          <div className="bubble-size-indicator">
            {Math.round(position.width)}×{Math.round(position.height)}
          </div>
        </>
      )}
    </div>
  );
}
