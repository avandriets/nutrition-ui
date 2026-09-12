import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import type { Product, ProductPayload } from '../types/product.types';
import { ProductCatalogStore } from './product-catalog.store';
import { ProductsApiService } from './products-api.service';

describe('ProductCatalogStore', () => {
  const product: Product = {
    id: 1,
    name: 'Яблоко',
    brand: null,
    category: 'Фрукты',
    barcode: null,
    description: null,
    calories_kcal: 52,
    protein_g: 0.3,
    fat_g: 0.2,
    carbohydrates_g: 14,
    fiber_g: 2.4,
    created_at: '2026-09-12T00:00:00Z',
    updated_at: '2026-09-12T00:00:00Z',
  };
  const payload: ProductPayload = {
    name: product.name,
    brand: product.brand,
    category: product.category,
    barcode: product.barcode,
    description: product.description,
    calories_kcal: product.calories_kcal,
    protein_g: product.protein_g,
    fat_g: product.fat_g,
    carbohydrates_g: product.carbohydrates_g,
    fiber_g: product.fiber_g,
  };
  const productsApi = {
    list: vi.fn(() => of([product])),
    create: vi.fn(() => of(product)),
    update: vi.fn(() => of({ ...product, name: 'Зелёное яблоко' })),
    delete: vi.fn(() => of(undefined)),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    productsApi.list.mockReturnValue(of([product]));

    TestBed.configureTestingModule({
      providers: [ProductCatalogStore, { provide: ProductsApiService, useValue: productsApi }],
    });
  });

  it('loads entities and exposes a resolved UI state', () => {
    const store = TestBed.inject(ProductCatalogStore);

    store.load({ skip: 20, limit: 10 }).subscribe();

    expect(productsApi.list).toHaveBeenCalledWith({ skip: 20, limit: 10 });
    expect(store.entities()).toEqual([product]);
    expect(store.entityState()).toEqual({
      resolved: true,
      rejected: false,
      pending: false,
      err: null,
      empty: false,
    });
  });

  it('maps a load failure to the shared UI state', () => {
    productsApi.list.mockReturnValue(throwError(() => new Error('Network error')));
    const store = TestBed.inject(ProductCatalogStore);

    store.load({}).subscribe();

    expect(store.entities()).toEqual([]);
    expect(store.entityState()).toEqual({
      resolved: false,
      rejected: true,
      pending: false,
      err: 'Не удалось загрузить продукты',
      empty: false,
    });
  });

  it('updates the entity collection after create, update and remove', () => {
    const store = TestBed.inject(ProductCatalogStore);

    store.create(payload).subscribe();
    expect(store.entities()).toEqual([product]);

    store.update({ id: product.id, payload: { ...payload, name: 'Зелёное яблоко' } }).subscribe();
    expect(store.entities()[0].name).toBe('Зелёное яблоко');

    store.remove(product.id).subscribe();
    expect(store.entities()).toEqual([]);
  });

  it('exposes and dismisses an action error', () => {
    productsApi.create.mockReturnValue(throwError(() => new Error('Network error')));
    const store = TestBed.inject(ProductCatalogStore);

    store.create(payload).subscribe();

    expect(store.saving()).toBe(false);
    expect(store.actionError()).toBe('Не удалось добавить продукт.');

    store.dismissActionError();
    expect(store.actionError()).toBeNull();
  });
});
