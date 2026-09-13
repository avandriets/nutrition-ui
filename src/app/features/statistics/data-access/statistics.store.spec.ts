import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { AccountBootstrapService } from '../../../core/account/account-bootstrap.service';
import { AccountContextStore } from '../../../core/account/account-context.store';
import type { UserIdentity } from '../../../shared/types';
import { emptyNutrientValues } from '../../../shared/utils/nutrition.utils';
import type { MealDayTotals, NutritionAverage, NutritionTimelineResponse } from '../types/statistics.types';
import { StatisticsStore } from './statistics.store';
import { StatisticsApiService } from './statistics-api.service';
import { StatisticsDailyStore } from './statistics-daily.store';
import { StatisticsInitialStore } from './statistics-initial.store';
import { StatisticsPeriodStore } from './statistics-period.store';

describe('StatisticsStore', () => {
  const account = { id: 10, name: 'Семья' };
  const users: UserIdentity[] = [
    { id: 1, account_id: account.id, name: 'Александр' },
    { id: 2, account_id: account.id, name: 'Мария' },
  ];
  const nutrients = {
    ...emptyNutrientValues(),
    calories_kcal: 1_800,
    protein_g: 95,
  };
  const accountBootstrap = {
    ensureAccount: vi.fn(() => of(account)),
  };
  const api = {
    listUsers: vi.fn(() => of(users)),
    getDayTotals: vi.fn((_accountId: number, date: string) =>
      of<MealDayTotals>({
        account_id: account.id,
        meal_date: date,
        users: users.map(user => ({ user_id: user.id, ...nutrients })),
      }),
    ),
    getGoalForDate: vi.fn((_accountId: number, userId: number, date: string) => of({ user_id: userId, date_from: date, date_to: date, periods: [] })),
    listGoals: vi.fn(() => of([])),
    getNutritionAverage: vi.fn((_accountId: number, userId: number, dateFrom: string, dateTo: string, includeEmptyDays: boolean) =>
      of<NutritionAverage>({
        user_id: userId,
        date_from: dateFrom,
        date_to: dateTo,
        calendar_days: 30,
        active_days: 20,
        include_empty_days: includeEmptyDays,
        ...nutrients,
      }),
    ),
    getNutritionTimeline: vi.fn((_accountId: number, userId: number, dateFrom: string, dateTo: string, granularity: 'day' | 'week' | 'month', includeEmptyDays: boolean) =>
      of<NutritionTimelineResponse>({
        user_id: userId,
        date_from: dateFrom,
        date_to: dateTo,
        granularity,
        include_empty_days: includeEmptyDays,
        points: [],
      }),
    ),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    api.listUsers.mockReturnValue(of(users));
    TestBed.configureTestingModule({
      providers: [
        AccountContextStore,
        StatisticsInitialStore,
        StatisticsDailyStore,
        StatisticsPeriodStore,
        StatisticsStore,
        { provide: AccountBootstrapService, useValue: accountBootstrap },
        { provide: StatisticsApiService, useValue: api },
      ],
    });
  });

  it('cascades initial, daily and period requests through independent request stores', () => {
    const store = TestBed.inject(StatisticsStore);

    store.initialize();

    expect(api.listUsers).toHaveBeenCalledWith(account.id);
    expect(api.getDayTotals).toHaveBeenCalledWith(account.id, store.today);
    expect(api.getGoalForDate).toHaveBeenCalledTimes(users.length);
    expect(api.getNutritionAverage).toHaveBeenCalledTimes(users.length);
    expect(api.getNutritionTimeline).toHaveBeenCalledTimes(users.length);
    expect(store.dailyReports().map(report => report.user.id)).toEqual([1, 2]);
    expect(store.averageReports().map(report => report.user.id)).toEqual([1, 2]);
    expect(store.initialState().resolved).toBe(true);
  });

  it('reloads both report groups only for the selected user', () => {
    const store = TestBed.inject(StatisticsStore);
    store.initialize();

    store.selectUser(users[1].id);

    expect(store.selectedUserName()).toBe(users[1].name);
    expect(store.dailyReports().map(report => report.user.id)).toEqual([users[1].id]);
    expect(store.timelineReports().map(report => report.user.id)).toEqual([users[1].id]);
  });

  it('publishes period validation errors without sending a request', () => {
    const store = TestBed.inject(StatisticsStore);
    store.initialize();
    const requestCount = api.getNutritionAverage.mock.calls.length;
    store.setDateFrom('2026-09-13');
    store.setDateTo('2026-09-12');

    store.applyPeriod();

    expect(api.getNutritionAverage).toHaveBeenCalledTimes(requestCount);
    expect(store.periodError()).toBe('Начало периода не может быть позже окончания.');
  });

  it('reloads only the report group affected by route filters', () => {
    const store = TestBed.inject(StatisticsStore);
    store.initialize();
    const dailyRequests = api.getDayTotals.mock.calls.length;
    const periodRequests = api.getNutritionAverage.mock.calls.length;

    store.applyFilters({
      userId: null,
      day: '2026-09-12',
      dateFrom: store.dateFrom(),
      dateTo: store.dateTo(),
      granularity: store.granularity(),
      includeEmptyDays: store.includeEmptyDays(),
      metric: 'protein_g',
    });

    expect(api.getDayTotals).toHaveBeenCalledTimes(dailyRequests + 1);
    expect(api.getNutritionAverage).toHaveBeenCalledTimes(periodRequests);
    expect(store.selectedMetric()).toBe('protein_g');

    store.applyFilters({
      userId: null,
      day: '2026-09-12',
      dateFrom: '2026-08-01',
      dateTo: store.dateTo(),
      granularity: 'week',
      includeEmptyDays: true,
      metric: 'protein_g',
    });

    expect(api.getDayTotals).toHaveBeenCalledTimes(dailyRequests + 1);
    expect(api.getNutritionAverage).toHaveBeenCalledTimes(periodRequests + users.length);
  });
});
