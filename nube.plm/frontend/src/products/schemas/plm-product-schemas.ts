/**
 * PLM Product Schemas - Local definitions
 *
 * These schemas define the product forms without needing to query the backend.
 * They match the validation rules defined in config/nodes.yaml
 */

export interface SchemaInfo {
  name: string;
  displayName: string;
  description: string;
  isDefault: boolean;
  schema: Record<string, unknown>;
}

/**
 * Hardware Product Schema
 */
const hardwareSchema: Record<string, unknown> = {
  type: 'object',
  properties: {
    sku: {
      type: 'string',
      title: 'SKU',
      description: 'Product SKU (e.g., EDGE-001)',
      pattern: '^[A-Z0-9\\-]+$',
    },
    productName: {
      type: 'string',
      title: 'Product Name',
      description: 'Full product name',
    },
    manufacturer: {
      type: 'string',
      title: 'Manufacturer',
      description: 'Manufacturer name (e.g., NubeIO)',
    },
    category: {
      type: 'string',
      title: 'Category',
      description: 'Product category',
      enum: ['hardware', 'software', 'hybrid', 'firmware', 'bundle'],
      default: 'hardware',
    },
    price: {
      type: 'number',
      title: 'Price',
      description: 'Product price',
      minimum: 0,
    },
    currency: {
      type: 'string',
      title: 'Currency',
      description: 'Price currency',
      default: 'USD',
    },
    availability: {
      type: 'string',
      title: 'Availability',
      description: 'Product availability status',
      enum: ['in-development', 'prototype', 'production', 'discontinued', 'end-of-life'],
      default: 'in-development',
    },
  },
  required: ['sku', 'productName', 'manufacturer'],
};

/**
 * Software Product Schema
 */
const softwareSchema: Record<string, unknown> = {
  type: 'object',
  properties: {
    sku: {
      type: 'string',
      title: 'SKU',
      description: 'Product SKU (e.g., APP-CLOUD-001)',
      pattern: '^[A-Z0-9\\-]+$',
    },
    productName: {
      type: 'string',
      title: 'Product Name',
      description: 'Full product name',
    },
    manufacturer: {
      type: 'string',
      title: 'Manufacturer / Vendor',
      description: 'Software vendor name',
    },
    category: {
      type: 'string',
      title: 'Category',
      description: 'Product category',
      enum: ['hardware', 'software', 'hybrid', 'firmware', 'bundle'],
      default: 'software',
    },
    licenseType: {
      type: 'string',
      title: 'License Type',
      description: 'Software licensing model',
      enum: ['perpetual', 'subscription', 'saas', 'open-source', 'trial'],
    },
    price: {
      type: 'number',
      title: 'Price',
      description: 'License/subscription price',
      minimum: 0,
    },
    currency: {
      type: 'string',
      title: 'Currency',
      description: 'Price currency',
      default: 'USD',
    },
    availability: {
      type: 'string',
      title: 'Availability',
      description: 'Product availability status',
      enum: ['in-development', 'prototype', 'production', 'discontinued', 'end-of-life'],
      default: 'in-development',
    },
  },
  required: ['sku', 'productName', 'manufacturer'],
};

/**
 * All available product schemas
 */
export const PLM_PRODUCT_SCHEMAS: SchemaInfo[] = [
  {
    name: 'hardware',
    displayName: 'Hardware Product',
    description: 'Physical products (controllers, sensors, equipment)',
    isDefault: true,
    schema: hardwareSchema,
  },
  {
    name: 'software',
    displayName: 'Software Product',
    description: 'Digital products (applications, licenses, SaaS)',
    isDefault: false,
    schema: softwareSchema,
  },
];
