import { computed, inject, Injectable, signal } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { format } from 'date-fns';
import type { Observable } from 'rxjs';
import { catchError, defer, EMPTY, finalize, forkJoin, map, switchMap, tap } from 'rxjs';

import { AccountBootstrapService } from '../../../core/account/account-bootstrap.service';
import { AccountContextStore } from '../../../core/account/account-context.store';
import type { UIStateStatus } from '../../../shared/types/state-container.types';
import type { Meal, MealDay, MealPayload } from '../types/meal.types';
import type { MealDayCopyRequest } from '../types/meal-list.types';
import { MealsApiService } from './meals-api.service';
import { MealsEntityStore } from './meals-entity.store';

@Injectable()
export class MealListStore {
  private readonly accountBootstrap = inject(AccountBootstrapService);
  private readonly accountContext = inject(AccountContextStore);
  private readonly api = inject(MealsApiService);
  private readonly mealsStore = inject(MealsEntityStore);
  private readonly initializing = signal(true);
  private readonly usersError = signal<string | null>(null);
  private readonly copyError = signal<string | null>(null);
  private readonly copying = signal(false);

  readonly todayDate = format(new Date(), 'yyyy-MM-dd');
  readonly dateFilter = signal(this.todayDate);
  readonly meals = this.mealsStore.entities;
  readonly users = this.accountContext.members;
  readonly loading = computed(() => this.initializing() || this.mealsStore.loading());
  readonly saving = computed(() => this.mealsStore.saving() || this.copying());
  readonly loadError = computed(() => this.usersError() ?? this.mealsStore.error());
  readonly actionError = computed(() => this.copyError() ?? this.mealsStore.actionError());
  readonly state = computed<UIStateStatus<string>>(() => {
    const error = this.loadError();
    const pending = this.loading();

    return {
      resolved: !pending && !error,
      rejected: !!error,
      pending,
      err: error,
      empty: !pending && !error && !this.meals().length,
    };
  });

  load(): Observable<Meal[]> {
    this.initializing.set(true);
    this.usersError.set(null);
    this.mealsStore.dismissError();

    return this.accountBootstrap.ensureAccount().pipe(
      tap(account => this.accountContext.setAccount(account)),
      switchMap(account =>
        forkJoin({
          meals: this.mealsStore.load({ mealDate: this.dateFilter() || undefined }),
          users: this.api.listUsers(account.id),
        }),
      ),
      tap(({ users }) => this.accountContext.setMembers(users)),
      map(({ meals }) => meals.entities),
      catchError(() => {
        this.usersError.set('Не удалось загрузить приёмы пищи.');
        return EMPTY;
      }),
      finalize(() => this.initializing.set(false)),
    );
  }

  setDateFilter(date: string): Observable<Meal[]> {
    this.dateFilter.set(date);
    return this.load();
  }

  create(payload: MealPayload): Observable<Meal> {
    return this.mealsStore.create(payload);
  }

  copyDay(request: MealDayCopyRequest): Observable<MealDay> {
    return defer(() => {
      const account = this.accountContext.account();
      if (!account) throw new Error('Account is not initialized');

      this.copying.set(true);
      this.copyError.set(null);
      return this.api.copyMealDay(account.id, request.targetDate, request.payload);
    }).pipe(
      tapResponse({
        next: mealDay => {
          this.dateFilter.set(mealDay.meal_date);
          this.mealsStore.replaceAll(mealDay.meals);
        },
        error: () => this.copyError.set('Не удалось скопировать рацион. Если целевой день уже заполнен, включите замену существующих приёмов.'),
        finalize: () => this.copying.set(false),
      }),
    );
  }

  dismissActionError(): void {
    this.copyError.set(null);
    this.mealsStore.dismissActionError();
  }
}
