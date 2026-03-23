/**
 * Node Settings Dialog Component
 * Uses NodeSettingsForm reusable component
 */


import * as React from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from '@/components/ui/dialog';

import { NodeSettingsForm } from './node-settings-form';

interface NodeSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeId: string;
  parentId?: string;
  nodeType?: string;
  orgId: string;
  deviceId: string;
  onSuccess?: () => void;
}

export function NodeSettingsModal({
  open,
  onOpenChange,
  nodeId,
  nodeType,
  orgId,
  deviceId,
  parentId,
  onSuccess
}: NodeSettingsModalProps) {
  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[80vh] max-w-2xl overflow-y-auto'>
        <DialogTitle className='sr-only'>Node Settings</DialogTitle>
        <DialogDescription className='sr-only'>
          Configure node settings and properties
        </DialogDescription>
        <NodeSettingsForm
          nodeId={nodeId}
          nodeType={nodeType}
          orgId={orgId}
          deviceId={deviceId}
          parentId={parentId}
          onSuccess={handleSuccess}
          compact={false}
        />
      </DialogContent>
    </Dialog>
  );
}
