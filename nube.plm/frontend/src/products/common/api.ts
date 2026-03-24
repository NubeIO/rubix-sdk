/**
 * Product API methods
 */

import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';
import { Product, ProductFormData, ProductSettings } from './types';

export interface PLMClientConfig {
  orgId: string;
  deviceId: string;
  baseUrl?: string;
  token?: string;
}

export interface CreateProductInput {
  name: string;
  parentId: string;
  settings: ProductSettings;
}

export interface UpdateProductInput {
  name?: string;
  settings: ProductSettings;
}

export class ProductsAPI {
  private client: ReturnType<typeof createPluginClient>;

  constructor(config: PLMClientConfig) {
    this.client = createPluginClient(config);
  }

  async queryProducts(): Promise<Product[]> {
    const filter = 'type is "plm.product"';
    const nodes = await this.client.queryNodes({ filter });
    console.log('[ProductsAPI] Query result:', nodes);
    console.log('[ProductsAPI] First product:', nodes[0]);
    console.log('[ProductsAPI] First product ID:', nodes[0]?.id);
    console.log('[ProductsAPI] First product name:', nodes[0]?.name);
    console.log('[ProductsAPI] First product settings:', nodes[0]?.settings);
    return nodes as Product[];
  }

  async createProduct(input: CreateProductInput): Promise<Product> {
    const node = await this.client.createNode({
      type: 'plm.product',
      name: input.name,
      parentId: input.parentId,
      settings: input.settings,
    });
    return node as Product;
  }

  async updateProduct(productId: string, input: UpdateProductInput): Promise<Product> {
    // Use settingsPatch endpoint for more efficient settings-only updates
    // This uses PATCH /nodes/{id}/settings instead of PUT /nodes/{id}
    const settingsUpdate: Record<string, unknown> = { ...input.settings };

    // If name is provided and different, include it in the settings update
    // The backend will handle synchronizing it with node.name if needed
    if (input.name !== undefined) {
      settingsUpdate.name = input.name;
    }

    const node = await this.client.updateNodeSettings(productId, settingsUpdate);
    return node as Product;
  }

  async deleteProduct(productId: string): Promise<void> {
    await this.client.deleteNode(productId);
  }
}

export function formDataToProductInput(
  formData: ProductFormData,
  parentId: string
): CreateProductInput {
  // Extract settings from the nested structure (from MultiSettingsDialog)
  const settings = (formData as unknown as { settings?: ProductSettings }).settings || {};

  return {
    name: formData.name,
    parentId,
    settings: settings, // Pass through all settings from the schema
  };
}

export function formDataToUpdateInput(formData: ProductFormData): UpdateProductInput {
  return {
    name: formData.name,
    settings: {
      productCode: formData.productCode,
      description: formData.description || undefined,
      productType: formData.productType,
      status: formData.status,
      price: formData.price ? parseFloat(formData.price) : undefined,
    },
  };
}
