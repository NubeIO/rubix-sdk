/**
 * Pricing Section - Pricing management
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
// @ts-ignore - SDK button
import { Button } from '@rubix-sdk/frontend/common/ui/button';
import { Input } from '@/components/ui/input';
import type { Product } from '../../types/product.types';

interface PricingSectionProps {
  product: Product;
  client: any;
  onProductUpdate: (updates: any) => Promise<void>;
}

export function PricingSection({ product, onProductUpdate }: PricingSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [price, setPrice] = useState(product.settings?.price?.toString() || '0');

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onProductUpdate({
        settings: {
          ...product.settings,
          price: parseFloat(price) || 0,
        },
      });
      setIsEditing(false);
    } catch (err) {
      console.error('[PricingSection] Save failed:', err);
      alert('Failed to save pricing');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setPrice(product.settings?.price?.toString() || '0');
    setIsEditing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pricing</h2>
          <p className="text-sm text-muted-foreground">
            Manage product pricing and cost information
          </p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Base Price */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Base Price (USD)
              </label>
              {isEditing ? (
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="font-mono"
                />
              ) : (
                <div className="text-3xl font-bold">
                  {formatCurrency(parseFloat(product.settings?.price?.toString() || '0'))}
                </div>
              )}
            </div>

            {/* Save/Cancel buttons */}
            {isEditing && (
              <div className="flex gap-3 pt-4">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
