/**
 * Edit Product Dialog (SDK Version)
 *
 * Uses MultiSettingsDialog from @rubix-sdk/frontend for schema-driven forms
 */

import { useMemo } from 'react';

// @ts-ignore - SDK types are resolved at build time
import { MultiSettingsDialog } from '@rubix-sdk/frontend/components/settings';

import { useProductSchemas } from '@features/product/hooks/use-product-schemas';
import { Product } from '@features/product/types/product.types';
import type { UpdateProductInput } from '@features/product/api/product-api';

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
    console.log('[EditProductDialogSDK] Form submitted:', { settings, schemaName, productId: product.id });

    try {
      // MultiSettingsDialog returns flat settings like { productCode: "...", category: "..." }
      // UpdateProductInput.settings expects the same flat structure
      // DO NOT wrap in another settings key - that causes infinite nesting!
      const input: UpdateProductInput = {
        settings: {
          ...settings,
          productType: schemaName,
        },
      };

      console.log('[EditProductDialogSDK] Calling onSubmit with:', input);
      await onSubmit(product.id, input);

      console.log('[EditProductDialogSDK] Submit successful, closing dialog');
      onClose();
    } catch (err) {
      console.error('[EditProductDialogSDK] Submit FAILED:', err);
      // Don't throw - parent will handle the error and show alert
      // Just log it here for debugging
    }
  };

  // Memoize settings to prevent infinite re-renders in MultiSettingsDialog
  const { currentSchema, cleanSettings } = useMemo(() => {
    const schema = product.settings?.productType || 'hardware';

    // Extract current settings, handling corrupted nested data from previous bugs
    let settings = product.settings || {};

    // If settings contains a nested "settings" key (from previous bug), unwrap it
    if (settings.settings && typeof settings.settings === 'object') {
      console.warn('[EditProductDialogSDK] Detected nested settings, unwrapping...', settings);
      settings = settings.settings;
    }

    // Remove the "name" field if it exists (it's not a setting, it's the node name)
    const { name: _unused, ...clean } = settings;

    return {
      currentSchema: schema,
      cleanSettings: clean,
    };
  }, [product.settings]);

  // IMPORTANT: Never return null when open=true! This prevents mount/unmount crashes.
  // Only return null when dialog is actually closed
  if (!open) {
    return null;
  }

  // When open, ALWAYS render something - even during loading or error
  // This keeps the component mounted and prevents white screen crashes

  console.log('[EditProductDialogSDK] Rendering:', {
    loading,
    error: error?.message,
    schemasCount: schemas.length,
    open,
  });

  // If we don't have schemas yet, show dialog anyway (it might handle it gracefully)
  // or the loading state will be visible
  return (
    <MultiSettingsDialog
      open={open}
      onOpenChange={onClose}
      title="Edit Product"
      description={`Editing: ${product.name}`}
      schemas={schemas}
      defaultSchema={currentSchema}
      currentSettings={cleanSettings}
      onSubmit={handleSubmit}
    />
  );
}
