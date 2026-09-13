import type { Routes } from '@angular/router';

import { OverviewStore } from './data-access/overview.store';
import { OverviewApiService } from './data-access/overview-api.service';
import { OverviewDataStore } from './data-access/overview-data.store';
import { OverviewGoalStore } from './data-access/overview-goal.store';

export const OVERVIEW_ROUTES: Routes = [
  {
    path: '',
    title: 'Обзор — NutriFlow',
    providers: [OverviewApiService, OverviewDataStore, OverviewGoalStore, OverviewStore],
    loadComponent: () => import('./pages/overview-page/overview-page').then(page => page.OverviewPage),
  },
];
