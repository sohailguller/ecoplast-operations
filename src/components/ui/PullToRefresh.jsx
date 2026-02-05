import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

export default function PullToRefresh({ onRefresh, children }) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const controls = useAnimation();
  const containerRef = useRef(null);

  const threshold = 80;

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (startY === 0 || refreshing) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startY;

    if (distance > 0 && window.scrollY === 0) {
      setPulling(true);
      setPullDistance(Math.min(distance * 0.5, threshold * 1.5));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold && !refreshing) {
      setRefreshing(true);
      controls.start({ y: threshold });
      
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        controls.start({ y: 0 });
      }
    } else {
      controls.start({ y: 0 });
    }
    
    setPulling(false);
    setStartY(0);
    setPullDistance(0);
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      <motion.div
        animate={controls}
        className="absolute top-0 left-0 right-0 flex justify-center"
        style={{ y: pulling ? pullDistance : 0 }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg">
          <RefreshCw
            className={`w-5 h-5 text-emerald-600 dark:text-emerald-400 ${
              refreshing ? 'animate-spin' : ''
            }`}
            style={{
              transform: `rotate(${pullDistance * 2}deg)`,
            }}
          />
        </div>
      </motion.div>
      {children}
    </div>
  );
}