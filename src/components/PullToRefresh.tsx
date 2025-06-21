import React, { useState, useRef, useCallback } from 'react';
import './PullToRefresh.css';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const threshold = 80;
  const maxPull = 120;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      setTouchStart(e.touches[0].clientY);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart || isRefreshing) return;

    const touchY = e.touches[0].clientY;
    const distance = touchY - touchStart;

    if (distance > 0 && containerRef.current?.scrollTop === 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance, maxPull));
    }
  }, [touchStart, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > threshold && !isRefreshing) {
      setIsRefreshing(true);
      
      // Haptic feedback on supported devices
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
    setTouchStart(0);
  }, [pullDistance, isRefreshing, onRefresh]);

  const pullPercentage = Math.min((pullDistance / threshold) * 100, 100);
  const rotation = pullPercentage * 3.6; // 360 degrees at 100%

  return (
    <div
      ref={containerRef}
      className="pull-to-refresh-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className={`pull-to-refresh-indicator ${isRefreshing ? 'refreshing' : ''}`}
        style={{
          transform: `translateY(${pullDistance}px)`,
          opacity: pullDistance > 0 ? 1 : 0,
        }}
      >
        <div
          className="refresh-spinner"
          style={{
            transform: `rotate(${rotation}deg)`,
          }}
        >
          {isRefreshing ? '↻' : '↓'}
        </div>
        <div className="refresh-text">
          {isRefreshing
            ? 'Refreshing...'
            : pullDistance > threshold
            ? 'Release to refresh'
            : 'Pull to refresh'}
        </div>
      </div>
      <div
        className="pull-to-refresh-content"
        style={{
          transform: `translateY(${pullDistance}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;