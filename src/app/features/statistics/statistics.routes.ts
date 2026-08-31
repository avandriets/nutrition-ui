import { Routes } from '@angular/router';
import { StatisticsApiService } from './data-access/statistics-api.service';

export const STATISTICS_ROUTES: Routes = [
  {
    path: '',
    title: 'Статистика — NutriFlow',
    providers: [StatisticsApiService],
    loadComponent: () =>
      import('./pages/statistics-page/statistics.page').then(
        (component) => component.StatisticsPage,
      ),
  },
];
