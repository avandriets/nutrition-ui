import type { Routes } from '@angular/router';

import { ProductCatalogStore } from './data-access/product-catalog.store';

export const PRODUCTS_ROUTES: Routes = [
  {
    path: '',
    providers: [ProductCatalogStore],
    children: [
      {
        path: '',
        title: 'Products — NutriFlow',
        loadComponent: () => import('./pages/product-catalog/product-catalog.page').then(page => page.ProductCatalogPage),
      },
    ],
  },
];
