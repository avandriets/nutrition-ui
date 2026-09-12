import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { signalStore } from '@ngrx/signals';
import { Events, withEventHandlers } from '@ngrx/signals/events';
import { map, tap } from 'rxjs';

import { withEntityData } from '../../../shared/data-access/entity-data/with-entity-data';
import type { EntityDataAdapter } from '../../../shared/types/entity-data.types';
import type { Product, ProductListParams, ProductPayload } from '../types/product.types';
import { productCatalogEvents } from './product-catalog.events';
import { productCatalogProcessors } from './product-catalog.processors';
import { ProductsApiService } from './products-api.service';

export const ProductCatalogStore = signalStore(
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
    events: productCatalogEvents,
    processors: productCatalogProcessors,
  }),
  withEventHandlers((_, events = inject(Events), snackBar = inject(MatSnackBar)) => ({
    createdNotification: events.on(productCatalogEvents.created).pipe(tap(() => snackBar.open('Продукт добавлен в общий каталог', 'Закрыть', { duration: 3000 }))),
    updatedNotification: events.on(productCatalogEvents.updated).pipe(tap(() => snackBar.open('Изменения сохранены', 'Закрыть', { duration: 3000 }))),
    removedNotification: events.on(productCatalogEvents.removed).pipe(tap(() => snackBar.open('Продукт удалён', 'Закрыть', { duration: 3000 }))),
  })),
);
