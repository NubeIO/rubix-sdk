# RightClickMenu Examples

```tsx
import { Lock, Pencil, Trash2 } from 'lucide-react';
import {
  RightClickMenu,
  RightClickMenuItem,
  RightClickMenuSeparator,
} from '@rubix-sdk/frontend';

export function WidgetMenu({
  open,
  x,
  y,
  onClose,
  locked,
}: {
  open: boolean;
  x: number;
  y: number;
  onClose: () => void;
  locked: boolean;
}) {
  return (
    <RightClickMenu open={open} x={x} y={y} onClose={onClose}>
      <RightClickMenuItem
        icon={<Pencil className="h-4 w-4" />}
        label="Rename"
        onSelect={() => {
          onClose();
        }}
      />

      <RightClickMenuItem
        icon={<Lock className="h-4 w-4" />}
        label={locked ? 'Unlock' : 'Lock'}
        locked={locked}
        onSelect={() => {
          onClose();
        }}
      />

      <RightClickMenuSeparator />

      <RightClickMenuItem
        icon={<Trash2 className="h-4 w-4" />}
        label="Delete"
        destructive
        onSelect={() => {
          onClose();
        }}
      />
    </RightClickMenu>
  );
}
```
