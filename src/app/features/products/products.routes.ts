import { Routes } from '@angular/router';
import { ProductsApiService } from './data-access/products-api.service';

export const PRODUCTS_ROUTES: Routes = [
  {
    path: '',
    providers: [ProductsApiService],
    children: [
      {
        path: '',
        title: 'Продукты — NutriFlow',
        loadComponent: () =>
          import('./pages/product-catalog/product-catalog.page').then(
            (page) => page.ProductCatalogPage,
          ),
      },
    ],
  },
];
