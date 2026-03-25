import React from 'react';
import type { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
} from 'lucide-react';
import { cn } from '../../common/utils';
import { Button } from '../../common/ui/button';

export interface MarkdownToolbarProps {
  editor: Editor;
  className?: string;
}

export function MarkdownToolbar({ editor, className }: MarkdownToolbarProps) {
  const buttonClass = 'h-8 w-8 p-0';

  const setLink = React.useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30',
        className
      )}
    >
      {/* Text formatting */}
      <Button
        variant={editor.isActive('bold') ? 'default' : 'ghost'}
        size="sm"
        className={buttonClass}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold (Cmd+B)"
        type="button"
      >
        <Bold className="h-4 w-4" />
      </Button>

      <Button
        variant={editor.isActive('italic') ? 'default' : 'ghost'}
        size="sm"
        className={buttonClass}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic (Cmd+I)"
        type="button"
      >
        <Italic className="h-4 w-4" />
      </Button>

      <Button
        variant={editor.isActive('strike') ? 'default' : 'ghost'}
        size="sm"
        className={buttonClass}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough"
        type="button"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>

      <Button
        variant={editor.isActive('code') ? 'default' : 'ghost'}
        size="sm"
        className={buttonClass}
        onClick={() => editor.chain().focus().toggleCode().run()}
        title="Inline Code"
        type="button"
      >
        <Code className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Headings */}
      <Button
        variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
        size="sm"
        className={buttonClass}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        title="Heading 1"
        type="button"
      >
        <Heading1 className="h-4 w-4" />
      </Button>

      <Button
        variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
        size="sm"
        className={buttonClass}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Heading 2"
        type="button"
      >
        <Heading2 className="h-4 w-4" />
      </Button>

      <Button
        variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
        size="sm"
        className={buttonClass}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        title="Heading 3"
        type="button"
      >
        <Heading3 className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Lists */}
      <Button
        variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
        size="sm"
        className={buttonClass}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet List"
        type="button"
      >
        <List className="h-4 w-4" />
      </Button>

      <Button
        variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
        size="sm"
        className={buttonClass}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Numbered List"
        type="button"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      <Button
        variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
        size="sm"
        className={buttonClass}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="Quote"
        type="button"
      >
        <Quote className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Link */}
      <Button
        variant={editor.isActive('link') ? 'default' : 'ghost'}
        size="sm"
        className={buttonClass}
        onClick={setLink}
        title="Add Link"
        type="button"
      >
        <LinkIcon className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Undo/Redo */}
      <Button
        variant="ghost"
        size="sm"
        className={buttonClass}
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo (Cmd+Z)"
        type="button"
      >
        <Undo className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className={buttonClass}
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo (Cmd+Shift+Z)"
        type="button"
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  );
}
