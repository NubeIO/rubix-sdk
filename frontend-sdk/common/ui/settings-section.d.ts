import { type LucideIcon } from 'lucide-react';
import * as React from 'react';
interface SettingsSectionProps {
    id: string;
    title: string;
    description: string;
    icon: LucideIcon;
    iconBgColor?: string;
    iconTextColor?: string;
    isExpanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    badgeCount?: number;
    onRefresh?: () => void;
    isRefreshing?: boolean;
}
export declare function SettingsSection({ id, title, description, icon: Icon, iconBgColor, iconTextColor, isExpanded, onToggle, children, badgeCount, onRefresh, isRefreshing }: SettingsSectionProps): import("react/jsx-runtime").JSX.Element;
export {};
