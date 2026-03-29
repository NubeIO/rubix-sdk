/**
 * RefreshButton Component
 * Standardized icon-only refresh button with smooth animation
 *
 * Features:
 * - Icon-only design (no text)
 * - Smooth spin animation when refreshing
 * - Consistent styling across the app
 * - Accessible with title attribute
 *
 * @example
 * <RefreshButton onRefresh={handleRefresh} isRefreshing={isLoading} />
 */
export interface RefreshButtonProps {
    /** Callback when refresh is triggered */
    onRefresh: () => void;
    /** Whether refresh is in progress */
    isRefreshing?: boolean;
    /** Additional class names */
    className?: string;
    /** Custom title for accessibility (default: "Refresh") */
    title?: string;
    /** Button size variant */
    size?: 'sm' | 'md' | 'lg';
}
export declare function RefreshButton({ onRefresh, isRefreshing, className, title, size }: RefreshButtonProps): import("react/jsx-runtime").JSX.Element;
