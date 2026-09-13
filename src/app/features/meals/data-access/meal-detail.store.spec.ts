import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';

import { AccountBootstrapService } from '../../../core/account/account-bootstrap.service';
import { AccountContextStore } from '../../../core/account/account-context.store';
import { ProductsApiService, ProductsStore } from '../../../shared/data-access/products';
import type { GoalTimelineResponse, Product, UserIdentity } from '../../../shared/types';
import type { Meal, MealDayTotals, MealRow } from '../types/meal.types';
import { MealDetailStore } from './meal-detail.store';
import { MealsApiService } from './meals-api.service';

describe('MealDetailStore', () => {
  const account = { id: 10, name: 'Семья' };
  const user: UserIdentity = { id: 1, account_id: account.id, name: 'Александр' };
  const row: MealRow = {
    id: 20,
    position: 0,
    product_id: 30,
    product_name: 'Яблоко',
    product_brand: null,
    calories_kcal: 52,
    protein_g: 0.3,
    fat_g: 0.2,
    carbohydrates_g: 14,
    fiber_g: 2.4,
    portions: [
      {
        id: 40,
        user_id: user.id,
        amount_g: 100,
        version: 1,
        created_at: '2026-09-12T00:00:00Z',
        updated_at: '2026-09-12T00:00:00Z',
      },
    ],
  };
  const meal: Meal = {
    id: 2,
    account_id: account.id,
    meal_date: '2026-09-12',
    meal_type: 'breakfast',
    name: 'Завтрак',
    rows: [row],
    created_at: '2026-09-12T00:00:00Z',
    updated_at: '2026-09-12T00:00:00Z',
  };
  const products: Product[] = [
    {
      id: 30,
      name: 'Яблоко',
      brand: null,
      category: 'Фрукты',
      barcode: null,
      description: null,
      calories_kcal: 52,
      protein_g: 0.3,
      fat_g: 0.2,
      carbohydrates_g: 14,
      fiber_g: 2.4,
      created_at: '2026-09-12T00:00:00Z',
      updated_at: '2026-09-12T00:00:00Z',
    },
  ];
  const totals: MealDayTotals = {
    account_id: account.id,
    meal_date: meal.meal_date,
    users: [
      {
        user_id: user.id,
        calories_kcal: 52,
        protein_g: 0.3,
        fat_g: 0.2,
        carbohydrates_g: 14,
        fiber_g: 2.4,
      },
    ],
  };
  const goalTimeline: GoalTimelineResponse = {
    user_id: user.id,
    date_from: meal.meal_date,
    date_to: meal.meal_date,
    periods: [
      {
        goal_id: 50,
        effective_from: meal.meal_date,
        period_start: meal.meal_date,
        period_end: meal.meal_date,
        daily_calories_kcal: 2_000,
        daily_protein_g: 120,
        daily_fiber_g: 30,
      },
    ],
  };
  const accountBootstrap = {
    ensureAccount: vi.fn(() => of(account)),
  };
  const api = {
    getMeal: vi.fn(() => of(meal)),
    listUsers: vi.fn(() => of([user])),
    getDayTotals: vi.fn(() => of(totals)),
    getGoalForDate: vi.fn(() => of(goalTimeline)),
    upsertEntry: vi.fn(() => of({})),
    upsertEntries: vi.fn(() => of({})),
    deleteEntry: vi.fn(() => of(undefined)),
  };
  const productsApi = {
    list: vi.fn(() => of(products)),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    api.getMeal.mockReturnValue(of(meal));
    api.listUsers.mockReturnValue(of([user]));
    productsApi.list.mockReturnValue(of(products));
    api.getDayTotals.mockReturnValue(of(totals));
    api.getGoalForDate.mockReturnValue(of(goalTimeline));
    api.upsertEntry.mockReturnValue(of({}));
    api.upsertEntries.mockReturnValue(of({}));
    api.deleteEntry.mockReturnValue(of(undefined));

    TestBed.configureTestingModule({
      providers: [
        AccountContextStore,
        MealDetailStore,
        ProductsStore,
        { provide: AccountBootstrapService, useValue: accountBootstrap },
        { provide: MealsApiService, useValue: api },
        { provide: ProductsApiService, useValue: productsApi },
      ],
    });
  });

  it('loads the meal and then cascades daily totals and user goals', () => {
    const store = TestBed.inject(MealDetailStore);

    store.load(meal.id).subscribe();

    expect(api.getMeal).toHaveBeenCalledWith(account.id, meal.id);
    expect(api.listUsers).toHaveBeenCalledWith(account.id);
    expect(productsApi.list).toHaveBeenCalledTimes(1);
    expect(api.getDayTotals).toHaveBeenCalledWith(account.id, meal.meal_date);
    expect(api.getGoalForDate).toHaveBeenCalledWith(account.id, user.id, meal.meal_date);
    expect(store.meal()).toEqual(meal);
    expect(store.dayTotals()).toEqual(totals);
    expect(store.goals().get(user.id)).toEqual(goalTimeline.periods[0]);
    expect(store.familyMealTotals()[0].totals.calories_kcal).toBe(52);
    expect(store.state()).toEqual({
      resolved: true,
      rejected: false,
      pending: false,
      err: null,
      empty: false,
    });
  });

  it('keeps the page pending until cascaded daily totals are loaded', () => {
    const totalsRequest = new Subject<MealDayTotals>();
    api.getDayTotals.mockReturnValue(totalsRequest);
    const store = TestBed.inject(MealDetailStore);

    store.load(meal.id).subscribe();

    expect(store.state()).toEqual({
      resolved: false,
      rejected: false,
      pending: true,
      err: null,
      empty: false,
    });

    totalsRequest.next(totals);
    totalsRequest.complete();

    expect(store.state()).toEqual({
      resolved: true,
      rejected: false,
      pending: false,
      err: null,
      empty: false,
    });
  });

  it('uses the container empty state when the meal has no family members', () => {
    api.listUsers.mockReturnValue(of([]));
    const store = TestBed.inject(MealDetailStore);

    store.load(meal.id).subscribe();

    expect(store.state().empty).toBe(true);
  });

  it('uses the container empty state when the meal has no product rows', () => {
    api.getMeal.mockReturnValue(of({ ...meal, rows: [] }));
    const store = TestBed.inject(MealDetailStore);

    store.load(meal.id).subscribe();

    expect(store.state().empty).toBe(true);
  });

  it('reuses products when the meal is loaded again', () => {
    const store = TestBed.inject(MealDetailStore);

    store.load(meal.id).subscribe();
    store.load(meal.id).subscribe();

    expect(productsApi.list).toHaveBeenCalledTimes(1);
    expect(store.products()).toEqual(products);
  });

  it('tracks a portion mutation by its row and user key', () => {
    const updatedRow = { ...row, portions: [{ ...row.portions[0], amount_g: 150, version: 2 }] };
    const updatedMeal = { ...meal, rows: [updatedRow] };
    const store = TestBed.inject(MealDetailStore);
    store.load(meal.id).subscribe();
    api.getMeal.mockReturnValue(of(updatedMeal));

    store.savePortion({ row, userId: user.id, amount: 150 }).subscribe();

    expect(api.upsertEntry).toHaveBeenCalledWith(account.id, meal.id, {
      user_id: user.id,
      product_id: row.product_id,
      amount_g: 150,
      version: row.portions[0].version,
    });
    expect(store.meal()).toEqual(updatedMeal);
    expect(store.cellOperations()[`${row.id}:${user.id}`]).toEqual(expect.objectContaining({ status: 'success', type: 'update' }));
  });

  it('adds entries and refreshes the meal and daily progress', () => {
    const addedMeal = { ...meal, name: 'Обновлённый завтрак' };
    const entries = [{ user_id: user.id, product_id: 30, amount_g: 120, version: null }];
    const store = TestBed.inject(MealDetailStore);
    store.load(meal.id).subscribe();
    api.getMeal.mockReturnValue(of(addedMeal));

    store.addEntries(entries).subscribe();

    expect(api.upsertEntries).toHaveBeenCalledWith(account.id, meal.id, { entries });
    expect(store.meal()).toEqual(addedMeal);
    expect(store.addOperation()).toEqual(expect.objectContaining({ status: 'success', type: 'create' }));
    expect(api.getDayTotals).toHaveBeenCalledTimes(2);
  });

  it('ignores a stale response for the same portion cell', () => {
    const firstRequest = new Subject<object>();
    const secondRequest = new Subject<object>();
    const firstMeal = { ...meal, name: 'Устаревший ответ' };
    const secondMeal = { ...meal, name: 'Последний ответ' };
    const store = TestBed.inject(MealDetailStore);
    store.load(meal.id).subscribe();
    api.upsertEntry.mockReturnValueOnce(firstRequest).mockReturnValueOnce(secondRequest);
    api.getMeal.mockReturnValueOnce(of(secondMeal)).mockReturnValueOnce(of(firstMeal));

    store.savePortion({ row, userId: user.id, amount: 120 }).subscribe();

    expect(store.state()).toEqual({
      resolved: true,
      rejected: false,
      pending: true,
      err: null,
      empty: false,
    });

    store.savePortion({ row, userId: user.id, amount: 130 }).subscribe();
    secondRequest.next({});
    secondRequest.complete();
    firstRequest.next({});
    firstRequest.complete();

    expect(store.meal()?.name).toBe(secondMeal.name);
    expect(store.state().pending).toBe(false);
  });

  it('does not call the API when a row without portions cannot be deleted', () => {
    const store = TestBed.inject(MealDetailStore);
    store.load(meal.id).subscribe();

    store.deleteRow({ ...row, portions: [] }).subscribe();

    expect(api.deleteEntry).not.toHaveBeenCalled();
    expect(store.actionError()).toBe('Строку без порций нельзя удалить через доступное API.');
  });

  it('deletes every portion in a row and refreshes the meal', () => {
    const updatedMeal = { ...meal, rows: [] };
    const store = TestBed.inject(MealDetailStore);
    store.load(meal.id).subscribe();
    api.getMeal.mockReturnValue(of(updatedMeal));

    store.deleteRow(row).subscribe();

    expect(api.deleteEntry).toHaveBeenCalledWith(account.id, meal.id, row.portions[0].id);
    expect(store.meal()).toEqual(updatedMeal);
    expect(store.rowOperations()[row.id]).toEqual(expect.objectContaining({ status: 'success', type: 'remove' }));
  });
});
