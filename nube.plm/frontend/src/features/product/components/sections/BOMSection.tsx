import { useState, useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

// @ts-ignore - SDK components
import { SettingsSection } from '@rubix-sdk/frontend/common/ui/settings-section';
import { Button } from '@rubix-sdk/frontend/common/ui/button';
// @ts-ignore - SDK icons
import { ListTree, Plus, Edit, Trash2, Package } from 'lucide-react';

import type { Product } from '@features/product/types/product.types';
import type { Node } from '../../../../../../frontend-sdk/ras/types';
import { BOMComponentDialog } from './BOMComponentDialog';

interface BOMComponent extends Node {
  settings?: {
    documentType?: string;
    partNumber?: string;
    quantity?: number;
    unitCost?: number;
    supplier?: string;
    description?: string;
    [key: string]: unknown;
  };
}

interface BOMSectionProps {
  product: Product;
  orgId: string;
  deviceId: string;
  baseUrl?: string;
  token?: string;
  isExpanded: boolean;
  onToggle: () => void;
  onBOMCostChange?: (cost: number, componentCount: number) => void;
}

export function BOMSection({
  product,
  orgId,
  deviceId,
  baseUrl = '',
  token,
  isExpanded,
  onToggle,
  onBOMCostChange,
}: BOMSectionProps) {
  const [bomComponents, setBomComponents] = useState<BOMComponent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingComponent, setEditingComponent] = useState<BOMComponent | null>(null);

  const parentRef = useRef<HTMLDivElement>(null);

  if (product.settings?.category !== 'hardware') {
    return null;
  }

  const fetchBOMComponents = async () => {
    setLoading(true);

    try {
      const url = `${baseUrl}/orgs/${orgId}/devices/${deviceId}/nodes`;
      const params = new URLSearchParams({
        type: 'core.component',
        parentId: product.id,
        identity: 'bom,component,plm',
      });

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${url}?${params}`, { headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch BOM components: ${response.status}`);
      }

      const data = await response.json();
      const components = Array.isArray(data.data) ? data.data : [];
      setBomComponents(components);

      const totalCost = components.reduce((sum, comp) => {
        const qty = comp.settings?.quantity || 0;
        const cost = comp.settings?.unitCost || 0;
        return sum + qty * cost;
      }, 0);

      onBOMCostChange?.(totalCost, components.length);
    } catch (err) {
      console.error('[BOMSection] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isExpanded) {
      fetchBOMComponents();
    }
  }, [product.id, orgId, deviceId, isExpanded]);

  const handleAddComponent = async (componentData: any) => {
    try {
      const url = `${baseUrl}/orgs/${orgId}/devices/${deviceId}/nodes`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const newComponent = {
        name: componentData.name,
        type: 'core.component',
        parentId: product.id,
        identity: ['bom', 'component', 'plm'],
        settings: {
          partNumber: componentData.partNumber || '',
          quantity: componentData.quantity || 1,
          unitCost: componentData.unitCost || 0,
          supplier: componentData.supplier || '',
          description: componentData.description || '',
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

      setShowAddDialog(false);
      await fetchBOMComponents();
    } catch (err) {
      console.error('[BOMSection] Create error:', err);
      throw err;
    }
  };

  const handleEditComponent = async (componentId: string, componentData: any) => {
    try {
      const url = `${baseUrl}/orgs/${orgId}/devices/${deviceId}/nodes/${componentId}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const updates = {
        name: componentData.name,
        settings: {
          partNumber: componentData.partNumber || '',
          quantity: componentData.quantity || 1,
          unitCost: componentData.unitCost || 0,
          supplier: componentData.supplier || '',
          description: componentData.description || '',
        },
      };

      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update component: ${response.status}`);
      }

      setEditingComponent(null);
      await fetchBOMComponents();
    } catch (err) {
      console.error('[BOMSection] Update error:', err);
      throw err;
    }
  };

  const handleDeleteComponent = async (componentId: string, componentName: string) => {
    if (!confirm(`Delete ${componentName}?`)) {
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

      await fetchBOMComponents();
    } catch (err) {
      console.error('[BOMSection] Delete error:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete component');
    }
  };

  const totalBOMCost = bomComponents.reduce((sum, component) => {
    const quantity = component.settings?.quantity || 0;
    const unitCost = component.settings?.unitCost || 0;
    return sum + quantity * unitCost;
  }, 0);

  const rowVirtualizer = useVirtualizer({
    count: bomComponents.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 10,
  });

  return (
    <>
      <SettingsSection
        id="bom"
        title="Bill of Materials"
        description="Components and assemblies for this product"
        icon={ListTree}
        iconBgColor="bg-amber-500"
        iconTextColor="text-white"
        isExpanded={isExpanded}
        onToggle={onToggle}
        badgeCount={bomComponents.length}
        onRefresh={isExpanded ? fetchBOMComponents : undefined}
        isRefreshing={loading}
      >
        {loading && bomComponents.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading components...</p>
            </div>
          </div>
        )}

        {!loading && bomComponents.length === 0 && (
          <div className="py-8 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No components yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Add components to build your bill of materials
            </p>
            <Button onClick={() => setShowAddDialog(true)} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Add Component
            </Button>
          </div>
        )}

        {bomComponents.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {bomComponents.length} component{bomComponents.length !== 1 ? 's' : ''}
              </p>
              <Button onClick={() => setShowAddDialog(true)} size="sm">
                <Plus className="mr-2 h-3 w-3" />
                Add Component
              </Button>
            </div>

            {/* Virtualized Table */}
            <div
              ref={parentRef}
              className="rounded-md border"
              style={{ height: Math.min(bomComponents.length * 48 + 40, 400), overflow: 'auto' }}
            >
              <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
                {/* Table Header */}
                <div className="sticky top-0 z-10 flex border-b bg-muted/50 text-sm font-medium">
                  <div className="flex-1 px-4 py-3">Component</div>
                  <div className="w-32 px-4 py-3">Part #</div>
                  <div className="w-20 px-4 py-3 text-right">Qty</div>
                  <div className="w-24 px-4 py-3 text-right">Unit Cost</div>
                  <div className="w-24 px-4 py-3 text-right">Total</div>
                  <div className="w-20 px-4 py-3"></div>
                </div>

                {/* Virtual Rows */}
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const component = bomComponents[virtualRow.index];
                  const qty = component.settings?.quantity || 0;
                  const unitCost = component.settings?.unitCost || 0;
                  const total = qty * unitCost;

                  return (
                    <div
                      key={component.id}
                      className="absolute left-0 top-0 flex w-full border-b hover:bg-muted/30"
                      style={{
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <div className="flex-1 px-4 py-3 text-sm font-medium">{component.name}</div>
                      <div className="w-32 px-4 py-3 font-mono text-sm">
                        {component.settings?.partNumber || '—'}
                      </div>
                      <div className="w-20 px-4 py-3 text-right text-sm">{qty}</div>
                      <div className="w-24 px-4 py-3 text-right text-sm">
                        ${unitCost.toFixed(2)}
                      </div>
                      <div className="w-24 px-4 py-3 text-right text-sm font-semibold">
                        ${total.toFixed(2)}
                      </div>
                      <div className="w-20 px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Edit"
                            onClick={() => setEditingComponent(component)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Delete"
                            onClick={() => handleDeleteComponent(component.id, component.name)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total Cost */}
            <div className="rounded-md border bg-muted/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">
                  Total ({bomComponents.length} component{bomComponents.length !== 1 ? 's' : ''})
                </span>
                <span className="text-lg font-bold">${totalBOMCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </SettingsSection>

      {showAddDialog && (
        <BOMComponentDialog
          open={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          onSubmit={handleAddComponent}
        />
      )}

      {editingComponent && (
        <BOMComponentDialog
          open={!!editingComponent}
          component={editingComponent}
          onClose={() => setEditingComponent(null)}
          onSubmit={(data) => handleEditComponent(editingComponent.id, data)}
        />
      )}
    </>
  );
}
