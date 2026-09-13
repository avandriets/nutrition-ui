import type { Routes } from '@angular/router';

import { MealDetailStore } from './data-access/meal-detail.store';
import { MealListStore } from './data-access/meal-list.store';
import { MealsApiService } from './data-access/meals-api.service';
import { MealsEntityStore } from './data-access/meals-entity.store';

export const MEALS_ROUTES: Routes = [
  {
    path: '',
    providers: [MealsApiService],
    children: [
      {
        path: '',
        pathMatch: 'full',
        providers: [MealsEntityStore, MealListStore],
        title: 'Приёмы пищи — NutriFlow',
        loadComponent: () => import('./pages/meal-list/meal-list.page').then(page => page.MealListPage),
      },
      {
        path: ':mealId',
        providers: [MealDetailStore],
        title: 'Приём пищи — NutriFlow',
        loadComponent: () => import('./pages/meal-detail/meal-detail.page').then(page => page.MealDetailPage),
      },
    ],
  },
];
