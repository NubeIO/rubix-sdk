# DeleteDialog Component - Usage Guide

**Shared delete confirmation dialog for main frontend and plugins.**

## Why Use This?

Instead of creating custom delete dialogs every time, use this shared component:

- ✅ **Consistent UX** across all delete actions
- ✅ **Handles loading states** automatically
- ✅ **Accessible** (keyboard navigation, screen readers)
- ✅ **Customizable** for different use cases
- ✅ **Type-safe** with TypeScript

---

## Installation

### Main Frontend

Already imported via `@rubix-sdk/frontend`:

```tsx
import { DeleteDialog } from '@rubix-sdk/frontend';
```

### Plugins

Install SDK as dependency:

```bash
pnpm add @rubix-sdk/frontend
```

Then import:

```tsx
import { DeleteDialog } from '@rubix-sdk/frontend';
```

---

## Basic Usage

```tsx
import { useState } from 'react';
import { DeleteDialog } from '@rubix-sdk/frontend';
import { toast } from 'sonner';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await fetch('/api/items/123', { method: 'DELETE' });
      toast.success('Item deleted');
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Delete</Button>

      <DeleteDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Delete Item"
        itemName="My Item"
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
```

---

## Before & After

### ❌ Before (Custom Implementation)

**64 lines of boilerplate:**

```tsx
import { Loader2, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@rubix-sdk/frontend/common/ui';
import { Button } from '@rubix-sdk/frontend/common/ui';

interface DeleteTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string | null;
  teamName: string;
  onConfirm: (teamId: string) => void;
  isDeleting?: boolean;
}

export function DeleteTeamDialog({
  open,
  onOpenChange,
  teamId,
  teamName,
  onConfirm,
  isDeleting,
}: DeleteTeamDialogProps) {
  const handleConfirm = () => {
    if (teamId) {
      onConfirm(teamId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Team</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the team &quot;{teamName}&quot;?
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-muted-foreground text-sm">
            This action cannot be undone. All users will be removed from this
            team.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Delete Team
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### ✅ After (Using SDK)

**7 lines:**

```tsx
import { DeleteDialog } from '@rubix-sdk/frontend';

export function DeleteTeamDialog({
  open,
  onOpenChange,
  teamName,
  onConfirm,
  isDeleting,
}: DeleteTeamDialogProps) {
  return (
    <DeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Team"
      itemName={teamName}
      warningText="This action cannot be undone. All users will be removed from this team."
      deleteButtonText="Delete Team"
      onConfirm={onConfirm}
      isDeleting={isDeleting}
    />
  );
}
```

**Result**: 90% less code, same functionality.

---

## Advanced Examples

### Custom Description with JSX

```tsx
<DeleteDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Delete Tag"
  description={
    <>
      Are you sure you want to delete{' '}
      <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-sm">
        {tagName} = {tagValue}
      </code>
      ?
    </>
  }
  onConfirm={handleDelete}
  isDeleting={isDeleting}
/>
```

### No Warning Text

```tsx
<DeleteDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Remove Item"
  itemName="Draft #123"
  warningText="" // Empty = no warning shown
  onConfirm={handleDelete}
/>
```

### Custom Button Text

```tsx
<DeleteDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Archive Project"
  itemName="Q4 Report"
  deleteButtonText="Archive"
  cancelButtonText="Keep"
  showIcon={false} // No trash icon
  onConfirm={handleArchive}
/>
```

### With React Query Mutation

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DeleteDialog } from '@rubix-sdk/frontend';
import { toast } from 'sonner';

function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (teamId: string) =>
      fetch(`/api/teams/${teamId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team deleted');
    },
    onError: () => {
      toast.error('Failed to delete team');
    },
  });
}

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const deleteMutation = useDeleteTeam();

  return (
    <DeleteDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      title="Delete Team"
      itemName={selectedTeam?.name}
      onConfirm={() => {
        if (selectedTeam) {
          deleteMutation.mutate(selectedTeam.id);
        }
      }}
      isDeleting={deleteMutation.isPending}
    />
  );
}
```

---

## API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | **required** | Controls dialog visibility |
| `onOpenChange` | `(open: boolean) => void` | **required** | Callback when visibility changes |
| `onConfirm` | `() => void \| Promise<void>` | **required** | Called when user confirms delete |
| `title` | `string` | `"Delete Item"` | Dialog title |
| `itemName` | `string` | `undefined` | Name of item being deleted (shown in description) |
| `description` | `React.ReactNode` | Auto-generated | Custom description (overrides default) |
| `warningText` | `string` | `"This action cannot be undone."` | Warning text below description |
| `isDeleting` | `boolean` | `false` | Shows loading spinner on delete button |
| `deleteButtonText` | `string` | `"Delete"` | Delete button label |
| `cancelButtonText` | `string` | `"Cancel"` | Cancel button label |
| `showIcon` | `boolean` | `true` | Show trash icon on delete button |

---

## Plugin Example

```tsx
// plugins/my-plugin/src/components/products-table.tsx
import { useState } from 'react';
import { DeleteDialog } from '@rubix-sdk/frontend';
import { useDeleteProduct } from '../hooks/use-delete-product';

