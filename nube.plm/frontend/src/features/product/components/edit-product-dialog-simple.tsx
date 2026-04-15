/**
 * Simple Edit Product Dialog - No SDK complexity
 * Just a basic form that works
 */

import { useState } from 'react';

// @ts-ignore - SDK types
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@rubix-sdk/frontend/common/ui';

import type { Product } from '@features/product/types/product.types';
import type { UpdateProductInput } from '@features/product/api/product-api';

export interface SimpleEditProductDialogProps {
  product: Product;
  open: boolean;
  onClose: () => void;
  onSubmit: (productId: string, input: { name?: string; settings: Record<string, any> }) => Promise<void>;
}

export function SimpleEditProductDialog({
  product,
  open,
  onClose,
  onSubmit,
}: SimpleEditProductDialogProps) {
  // Extract current values from product settings
  const settings = product.settings || {};

  const [name, setName] = useState(product.name);
  const [productCode, setProductCode] = useState(settings.productCode || '');
  const [description, setDescription] = useState(settings.description || '');
  const [category, setCategory] = useState(settings.category || 'hardware');
  const [status, setStatus] = useState(settings.status || 'draft');
  const [price, setPrice] = useState(settings.price?.toString() || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (saving) return;

    console.log('[SimpleEditProductDialog] Submitting...');
    setSaving(true);

    try {
      // Pass both name AND settings (flat, no wrapping!)
      const updateInput = {
        name, // Include name so it can be updated
        settings: {
          productCode,
          description: description || undefined,
          category,
          status,
          price: price ? parseFloat(price) : undefined,
          productType: settings.productType || 'hardware', // Keep existing productType
        },
      };

      console.log('[SimpleEditProductDialog] Update input:', updateInput);

      // Call onSubmit with both name and settings
      await onSubmit(product.id, updateInput);

      console.log('[SimpleEditProductDialog] Success!');
      onClose();
    } catch (err) {
      console.error('[SimpleEditProductDialog] Error:', err);
      alert(`Failed to update: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          {/* Product Code */}
          <div>
            <label className="block text-sm font-medium mb-1">Product Code</label>
            <input
              type="text"
              value={productCode}
              onChange={(e) => setProductCode(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="hardware">Hardware</option>
              <option value="software">Software</option>
              <option value="service">Service</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="deprecated">Deprecated</option>
              <option value="discontinued">Discontinued</option>
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium mb-1">Price</label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
