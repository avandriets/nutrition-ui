import { inject } from '@angular/core';
import { signalStore } from '@ngrx/signals';
import { map } from 'rxjs';

import { AccountContextStore } from '../../../core/account/account-context.store';
import { withEntityData } from '../../../shared/data-access/entity-data/with-entity-data';
import type { EntityDataAdapter, EntityDataProcessors } from '../../../shared/types/entity-data.types';
import type { GoalPayload, UserGoal } from '../types/family.types';
import type { UserScopedLoadParams } from '../types/family-data.types';
import { FamilyApiService } from './family-api.service';

const processors: EntityDataProcessors<UserGoal, GoalPayload, UserScopedLoadParams> = {
  afterLoad: goals => [...goals].sort((left, right) => right.effective_from.localeCompare(left.effective_from) || right.id - left.id),
};

export const UserGoalsStore = signalStore(
  withEntityData<UserGoal, GoalPayload, UserScopedLoadParams>({
    adapter: (): EntityDataAdapter<UserGoal, GoalPayload, UserScopedLoadParams> => {
      const api = inject(FamilyApiService);
      const accountContext = inject(AccountContextStore);
      const accountId = (): number => {
        const account = accountContext.account();
        if (!account) throw new Error('Family account is not initialized');
        return account.id;
      };
      const selectedUserId = (): number => {
        const userId = accountContext.activeUserId();
        if (userId === null) throw new Error('Family user is not selected');
        return userId;
      };

      return {
        load: ({ userId }) => api.listGoals(accountId(), userId).pipe(map(entities => ({ entities }))),
        create: payload => api.createGoal(accountId(), selectedUserId(), payload),
        update: (id, payload) => api.updateGoal(accountId(), selectedUserId(), Number(id), payload),
      };
    },
    errors: {
      load: 'Не удалось загрузить историю целей пользователя.',
      create: 'Не удалось сохранить цель.',
      update: 'Не удалось обновить цель.',
      remove: 'Не удалось удалить цель.',
    },
    processors,
  }),
);