export function ProductsTable() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { mutate: deleteProduct, isPending } = useDeleteProduct();

  const handleDelete = () => {
    if (selectedProduct) {
      deleteProduct(selectedProduct.id, {
        onSuccess: () => setDeleteDialogOpen(false),
      });
    }
  };

  return (
    <>
      <Table>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell>{product.name}</TableCell>
            <TableCell>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setSelectedProduct(product);
                  setDeleteDialogOpen(true);
                }}
              >
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </Table>

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Product"
        itemName={selectedProduct?.name}
        warningText="This will permanently remove the product from your catalog."
        onConfirm={handleDelete}
        isDeleting={isPending}
      />
    </>
  );
}
```

---

## Migration Guide

If you have existing custom delete dialogs in your code:

1. **Import SDK component:**
   ```tsx
   import { DeleteDialog } from '@rubix-sdk/frontend';
   ```

2. **Replace custom dialog with SDK:**
   - Remove `Dialog`, `DialogContent`, `DialogHeader`, etc. imports
   - Remove button rendering logic
   - Remove loading state UI
   - Pass props to `DeleteDialog`

3. **Keep business logic:**
   - Keep your delete mutation/API call
   - Keep your state management
   - Keep your toast notifications

**Estimated time per dialog**: 2-5 minutes

---

## Benefits

### For Main Frontend

- ✅ Reduce duplication (38 delete dialogs found)
- ✅ Consistent UX across all features
- ✅ Easier maintenance (fix once, benefits all)

### For Plugins

- ✅ No need to build delete UI from scratch
- ✅ Matches main frontend styling
- ✅ Best practices built-in

### For Users

- ✅ Predictable delete flows
- ✅ Accessible (keyboard, screen readers)
- ✅ Visual consistency

---

## FAQ

**Q: Can I customize the styling?**
A: The dialog uses Rubix design tokens and matches the app theme automatically. For custom styles, you can wrap it in a div with className.

**Q: Does it work with async operations?**
A: Yes! `onConfirm` can be sync or async. Pass `isDeleting={true}` to show loading state.

**Q: What about error handling?**
A: The component handles the UI. You handle errors in `onConfirm` (show toast, etc.).

**Q: Can I use it for non-delete actions (archive, remove)?**
A: Yes! Customize `title`, `deleteButtonText`, and `showIcon={false}`.

---

## Next Steps

1. ✅ **Try it**: Replace one delete dialog in your code
2. ✅ **Migrate**: Gradually replace custom dialogs
3. ✅ **Extend**: Build more shared components (forms, tables, etc.)

**Questions?** Check the SDK docs or ask in #frontend.
# DeleteDialog - Reusable for ANY Delete Operation

**The DeleteDialog component is 100% generic** - it works for nodes, products, teams, files, or ANYTHING you need to delete.

---

## Core Principle: Pass Custom Messages

```tsx
import { DeleteDialog } from '@rubix-sdk/frontend';

// Use it for ANYTHING - just customize the props!
<DeleteDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Delete [Whatever]"           // ← Customize
  description="Custom message here"   // ← Customize
  warningText="Custom warning"        // ← Customize
  onConfirm={handleDelete}
  isDeleting={isDeleting}
/>
```

---

## Example 1: Delete Node (Current Implementation)

```tsx
function DeleteNodeDialog({ nodeType, nodeId, ...props }) {
  const description = (
    <div>
      <div>Node: {nodeType}</div>
      <div>ID: {nodeId}</div>
    </div>
  );

  return (
    <DeleteDialog
      title="Delete Node"
      description={description}
      warningText="This action cannot be undone."
      {...props}
    />
  );
}
```

---

## Example 2: Delete Product (Current Implementation)

```tsx
function DeleteProductDialog({ productName, productCode, ...props }) {
  const description = (
    <>
      Are you sure you want to delete <strong>{productName}</strong>
      {productCode && <span> ({productCode})</span>}?
    </>
  );

  return (
    <DeleteDialog
      title="Delete Product"
      description={description}
      warningText="This action cannot be undone."
      {...props}
    />
  );
}
```

---

## Example 3: Delete Team (Different Warning)

```tsx
<DeleteDialog
  title="Delete Team"
  itemName={teamName}
  warningText="All users will be removed from this team. This cannot be undone."
  onConfirm={handleDeleteTeam}
  isDeleting={isDeleting}
