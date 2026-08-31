import { Routes } from '@angular/router';
import { MealsApiService } from './data-access/meals-api.service';

export const MEALS_ROUTES: Routes = [
  {
    path: '',
    providers: [MealsApiService],
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Приёмы пищи — NutriFlow',
        loadComponent: () =>
          import('./pages/meal-list/meal-list.page').then((page) => page.MealListPage),
      },
      {
        path: ':mealId',
        title: 'Приём пищи — NutriFlow',
        loadComponent: () =>
          import('./pages/meal-detail/meal-detail.page').then((page) => page.MealDetailPage),
      },
    ],
  },
];
