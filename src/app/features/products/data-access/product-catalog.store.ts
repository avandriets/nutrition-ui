import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { signalStore, withMethods, withProps } from '@ngrx/signals';
import type { EntityId } from '@ngrx/signals/entities';
import { Events, withEventHandlers } from '@ngrx/signals/events';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs';

import { productsEvents, ProductsStore } from '../../../shared/data-access/products';
import type { EntityDataLoadOptions, EntityDataRequestOptions, EntityDataUpdate, Product, ProductListParams, ProductPayload } from '../../../shared/types';

export const ProductCatalogStore = signalStore(
  withProps(() => {
    const productsStore = inject(ProductsStore);

    return {
      entities: productsStore.entities,
      actionError: productsStore.actionError,
      saving: productsStore.saving,
      entityState: productsStore.entityState,
      entityOperations: productsStore.entityOperations,
    };
  }),
  withMethods((_, productsStore = inject(ProductsStore)) => ({
    load(params: ProductListParams, options?: EntityDataLoadOptions) {
      return productsStore.load(params, options);
    },
    ensureLoaded(params?: ProductListParams): Observable<Product[]> {
      return productsStore.ensureLoaded(params);
    },
    create(payload: ProductPayload, options?: EntityDataRequestOptions) {
      return productsStore.create(payload, options);
    },
    update(update: EntityDataUpdate<ProductPayload>, options?: EntityDataRequestOptions) {
      return productsStore.update(update, options);
    },
    remove(id: EntityId, options?: EntityDataRequestOptions) {
      return productsStore.remove(id, options);
    },
    dismissActionError(): void {
      productsStore.dismissActionError();
    },
  })),
  withEventHandlers((_, events = inject(Events), snackBar = inject(MatSnackBar)) => ({
    createdNotification: events.on(productsEvents.created).pipe(tap(() => snackBar.open('Продукт добавлен в общий каталог', 'Закрыть', { duration: 3000 }))),
    updatedNotification: events.on(productsEvents.updated).pipe(tap(() => snackBar.open('Изменения сохранены', 'Закрыть', { duration: 3000 }))),
    removedNotification: events.on(productsEvents.removed).pipe(tap(() => snackBar.open('Продукт удалён', 'Закрыть', { duration: 3000 }))),
  })),
);
