/**
 * Custom RJSF Theme for shadcn/ui
 * Provides custom widgets and templates for react-jsonschema-form
 * Adapted from Rubix frontend for use in SDK/plugins
 */
import type { ArrayFieldTemplateProps, DescriptionFieldProps, FieldTemplateProps, ObjectFieldTemplateProps, RegistryWidgetsType } from '@rjsf/utils';
export declare function CustomDescriptionField(props: DescriptionFieldProps): import("react/jsx-runtime").JSX.Element | null;
export declare function CustomFieldTemplate(props: FieldTemplateProps): import("react/jsx-runtime").JSX.Element;
export declare function CompactFieldTemplate(props: FieldTemplateProps): import("react/jsx-runtime").JSX.Element;
export declare function CompactObjectFieldTemplate(props: ObjectFieldTemplateProps): import("react/jsx-runtime").JSX.Element;
export declare function CustomArrayFieldTemplate(props: ArrayFieldTemplateProps): import("react/jsx-runtime").JSX.Element;
export declare const customWidgets: RegistryWidgetsType;
