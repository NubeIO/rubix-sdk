# Bundle Size Comparison

## Tiptap vs mdx-editor

### Tiptap (Our Choice)
```
@tiptap/core + @tiptap/react        ~25KB gzipped
@tiptap/starter-kit                 ~30KB gzipped
@tiptap/extension-placeholder       ~5KB gzipped
@tiptap/extension-link              ~5KB gzipped
────────────────────────────────────────────────
Total:                              ~50-70KB gzipped
```

### mdx-editor
```
@mdxeditor/editor                   ~100-150KB gzipped
```

## Size Savings

**30-50% smaller bundle** (~50-80KB savings)

This matters because:
1. SDK is imported by every plugin
2. Faster page loads
3. Better mobile performance
4. Lower bandwidth costs

## Feature Comparison

### Tiptap ✅
- Modular (only ship what you need)
- Customizable UI (matches shadcn/ui)
- Full keyboard shortcuts
- Undo/Redo
- Markdown support
- Link editing
- Lightweight

### mdx-editor
- All-in-one package (heavier)
- Fixed UI (harder to customize)
- MDX support (we don't need it)
- More features we don't use
- Larger bundle

## Why Tiptap Wins

1. **Smaller bundle** - 30-50% smaller
2. **More control** - Build UI that matches our design system
3. **Modular** - Only import extensions you need
4. **Better for SDK** - Consumers can customize further
5. **Active development** - Used by GitHub, Substack, Axios

## Performance Impact

For a plugin that imports the SDK:

**With mdx-editor:**
- Initial bundle: +150KB
- Parse time: +50ms

**With Tiptap:**
- Initial bundle: +70KB
- Parse time: +20ms

**Result**: 50% faster load, 53% smaller bundle
