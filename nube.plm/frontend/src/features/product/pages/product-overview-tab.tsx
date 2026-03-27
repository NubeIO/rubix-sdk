/**
 * Product Overview Tab
 * Displays product details in a clean, readable format
 */

import { useState } from 'react';

// @ts-ignore - SDK components
import { Button } from '@rubix-sdk/frontend/common/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@rubix-sdk/frontend/common/ui/card';
// @ts-ignore - SDK icons
import { Edit, DollarSign, Package, Tag, Activity, RefreshCw } from 'lucide-react';

import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';
import type { Product } from '@features/product/types/localProduct.types';
import type { ProductSettings } from '@features/product/types/product.types';
import { ProductStatusBadge } from '@features/product/components/ProductStatusBadge';
import { EditProductDialogSDK } from '@features/product/components/edit-product-dialog-sdk';

interface ProductOverviewTabProps {
  product: Product;
  orgId: string;
  deviceId: string;
  baseUrl?: string;
  token?: string;
  onProductUpdated?: (product: Product) => void;
}

export function ProductOverviewTab({
  product,
  orgId,
  deviceId,
  baseUrl = '/api/v1',
  token,
  onProductUpdated,
}: ProductOverviewTabProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localProduct, setLocalProduct] = useState<Product>(product);

  // Create plugin client - use SDK directly!
  const client = createPluginClient({ orgId, deviceId, baseUrl, token });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Use SDK getNode instead of ProductsAPI
      const updated = await client.getNode(localProduct.id);
      setLocalProduct(updated as Product);
      onProductUpdated?.(updated as Product);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEdit = () => {
    setShowEditDialog(true);
  };

  const handleProductUpdate = async (productId: string, input: { name?: string; settings: ProductSettings }) => {
    try {
      // Update name if provided
      if (input.name) {
        await client.updateNode(productId, { name: input.name });
      }
      // Update settings (uses PATCH endpoint for deep merge)
      const updatedProduct = await client.updateNodeSettings(productId, input.settings);

      // Update local state
      setLocalProduct(updatedProduct as Product);

      // Close dialog
      setShowEditDialog(false);

      // Notify parent
      onProductUpdated?.(updatedProduct as Product);
    } catch (err) {
      console.error('[ProductOverviewTab] Update error:', err);
      throw err;
    }
  };

  return (
    <div className="h-full p-6">
      <div className="max-w-4xl space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Product Details</h3>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleEdit}
              variant="outline"
              size="sm"
              title="Edit Product"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Main Product Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Product Name</label>
                <p className="mt-1 text-base">{localProduct.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Product Code</label>
                <p className="mt-1 font-mono text-base">
                  {localProduct.settings?.productCode || '—'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Category</label>
                <p className="mt-1 text-base capitalize">
                  {localProduct.settings?.category || '—'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <ProductStatusBadge status={localProduct.settings?.status} />
                </div>
              </div>
            </div>

            {localProduct.settings?.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="mt-1 text-base text-muted-foreground">
                  {localProduct.settings.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Price</label>
                <p className="mt-1 text-2xl font-semibold">
                  {localProduct.settings?.price
                    ? `$${Number(localProduct.settings.price).toFixed(2)}`
                    : '—'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Currency</label>
                <p className="mt-1 text-base">{localProduct.settings?.currency || 'USD'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Info (for hardware) */}
        {localProduct.settings?.category === 'hardware' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Hardware Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {localProduct.settings?.sku && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">SKU</label>
                    <p className="mt-1 font-mono text-base">{localProduct.settings.sku}</p>
                  </div>
                )}

                {localProduct.settings?.manufacturer && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Manufacturer
                    </label>
                    <p className="mt-1 text-base">{localProduct.settings.manufacturer}</p>
                  </div>
                )}

                {localProduct.settings?.modelNumber && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Model Number
                    </label>
                    <p className="mt-1 font-mono text-base">{localProduct.settings.modelNumber}</p>
                  </div>
                )}

                {localProduct.settings?.weight && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Weight</label>
                    <p className="mt-1 text-base">{localProduct.settings.weight} kg</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Software Info (for software) */}
        {localProduct.settings?.category === 'software' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Software Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {localProduct.settings?.version && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Version</label>
                    <p className="mt-1 font-mono text-base">{localProduct.settings.version}</p>
                  </div>
                )}

                {localProduct.settings?.licenseType && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      License Type
                    </label>
                    <p className="mt-1 text-base capitalize">{localProduct.settings.licenseType}</p>
                  </div>
                )}

                {localProduct.settings?.platform && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Platform</label>
                    <p className="mt-1 text-base">{localProduct.settings.platform}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Node ID</label>
                <p className="mt-1 font-mono text-sm">{localProduct.id}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Node Type</label>
                <p className="mt-1 font-mono text-sm">{localProduct.type}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      {showEditDialog && (
        <EditProductDialogSDK
          orgId={orgId}
          deviceId={deviceId}
          baseUrl={baseUrl}
          token={token}
          product={localProduct}
          open={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          onSubmit={handleProductUpdate}
        />
      )}
    </div>
  );
}
