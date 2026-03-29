/**
 * BOM Section V2 - Modern Bill of Materials table with popovers
 */

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
// @ts-ignore - SDK button
import { Button } from '@rubix-sdk/frontend/common/ui/button';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { Product } from '../../types/product.types';
import { AddBOMItemDialog } from '../components/AddBOMItemDialog';

interface BOMItem {
  id: string;
  name: string;
  partCode: string;
  description: string;
  quantity: number;
  unit: string;
  status: string;
  unitCost: number;
}

interface BOMSectionV2Props {
  product: Product;
  client: any;
  onStatsUpdate: (stats: any) => void;
}

export function BOMSectionV2({ product, client, onStatsUpdate }: BOMSectionV2Props) {
  const [bomItems, setBomItems] = useState<BOMItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    fetchBOMItems();
  }, [product.id]);

  const fetchBOMItems = async () => {
    try {
      setIsLoading(true);
      console.log('[BOMSectionV2] Fetching BOM items for product:', product.id);

      // Query for BOM items
      const result = await client.queryNodes({
        filter: `parent.id is "${product.id}" and type is "plm.bom"`,
      });

      console.log('[BOMSectionV2] Query result:', result);
      console.log('[BOMSectionV2] Found nodes:', result.nodes?.length || 0);

      // Filter by profile if needed (some may not have profile set)
      const bomNodes = (result.nodes || []).filter((node: any) =>
        !node.profile || node.profile === 'plm-bom'
      );

      console.log('[BOMSectionV2] BOM nodes after profile filter:', bomNodes.length);

      const items: BOMItem[] = bomNodes.map((node: any) => ({
        id: node.id,
        name: node.name,
        partCode: node.name || node.settings?.partCode || 'N/A',
        description: node.settings?.description || '',
        quantity: parseFloat(node.settings?.quantity) || 0,
        unit: node.settings?.unit || 'pcs',
        status: node.settings?.status || 'Pending',
        unitCost: parseFloat(node.settings?.unitCost) || 0,
      }));

      console.log('[BOMSectionV2] Processed BOM items:', items);
      setBomItems(items);

      // Update stats
      const statsUpdate = {
        bomItemsCount: items.length,
        bomItemsPending: items.filter(item => item.status === 'Pending').length,
        totalCost: items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0),
      };
      console.log('[BOMSectionV2] Updating stats:', statsUpdate);
      onStatsUpdate(statsUpdate);
    } catch (err) {
      console.error('[BOMSectionV2] Failed to fetch BOM items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = bomItems.filter(item =>
    item.partCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleAddBOMItem = async (bomItem: {
    partCode: string;
    description: string;
    quantity: number;
    unit: string;
    unitCost: number;
    status: string;
  }) => {
    console.log('[BOMSectionV2] Adding BOM item:', bomItem);

    // Create BOM item using SDK
    await client.createNode(product.id, {
      type: 'core.document',
      profile: 'plm-bom',
      name: bomItem.partCode,
      settings: {
        documentType: 'bom-item',
        description: bomItem.description,
        quantity: bomItem.quantity,
        unit: bomItem.unit,
        unitCost: bomItem.unitCost,
        status: bomItem.status,
      },
    });

    // Refresh BOM items
    await fetchBOMItems();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bill of Materials</h2>
          <p className="text-sm text-muted-foreground">
            Manage components and materials for this product
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      <Card>
        {/* Header with search */}
        <div className="border-b p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search parts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Part Code</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Description</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-right">Qty</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Unit</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Status</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-right">Unit Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Loading BOM items...
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No BOM items found. Add your first component to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id} className="hover:bg-primary/5 transition-colors">
                    <TableCell className="font-mono text-xs font-medium">
                      <button className="text-primary hover:underline">
                        {item.partCode}
                      </button>
                    </TableCell>
                    <TableCell className="text-sm">{item.description || '—'}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{item.quantity}</TableCell>
                    <TableCell className="text-sm">{item.unit}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          item.status === 'Released'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(item.unitCost)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        {filteredItems.length > 0 && (
          <div className="border-t p-4 text-sm text-muted-foreground">
            Showing {filteredItems.length} of {bomItems.length} items
          </div>
        )}
      </Card>

      {/* Add BOM Item Dialog */}
      <AddBOMItemDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={handleAddBOMItem}
      />
    </div>
  );
}
