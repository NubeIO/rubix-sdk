# Rubix Frontend SDK

**Shared UI components, utilities, and settings SDK for Rubix and plugins.**

## Features

- ✅ **Common UI** - shadcn/ui components (Button, Card, Dialog, Input, etc.)
- ✅ **Settings SDK** - Multi-schema settings support for plugins
- ✅ **Plugin Client** - Type-safe API wrapper for node operations
- ✅ **RAS Client** - Advanced API client with full type safety
- ✅ **TypeScript** - Full type definitions included
- ✅ **Design System** - CSS variables for light/dark mode

## Package Structure

```
@rubix-sdk/frontend/
├── common/              # Shared UI primitives
│   ├── ui/             # shadcn/ui components
│   └── utils/          # Utilities (cn, etc.)
├── settings/           # Settings SDK for plugins
│   ├── components/     # SchemaSelector, SchemaChanger
│   └── hooks/          # useMultiSchema
├── plugin-client/      # Plugin client utilities
├── ras/               # RAS API client
└── globals.css        # Global styles
```

## Installation

```bash
# In your plugin or application
pnpm add @rubix-sdk/frontend

# Peer dependencies
pnpm add react react-dom lucide-react
```

## Quick Start

### 1. Common UI Components

```tsx
import { Button, Card, Input, Dialog } from '@rubix-sdk/frontend/common/ui';
import { cn } from '@rubix-sdk/frontend/common/utils';
import '@rubix-sdk/frontend/globals.css';

export function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Plugin</CardTitle>
      </CardHeader>
      <CardContent>
        <Input placeholder="Enter value" />
        <Button className={cn('mt-4')}>Submit</Button>
      </CardContent>
    </Card>
  );
}
```

### 2. Multi-Schema Settings (Plugins)

```tsx
import { SchemaSelector, useMultiSchema } from '@rubix-sdk/frontend/settings';
import { Dialog, Button } from '@rubix-sdk/frontend/common/ui';

export function ProductSettings() {
  const { schemas, selectedSchema, selectSchema, isSelecting } = useMultiSchema({
    schemas: [
      { name: 'hardware', displayName: 'Hardware Product', isDefault: true },
      { name: 'software', displayName: 'Software Product' }
    ],
  });

  return (
    <Dialog open={true}>
      {isSelecting && (
        <SchemaSelector schemas={schemas} onSelect={selectSchema} />
      )}
    </Dialog>
  );
}
```

## Components

### Available Components

**Layout:**
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter`
- `Popover`, `PopoverContent`, `PopoverTrigger`

**Forms:**
- `Input`, `Label`, `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`

**Feedback:**
- `Button`, `Badge`, `Skeleton`

**Utils:**
- `cn()` - classnames utility (clsx + tailwind-merge)

## Settings SDK API

### `useMultiSchema(options)`

Hook for managing multi-schema settings state.

**Options:**
```ts
{
  schemas: SchemaInfo[];
  defaultSchema?: string;
  onSchemaChange?: (name: string) => void;
}
```

**Returns:**
```ts
{
  selectedSchema: string | null;
  isSelecting: boolean;
  availableSchemas: SchemaInfo[];
  supportsMultiple: boolean;
  currentSchemaInfo: SchemaInfo | undefined;
  selectSchema: (name: string) => void;
  startSelection: () => void;
  cancelSelection: () => void;
  resetToDefault: () => void;
}
```

### `<SchemaSelector>`

Component for selecting from multiple schemas.

```tsx
<SchemaSelector
  schemas={schemas}
  selectedSchema={selectedSchema}
  onSelect={selectSchema}
  title="Select Configuration Type"
  description="Choose the type that matches your use case."
/>
```

### `<SchemaChanger>`

Display current schema with ability to change it.

```tsx
<SchemaChanger
  currentSchema={currentSchemaInfo}
  onChangeRequest={startSelection}
  label="Configuration Type"
/>
```

## Examples

### Example: PLM Product Settings

```tsx
import { SchemaSelector, SchemaChanger, useMultiSchema } from '@rubix-sdk/frontend/settings';
import { Dialog, Button, Input } from '@rubix-sdk/frontend/common/ui';

export function PLMProductSettings({ productId }: { productId: string }) {
  const {
    schemas,
    selectedSchema,
    isSelecting,
    currentSchemaInfo,
    selectSchema,
    startSelection,
  } = useMultiSchema({
    schemas: [
      { name: 'hardware', displayName: 'Hardware Product', isDefault: true },
      { name: 'software', displayName: 'Software Product' },
    ],
  });

  if (isSelecting) {
    return <SchemaSelector schemas={schemas} onSelect={selectSchema} />;
  }

  return (
    <div className="space-y-4">
      <SchemaChanger
        currentSchema={currentSchemaInfo!}
        onChangeRequest={startSelection}
      />

      {selectedSchema === 'hardware' && (
        <div className="space-y-3">
          <Input placeholder="SKU" />
          <Input placeholder="Weight (kg)" type="number" />
          <Button>Save Hardware Product</Button>
        </div>
      )}

      {selectedSchema === 'software' && (
        <div className="space-y-3">
          <Input placeholder="Version" />
          <Input placeholder="License Type" />
          <Button>Save Software Product</Button>
        </div>
      )}
    </div>
  );
}
```

## Plugin Client

```tsx
import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';

export default function MyWidget(props: PluginWidgetProps) {
  const client = createPluginClient(props);

  const data = await client.queryNodes({ filter: 'type is "plm.product"' });
}
```

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Watch mode
pnpm dev

# Type check
pnpm typecheck
```

## Migration from `@rubix/plugin-ui`

If you're migrating from the old package:

```diff
- import { Button } from '@rubix/plugin-ui';
+ import { Button } from '@rubix-sdk/frontend/common/ui';

- import { createPluginClient } from '@rubix/plugin-ui';
+ import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';
```

## License

MIT
