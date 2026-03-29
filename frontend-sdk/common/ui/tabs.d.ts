/**
 * Tabs Component - Pill-style tabs for consistent navigation
 *
 * Based on Rubix UX guidelines for tabs
 * See: docs/system/v1/ux/TABS.md
 */
import * as React from 'react';
export interface Tab {
    value: string;
    label: string;
    icon?: React.ComponentType<{
        className?: string;
    }>;
    count?: number;
}
export interface TabsProps {
    tabs: Tab[];
    value: string;
    onValueChange: (value: string) => void;
    className?: string;
}
export declare function Tabs({ tabs, value, onValueChange, className }: TabsProps): import("react/jsx-runtime").JSX.Element;
