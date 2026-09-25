import { inject } from '@angular/core';
import { signalStore } from '@ngrx/signals';
import { forkJoin, map, of } from 'rxjs';

import { withRequestData } from '../../../shared/data-access/request-data/with-request-data';
import type { RequestDataAdapter } from '../../../shared/types';
import type { PeriodStatisticsData, PeriodStatisticsParams } from '../types/statistics-store.types';
import { StatisticsApiService } from './statistics-api.service';

export const StatisticsPeriodStore = signalStore(
  withRequestData<PeriodStatisticsData, PeriodStatisticsParams>({
    adapter: (): RequestDataAdapter<PeriodStatisticsData, PeriodStatisticsParams> => {
      const api = inject(StatisticsApiService);

      return {
        load: ({ accountId, users, dateFrom, dateTo, granularity, includeEmptyDays }) => {
          if (!users.length) return of({ averageReports: [], timelineReports: [] });

          return forkJoin(
            users.map(user =>
              forkJoin({
                average: api.getNutritionAverage(accountId, user.id, dateFrom, dateTo, includeEmptyDays),
                timeline: api.getNutritionTimeline(accountId, user.id, dateFrom, dateTo, granularity, includeEmptyDays),
              }).pipe(map(({ average, timeline }) => ({ user, average, timeline }))),
            ),
          ).pipe(
            map(reports => ({
              averageReports: reports.map(({ user, average }) => ({ user, average })),
              timelineReports: reports.map(({ user, timeline }) => ({ user, timeline })),
            })),
          );
        },
      };
    },
    error: 'Could not load statistics for the selected period.',
    isEmpty: data => !data.averageReports.length && !data.timelineReports.length,
  }),
);
