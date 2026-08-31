import { Routes } from '@angular/router';
import { OverviewApiService } from './data-access/overview-api.service';

export const OVERVIEW_ROUTES: Routes = [
  {
    path: '',
    title: 'Обзор — NutriFlow',
    providers: [OverviewApiService],
    loadComponent: () =>
      import('./pages/overview-page/overview-page').then((page) => page.OverviewPage),
  },
];
