import { inject } from '@angular/core';
import { signalStore, withMethods } from '@ngrx/signals';
import type { Observable } from 'rxjs';
import { defaultIfEmpty, finalize, map, of, shareReplay } from 'rxjs';

import type { Product, ProductListParams, ProductPayload, EntityDataAdapter } from '../../types';
import { withEntityData } from '../entity-data/with-entity-data';
import { productsEvents } from './products.events';
import { productsProcessors } from './products.processors';
import { ProductsApiService } from './products-api.service';

export const ProductsStore = signalStore(
  { providedIn: 'root' },
  withEntityData<Product, ProductPayload, ProductListParams>({
    adapter: (): EntityDataAdapter<Product, ProductPayload, ProductListParams> => {
      const productsApi = inject(ProductsApiService);

      return {
        load: params => productsApi.list(params).pipe(map(entities => ({ entities }))),
        getById: id => productsApi.getById(Number(id)),
        create: payload => productsApi.create(payload),
        update: (id, payload) => productsApi.update(Number(id), payload),
        remove: id => productsApi.delete(Number(id)),
      };
    },
    errors: {
      load: 'Не удалось загрузить продукты',
      getById: 'Не удалось загрузить продукт.',
      create: 'Не удалось добавить продукт.',
      update: 'Не удалось сохранить изменения.',
      remove: 'Не удалось удалить продукт.',
    },
    events: productsEvents,
    processors: productsProcessors,
  }),
  withMethods(store => {
    let pendingLoad: Observable<Product[]> | null = null;

    return {
      ensureLoaded(params: ProductListParams = {}): Observable<Product[]> {
        if (store.loaded()) return of(store.entities());
        if (pendingLoad) return pendingLoad;

        pendingLoad = store.load(params).pipe(
          map(page => page.entities),
          defaultIfEmpty(store.entities()),
          finalize(() => (pendingLoad = null)),
          shareReplay({ bufferSize: 1, refCount: false }),
        );

        return pendingLoad;
      },
    };
  }),
);
