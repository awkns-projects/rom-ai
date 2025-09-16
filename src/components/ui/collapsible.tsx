'use client';

import React, { useState, createContext, useContext } from 'react';

interface CollapsibleContextType {
  isOpen: boolean;
  toggle: () => void;
}

const CollapsibleContext = createContext<CollapsibleContextType | undefined>(undefined);

interface CollapsibleProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function Collapsible({ children, defaultOpen = false }: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  const toggle = () => setIsOpen(!isOpen);
  
  return (
    <CollapsibleContext.Provider value={{ isOpen, toggle }}>
      <div>{children}</div>
    </CollapsibleContext.Provider>
  );
}

interface CollapsibleTriggerProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function CollapsibleTrigger({ children, className, onClick }: CollapsibleTriggerProps) {
  const context = useContext(CollapsibleContext);
  
  if (!context) {
    throw new Error('CollapsibleTrigger must be used within Collapsible');
  }
  
  const handleClick = () => {
    context.toggle();
    onClick?.();
  };
  
  return (
    <button className={className} onClick={handleClick}>
      {children}
    </button>
  );
}

interface CollapsibleContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CollapsibleContent({ children, className }: CollapsibleContentProps) {
  const context = useContext(CollapsibleContext);
  
  if (!context) {
    throw new Error('CollapsibleContent must be used within Collapsible');
  }
  
  if (!context.isOpen) {
    return null;
  }
  
  return (
    <div className={className}>
      {children}
    </div>
  );
} 