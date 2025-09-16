'use client';

import React from 'react';

interface ScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function ScrollArea({ children, className, style }: ScrollAreaProps) {
  return (
    <div 
      className={`overflow-y-auto ${className || ''}`}
      style={style}
    >
      {children}
    </div>
  );
} 