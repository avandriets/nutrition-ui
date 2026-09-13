import { inject } from '@angular/core';
import { signalStore } from '@ngrx/signals';
import { map } from 'rxjs';

import { AccountContextStore } from '../../../core/account/account-context.store';
import { withEntityData } from '../../../shared/data-access/entity-data/with-entity-data';
import type { EntityDataAdapter } from '../../../shared/types/entity-data.types';
import type { FamilyUser, UserPayload } from '../types/family.types';
import { FamilyApiService } from './family-api.service';

export const FamilyUsersStore = signalStore(
  withEntityData<FamilyUser, UserPayload>({
    adapter: (): EntityDataAdapter<FamilyUser, UserPayload> => {
      const api = inject(FamilyApiService);
      const accountContext = inject(AccountContextStore);
      const accountId = (): number => {
        const account = accountContext.account();
        if (!account) throw new Error('Family account is not initialized');
        return account.id;
      };

      return {
        load: () => api.listUsers(accountId()).pipe(map(entities => ({ entities }))),
        create: payload => api.createUser(accountId(), payload),
        update: (id, payload) => api.updateUser(accountId(), Number(id), payload),
        remove: id => api.deleteUser(accountId(), Number(id)),
      };
    },
    errors: {
      load: 'Не удалось загрузить семейный аккаунт.',
      create: 'Не удалось добавить члена семьи.',
      update: 'Не удалось обновить профиль.',
      remove: 'Не удалось удалить профиль.',
    },
  }),
);
