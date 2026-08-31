import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'overview',
    loadChildren: () =>
      import('./features/overview/overview.routes').then((feature) => feature.OVERVIEW_ROUTES),
  },
  {
    path: 'products',
    loadChildren: () =>
      import('./features/products/products.routes').then((feature) => feature.PRODUCTS_ROUTES),
  },
  {
    path: 'meals',
    loadChildren: () =>
      import('./features/meals/meals.routes').then((feature) => feature.MEALS_ROUTES),
  },
  {
    path: 'statistics',
    loadChildren: () =>
      import('./features/statistics/statistics.routes').then(
        (feature) => feature.STATISTICS_ROUTES,
      ),
  },
  {
    path: 'family',
    loadChildren: () =>
      import('./features/family/family.routes').then((feature) => feature.FAMILY_ROUTES),
  },
  { path: '', pathMatch: 'full', redirectTo: 'overview' },
  { path: '**', redirectTo: 'overview' },
];
