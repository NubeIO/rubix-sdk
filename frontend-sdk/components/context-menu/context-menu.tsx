import { Lock } from 'lucide-react';
import * as React from 'react';

import { cn } from '../../common/utils/utils';

export interface RightClickMenuProps {
  open: boolean;
  x: number;
  y: number;
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

export interface RightClickMenuItemProps {
  label: React.ReactNode;
  icon?: React.ReactNode;
  onSelect?: () => void;
  className?: string;
  disabled?: boolean;
  destructive?: boolean;
  locked?: boolean;
  trailing?: React.ReactNode;
}

export interface RightClickMenuSeparatorProps {
  className?: string;
}

function getBoundedPosition(
  element: HTMLDivElement,
  x: number,
  y: number
) {
  const rect = element.getBoundingClientRect();
  const padding = 8;
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  let top = y;
  let left = x;

  if (top + rect.height > viewportHeight - padding) {
    top = Math.max(padding, y - rect.height);
    if (top < padding) {
      top = viewportHeight - rect.height - padding;
    }
  }

  if (left + rect.width > viewportWidth - padding) {
    left = Math.max(padding, x - rect.width);
    if (left < padding) {
      left = viewportWidth - rect.width - padding;
    }
  }

  return {
    top: Math.max(padding, Math.min(top, viewportHeight - rect.height - padding)),
    left: Math.max(padding, Math.min(left, viewportWidth - rect.width - padding)),
  };
}

export function RightClickMenu({
  open,
  x,
  y,
  children,
  className,
  onClose,
}: RightClickMenuProps) {
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    if (!open || !menuRef.current) return;

    const { top, left } = getBoundedPosition(menuRef.current, x, y);
    menuRef.current.style.top = `${top}px`;
    menuRef.current.style.left = `${left}px`;
  }, [open, x, y]);

  React.useEffect(() => {
    if (!open || !onClose) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Node && !menuRef.current?.contains(target)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('contextmenu', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('contextmenu', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: y,
        left: x,
        zIndex: 1000,
      }}
      role="menu"
      data-context-menu
      className={cn(
        'bg-popover text-popover-foreground min-w-[8rem] overflow-visible rounded-md border p-1 shadow-md',
        className
      )}
      onClick={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
    >
      {children}
    </div>
  );
}

export function RightClickMenuItem({
  label,
  icon,
  onSelect,
  className,
  disabled = false,
  destructive = false,
  locked = false,
  trailing,
}: RightClickMenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      className={cn(
        'relative flex w-full items-center rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none',
        disabled
          ? 'cursor-not-allowed opacity-50'
          : destructive
            ? 'text-destructive hover:bg-destructive hover:text-destructive-foreground cursor-pointer'
            : 'hover:bg-accent hover:text-accent-foreground cursor-pointer',
        className
      )}
      onClick={() => {
        if (!disabled) {
          onSelect?.();
        }
      }}
    >
      {icon ? (
        <span className="mr-2 flex h-4 w-4 shrink-0 items-center justify-center">
          {icon}
        </span>
      ) : null}
      <span className="flex-1 text-left">{label}</span>
      {trailing ? (
        <span className="ml-2 flex h-4 w-4 shrink-0 items-center justify-center">
          {trailing}
        </span>
      ) : null}
      {locked ? (
        <Lock className="ml-2 h-4 w-4 shrink-0 opacity-70" aria-hidden="true" />
      ) : null}
    </button>
  );
}

export function RightClickMenuSeparator({
  className,
}: RightClickMenuSeparatorProps) {
  return <div className={cn('bg-border my-1 h-px', className)} role="separator" />;
}
