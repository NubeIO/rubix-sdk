import React from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { cn } from '../../common/utils';
import { MarkdownToolbar } from './toolbar';

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

export function MarkdownEditor({
  value = '',
  onChange,
  placeholder = 'Write something...',
  className,
  editorClassName,
  toolbarClassName,
  minHeight = '200px',
  maxHeight,
  readOnly = false,
  showToolbar = true,
  autoFocus = false,
}: MarkdownEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline cursor-pointer',
        },
      }),
    ],
    content: value,
    editable: !readOnly,
    autofocus: autoFocus,
    onUpdate: ({ editor }) => {
      const markdown = editor.getText();
      onChange?.(markdown);
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none focus:outline-none',
          'min-h-[var(--editor-min-height)]',
          maxHeight && 'max-h-[var(--editor-max-height)] overflow-y-auto',
          editorClassName
        ),
      },
    },
  });

  React.useEffect(() => {
    if (editor && value !== editor.getText()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div
      className={cn('border rounded-md bg-background', className)}
      style={
        {
          '--editor-min-height': minHeight,
          '--editor-max-height': maxHeight,
        } as React.CSSProperties
      }
    >
      {showToolbar && !readOnly && (
        <MarkdownToolbar editor={editor} className={toolbarClassName} />
      )}
      <div className={cn('px-4 py-3', showToolbar && 'pt-0')}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

export { type Editor };
