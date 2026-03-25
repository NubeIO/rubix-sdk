# Markdown Editor

A lightweight, customizable markdown editor built with Tiptap for the Rubix SDK.

## Features

- 🎨 Rich text toolbar (bold, italic, headings, lists, links, etc.)
- ⌨️ Keyboard shortcuts (Cmd+B, Cmd+I, Cmd+Z, etc.)
- 🎯 Customizable styling and height
- 📝 Markdown output
- 🔗 Link support with visual editor
- 🎨 Matches shadcn/ui design system
- 📦 ~50-70KB gzipped (much lighter than mdx-editor)

## Installation

The editor requires Tiptap peer dependencies:

```bash
pnpm add @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-link
```

## Basic Usage

```tsx
import { MarkdownEditor } from '@rubix-sdk/frontend';
import { useState } from 'react';

export function MyComponent() {
  const [content, setContent] = useState('');

  return (
    <MarkdownEditor
      value={content}
      onChange={setContent}
      placeholder="Write your documentation..."
    />
  );
}
```

## Props

```tsx
interface MarkdownEditorProps {
  value?: string;                  // Current markdown content
  onChange?: (markdown: string) => void;  // Called on content change
  placeholder?: string;             // Placeholder text (default: "Write something...")
  className?: string;               // Container className
  editorClassName?: string;         // Editor content className
  toolbarClassName?: string;        // Toolbar className
  minHeight?: string;               // Min height (default: "200px")
  maxHeight?: string;               // Max height (enables scrolling)
  readOnly?: boolean;               // Read-only mode (default: false)
  showToolbar?: boolean;            // Show/hide toolbar (default: true)
  autoFocus?: boolean;              // Auto-focus on mount (default: false)
}
```

## Examples

### Read-only Viewer

```tsx
<MarkdownEditor
  value={content}
  readOnly
  showToolbar={false}
  minHeight="100px"
/>
```

### Custom Height with Scrolling

```tsx
<MarkdownEditor
  value={content}
  onChange={setContent}
  minHeight="300px"
  maxHeight="600px"
/>
```

### Custom Styling

```tsx
<MarkdownEditor
  value={content}
  onChange={setContent}
  className="border-2 border-blue-500"
  editorClassName="text-lg"
  toolbarClassName="bg-gray-100"
/>
```

### Standalone Toolbar

You can also use the toolbar separately:

```tsx
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { MarkdownToolbar } from '@rubix-sdk/frontend';

export function CustomEditor() {
  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
  });

  if (!editor) return null;

  return (
    <div>
      <MarkdownToolbar editor={editor} />
      {/* Custom editor UI */}
    </div>
  );
}
```

## Toolbar Features

- **Text Formatting**: Bold, Italic, Strikethrough, Inline Code
- **Headings**: H1, H2, H3
- **Lists**: Bullet list, Numbered list
- **Blockquote**
- **Links**: Add/edit/remove links with prompt
- **Undo/Redo**: Full history support

## Keyboard Shortcuts

- `Cmd+B` / `Ctrl+B` - Bold
- `Cmd+I` / `Ctrl+I` - Italic
- `Cmd+Z` / `Ctrl+Z` - Undo
- `Cmd+Shift+Z` / `Ctrl+Shift+Z` - Redo
- `Cmd+E` / `Ctrl+E` - Inline code
- `#` + `Space` - Heading 1
- `##` + `Space` - Heading 2
- `###` + `Space` - Heading 3
- `-` + `Space` - Bullet list
- `1.` + `Space` - Numbered list
- `>` + `Space` - Blockquote

## Bundle Size

The markdown editor adds approximately:

- `@tiptap/core` + `@tiptap/react`: ~25KB gzipped
- `@tiptap/starter-kit`: ~30KB gzipped
- `@tiptap/extension-placeholder` + `@tiptap/extension-link`: ~10KB gzipped
- **Total**: ~50-70KB gzipped

Much lighter than alternatives like mdx-editor (~100-150KB).
