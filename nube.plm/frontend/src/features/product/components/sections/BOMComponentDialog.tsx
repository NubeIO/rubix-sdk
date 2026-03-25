import { useState, useEffect } from 'react';

// @ts-ignore - SDK components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@rubix-sdk/frontend/common/ui/dialog';
import { Button } from '@rubix-sdk/frontend/common/ui/button';
import { Input } from '@rubix-sdk/frontend/common/ui/input';
import { Textarea } from '@rubix-sdk/frontend/common/ui/textarea';

import type { Node } from '../../../../../../frontend-sdk/ras/types';

interface BOMComponent extends Node {
  settings?: {
    partNumber?: string;
    quantity?: number;
    unitCost?: number;
    supplier?: string;
    description?: string;
    [key: string]: unknown;
  };
}

interface BOMComponentDialogProps {
  open: boolean;
  component?: BOMComponent;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export function BOMComponentDialog({
  open,
  component,
  onClose,
  onSubmit,
}: BOMComponentDialogProps) {
  const isEdit = !!component;

  const [formData, setFormData] = useState({
    name: '',
    partNumber: '',
    quantity: 1,
    unitCost: 0,
    supplier: '',
    description: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (component) {
      setFormData({
        name: component.name || '',
        partNumber: component.settings?.partNumber || '',
        quantity: component.settings?.quantity || 1,
        unitCost: component.settings?.unitCost || 0,
        supplier: component.settings?.supplier || '',
        description: component.settings?.description || '',
      });
    } else {
      setFormData({
        name: '',
        partNumber: '',
        quantity: 1,
        unitCost: 0,
        supplier: '',
        description: '',
      });
    }
  }, [component]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Component name is required');
      return;
    }

    if (formData.quantity < 1) {
      setError('Quantity must be at least 1');
      return;
    }

    if (formData.unitCost < 0) {
      setError('Unit cost cannot be negative');
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save component');
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit BOM Component' : 'Add BOM Component'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="name" className="text-sm font-medium">
                Component Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., PCB Board"
                required
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="partNumber" className="text-sm font-medium">
                Part Number
              </label>
              <Input
                id="partNumber"
                value={formData.partNumber}
                onChange={(e) => handleChange('partNumber', e.target.value)}
                placeholder="e.g., PCB-001"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="quantity" className="text-sm font-medium">
                  Quantity <span className="text-destructive">*</span>
                </label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', parseInt(e.target.value, 10))}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <label htmlFor="unitCost" className="text-sm font-medium">
                  Unit Cost
                </label>
                <Input
                  id="unitCost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.unitCost}
                  onChange={(e) => handleChange('unitCost', parseFloat(e.target.value))}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label htmlFor="supplier" className="text-sm font-medium">
                Supplier
              </label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => handleChange('supplier', e.target.value)}
                placeholder="e.g., Acme Electronics"
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Component description or notes"
                rows={3}
                className="mt-1"
              />
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : isEdit ? 'Update Component' : 'Add Component'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
