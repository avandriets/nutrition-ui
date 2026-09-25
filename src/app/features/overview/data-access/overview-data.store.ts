import { inject } from '@angular/core';
import { signalStore } from '@ngrx/signals';
import { forkJoin, map, switchMap } from 'rxjs';

import { AccountBootstrapService } from '../../../core/account/account-bootstrap.service';
import { withRequestData } from '../../../shared/data-access/request-data/with-request-data';
import type { RequestDataAdapter } from '../../../shared/types';
import type { OverviewData, OverviewDataParams } from '../types/overview-store.types';
import { OverviewApiService } from './overview-api.service';

export const OverviewDataStore = signalStore(
  withRequestData<OverviewData, OverviewDataParams>({
    adapter: (): RequestDataAdapter<OverviewData, OverviewDataParams> => {
      const accountBootstrap = inject(AccountBootstrapService);
      const api = inject(OverviewApiService);

      return {
        load: ({ mealDate }) =>
          accountBootstrap.ensureAccount().pipe(
            switchMap(account =>
              forkJoin({
                users: api.listUsers(account.id),
                meals: api.listMeals(account.id, mealDate),
              }).pipe(map(({ users, meals }) => ({ accountId: account.id, users, meals }))),
            ),
          ),
      };
    },
    error: 'Could not load the summary.',
    isEmpty: data => !data.users.length,
  }),
);
