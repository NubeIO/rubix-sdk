/**
 * Product Detail View - SettingsSection layout
 * Matches Rubix Node Overview pattern with lazy loading
 */

import { useState } from 'react';

// @ts-ignore - SDK components
import { Button } from '@rubix-sdk/frontend/common/ui/button';
// @ts-ignore - SDK icons
import { Copy, Info } from 'lucide-react';

import type { Product } from '@features/product/types/product.types';
import { EditProductDialogSDK } from '@features/product/components/edit-product-dialog-sdk';
import { ProductStatusBadge } from '@features/product/components/ProductStatusBadge';
import { BasicInfoSection } from '@features/product/components/sections/BasicInfoSection-v2';
import { PricingSection } from '@features/product/components/sections/PricingSection-v2';
import { HardwareDetailsSection } from '@features/product/components/sections/HardwareDetailsSection-v2';
import { SoftwareDetailsSection } from '@features/product/components/sections/SoftwareDetailsSection-v2';
import { BOMSection } from '@features/product/components/sections/BOMSection';
import { SystemInfoSection } from '@features/product/components/sections/SystemInfoSection-v2';
import { TasksSection } from '@features/product/components/sections/TasksSection';

interface ProductDetailViewProps {
  product: Product;
  orgId: string;
  deviceId: string;
  baseUrl?: string;
  token?: string;
  onProductUpdated?: (product: Product) => void;
}

export function ProductDetailView({
  product,
  orgId,
  deviceId,
  baseUrl,
  token,
  onProductUpdated,
}: ProductDetailViewProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [bomCost, setBomCost] = useState<number>(0);
  const [bomComponentCount, setBomComponentCount] = useState<number>(0);

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['basic-info'])
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
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
      console.error('[ProductDetailView] Update error:', err);
      throw err;
    }
  };

  const handleBOMCostChange = (cost: number, componentCount: number) => {
    setBomCost(cost);
    setBomComponentCount(componentCount);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
  };

  const infoItems = [
    { label: 'Product Code', value: product.settings?.productCode || '—' },
    { label: 'Category', value: product.settings?.category || '—' },
    { label: 'Node ID', value: product.id },
    { label: 'Node Type', value: product.type },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Content - scrollable */}
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-5xl space-y-3">
          {/* Product Info Card - Always visible */}
          <div className="rounded-lg border bg-card p-5">
            <div className="flex items-start gap-4 mb-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Info className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold">{product.name}</h3>
                <div className="mt-1 flex items-center gap-2">
                  <ProductStatusBadge status={product.settings?.status} />
                  <span className="text-muted-foreground text-xs">
                    {product.settings?.category || 'Product'}
                  </span>
                </div>
              </div>
              <Button size="sm" variant="outline" title="Edit Product" onClick={() => setShowEditDialog(true)}>
                Edit
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {infoItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => copyToClipboard(item.value, item.label)}
                  className="group flex items-center justify-between rounded-md bg-muted/50 px-3 py-2.5 text-left transition-colors hover:bg-muted"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
                      {item.label}
                    </p>
                    <p className="font-mono text-xs mt-0.5 truncate">{item.value}</p>
                  </div>
                  <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground ml-2" />
                </button>
              ))}
            </div>
          </div>

          {/* Sections */}
          <BasicInfoSection
            product={product}
            isExpanded={expandedSections.has('basic-info')}
            onToggle={() => toggleSection('basic-info')}
            onEdit={() => setShowEditDialog(true)}
          />

          <PricingSection
            product={product}
            bomCost={bomCost}
            bomComponentCount={bomComponentCount}
            isExpanded={expandedSections.has('pricing')}
            onToggle={() => toggleSection('pricing')}
          />

          <HardwareDetailsSection
            product={product}
            isExpanded={expandedSections.has('hardware')}
            onToggle={() => toggleSection('hardware')}
          />

          <SoftwareDetailsSection
            product={product}
            isExpanded={expandedSections.has('software')}
            onToggle={() => toggleSection('software')}
          />

          <BOMSection
            product={product}
            orgId={orgId}
            deviceId={deviceId}
            baseUrl={baseUrl}
            token={token}
            isExpanded={expandedSections.has('bom')}
            onToggle={() => toggleSection('bom')}
            onBOMCostChange={handleBOMCostChange}
          />

          <TasksSection
            product={product}
            orgId={orgId}
            deviceId={deviceId}
            baseUrl={baseUrl}
            token={token}
            isExpanded={expandedSections.has('tasks')}
            onToggle={() => toggleSection('tasks')}
          />

          <SystemInfoSection
            product={product}
            isExpanded={expandedSections.has('system')}
            onToggle={() => toggleSection('system')}
          />
        </div>
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
