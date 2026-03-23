/**
 * Edit Product Dialog (SDK Version)
 *
 * Uses MultiSettingsDialog from @rubix-sdk/frontend for schema-driven forms
 */

// @ts-ignore - SDK types are resolved at build time
import { MultiSettingsDialog } from '@rubix-sdk/frontend/components/settings';

import { useProductSchemas } from '../hooks/use-product-schemas';
import { Product } from '../common/types';
import type { UpdateProductInput } from '../common/api';

export interface EditProductDialogProps {
  orgId: string;
  deviceId: string;
  baseUrl?: string;
  token?: string;
  product: Product; // Product being edited
  open: boolean;
  onClose: () => void;
  onSubmit: (productId: string, input: UpdateProductInput) => Promise<void>;
}

export function EditProductDialogSDK({
  orgId,
  deviceId,
  baseUrl,
  token,
  product,
  open,
  onClose,
  onSubmit,
}: EditProductDialogProps) {
  // Fetch schemas from backend
  const { schemas, loading, error } = useProductSchemas({
    orgId,
    deviceId,
    nodeId: product.id, // Use existing product ID
    baseUrl,
    token,
    enabled: open,
  });

  // Debug logging
  console.log('[EditProductDialogSDK] State:', {
    open,
    productId: product.id,
    productName: product.name,
    productType: product.settings?.productType,
    loading,
    error,
    schemasCount: schemas.length,
    schemaNames: schemas.map(s => s.name),
    currentSettings: product.settings,
  });

  const handleSubmit = async (settings: Record<string, any>, schemaName: string) => {
    try {
      console.log('[EditProductDialogSDK] Submit:', { settings, schemaName });

      // Extract product name from productCode field
      const productName = settings.productCode || product.name;

      // Ensure productType is set
      const finalSettings = {
        ...settings,
        productType: schemaName, // Update/preserve which schema was used
      };

      const input = {
        name: productName,
        settings: finalSettings,
      };

      console.log('[EditProductDialogSDK] Submitting to API:', { productId: product.id, input });
      await onSubmit(product.id, input);

      onClose();
    } catch (err) {
      console.error('[EditProductDialogSDK] Submit error:', err);
      // Error handling is done by the parent component
      throw err;
    }
  };

  // Show loading state
  if (loading) {
    console.log('[EditProductDialogSDK] Loading schemas...');
    return null; // Dialog will be hidden during schema loading
  }

  // Show error state
  if (error || schemas.length === 0) {
    console.error('[EditProductDialogSDK] Schema error:', error || 'No schemas available');
    return null; // Could render an error dialog here
  }

  // Determine current schema from product settings
  const currentSchema = product.settings?.productType || 'hardware';

  // Current settings (exclude productType from form as it's automatically set)
  const currentSettings = product.settings || {};

  console.log('[EditProductDialogSDK] Rendering with schemas:', {
    currentSchema,
    schemas: schemas.map(s => ({ name: s.name, displayName: s.displayName })),
    currentSettings,
  });

  return (
    <MultiSettingsDialog
      open={open}
      onOpenChange={onClose}
      title="Edit Product"
      description={`Editing: ${product.name}`}
      schemas={schemas}
      defaultSchema={currentSchema}
      currentSettings={currentSettings}
      onSubmit={handleSubmit}
    />
  );
}
