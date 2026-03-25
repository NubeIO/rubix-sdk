/**
 * Simple Tabs Component - Local implementation
 * Since plugin is isolated, we can't use host's tabs component
 */

import { ReactNode } from 'react';

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  children: ReactNode;
}

export function Tabs({ value, onValueChange, className, children }: TabsProps) {
  return <div className={className}>{children}</div>;
}

interface TabsListProps {
  className?: string;
  children: ReactNode;
}

export function TabsList({ className, children }: TabsListProps) {
  return <div className={`flex border-b ${className || ''}`}>{children}</div>;
}

interface TabsTriggerProps {
  value: string;
  className?: string;
  children: ReactNode;
}

export function TabsTrigger({ value, className, children }: TabsTriggerProps) {
  // Get context from parent Tabs component via DOM traversal (hack but works)
  const handleClick = () => {
    const event = new CustomEvent('tab-change', { detail: value });
    document.dispatchEvent(event);
  };

  return (
    <button
      onClick={handleClick}
      className={`px-4 py-3 text-sm font-medium transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 ${className || ''}`}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  className?: string;
  children: ReactNode;
}

export function TabsContent({ value, className, children }: TabsContentProps) {
  return <div className={className}>{children}</div>;
}
