import type { Routes } from '@angular/router';

import { FamilyStore } from './data-access/family.store';
import { FamilyApiService } from './data-access/family-api.service';
import { FamilyDiaryApiService } from './data-access/family-diary-api.service';
import { FamilyUsersStore } from './data-access/family-users.store';
import { PersonalDiaryStore } from './data-access/personal-diary.store';
import { PersonalDiaryDataStore } from './data-access/personal-diary-data.store';
import { UserGoalsStore } from './data-access/user-goals.store';
import { UserMeasurementsStore } from './data-access/user-measurements.store';

export const FAMILY_ROUTES: Routes = [
  {
    path: '',
    providers: [FamilyApiService, FamilyUsersStore, UserGoalsStore, UserMeasurementsStore, FamilyStore],
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Family — NutriFlow',
        loadComponent: () => import('./pages/family-members/family-members.page').then(page => page.FamilyMembersPage),
      },
      {
        path: 'users/:userId/diary',
        providers: [FamilyDiaryApiService, PersonalDiaryDataStore, PersonalDiaryStore],
        title: 'Personal diary — NutriFlow',
        loadComponent: () => import('./pages/personal-diary/personal-diary.page').then(page => page.PersonalDiaryPage),
      },
    ],
  },
];
