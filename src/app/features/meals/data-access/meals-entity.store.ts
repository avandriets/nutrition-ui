import { inject } from '@angular/core';
import { signalStore } from '@ngrx/signals';
import { map } from 'rxjs';

import { AccountContextStore } from '../../../core/account/account-context.store';
import { withEntityData } from '../../../shared/data-access/entity-data/with-entity-data';
import type { EntityDataAdapter } from '../../../shared/types';
import type { Meal, MealPayload } from '../types/meal.types';
import type { MealListParams } from '../types/meal-list.types';
import { MealsApiService } from './meals-api.service';

export const MealsEntityStore = signalStore(
  withEntityData<Meal, MealPayload, MealListParams>({
    adapter: (): EntityDataAdapter<Meal, MealPayload, MealListParams> => {
      const api = inject(MealsApiService);
      const accountContext = inject(AccountContextStore);
      const accountId = (): number => {
        const account = accountContext.account();
        if (!account) throw new Error('Account is not initialized');
        return account.id;
      };

      return {
        load: ({ mealDate }) => api.listMeals(accountId(), mealDate).pipe(map(entities => ({ entities }))),
        getById: id => api.getMeal(accountId(), Number(id)),
        create: payload => api.createMeal(accountId(), payload),
      };
    },
    errors: {
      load: 'Could not load meals.',
      getById: 'Could not load the meal.',
      create: 'Could not create the meal.',
      update: 'Editing meals is not supported.',
      remove: 'Deleting meals is not supported.',
    },
  }),
);
