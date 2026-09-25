import { inject } from '@angular/core';
import { signalStore } from '@ngrx/signals';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';

import { AccountBootstrapService } from '../../../core/account/account-bootstrap.service';
import { withRequestData } from '../../../shared/data-access/request-data/with-request-data';
import type { RequestDataAdapter } from '../../../shared/types';
import { emptyNutrientValues } from '../../../shared/utils/nutrition.utils';
import type { PersonalDiaryData, PersonalDiaryParams } from '../types/personal-diary-store.types';
import { FamilyDiaryApiService } from './family-diary-api.service';

export const PersonalDiaryDataStore = signalStore(
  withRequestData<PersonalDiaryData, PersonalDiaryParams>({
    adapter: (): RequestDataAdapter<PersonalDiaryData, PersonalDiaryParams> => {
      const accountBootstrap = inject(AccountBootstrapService);
      const api = inject(FamilyDiaryApiService);

      return {
        load: ({ userId, diaryDate }) =>
          accountBootstrap.ensureAccount().pipe(
            switchMap(account =>
              forkJoin({
                user: api.getUser(account.id, userId),
                meals: api.listMeals(account.id, diaryDate),
                totals: api.getDayTotals(account.id, diaryDate),
                goalTimeline: api.getGoalForDate(account.id, userId, diaryDate).pipe(catchError(() => of(null))),
              }),
            ),
            map(({ user, meals, totals, goalTimeline }) => ({
              user,
              meals,
              goal: goalTimeline?.periods[0] ?? null,
              dayTotals: totals.users.find(total => total.user_id === userId) ?? emptyNutrientValues(),
            })),
          ),
      };
    },
    error: 'Could not load the personal diary.',
    concurrency: 'latest',
  }),
);
