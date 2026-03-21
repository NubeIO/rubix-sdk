/**
 * TEST PAGE - Testing local Dialog component
 */

import { useState } from 'react';
// @ts-ignore
import { Button, Card, CardHeader, CardTitle, CardContent } from '@rubix-sdk/frontend/common/ui';
import '@rubix-sdk/frontend/globals.css';
// Test local Dialog
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../dialogs/local-dialog';

export default function TestPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle>PLM Plugin Test Page</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Testing local Dialog component with Radix UI primitives:</p>
          <Button onClick={() => setDialogOpen(true)}>
            Open Dialog
          </Button>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogHeader>
          <p>If you see this dialog, Radix UI Dialog works!</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
