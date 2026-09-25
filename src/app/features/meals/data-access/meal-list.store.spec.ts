import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AccountBootstrapService } from '../../../core/account/account-bootstrap.service';
import { AccountContextStore } from '../../../core/account/account-context.store';
import type { UserIdentity } from '../../../shared/types';
import type { Meal, MealDay, MealPayload } from '../types/meal.types';
import { MealListStore } from './meal-list.store';
import { MealsApiService } from './meals-api.service';
import { MealsEntityStore } from './meals-entity.store';

describe('MealListStore', () => {
  const account = { id: 10, name: 'Family' };
  const user: UserIdentity = { id: 1, account_id: account.id, name: 'Alexander' };
  const meal: Meal = {
    id: 2,
    account_id: account.id,
    meal_date: '2026-09-12',
    meal_type: 'breakfast',
    name: 'Breakfast',
    rows: [],
    created_at: '2026-09-12T00:00:00Z',
    updated_at: '2026-09-12T00:00:00Z',
  };
  const copiedMeal: Meal = { ...meal, id: 3, meal_date: '2026-09-13' };
  const payload: MealPayload = {
    meal_date: meal.meal_date,
    meal_type: meal.meal_type,
    name: meal.name,
  };
  const copiedDay: MealDay = {
    account_id: account.id,
    meal_date: copiedMeal.meal_date,
    meals: [copiedMeal],
  };
  const accountBootstrap = {
    ensureAccount: vi.fn(() => of(account)),
  };
  const api = {
    listMeals: vi.fn(() => of([meal])),
    getMeal: vi.fn(() => of(meal)),
    createMeal: vi.fn(() => of(meal)),
    copyMealDay: vi.fn(() => of(copiedDay)),
    listUsers: vi.fn(() => of([user])),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    api.listMeals.mockReturnValue(of([meal]));
    api.createMeal.mockReturnValue(of(meal));
    api.copyMealDay.mockReturnValue(of(copiedDay));
    api.listUsers.mockReturnValue(of([user]));

    TestBed.configureTestingModule({
      providers: [
        AccountContextStore,
        MealsEntityStore,
        MealListStore,
        { provide: AccountBootstrapService, useValue: accountBootstrap },
        { provide: MealsApiService, useValue: api },
      ],
    });
  });

  it('loads meals and account users for the selected date', () => {
    const store = TestBed.inject(MealListStore);
    store.dateFilter.set(meal.meal_date);

    store.load().subscribe();

    expect(api.listMeals).toHaveBeenCalledWith(account.id, meal.meal_date);
    expect(api.listUsers).toHaveBeenCalledWith(account.id);
    expect(store.meals()).toEqual([meal]);
    expect(store.users()).toEqual([user]);
    expect(store.state()).toEqual({
      resolved: true,
      rejected: false,
      pending: false,
      err: null,
      empty: false,
    });
  });

  it('creates a meal through the shared entity adapter', () => {
    const store = TestBed.inject(MealListStore);
    store.load().subscribe();

    store.create(payload).subscribe();

    expect(api.createMeal).toHaveBeenCalledWith(account.id, payload);
    expect(store.meals()).toEqual([meal]);
  });

  it('copies a day and replaces the currently displayed collection', () => {
    const store = TestBed.inject(MealListStore);
    store.load().subscribe();

    store
      .copyDay({
        targetDate: copiedMeal.meal_date,
        payload: { source_date: meal.meal_date, replace_existing: true },
      })
      .subscribe();

    expect(api.copyMealDay).toHaveBeenCalledWith(account.id, copiedMeal.meal_date, {
      source_date: meal.meal_date,
      replace_existing: true,
    });
    expect(store.dateFilter()).toBe(copiedMeal.meal_date);
    expect(store.meals()).toEqual([copiedMeal]);
    expect(store.saving()).toBe(false);
  });

  it('keeps loaded meals visible when copying fails', () => {
    api.copyMealDay.mockReturnValue(throwError(() => new Error('Conflict')));
    const store = TestBed.inject(MealListStore);
    store.load().subscribe();

    store
      .copyDay({
        targetDate: copiedMeal.meal_date,
        payload: { source_date: meal.meal_date, replace_existing: false },
      })
      .subscribe();

    expect(store.meals()).toEqual([meal]);
    expect(store.actionError()).toContain('Could not copy the meal plan');
    expect(store.state().resolved).toBe(true);
  });
});
