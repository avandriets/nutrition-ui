import { inject } from '@angular/core';
import { signalStore } from '@ngrx/signals';

import { withEntityData } from '../../../shared/data-access/entity-data/with-entity-data';
import type { EntityDataAdapter } from '../../../shared/types/entity-data.types';
import type { Product, ProductListParams, ProductPayload } from '../types/product.types';
import { ProductsApiService } from './products-api.service';

export const ProductCatalogStore = signalStore(
  withEntityData<Product, ProductPayload, ProductListParams>({
    adapter: (): EntityDataAdapter<Product, ProductPayload, ProductListParams> => {
      const productsApi = inject(ProductsApiService);

      return {
        load: params => productsApi.list(params),
        create: payload => productsApi.create(payload),
        update: (id, payload) => productsApi.update(Number(id), payload),
        remove: id => productsApi.delete(Number(id)),
      };
    },
    errors: {
      load: 'Не удалось загрузить продукты',
      create: 'Не удалось добавить продукт.',
      update: 'Не удалось сохранить изменения.',
      remove: 'Не удалось удалить продукт.',
    },
  }),
);
