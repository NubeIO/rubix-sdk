/**
 * Create Product Dialog (SDK Version)
 *
 * Uses MultiSettingsDialog from @rubix-sdk/frontend for schema-driven forms
 */

// @ts-ignore - SDK types are resolved at build time
import { MultiSettingsDialog } from '@rubix-sdk/frontend/components/settings';
// @ts-ignore - SDK UI components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@rubix-sdk/frontend/common/ui/dialog';
// @ts-ignore - SDK UI components
import { Card } from '@rubix-sdk/frontend/common/ui/card';
// @ts-ignore - SDK icons
import { Loader2, AlertCircle } from 'lucide-react';

import { useProductSchemas } from '@features/product/hooks/use-product-schemas';

import type { CreateProductInput } from '@features/product/api/product-api';

export interface CreateProductDialogProps {
  orgId: string;
  deviceId: string;
  baseUrl?: string;
  token?: string;
  productsCollectionId: string; // Parent ID for new products
  templateNodeId?: string; // Optional: Existing product node to fetch schemas from
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateProductInput) => Promise<void>;
}

export function CreateProductDialogSDK({
  orgId,
  deviceId,
  baseUrl,
  token,
  productsCollectionId,
  templateNodeId,
  open,
  onClose,
  onSubmit,
}: CreateProductDialogProps) {
  // Fetch schemas from backend (use templateNodeId if provided)
  const { schemas, loading, error } = useProductSchemas({
    orgId,
    deviceId,
    nodeId: templateNodeId,
    baseUrl,
    token,
    enabled: open,
  });

  // Debug logging
  console.log('[CreateProductDialogSDK] State:', {
    open,
    orgId,
    deviceId,
    productsCollectionId,
    loading,
    error,
    schemasCount: schemas.length,
    schemaNames: schemas.map(s => s.name),
  });

  const handleSubmit = async (settings: Record<string, any>, schemaName: string) => {
    try {
      console.log('[CreateProductDialogSDK] Submit:', { settings, schemaName });

      // Extract product name from productCode field
      const productName = settings.productCode || 'New Product';

      // Ensure productType is set
      const finalSettings = {
        ...settings,
        productType: schemaName, // Store which schema was used
      };

      const input = {
        name: productName,
        parentId: productsCollectionId,
        settings: finalSettings,
      };

      console.log('[CreateProductDialogSDK] Submitting to API:', input);
      await onSubmit(input);

      onClose();
    } catch (err) {
      console.error('[CreateProductDialogSDK] Submit error:', err);
      // Error handling is done by the parent component
      throw err;
    }
  };

  // Show loading state
  if (loading) {
    console.log('[CreateProductDialogSDK] Loading schemas...');
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Product</DialogTitle>
            <DialogDescription>Loading product schemas...</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Loading...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show error state
  if (error || schemas.length === 0) {
    console.error('[CreateProductDialogSDK] Schema error:', error || 'No schemas available');
    const errorMessage = error || 'No schemas available for plm.product node type';

    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Product</DialogTitle>
            <DialogDescription>Unable to load product schemas</DialogDescription>
          </DialogHeader>
          <Card className="border-red-500 bg-red-50 dark:bg-red-950 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                  Schema Error
                </h3>
                <p className="text-sm text-red-800 dark:text-red-200 mb-3">{errorMessage}</p>
                <details className="text-xs text-red-700 dark:text-red-300">
                  <summary className="cursor-pointer font-medium hover:underline">
                    Show Debug Info
                  </summary>
                  <pre className="mt-2 rounded bg-red-100 dark:bg-red-900 p-2 text-xs overflow-auto">
                    {JSON.stringify({ orgId, deviceId, baseUrl, templateNodeId, error }, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          </Card>
        </DialogContent>
      </Dialog>
    );
  }

  // Find default schema
  const defaultSchema = schemas.find((s) => s.isDefault)?.name || schemas[0]?.name || 'hardware';

  console.log('[CreateProductDialogSDK] Rendering with schemas:', {
    defaultSchema,
    schemas: schemas.map(s => ({ name: s.name, displayName: s.displayName })),
  });

  return (
    <MultiSettingsDialog
      open={open}
      onOpenChange={onClose}
      title="Create Product"
      description="Select a product type and fill in the details"
      schemas={schemas}
      defaultSchema={defaultSchema}
      currentSettings={{}} // Empty for create
      onSubmit={handleSubmit}
    />
  );
}
