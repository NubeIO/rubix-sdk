import { useState, useEffect } from 'react';

// @ts-ignore - SDK components
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@rubix-sdk/frontend/common/ui/collapsible';
import { Button } from '@rubix-sdk/frontend/common/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@rubix-sdk/frontend/common/ui/table';
// @ts-ignore - SDK icons
import { ChevronDown, ListTree, Plus, Edit, Trash2, Package } from 'lucide-react';

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
  defaultOpen?: boolean;
  onBOMCostChange?: (cost: number, componentCount: number) => void;
}

export function BOMSection({
  product,
  orgId,
  deviceId,
  baseUrl = '',
  token,
  defaultOpen = true,
  onBOMCostChange,
}: BOMSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [bomComponents, setBomComponents] = useState<BOMComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingComponent, setEditingComponent] = useState<BOMComponent | null>(null);

  if (product.settings?.category !== 'hardware') {
    return null;
  }

  const fetchBOMComponents = async () => {
    setLoading(true);

    try {
      const url = `${baseUrl}/orgs/${orgId}/devices/${deviceId}/nodes`;
      const params = new URLSearchParams({
        type: 'core.document',
        parentId: product.id,
        identity: 'document,bom,component',
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
      const components = Array.isArray(data) ? data : [];
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
    if (isOpen) {
      fetchBOMComponents();
    }
  }, [product.id, orgId, deviceId, isOpen]);

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
        type: 'core.document',
        parentId: product.id,
        identity: ['document', 'bom', 'component'],
        settings: {
          documentType: 'bom-component',
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

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex w-full items-center gap-2 border-b px-6 py-3 hover:bg-muted/50">
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? '' : '-rotate-90'}`}
          />
          <ListTree className="h-4 w-4" />
          <span className="font-semibold">
            Bill of Materials {bomComponents.length > 0 && `(${bomComponents.length})`}
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent className="border-b px-6 py-4">
          {loading && (
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

          {!loading && bomComponents.length > 0 && (
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

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead>Part Number</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bomComponents.map((component) => {
                    const qty = component.settings?.quantity || 0;
                    const unitCost = component.settings?.unitCost || 0;
                    const total = qty * unitCost;

                    return (
                      <TableRow key={component.id}>
                        <TableCell className="font-medium">{component.name}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {component.settings?.partNumber || '—'}
                        </TableCell>
                        <TableCell className="text-right">{qty}</TableCell>
                        <TableCell className="text-right">
                          ${unitCost.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ${total.toFixed(2)}
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4} className="font-semibold">
                      Total ({bomComponents.length} component{bomComponents.length !== 1 ? 's' : ''})
                    </TableCell>
                    <TableCell className="text-right text-lg font-bold">
                      ${totalBOMCost.toFixed(2)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

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
