/**
 * Basic Info Section - Product information form
 */

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// @ts-ignore - SDK button
import { Button } from '@rubix-sdk/frontend/common/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { Product, ProductStatus, ProductType } from '../../types/product.types';
import { PRODUCT_STATUSES, PRODUCT_TYPES } from '../../types/product.types';

interface BasicInfoSectionProps {
  product: Product;
  client: any;
  onProductUpdate: (updates: any) => Promise<void>;
}

export function BasicInfoSection({ product, onProductUpdate }: BasicInfoSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: product.name,
    productCode: product.settings?.productCode || '',
    description: product.settings?.description || '',
    productType: (product.settings?.productType as ProductType) || 'hardware',
    status: (product.settings?.status as ProductStatus) || 'Design',
  });

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onProductUpdate({
        name: formData.name,
        settings: {
          ...product.settings,
          productCode: formData.productCode,
          description: formData.description,
          productType: formData.productType,
          status: formData.status,
        },
      });
      setIsEditing(false);
    } catch (err) {
      console.error('[BasicInfoSection] Save failed:', err);
      alert('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: product.name,
      productCode: product.settings?.productCode || '',
      description: product.settings?.description || '',
      productType: (product.settings?.productType as ProductType) || 'hardware',
      status: (product.settings?.status as ProductStatus) || 'Design',
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Basic Information</h2>
          <p className="text-sm text-muted-foreground">
            Product name, description, and classification details
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
            {/* Product Name */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Product Name
              </label>
              {isEditing ? (
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter product name"
                />
              ) : (
                <div className="text-base">{product.name}</div>
              )}
            </div>

            {/* Product Code */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Product Code
              </label>
              {isEditing ? (
                <Input
                  value={formData.productCode}
                  onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                  placeholder="Enter product code"
                  className="font-mono"
                />
              ) : (
                <div className="font-mono text-base">{product.settings?.productCode || '—'}</div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Description
              </label>
              {isEditing ? (
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter product description"
                  rows={4}
                />
              ) : (
                <div className="text-base text-muted-foreground">
                  {product.settings?.description || 'No description provided'}
                </div>
              )}
            </div>

            {/* Product Type */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Product Type
              </label>
              {isEditing ? (
                <Select
                  value={formData.productType}
                  onValueChange={(value) => setFormData({ ...formData, productType: value as ProductType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline" className="capitalize">
                  {product.settings?.productType || 'hardware'}
                </Badge>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Status
              </label>
              {isEditing ? (
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as ProductStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge>{product.settings?.status || 'Design'}</Badge>
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
