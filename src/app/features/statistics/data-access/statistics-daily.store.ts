import { inject } from '@angular/core';
import { signalStore } from '@ngrx/signals';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';

import { withRequestData } from '../../../shared/data-access/request-data/with-request-data';
import type { RequestDataAdapter } from '../../../shared/types';
import { emptyNutrientValues } from '../../../shared/utils/nutrition.utils';
import type { GoalTarget } from '../types/statistics.types';
import type { DailyStatisticsData, DailyStatisticsParams } from '../types/statistics-store.types';
import { StatisticsApiService } from './statistics-api.service';

const EMPTY_NUTRIENTS = emptyNutrientValues();

export const StatisticsDailyStore = signalStore(
  withRequestData<DailyStatisticsData, DailyStatisticsParams>({
    adapter: (): RequestDataAdapter<DailyStatisticsData, DailyStatisticsParams> => {
      const api = inject(StatisticsApiService);

      return {
        load: ({ accountId, users, selectedDay }) => {
          if (!users.length) return of([]);

          const goalRequests = users.map(user =>
            api.getGoalForDate(accountId, user.id, selectedDay).pipe(
              switchMap(timeline => {
                const activeGoal = timeline.periods[0];
                if (activeGoal) return of({ goal: activeGoal, goalIsFallback: false });

                return api.listGoals(accountId, user.id).pipe(
                  map(goals => {
                    const nextGoal = [...goals]
                      .filter(goal => goal.effective_from > selectedDay)
                      .sort((left, right) => left.effective_from.localeCompare(right.effective_from) || left.id - right.id)[0];
                    const goal: GoalTarget | null = nextGoal
                      ? {
                          goal_id: nextGoal.id,
                          daily_calories_kcal: nextGoal.daily_calories_kcal,
                          daily_protein_g: nextGoal.daily_protein_g,
                          daily_fiber_g: nextGoal.daily_fiber_g,
                          effective_from: nextGoal.effective_from,
                        }
                      : null;
                    return { goal, goalIsFallback: goal !== null };
                  }),
                );
              }),
              catchError(() => of({ goal: null, goalIsFallback: false })),
            ),
          );

          return forkJoin({
            totals: api.getDayTotals(accountId, selectedDay),
            goals: forkJoin(goalRequests),
          }).pipe(
            map(({ totals, goals }) => {
              const totalsByUser = new Map(totals.users.map(total => [total.user_id, total]));
              return users.map((user, index) => ({
                user,
                totals: totalsByUser.get(user.id) ?? { user_id: user.id, ...EMPTY_NUTRIENTS },
                goal: goals[index]?.goal ?? null,
                goalIsFallback: goals[index]?.goalIsFallback ?? false,
              }));
            }),
          );
        },
      };
    },
    error: 'Could not load goal progress for the selected day.',
    isEmpty: reports => !reports.length,
  }),
);
