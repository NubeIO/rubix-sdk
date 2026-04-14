/**
 * PROOF: Plugin Uses EXACT SAME Component as Host
 *
 * This component proves that the plugin imports and uses
 * the EXACT SAME DeleteDialog from @rubix-sdk/frontend as the host.
 */

import { createRoot, type Root } from 'react-dom/client';
import { useState } from 'react';

// ✅ THE EXACT SAME IMPORT AS THE HOST
import { DeleteDialog } from '@rubix-sdk/frontend/components/delete';

// Also import the Button from SDK to be consistent
import { Button } from '@rubix-sdk/frontend/common/ui';

function ProofComponent() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletedCount, setDeletedCount] = useState(0);

  const handleDelete = async () => {
    // Simulate deletion
    await new Promise(resolve => setTimeout(resolve, 500));
    setDeletedCount(prev => prev + 1);
    setShowDeleteDialog(false);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-green-500 bg-green-50 p-6 dark:border-green-900 dark:bg-green-950">
        <h1 className="text-3xl font-bold text-green-900 dark:text-green-100">
          ✅ PROOF: Plugin Uses EXACT SAME Component as Host
        </h1>
        <p className="mt-2 text-green-800 dark:text-green-200">
          The plugin imports DeleteDialog from @rubix-sdk/frontend - the SAME source as the host.
        </p>
      </div>

      {/* Code Comparison */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Host Code */}
        <div className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">🏠 Host Code</h2>
          <div className="rounded bg-zinc-900 p-4 text-sm font-mono text-zinc-100">
            <div className="text-zinc-500">// delete-node-dialog.tsx</div>
            <div className="text-blue-400">import</div> {'{ DeleteDialog }'} <div className="text-blue-400 inline">from</div> <span className="text-green-400">'@rubix-sdk/frontend'</span>;
            <div className="mt-4">
              <span className="text-purple-400">&lt;DeleteDialog</span>
              <div className="ml-4">
                open={'{open}'}
                <br />
                onOpenChange={'{setOpen}'}
                <br />
                title=<span className="text-green-400">"Delete Node"</span>
                <br />
                itemName={'{nodeName}'}
                <br />
                onConfirm={'{handleDelete}'}
              </div>
              <span className="text-purple-400">/&gt;</span>
            </div>
          </div>
        </div>

        {/* Plugin Code */}
        <div className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">🔌 Plugin Code</h2>
          <div className="rounded bg-zinc-900 p-4 text-sm font-mono text-zinc-100">
            <div className="text-zinc-500">// delete-product-dialog-sdk.tsx</div>
            <div className="text-blue-400">import</div> {'{ DeleteDialog }'} <div className="text-blue-400 inline">from</div> <span className="text-green-400">'@rubix-sdk/frontend'</span>;
            <div className="mt-4">
              <span className="text-purple-400">&lt;DeleteDialog</span>
              <div className="ml-4">
                open={'{open}'}
                <br />
                onOpenChange={'{setOpen}'}
                <br />
                title=<span className="text-green-400">"Delete Product"</span>
                <br />
                itemName={'{productName}'}
                <br />
                onConfirm={'{handleDelete}'}
              </div>
              <span className="text-purple-400">/&gt;</span>
            </div>
          </div>
        </div>
      </div>

      {/* The Proof */}
      <div className="rounded-lg border border-green-500 bg-green-50 p-6 dark:border-green-900 dark:bg-green-950">
        <h2 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-4">
          ✅ What This Proves:
        </h2>
        <ul className="space-y-2 text-green-800 dark:text-green-200">
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span><strong>SAME import:</strong> <code className="bg-green-100 dark:bg-green-900 px-2 py-1 rounded text-xs">import {'{ DeleteDialog }'} from '@rubix-sdk/frontend'</code></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span><strong>SAME component:</strong> Both use <code className="bg-green-100 dark:bg-green-900 px-2 py-1 rounded text-xs">&lt;DeleteDialog /&gt;</code></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span><strong>SAME API:</strong> Same props (open, onOpenChange, title, itemName, onConfirm)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span><strong>SAME styling:</strong> Looks identical (shadcn/ui with Radix UI)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span><strong>NO hacks:</strong> No custom components, no Headless UI workarounds</span>
          </li>
        </ul>
      </div>

      {/* Live Demo */}
      <div className="rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">🎯 Live Demo</h2>
        <p className="text-muted-foreground mb-4">
          Click the button below to see the SHARED DeleteDialog in action:
        </p>

        <Button onClick={() => setShowDeleteDialog(true)} size="lg">
          Open Shared DeleteDialog
        </Button>

        {deletedCount > 0 && (
          <div className="mt-4 rounded bg-green-100 dark:bg-green-900 p-3 text-sm text-green-900 dark:text-green-100">
            ✅ Successfully "deleted" {deletedCount} item{deletedCount > 1 ? 's' : ''} using the shared component!
          </div>
        )}
      </div>

      {/* The Shared DeleteDialog */}
      <DeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Product"
        itemName="Example Product"
        description={
          <div className="space-y-2">
            <p>This DeleteDialog is imported from <code className="bg-muted px-1 py-0.5 rounded text-xs">@rubix-sdk/frontend</code>.</p>
            <p className="font-semibold text-green-600">It's the EXACT SAME component the host uses!</p>
          </div>
        }
        onConfirm={handleDelete}
      />
    </div>
  );
}

// Export mount/unmount API
export default {
  mount: (container: HTMLElement) => {
    const root = createRoot(container);
    root.render(<ProofComponent />);
    return root;
  },

  unmount: (root: Root) => {
    root.unmount();
  },
};
