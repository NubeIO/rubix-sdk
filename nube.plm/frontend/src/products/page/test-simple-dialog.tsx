/**
 * Test SIMPLEST possible Radix UI Dialog
 */
import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

export default function TestSimpleDialogPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simple Dialog Test</h1>

      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Open Simple Dialog
      </button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded shadow-lg">
            <Dialog.Title className="text-lg font-bold mb-4">
              Simple Dialog
            </Dialog.Title>
            <p>Just plain text - no complex children</p>
            <button
              onClick={() => setOpen(false)}
              className="mt-4 px-4 py-2 bg-gray-500 text-white rounded"
            >
              Close
            </button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
