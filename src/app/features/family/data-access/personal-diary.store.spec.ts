import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AccountBootstrapService } from '../../../core/account/account-bootstrap.service';
import type { GoalTimelineItem } from '../../../shared/types';
import type { FamilyUser } from '../types/family.types';
import type { DiaryDayTotals, DiaryMeal } from '../types/family-diary.types';
import { FamilyDiaryApiService } from './family-diary-api.service';
import { PersonalDiaryStore } from './personal-diary.store';
import { PersonalDiaryDataStore } from './personal-diary-data.store';

describe('PersonalDiaryStore', () => {
  const account = { id: 10, name: 'Family' };
  const user: FamilyUser = {
    id: 1,
    account_id: account.id,
    name: 'Alexander',
    birth_date: null,
    height_cm: 180,
    created_at: '2026-09-13T00:00:00Z',
    updated_at: '2026-09-13T00:00:00Z',
  };
  const goal: GoalTimelineItem = {
    goal_id: 2,
    effective_from: '2026-09-01',
    period_start: '2026-09-01',
    period_end: '2026-09-30',
    daily_calories_kcal: 2_000,
    daily_protein_g: 120,
    daily_fiber_g: 30,
  };
  const meal: DiaryMeal = {
    id: 3,
    meal_date: '2026-09-13',
    meal_type: 'breakfast',
    name: 'Breakfast',
    rows: [
      {
        id: 4,
        product_name: 'Oatmeal',
        product_brand: null,
        calories_kcal: 100,
        protein_g: 10,
        fat_g: 5,
        carbohydrates_g: 20,
        fiber_g: 4,
        portions: [{ user_id: user.id, amount_g: 150 }],
      },
    ],
  };
  const totals: DiaryDayTotals = {
    users: [
      {
        user_id: user.id,
        calories_kcal: 150,
        protein_g: 15,
        fat_g: 7.5,
        carbohydrates_g: 30,
        fiber_g: 6,
      },
    ],
  };
  const accountBootstrap = {
    ensureAccount: vi.fn(() => of(account)),
  };
  const api = {
    getUser: vi.fn(() => of(user)),
    listMeals: vi.fn(() => of([meal])),
    getDayTotals: vi.fn(() => of(totals)),
    getGoalForDate: vi.fn((_accountId: number, userId: number, date: string) => of({ user_id: userId, date_from: date, date_to: date, periods: [goal] })),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    api.getUser.mockReturnValue(of(user));
    api.listMeals.mockReturnValue(of([meal]));
    api.getDayTotals.mockReturnValue(of(totals));

    TestBed.configureTestingModule({
      providers: [PersonalDiaryDataStore, PersonalDiaryStore, { provide: AccountBootstrapService, useValue: accountBootstrap }, { provide: FamilyDiaryApiService, useValue: api }],
    });
  });

  it('loads the diary cascade and creates user-specific meal views', () => {
    const store = TestBed.inject(PersonalDiaryStore);

    store.initialize(user.id);

    expect(api.getUser).toHaveBeenCalledWith(account.id, user.id);
    expect(api.listMeals).toHaveBeenCalledWith(account.id, store.dateFilter());
    expect(api.getGoalForDate).toHaveBeenCalledWith(account.id, user.id, store.dateFilter());
    expect(store.user()).toEqual(user);
    expect(store.goal()).toEqual(goal);
    expect(store.dayTotals()).toEqual(totals.users[0]);
    expect(store.mealViews()[0].rows[0]).toMatchObject({
      portion_g: 150,
      calories_kcal: 150,
      protein_g: 15,
    });
    expect(store.mealViews()[0].totals.calories_kcal).toBe(150);
    expect(store.goalState().empty).toBe(false);
    expect(store.mealsState().empty).toBe(false);
    expect(store.pageState().resolved).toBe(true);
  });

  it('ignores an older response after the date changes again', () => {
    const firstResponse = new Subject<DiaryMeal[]>();
    const secondResponse = new Subject<DiaryMeal[]>();
    const store = TestBed.inject(PersonalDiaryStore);
    store.initialize(user.id);
    api.listMeals.mockReturnValueOnce(firstResponse).mockReturnValueOnce(secondResponse);

    store.setDate('2026-09-12');
    store.setDate('2026-09-11');
    secondResponse.next([{ ...meal, id: 11, meal_date: '2026-09-11' }]);
    secondResponse.complete();
    firstResponse.next([{ ...meal, id: 12, meal_date: '2026-09-12' }]);
    firstResponse.complete();

    expect(store.dateFilter()).toBe('2026-09-11');
    expect(store.meals()[0].id).toBe(11);
  });

  it('keeps loaded data visible when a refresh fails', () => {
    const store = TestBed.inject(PersonalDiaryStore);
    store.initialize(user.id);
    api.listMeals.mockReturnValue(throwError(() => new Error('Unavailable')));

    store.setDate('2026-09-12');

    expect(store.user()).toEqual(user);
    expect(store.meals()).toEqual([meal]);
    expect(store.refreshError()).toBe('Could not load the personal diary.');
    expect(store.pageState().resolved).toBe(true);

    store.dismissRefreshError();

    expect(store.refreshError()).toBeNull();
  });

  it('rejects an invalid route identifier without making requests', () => {
    const store = TestBed.inject(PersonalDiaryStore);

    store.initialize(Number.NaN);

    expect(store.pageState()).toEqual({
      resolved: false,
      rejected: true,
      pending: false,
      err: 'Invalid user ID.',
      empty: false,
    });
    expect(api.getUser).not.toHaveBeenCalled();
  });
});
