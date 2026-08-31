import { Routes } from '@angular/router';
import { FamilyDiaryApiService } from './data-access/family-diary-api.service';
import { FamilyApiService } from './data-access/family-api.service';
import { FamilyStore } from './state/family.store';

export const FAMILY_ROUTES: Routes = [
  {
    path: '',
    providers: [FamilyApiService, FamilyStore],
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Семья — NutriFlow',
        loadComponent: () =>
          import('./pages/family-members/family-members.page').then(
            (page) => page.FamilyMembersPage,
          ),
      },
      {
        path: 'users/:userId/diary',
        providers: [FamilyDiaryApiService],
        title: 'Персональный дневник — NutriFlow',
        loadComponent: () =>
          import('./pages/personal-diary/personal-diary.page').then(
            (page) => page.PersonalDiaryPage,
          ),
      },
    ],
  },
];
