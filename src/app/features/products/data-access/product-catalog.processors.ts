import type { EntityDataProcessors } from '../../../shared/types/entity-data.types';
import type { Product, ProductListParams, ProductPayload } from '../types/product.types';

function optionalText(value: string | null): string | null {
  return value?.trim() || null;
}

function normalizeProductPayload(payload: ProductPayload): ProductPayload {
  return {
    ...payload,
    name: payload.name.trim(),
    brand: optionalText(payload.brand),
    category: optionalText(payload.category),
    barcode: optionalText(payload.barcode),
    description: optionalText(payload.description),
  };
}

function normalizeProduct(product: Product): Product {
  return {
    ...product,
    ...normalizeProductPayload(product),
  };
}

export const productCatalogProcessors: EntityDataProcessors<Product, ProductPayload, ProductListParams> = {
  beforeLoad: params => ({
    skip: Math.max(0, params.skip ?? 0),
    limit: Math.min(Math.max(1, params.limit ?? 500), 500),
  }),
  afterLoad: products => products.map(normalizeProduct),
  beforeCreate: normalizeProductPayload,
  afterCreate: normalizeProduct,
  beforeUpdate: update => ({ ...update, payload: normalizeProductPayload(update.payload) }),
  afterUpdate: normalizeProduct,
};
