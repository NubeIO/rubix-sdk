/**
 * Multi-Settings Dialog (RJSF Version)
 *
 * Generic dialog for editing settings with multiple schemas using React JSON Schema Form.
 * Features:
 * - Card-based schema selection (like frontend node settings)
 * - RJSF-powered form rendering with custom shadcn widgets
 * - Compact side-by-side layout with info popovers
 * - Full JSON Schema validation
 * - Works in both host and plugins (mount/unmount pattern)
 *
 * @example
 * ```tsx
 * <MultiSettingsDialog
 *   open={true}
 *   onOpenChange={setOpen}
 *   title="Create Product"
 *   schemas={[
 *     { name: 'hardware', displayName: 'Hardware Product', description: '...', schema: {...}, isDefault: true },
 *     { name: 'software', displayName: 'Software Product', description: '...', schema: {...} }
 *   ]}
 *   currentSettings={{}}
 *   onSubmit={handleSubmit}
 * />
 * ```
 */
export interface SchemaInfo {
    /** Schema identifier (e.g., 'hardware', 'software') */
    name: string;
    /** Display name shown in UI */
    displayName: string;
    /** Description of this schema */
    description?: string;
    /** Whether this is the default schema */
    isDefault?: boolean;
    /** The JSON Schema definition */
    schema: any;
}
export interface MultiSettingsDialogProps {
    /** Controls dialog visibility */
    open: boolean;
    /** Callback when dialog visibility changes */
    onOpenChange: (open: boolean) => void;
    /** Dialog title */
    title: string;
    /** Optional description */
    description?: string;
    /** Available schemas to choose from */
    schemas: SchemaInfo[];
    /** Default schema to select (if not in currentSettings) */
    defaultSchema?: string;
    /** Current settings values */
    currentSettings?: Record<string, any>;
    /** Callback when form is submitted */
    onSubmit: (settings: Record<string, any>, schemaName: string) => Promise<void>;
    /** Optional cancel callback */
    onCancel?: () => void;
    /** Loading state */
    isSubmitting?: boolean;
}
export declare function MultiSettingsDialog({ open, onOpenChange, title, description, schemas, defaultSchema, currentSettings, onSubmit, onCancel, isSubmitting, }: MultiSettingsDialogProps): import("react/jsx-runtime").JSX.Element;
