/**
 * Add BOM Item Dialog
 */

import { useState } from 'react';
// @ts-ignore - SDK components
import { Button } from '@rubix-sdk/frontend/common/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';

interface AddBOMItemDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (bomItem: {
    partCode: string;
    description: string;
    quantity: number;
    unit: string;
    unitCost: number;
    status: string;
  }) => Promise<void>;
}

export function AddBOMItemDialog({ open, onClose, onAdd }: AddBOMItemDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    partCode: '',
    description: '',
    quantity: '1',
    unit: 'pcs',
    unitCost: '0',
    status: 'Pending',
  });

  const handleSubmit = async () => {
    try {
      setIsSaving(true);
      await onAdd({
        partCode: formData.partCode,
        description: formData.description,
        quantity: parseFloat(formData.quantity) || 0,
        unit: formData.unit,
        unitCost: parseFloat(formData.unitCost) || 0,
        status: formData.status,
      });
      // Reset form
      setFormData({
        partCode: '',
        description: '',
        quantity: '1',
        unit: 'pcs',
        unitCost: '0',
        status: 'Pending',
      });
      onClose();
    } catch (err) {
      console.error('[AddBOMItemDialog] Failed to add BOM item:', err);
      alert('Failed to add BOM item: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isSaving) return;
    setFormData({
      partCode: '',
      description: '',
      quantity: '1',
      unit: 'pcs',
      unitCost: '0',
      status: 'Pending',
    });
    onClose();
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Add BOM Item</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Part Code */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Part Code <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.partCode}
              onChange={(e) => setFormData({ ...formData, partCode: e.target.value })}
              placeholder="e.g., PART-001"
              className="font-mono"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Description
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter part description"
              rows={3}
            />
          </div>

          {/* Quantity and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Quantity <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="1"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                Unit
              </label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pcs">pcs</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="m">m</SelectItem>
                  <SelectItem value="l">l</SelectItem>
                  <SelectItem value="box">box</SelectItem>
                  <SelectItem value="set">set</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Unit Cost and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Unit Cost (USD)
              </label>
              <Input
                type="number"
                value={formData.unitCost}
                onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="font-mono"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                Status
              </label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Released">Released</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving || !formData.partCode}
          >
            {isSaving ? 'Adding...' : 'Add BOM Item'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
