import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Events } from '@ngrx/signals/events';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import type { Product, ProductPayload } from '../types/product.types';
import { productCatalogEvents } from './product-catalog.events';
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
    getById: vi.fn(() => of(product)),
    create: vi.fn(() => of(product)),
    update: vi.fn(() => of({ ...product, name: 'Зелёное яблоко' })),
    delete: vi.fn(() => of(undefined)),
  };
  const snackBar = {
    open: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    productsApi.list.mockReturnValue(of([product]));
    productsApi.getById.mockReturnValue(of(product));
    productsApi.create.mockReturnValue(of(product));
    productsApi.update.mockReturnValue(of({ ...product, name: 'Зелёное яблоко' }));
    productsApi.delete.mockReturnValue(of(undefined));

    TestBed.configureTestingModule({
      providers: [ProductCatalogStore, { provide: MatSnackBar, useValue: snackBar }, { provide: ProductsApiService, useValue: productsApi }],
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

  it('post-processes loaded entities before storing and publishing them', () => {
    productsApi.list.mockReturnValue(of([{ ...product, name: '  Яблоко  ', category: '  Фрукты  ' }]));
    const events = TestBed.inject(Events);
    const store = TestBed.inject(ProductCatalogStore);
    const loaded = vi.fn();
    const subscription = events.on(productCatalogEvents.loaded).subscribe(loaded);

    store.load({ limit: 1_000, skip: -5 }, { correlationId: 'load-normalized' }).subscribe();

    expect(productsApi.list).toHaveBeenCalledWith({ limit: 500, skip: 0 });
    expect(store.entities()[0]).toEqual(product);
    expect(loaded).toHaveBeenCalledWith({
      type: productCatalogEvents.loaded.type,
      payload: {
        correlationId: 'load-normalized',
        data: { entities: [product] },
      },
    });
    subscription.unsubscribe();
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

    store.create({ ...payload, name: '  Яблоко  ', brand: '   ' }).subscribe();
    expect(productsApi.create).toHaveBeenCalledWith({ ...payload, name: 'Яблоко', brand: null });
    expect(store.entities()).toEqual([product]);
    expect(snackBar.open).toHaveBeenCalledWith('Продукт добавлен в общий каталог', 'Закрыть', { duration: 3000 });

    store.update({ id: product.id, payload: { ...payload, name: '  Зелёное яблоко  ' } }).subscribe();
    expect(productsApi.update).toHaveBeenCalledWith(product.id, { ...payload, name: 'Зелёное яблоко' });
    expect(store.entities()[0].name).toBe('Зелёное яблоко');
    expect(store.entityOperations()[product.id]).toEqual(expect.objectContaining({ type: 'update', status: 'success' }));

    store.remove(product.id).subscribe();
    expect(store.entities()).toEqual([]);
    expect(snackBar.open).toHaveBeenCalledTimes(3);
  });

  it('exposes and dismisses an action error', () => {
    productsApi.create.mockReturnValue(throwError(() => new Error('Network error')));
    const store = TestBed.inject(ProductCatalogStore);

    store.create(payload, { correlationId: 'create-failed' }).subscribe();

    expect(store.saving()).toBe(false);
    expect(store.actionError()).toBe('Не удалось добавить продукт.');

    store.dismissActionError();
    expect(store.actionError()).toBeNull();
  });

  it('publishes a typed failure event', () => {
    productsApi.create.mockReturnValue(throwError(() => new Error('Network error')));
    const events = TestBed.inject(Events);
    const store = TestBed.inject(ProductCatalogStore);
    const createFailed = vi.fn();
    const subscription = events.on(productCatalogEvents.createFailed).subscribe(createFailed);

    store.create(payload, { correlationId: 'create-failed' }).subscribe();

    expect(createFailed).toHaveBeenCalledWith({
      type: productCatalogEvents.createFailed.type,
      payload: {
        error: expect.any(Error),
        message: 'Не удалось добавить продукт.',
        correlationId: 'create-failed',
      },
    });
    subscription.unsubscribe();
  });
});
