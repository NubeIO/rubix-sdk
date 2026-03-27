/**
 * Reusable components for Rubix and plugins (RJSF-powered)
 */

// Right-click / context menu components
export {
  RightClickMenu,
  RightClickMenuItem,
  RightClickMenuSeparator,
} from './context-menu';
export type {
  RightClickMenuProps,
  RightClickMenuItemProps,
  RightClickMenuSeparatorProps,
} from './context-menu';

// Delete components
export { DeleteDialog } from './delete';
export type { DeleteDialogProps } from './delete';

// Settings components (RJSF-based)
export {
  MultiSettingsDialog,
  CompactFieldTemplate,
  CompactObjectFieldTemplate,
  CustomArrayFieldTemplate,
  CustomDescriptionField,
  customWidgets,
  jsonSchemaToZod,
  validateSchema,
} from './settings';
export type {
  MultiSettingsDialogProps,
  SchemaInfo,
  JSONSchema,
  JSONSchemaProperty,
} from './settings';

// Filtered table with tabs
export { FilteredTableWithTabs } from './filtered-table';
export type { FilteredTableWithTabsProps, FilteredTab } from './filtered-table';

// Markdown editor
export { MarkdownEditor, MarkdownToolbar } from './markdown-editor';
export type { MarkdownEditorProps, MarkdownToolbarProps } from './markdown-editor';
