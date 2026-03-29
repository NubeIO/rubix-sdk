import * as React from 'react';
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
export declare function RightClickMenu({ open, x, y, children, className, onClose, }: RightClickMenuProps): import("react/jsx-runtime").JSX.Element | null;
export declare function RightClickMenuItem({ label, icon, onSelect, className, disabled, destructive, locked, trailing, }: RightClickMenuItemProps): import("react/jsx-runtime").JSX.Element;
export declare function RightClickMenuSeparator({ className, }: RightClickMenuSeparatorProps): import("react/jsx-runtime").JSX.Element;
