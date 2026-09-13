import type { Routes } from '@angular/router';

import { StatisticsStore } from './data-access/statistics.store';
import { StatisticsApiService } from './data-access/statistics-api.service';
import { StatisticsDailyStore } from './data-access/statistics-daily.store';
import { StatisticsInitialStore } from './data-access/statistics-initial.store';
import { StatisticsPeriodStore } from './data-access/statistics-period.store';

export const STATISTICS_ROUTES: Routes = [
  {
    path: '',
    title: 'Статистика — NutriFlow',
    providers: [StatisticsApiService, StatisticsInitialStore, StatisticsDailyStore, StatisticsPeriodStore, StatisticsStore],
    loadComponent: () => import('./pages/statistics-page/statistics.page').then(component => component.StatisticsPage),
  },
];
