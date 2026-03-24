/**
 * Product BOM (Bill of Materials) Tab
 * Shows component list with ability to add/edit/delete items
 */

import { useState, useEffect } from 'react';

// @ts-ignore - SDK components
import { Button } from '@rubix-sdk/frontend/common/ui/button';
import { Card } from '@rubix-sdk/frontend/common/ui/card';
// @ts-ignore - SDK icons
import { Plus, Trash2, Package, RefreshCw } from 'lucide-react';

import type { Product } from '../common/types';
import type { Node } from '../../../../../frontend-sdk/ras/types';

interface BOMItem extends Node {
  settings?: {
    partNumber?: string;
    description?: string;
    quantity?: number;
    unitPrice?: number;
    [key: string]: unknown;
  };
}

interface ProductBOMTabProps {
  product: Product;
  orgId: string;
  deviceId: string;
  baseUrl?: string;
  token?: string;
}

export function ProductBOMTab({
  product,
  orgId,
  deviceId,
  baseUrl = '',
  token,
}: ProductBOMTabProps) {
  const [bomItems, setBomItems] = useState<BOMItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch BOM items (child nodes of the product)
  const fetchBOMItems = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = `${baseUrl}/orgs/${orgId}/devices/${deviceId}/nodes/${product.id}/children`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch BOM items: ${response.status}`);
      }

      const data = await response.json();

      // Filter to only show BOM-related nodes (you can define specific types later)
      const items = Array.isArray(data) ? data : [];
      setBomItems(items);
    } catch (err) {
      console.error('[ProductBOMTab] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load BOM items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBOMItems();
  }, [product.id, orgId, deviceId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    await fetchBOMItems();
    setIsRefreshing(false);
  };

  const handleAddComponent = async () => {
    try {
      const url = `${baseUrl}/orgs/${orgId}/devices/${deviceId}/nodes`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const newComponent = {
        name: 'New Component',
        type: 'core.folder', // Using folder for now - can create plm.bom-item type later
        parentId: product.id,
        settings: {
          partNumber: '',
          description: 'Component description',
          quantity: 1,
          unitPrice: 0,
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(newComponent),
      });

      if (!response.ok) {
        throw new Error(`Failed to create component: ${response.status}`);
      }

      // Refresh the list
      await fetchBOMItems();
    } catch (err) {
      console.error('[ProductBOMTab] Create error:', err);
      alert(err instanceof Error ? err.message : 'Failed to create component');
    }
  };

  const handleDeleteComponent = async (componentId: string) => {
    if (!confirm('Are you sure you want to delete this component?')) {
      return;
    }

    try {
      const url = `${baseUrl}/orgs/${orgId}/devices/${deviceId}/nodes/${componentId}`;
      const headers: Record<string, string> = {};

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to delete component: ${response.status}`);
      }

      // Refresh the list
      await fetchBOMItems();
    } catch (err) {
      console.error('[ProductBOMTab] Delete error:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete component');
    }
  };

  // Calculate total BOM cost
  const totalCost = bomItems.reduce((sum, item) => {
    const qty = item.settings?.quantity || 0;
    const price = item.settings?.unitPrice || 0;
    return sum + qty * price;
  }, 0);

  return (
    <div className="relative h-full p-6">
      {/* Refresh Button */}
      <div className="absolute right-6 top-6">
        <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">Bill of Materials</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Components and assemblies for {product.name}
            </p>
          </div>
        </div>

        {/* Add Component Button */}
        <Card className="p-4">
          <Button onClick={handleAddComponent} variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Component
          </Button>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading components...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card className="border-destructive bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && bomItems.length === 0 && (
          <Card className="p-12">
            <div className="text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No components yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Add components to build your bill of materials
              </p>
              <Button onClick={handleAddComponent} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add First Component
              </Button>
            </div>
          </Card>
        )}

        {/* BOM Table */}
        {!loading && !error && bomItems.length > 0 && (
          <>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-medium">Part #</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Description</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Qty</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Unit Price</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Total</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bomItems.map((item) => {
                      const qty = item.settings?.quantity || 0;
                      const price = item.settings?.unitPrice || 0;
                      const total = qty * price;

                      return (
                        <tr key={item.id} className="border-b hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <span className="font-mono text-sm">
                              {item.settings?.partNumber || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-medium">{item.name}</p>
                              {item.settings?.description && (
                                <p className="text-xs text-muted-foreground">
                                  {item.settings.description}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm">{qty}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm">${price.toFixed(2)}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-medium">${total.toFixed(2)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteComponent(item.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Total Cost */}
            <Card className="bg-muted/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Total BOM Cost</span>
                <span className="text-2xl font-bold">${totalCost.toFixed(2)}</span>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
