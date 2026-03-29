import { type Editor } from '@tiptap/react';
export interface MarkdownEditorProps {
    value?: string;
    onChange?: (markdown: string) => void;
    placeholder?: string;
    className?: string;
    editorClassName?: string;
    toolbarClassName?: string;
    minHeight?: string;
    maxHeight?: string;
    readOnly?: boolean;
    showToolbar?: boolean;
    autoFocus?: boolean;
}
export declare function MarkdownEditor({ value, onChange, placeholder, className, editorClassName, toolbarClassName, minHeight, maxHeight, readOnly, showToolbar, autoFocus, }: MarkdownEditorProps): import("react/jsx-runtime").JSX.Element | null;
export { type Editor };
