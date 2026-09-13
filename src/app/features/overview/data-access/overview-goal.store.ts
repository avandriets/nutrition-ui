import { inject } from '@angular/core';
import { signalStore } from '@ngrx/signals';
import { catchError, of } from 'rxjs';

import { withRequestData } from '../../../shared/data-access/request-data/with-request-data';
import type { RequestDataAdapter } from '../../../shared/types';
import type { OverviewGoal } from '../types/overview.types';
import type { OverviewGoalParams } from '../types/overview-store.types';
import { OverviewApiService } from './overview-api.service';

export const OverviewGoalStore = signalStore(
  withRequestData<OverviewGoal | null, OverviewGoalParams>({
    adapter: (): RequestDataAdapter<OverviewGoal | null, OverviewGoalParams> => {
      const api = inject(OverviewApiService);

      return {
        load: ({ accountId, userId }) => api.getCurrentGoal(accountId, userId).pipe(catchError(() => of(null))),
      };
    },
    error: 'Не удалось загрузить дневную цель.',
  }),
);
