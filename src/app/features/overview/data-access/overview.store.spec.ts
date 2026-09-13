import { TestBed } from '@angular/core/testing';
import type { Observable } from 'rxjs';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';

import { AccountBootstrapService } from '../../../core/account/account-bootstrap.service';
import { AccountContextStore } from '../../../core/account/account-context.store';
import type { UserIdentity } from '../../../shared/types';
import type { OverviewGoal, OverviewMeal } from '../types/overview.types';
import { OverviewStore } from './overview.store';
import { OverviewApiService } from './overview-api.service';
import { OverviewDataStore } from './overview-data.store';
import { OverviewGoalStore } from './overview-goal.store';

describe('OverviewStore', () => {
  const account = { id: 10, name: 'Семья' };
  const users: UserIdentity[] = [
    { id: 1, account_id: account.id, name: 'Александр' },
    { id: 2, account_id: account.id, name: 'Мария' },
  ];
  const goals: Record<number, OverviewGoal> = {
    1: { daily_calories_kcal: 2_000, daily_protein_g: 100, daily_fiber_g: 30 },
    2: { daily_calories_kcal: 1_600, daily_protein_g: 80, daily_fiber_g: 25 },
  };
  const meals: OverviewMeal[] = [
    {
      id: 20,
      meal_date: '2026-09-13',
      meal_type: 'breakfast',
      name: 'Завтрак',
      rows: [
        {
          product_name: 'Овсянка',
          calories_kcal: 100,
          protein_g: 10,
          fat_g: 5,
          carbohydrates_g: 20,
          fiber_g: 4,
          portions: [
            { user_id: users[0].id, amount_g: 150 },
            { user_id: users[1].id, amount_g: 50 },
          ],
        },
      ],
    },
  ];
  const getCurrentGoal = vi.fn<(accountId: number, userId: number) => Observable<OverviewGoal>>((_accountId, userId) => of(goals[userId]));
  const accountBootstrap = {
    ensureAccount: vi.fn(() => of(account)),
  };
  const api = {
    listUsers: vi.fn(() => of(users)),
    listMeals: vi.fn(() => of(meals)),
    getCurrentGoal,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    api.listUsers.mockReturnValue(of(users));
    api.listMeals.mockReturnValue(of(meals));
    getCurrentGoal.mockImplementation((_accountId, userId) => of(goals[userId]));

    TestBed.configureTestingModule({
      providers: [
        AccountContextStore,
        OverviewDataStore,
        OverviewGoalStore,
        OverviewStore,
        { provide: AccountBootstrapService, useValue: accountBootstrap },
        { provide: OverviewApiService, useValue: api },
      ],
    });
  });

  it('loads the overview cascade and calculates totals for the active user', () => {
    const store = TestBed.inject(OverviewStore);

    store.initialize();

    expect(api.listUsers).toHaveBeenCalledWith(account.id);
    expect(api.listMeals).toHaveBeenCalledWith(account.id, expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
    expect(getCurrentGoal).toHaveBeenCalledWith(account.id, users[0].id);
    expect(store.selectedUser()).toEqual(users[0]);
    expect(store.dayTotals()).toEqual({
      calories_kcal: 150,
      protein_g: 15,
      fat_g: 7.5,
      carbohydrates_g: 30,
      fiber_g: 6,
    });
    expect(store.caloriePercent()).toBe(8);
    expect(store.pageState().resolved).toBe(true);
  });

  it('recalculates the overview and loads the goal for a selected user', () => {
    const store = TestBed.inject(OverviewStore);
    store.initialize();

    store.selectUser(users[1].id);

    expect(store.selectedUser()).toEqual(users[1]);
    expect(store.dayTotals().calories_kcal).toBe(50);
    expect(store.goal()).toEqual(goals[users[1].id]);
    expect(getCurrentGoal).toHaveBeenLastCalledWith(account.id, users[1].id);
  });

  it('uses the user requested by the route during initialization', () => {
    const store = TestBed.inject(OverviewStore);

    store.initialize(users[1].id);

    expect(store.selectedUser()).toEqual(users[1]);
    expect(store.dayTotals().calories_kcal).toBe(50);
    expect(getCurrentGoal).toHaveBeenCalledWith(account.id, users[1].id);
  });

  it('ignores a stale goal response after the user changes again', () => {
    const firstResponse = new Subject<OverviewGoal>();
    const secondResponse = new Subject<OverviewGoal>();
    const store = TestBed.inject(OverviewStore);
    store.initialize();
    getCurrentGoal.mockReturnValueOnce(firstResponse).mockReturnValueOnce(secondResponse);

    store.selectUser(users[1].id);
    store.selectUser(users[0].id);
    secondResponse.next(goals[users[0].id]);
    secondResponse.complete();
    firstResponse.next(goals[users[1].id]);
    firstResponse.complete();

    expect(store.selectedUser()).toEqual(users[0]);
    expect(store.goal()).toEqual(goals[users[0].id]);
  });

  it('exposes the shared empty state and skips the goal request without users', () => {
    api.listUsers.mockReturnValue(of([]));
    const store = TestBed.inject(OverviewStore);

    store.initialize();

    expect(store.selectedUser()).toBeUndefined();
    expect(store.pageState().empty).toBe(true);
    expect(getCurrentGoal).not.toHaveBeenCalled();
  });

  it('exposes a dedicated empty state when there are no meals', () => {
    api.listMeals.mockReturnValue(of([]));
    const store = TestBed.inject(OverviewStore);

    store.initialize();

    expect(store.mealsState().empty).toBe(true);
    expect(store.goalState().resolved).toBe(true);
  });
});