/>
```

---

## Example 4: Delete File (Custom Button Text)

```tsx
<DeleteDialog
  title="Delete File"
  itemName={fileName}
  warningText="The file will be permanently deleted from storage."
  deleteButtonText="Delete File"
  onConfirm={handleDeleteFile}
  isDeleting={isDeleting}
/>
```

---

## Example 5: Archive (Not Destructive)

```tsx
<DeleteDialog
  title="Archive Project"
  itemName={projectName}
  warningText="The project will be moved to archives. You can restore it later."
  deleteButtonText="Archive"
  cancelButtonText="Keep Active"
  showIcon={false}  // No trash icon for archive
  onConfirm={handleArchive}
  isDeleting={isArchiving}
/>
```

---

## Example 6: Fully Custom Content

```tsx
<DeleteDialog
  title="Remove Access"
  description={
    <div className="space-y-2">
      <p>You are about to remove access for:</p>
      <div className="bg-muted p-3 rounded">
        <div><strong>User:</strong> {userName}</div>
        <div><strong>Role:</strong> {userRole}</div>
        <div><strong>Email:</strong> {userEmail}</div>
      </div>
      <p className="text-sm">They will no longer be able to access this resource.</p>
    </div>
  }
  warningText="Send notification email to user?"
  deleteButtonText="Remove Access"
  onConfirm={handleRemoveAccess}
  isDeleting={isRemoving}
/>
```

---

## Example 7: Batch Delete

```tsx
<DeleteDialog
  title={`Delete ${selectedCount} Items`}
  description={
    <>
      You are about to delete <strong>{selectedCount} items</strong>:
      <ul className="mt-2 list-disc list-inside">
        {selectedItems.slice(0, 5).map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
        {selectedCount > 5 && <li>...and {selectedCount - 5} more</li>}
      </ul>
    </>
  }
  warningText="This action cannot be undone."
  deleteButtonText={`Delete ${selectedCount} Items`}
  onConfirm={handleBatchDelete}
  isDeleting={isDeleting}
/>
```

---

## The Point: ONE Component, Infinite Uses

**You DON'T need separate components for each delete type.**

Just use the generic `DeleteDialog` and pass custom props:

```tsx
// ✅ GOOD: Reusable, flexible
<DeleteDialog
  title="Delete [Type]"
  description={customContent}
  warningText={customWarning}
  onConfirm={handleDelete}
/>

// ❌ BAD: Creating separate components for each type
<DeleteNodeDialog />
<DeleteProductDialog />
<DeleteTeamDialog />
<DeleteFileDialog />
// ... etc (code duplication!)
```

---

## When to Create Wrapper Components

**Only create wrappers if you have complex formatting logic:**

```tsx
// ✅ Good use of wrapper: Complex node-specific formatting
function DeleteNodeDialog({ node, ...props }) {
  const isMultipleNodes = node.type.includes(' nodes');

  const description = isMultipleNodes ? (
    <>{node.type}</>
  ) : (
    <div>
      <div>Node: {node.type}</div>
      <div>ID: {node.id}</div>
      {node.hasChildren && <div>⚠️ Has {node.childCount} children</div>}
    </div>
  );

  return <DeleteDialog title="Delete Node" description={description} {...props} />;
}

// ✅ Good use of wrapper: Fetches data before showing dialog
function DeleteTeamDialogWithData({ teamId, ...props }) {
  const { data: team } = useTeam(teamId);
  const { data: members } = useTeamMembers(teamId);

  const description = (
    <>
      Delete team <strong>{team?.name}</strong>?
      <div className="mt-2">This will affect {members?.length} members.</div>
    </>
  );

  return <DeleteDialog title="Delete Team" description={description} {...props} />;
}
```

---

## Summary

**The DeleteDialog component is a TOOL, not a template.**

- ✅ **Pass custom messages** via props
- ✅ **Use for ANY delete operation** (node, product, file, user, etc.)
- ✅ **Create wrappers only when needed** (complex logic, data fetching)
- ✅ **Keep it simple** - most cases just need custom title + description

**Result**: Less code duplication, more flexibility, easier maintenance.
