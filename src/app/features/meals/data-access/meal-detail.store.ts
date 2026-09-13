import { computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import type { Observable } from 'rxjs';
import { catchError, concat, defer, EMPTY, filter, finalize, forkJoin, ignoreElements, map, of, switchMap, tap } from 'rxjs';

import { AccountBootstrapService } from '../../../core/account/account-bootstrap.service';
import { AccountContextStore } from '../../../core/account/account-context.store';
import type { GoalTimelineItem } from '../../../shared/domain/goal.types';
import type { EntityDataOperationState, EntityDataOperationType } from '../../../shared/types/entity-data.types';
import type { UIStateStatus } from '../../../shared/types/state-container.types';
import { emptyNutrientValues } from '../../../shared/utils/nutrition.utils';
import type { Meal, MealEntryPayload, MealRow } from '../types/meal.types';
import type { MealDetailLoadResult, MealDetailProgress, MealDetailState, MealPortionUpdate } from '../types/meal-detail.types';
import { MealsApiService } from './meals-api.service';

const EMPTY_TOTALS = emptyNutrientValues();

const initialState: MealDetailState = {
  accountId: null,
  meal: null,
  users: [],
  products: [],
  dayTotals: null,
  goals: new Map(),
  loading: true,
  loadingProgress: false,
  loadError: null,
  actionError: null,
  progressCorrelationId: null,
  addOperation: null,
  cellOperations: {},
  rowOperations: {},
};

let correlationSequence = 0;

function correlationId(type: EntityDataOperationType): string {
  correlationSequence += 1;
  return `${type}-${Date.now()}-${correlationSequence}`;
}

function pendingOperation(type: EntityDataOperationType, id: string): EntityDataOperationState {
  return { correlationId: id, type, status: 'pending', error: null };
}

function completedOperation(operation: EntityDataOperationState, error: string | null): EntityDataOperationState {
  return { ...operation, status: error ? 'error' : 'success', error };
}

function cellKey(rowId: number, userId: number): string {
  return `${rowId}:${userId}`;
}

export const MealDetailStore = signalStore(
  withState(initialState),
  withComputed(store => ({
    state: computed<UIStateStatus<string>>(() => ({
      resolved: !!store.meal() && !store.loadError(),
      rejected: !!store.loadError(),
      pending: store.loading(),
      err: store.loadError(),
    })),
    saving: computed(
      () =>
        store.addOperation()?.status === 'pending' ||
        Object.values(store.cellOperations()).some(operation => operation.status === 'pending') ||
        Object.values(store.rowOperations()).some(operation => operation.status === 'pending'),
    ),
    familyMealTotals: computed(() => {
      const meal = store.meal();
      if (!meal) return [];

      return store.users().map(user => ({
        user,
        totals: meal.rows.reduce(
          (totals, row) => {
            const amount = row.portions.find(portion => portion.user_id === user.id)?.amount_g ?? 0;
            const factor = amount / 100;
            return {
              calories_kcal: totals.calories_kcal + row.calories_kcal * factor,
              protein_g: totals.protein_g + row.protein_g * factor,
              fat_g: totals.fat_g + row.fat_g * factor,
              carbohydrates_g: totals.carbohydrates_g + row.carbohydrates_g * factor,
              fiber_g: totals.fiber_g + row.fiber_g * factor,
            };
          },
          { ...EMPTY_TOTALS },
        ),
      }));
    }),
    familyDayTotals: computed(() => {
      const totalsByUser = new Map((store.dayTotals()?.users ?? []).map(totals => [totals.user_id, totals]));
      return store.users().map(user => ({
        user,
        totals: totalsByUser.get(user.id) ?? EMPTY_TOTALS,
      }));
    }),
  })),
  withMethods((store, api = inject(MealsApiService), accountBootstrap = inject(AccountBootstrapService), accountContext = inject(AccountContextStore)) => {
    const isActiveAdd = (id: string): boolean => store.addOperation()?.correlationId === id && store.addOperation()?.status === 'pending';
    const isActiveCell = (key: string, id: string): boolean => store.cellOperations()[key]?.correlationId === id && store.cellOperations()[key]?.status === 'pending';
    const isActiveRow = (rowId: number, id: string): boolean => store.rowOperations()[rowId]?.correlationId === id && store.rowOperations()[rowId]?.status === 'pending';

    const applyMeal = (meal: Meal): void => patchState(store, { meal });

    const loadProgress = (meal: Meal, users = store.users()): Observable<MealDetailProgress> => {
      const id = correlationId('load');
      const accountId = store.accountId();
      if (accountId === null) return EMPTY;

      const goalRequests = users.map(user =>
        api.getGoalForDate(accountId, user.id, meal.meal_date).pipe(
          map(response => response.periods[0] ?? null),
          catchError(() => of(null)),
        ),
      );

      patchState(store, { loadingProgress: true, progressCorrelationId: id });
      return forkJoin({
        totals: api.getDayTotals(accountId, meal.meal_date),
        goals: goalRequests.length ? forkJoin(goalRequests) : of([]),
      }).pipe(
        map(({ totals, goals }) => ({
          totals,
          goals: new Map<number, GoalTimelineItem | null>(users.map((user, index) => [user.id, goals[index] ?? null])),
        })),
        tapResponse({
          next: progress => {
            if (store.progressCorrelationId() !== id) return;
            patchState(store, { dayTotals: progress.totals, goals: progress.goals });
          },
          error: () => {
            if (store.progressCorrelationId() !== id) return;
            patchState(store, { actionError: 'Не удалось загрузить дневные итоги.' });
          },
          finalize: () => {
            if (store.progressCorrelationId() === id) patchState(store, { loadingProgress: false });
          },
        }),
      );
    };

    const refreshProgressAfter = (meal: Meal): Observable<Meal> => concat(of(meal), loadProgress(meal).pipe(ignoreElements()));

    const completeAdd = (id: string, error: string | null): void => {
      const operation = store.addOperation();
      if (!operation || !isActiveAdd(id)) return;
      patchState(store, { addOperation: completedOperation(operation, error) });
    };

    const completeCell = (key: string, id: string, error: string | null): void => {
      if (!isActiveCell(key, id)) return;
      patchState(store, state => ({
        cellOperations: {
          ...state.cellOperations,
          [key]: completedOperation(state.cellOperations[key], error),
        },
      }));
    };

    const completeRow = (rowId: number, id: string, error: string | null): void => {
      if (!isActiveRow(rowId, id)) return;
      patchState(store, state => ({
        rowOperations: {
          ...state.rowOperations,
          [rowId]: completedOperation(state.rowOperations[rowId], error),
        },
      }));
    };

    return {
      load(mealId: number): Observable<Meal> {
        if (!Number.isInteger(mealId) || mealId <= 0) {
          patchState(store, { loading: false, loadError: 'Некорректный идентификатор приёма пищи.' });
          return EMPTY;
        }

        return defer(() => {
          patchState(store, { ...initialState, loading: true });
          return accountBootstrap.ensureAccount();
        }).pipe(
          tap(account => {
            accountContext.setAccount(account);
            patchState(store, { accountId: account.id });
          }),
          switchMap(account =>
            forkJoin({
              meal: api.getMeal(account.id, mealId),
              users: api.listUsers(account.id),
              products: api.listProducts(),
            }),
          ),
          tapResponse({
            next: result => {
              accountContext.setMembers(result.users);
              patchState(store, { meal: result.meal, users: result.users, products: result.products });
            },
            error: () => patchState(store, { loadError: 'Не удалось загрузить приём пищи.' }),
            finalize: () => patchState(store, { loading: false }),
          }),
          switchMap((result: MealDetailLoadResult) => refreshProgressAfter(result.meal)),
        );
      },

      addEntries(entries: MealEntryPayload[]): Observable<Meal> {
        const id = correlationId('create');
        return defer(() => {
          const meal = store.meal();
          const accountId = store.accountId();
          if (!meal || accountId === null) return EMPTY;

          patchState(store, { actionError: null, addOperation: pendingOperation('create', id) });
          return api.upsertEntries(accountId, meal.id, { entries }).pipe(switchMap(() => api.getMeal(accountId, meal.id)));
        }).pipe(
          tapResponse({
            next: meal => {
              if (!isActiveAdd(id)) return;
              applyMeal(meal);
              completeAdd(id, null);
            },
            error: () => {
              if (!isActiveAdd(id)) return;
              const error = 'Не удалось добавить продукт.';
              patchState(store, { actionError: error });
              completeAdd(id, error);
            },
            finalize: () => {
              if (isActiveAdd(id)) patchState(store, { addOperation: null });
            },
          }),
          switchMap(meal => refreshProgressAfter(meal)),
        );
      },

      savePortion(update: MealPortionUpdate): Observable<Meal> {
        const meal = store.meal();
        const accountId = store.accountId();
        const productId = update.row.product_id;
        if (!meal || accountId === null || productId === null) return EMPTY;

        const existing = update.row.portions.find(portion => portion.user_id === update.userId);
        if ((!existing && update.amount === 0) || existing?.amount_g === update.amount) return EMPTY;

        const key = cellKey(update.row.id, update.userId);
        const id = correlationId('update');
        return defer(() => {
          patchState(store, state => ({
            actionError: null,
            cellOperations: { ...state.cellOperations, [key]: pendingOperation('update', id) },
          }));

          const request =
            update.amount === 0 && existing
              ? api.deleteEntry(accountId, meal.id, existing.id)
              : api.upsertEntry(accountId, meal.id, {
                  user_id: update.userId,
                  product_id: productId,
                  amount_g: update.amount,
                  version: existing?.version ?? null,
                });

          return request.pipe(switchMap(() => api.getMeal(accountId, meal.id)));
        }).pipe(
          tapResponse({
            next: updatedMeal => {
              if (!isActiveCell(key, id)) return;
              applyMeal(updatedMeal);
              completeCell(key, id, null);
            },
            error: () => {
              if (!isActiveCell(key, id)) return;
              const error = 'Не удалось сохранить порцию. Обновите страницу и повторите.';
              patchState(store, { actionError: error });
              completeCell(key, id, error);
            },
            finalize: () => {
              if (!isActiveCell(key, id)) return;
              patchState(store, state => {
                const operations = { ...state.cellOperations };
                delete operations[key];
                return { cellOperations: operations };
              });
            },
          }),
          switchMap(updatedMeal => refreshProgressAfter(updatedMeal)),
        );
      },

      deleteRow(row: MealRow): Observable<Meal> {
        const meal = store.meal();
        const accountId = store.accountId();
        if (!meal || accountId === null) return EMPTY;
        if (!row.portions.length) {
          patchState(store, { actionError: 'Строку без порций нельзя удалить через доступное API.' });
          return EMPTY;
        }

        const id = correlationId('remove');
        return defer(() => {
          patchState(store, state => ({
            actionError: null,
            rowOperations: { ...state.rowOperations, [row.id]: pendingOperation('remove', id) },
          }));
          return forkJoin(row.portions.map(portion => api.deleteEntry(accountId, meal.id, portion.id))).pipe(
            switchMap(() => api.getMeal(accountId, meal.id)),
            map(updatedMeal => ({ updatedMeal, failed: false })),
            catchError(() =>
              api.getMeal(accountId, meal.id).pipe(
                map(updatedMeal => ({ updatedMeal, failed: true })),
                catchError(() => of({ updatedMeal: null, failed: true })),
              ),
            ),
          );
        }).pipe(
          tap(({ updatedMeal, failed }) => {
            if (!isActiveRow(row.id, id)) return;
            const error = failed ? 'Не удалось удалить строку полностью. Данные были обновлены.' : null;
            if (updatedMeal) applyMeal(updatedMeal);
            if (error) patchState(store, { actionError: error });
            completeRow(row.id, id, error);
          }),
          finalize(() => {
            if (!isActiveRow(row.id, id)) return;
            patchState(store, state => {
              const operations = { ...state.rowOperations };
              delete operations[row.id];
              return { rowOperations: operations };
            });
          }),
          map(({ updatedMeal }) => updatedMeal),
          filter((updatedMeal): updatedMeal is Meal => updatedMeal !== null),
          switchMap(updatedMeal => refreshProgressAfter(updatedMeal)),
        );
      },

      portionFor(row: MealRow, userId: number): number {
        return row.portions.find(portion => portion.user_id === userId)?.amount_g ?? 0;
      },

      isCellSaving(rowId: number, userId: number): boolean {
        return store.cellOperations()[cellKey(rowId, userId)]?.status === 'pending';
      },

      isRowDeleting(rowId: number): boolean {
        return store.rowOperations()[rowId]?.status === 'pending';
      },

      goalFor(userId: number): GoalTimelineItem | null {
        return store.goals().get(userId) ?? null;
      },

      setActionError(error: string): void {
        patchState(store, { actionError: error });
      },

      dismissActionError(): void {
        patchState(store, { actionError: null });
      },
    };
  }),
);
