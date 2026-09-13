import { inject } from '@angular/core';
import { signalStore } from '@ngrx/signals';
import { map, switchMap } from 'rxjs';

import { AccountBootstrapService } from '../../../core/account/account-bootstrap.service';
import { withRequestData } from '../../../shared/data-access/request-data/with-request-data';
import type { RequestDataAdapter } from '../../../shared/types';
import type { StatisticsInitialData } from '../types/statistics-store.types';
import { StatisticsApiService } from './statistics-api.service';

export const StatisticsInitialStore = signalStore(
  withRequestData<StatisticsInitialData>({
    adapter: (): RequestDataAdapter<StatisticsInitialData> => {
      const accountBootstrap = inject(AccountBootstrapService);
      const api = inject(StatisticsApiService);

      return {
        load: () => accountBootstrap.ensureAccount().pipe(switchMap(account => api.listUsers(account.id).pipe(map(users => ({ accountId: account.id, users }))))),
      };
    },
    error: 'Не удалось загрузить семейный аккаунт.',
    isEmpty: data => !data.users.length,
  }),
);
