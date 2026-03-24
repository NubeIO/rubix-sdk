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

import type { Product } from '../common/types';
import { ProductStatusBadge } from '../components/product-status-badge';
import { EditProductDialogSDK } from '../dialogs/edit-product-dialog-sdk';

interface ProductOverviewTabProps {
  product: Product;
  orgId: string;
  deviceId: string;
  baseUrl?: string;
  token?: string;
  onProductUpdated?: () => void;
}

export function ProductOverviewTab({
  product,
  orgId,
  deviceId,
  baseUrl,
  token,
  onProductUpdated,
}: ProductOverviewTabProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    window.location.reload();
  };

  const handleEdit = () => {
    setShowEditDialog(true);
  };

  const handleProductUpdate = async (productId: string, input: any) => {
    try {
      const url = `${baseUrl}/orgs/${orgId}/devices/${deviceId}/nodes/${productId}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(`Failed to update product: ${response.status}`);
      }

      setShowEditDialog(false);
      onProductUpdated?.();
      window.location.reload();
    } catch (err) {
      console.error('[ProductOverviewTab] Update error:', err);
      throw err;
    }
  };

  return (
    <div className="relative h-full p-6">
      {/* Refresh Button */}
      <div className="absolute right-6 top-6">
        <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Product Details</h3>
          <Button onClick={handleEdit} variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit Product
          </Button>
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
                <p className="mt-1 text-base">{product.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Product Code</label>
                <p className="mt-1 font-mono text-base">
                  {product.settings?.productCode || '—'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Category</label>
                <p className="mt-1 text-base capitalize">
                  {product.settings?.category || '—'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <ProductStatusBadge status={product.settings?.status} />
                </div>
              </div>
            </div>

            {product.settings?.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="mt-1 text-base text-muted-foreground">
                  {product.settings.description}
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
                  {product.settings?.price
                    ? `$${Number(product.settings.price).toFixed(2)}`
                    : '—'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Currency</label>
                <p className="mt-1 text-base">{product.settings?.currency || 'USD'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Info (for hardware) */}
        {product.settings?.category === 'hardware' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Hardware Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {product.settings?.sku && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">SKU</label>
                    <p className="mt-1 font-mono text-base">{product.settings.sku}</p>
                  </div>
                )}

                {product.settings?.manufacturer && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Manufacturer
                    </label>
                    <p className="mt-1 text-base">{product.settings.manufacturer}</p>
                  </div>
                )}

                {product.settings?.modelNumber && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Model Number
                    </label>
                    <p className="mt-1 font-mono text-base">{product.settings.modelNumber}</p>
                  </div>
                )}

                {product.settings?.weight && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Weight</label>
                    <p className="mt-1 text-base">{product.settings.weight} kg</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Software Info (for software) */}
        {product.settings?.category === 'software' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Software Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {product.settings?.version && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Version</label>
                    <p className="mt-1 font-mono text-base">{product.settings.version}</p>
                  </div>
                )}

                {product.settings?.licenseType && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      License Type
                    </label>
                    <p className="mt-1 text-base capitalize">{product.settings.licenseType}</p>
                  </div>
                )}

                {product.settings?.platform && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Platform</label>
                    <p className="mt-1 text-base">{product.settings.platform}</p>
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
                <p className="mt-1 font-mono text-sm">{product.id}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Node Type</label>
                <p className="mt-1 font-mono text-sm">{product.type}</p>
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
          product={product}
          open={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          onSubmit={handleProductUpdate}
        />
      )}
    </div>
  );
}
