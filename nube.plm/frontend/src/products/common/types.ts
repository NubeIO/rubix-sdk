/**
 * Product domain types
 */

import type { Node } from '../../../../../frontend-sdk/ras/types';

export interface ProductSettings {
  productCode?: string;
  description?: string;
  productType?: ProductType;
  status?: ProductStatus;
  price?: number;
  [key: string]: unknown;
}

export type Product = Node & {
  id: string;
  name: string;
  settings?: ProductSettings;
};

export type ProductType = 'software' | 'hardware';

export const PRODUCT_TYPES: ProductType[] = ['software', 'hardware'];

export type ProductStatus = 'Design' | 'Prototype' | 'Production' | 'Discontinued';

export const PRODUCT_STATUSES: ProductStatus[] = [
  'Design',
  'Prototype',
  'Production',
  'Discontinued',
];

export interface ProductFormData {
  name: string;
  productCode: string;
  description: string;
  productType: ProductType;
  status: ProductStatus;
  price: string;
}

export type ProductFormErrors = Partial<Record<keyof ProductFormData, string>>;

export const DEFAULT_FORM_DATA: ProductFormData = {
  name: '',
  productCode: '',
  description: '',
  productType: 'software',
  status: 'Design',
  price: '',
};
