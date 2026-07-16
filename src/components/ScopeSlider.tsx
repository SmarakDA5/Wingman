import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { ScopeLevel } from '../types';

interface ScopeSliderProps {
  value: ScopeLevel;
  onChange: (value: ScopeLevel) => void;
}

const scopeOptions: { value: ScopeLevel; label: string }[] = [
  { value: 'specific', label: 'Specific' },
  { value: 'broad', label: 'Broad' },
  { value: 'broader', label: 'Broader' },
  { value: 'explore', label: 'Unrestricted' },
];

export const ScopeSlider = ({ value, onChange }: ScopeSliderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  
  const currentIndex = scopeOptions.findIndex((opt) => opt.value === value);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  const handleMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging || !sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    
    let newIndex = 0;
    if (percentage > 0.875) newIndex = 3;
    else if (percentage > 0.625) newIndex = 2;
    else if (percentage > 0.375) newIndex = 1;
    else newIndex = 0;
    
    if (newIndex !== currentIndex) {
      onChange(scopeOptions[newIndex].value);
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, currentIndex]);

  const percentage = ((currentIndex) / (scopeOptions.length - 1)) * 100;

  return (
    <div className="w-full px-4 py-3">
      {/* Mode indicator above the slider - positioned top right */}
      <div className="flex justify-end items-center mb-2 px-1">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-200/50 dark:border-gray-700/50">
          {scopeOptions[currentIndex].label}
        </span>
      </div>
      
      <div 
        ref={sliderRef}
        className="relative h-8 w-full select-none touch-none flex items-center"
        onMouseDown={handleStart}
        onTouchStart={handleStart}
      >
        {/* Left Icon - Target */}
        <div className="absolute left-0 text-gray-400 dark:text-gray-500 z-10">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>

        {/* Track - Thinner and minimalist */}
        <div className="w-full h-0.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mx-6">
          {/* Active Fill */}
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
            initial={false}
            animate={{ width: `${percentage}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>

        {/* Right Icon - Globe/Explore */}
        <div className="absolute right-0 text-gray-400 dark:text-gray-500 z-10">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Draggable Knob - Smaller and cleaner */}
        <motion.div
          className="absolute w-4 h-4 rounded-full shadow-lg cursor-grab active:cursor-grabbing z-20"
          style={{ left: `calc(${percentage}% - 8px)` }}
          animate={{ scale: isDragging ? 1.15 : 1 }}
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <div className="w-full h-full rounded-full bg-white dark:bg-gray-100 shadow-md border border-gray-200 dark:border-gray-300" />
        </motion.div>
      </div>
      
      {/* Indicator Dots with labels */}
      <div className="flex justify-between mt-2 px-1">
        {scopeOptions.map((opt, i) => (
          <div key={opt.value} className="flex flex-col items-center">
            <motion.div 
              className={`w-1.5 h-1.5 rounded-full ${
                currentIndex === i 
                  ? 'bg-blue-500' 
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
              animate={{ 
                scale: currentIndex === i ? 1.3 : 1,
                opacity: currentIndex === i ? 1 : 0.5
              }}
            />
            {i > 0 && i < 3 && (
              <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                {opt.label}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
