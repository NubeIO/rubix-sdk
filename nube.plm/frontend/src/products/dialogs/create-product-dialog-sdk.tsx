/**
 * Create Product Dialog (SDK Version)
 *
 * Uses MultiSettingsDialog from @rubix-sdk/frontend for schema-driven forms
 */

// @ts-ignore - SDK types are resolved at build time
import { MultiSettingsDialog } from '@rubix-sdk/frontend/components/settings';

import { useProductSchemas } from '../hooks/use-product-schemas';

import type { CreateProductInput } from '../common/api';

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
    return null; // Dialog will be hidden during schema loading
  }

  // Show error state
  if (error || schemas.length === 0) {
    console.error('[CreateProductDialogSDK] Schema error:', error || 'No schemas available');
    return null; // Could render an error dialog here
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
