import { computed, inject, Injectable, signal } from '@angular/core';
import { format } from 'date-fns';
import { tap } from 'rxjs';

import { AccountContextStore } from '../../../core/account/account-context.store';
import type { NutrientValues } from '../../../shared/domain/nutrition.types';
import { emptyNutrientValues } from '../../../shared/utils/nutrition.utils';
import type { OverviewMeal, OverviewMealSummary, OverviewNutrient } from '../types/overview.types';
import { OverviewDataStore } from './overview-data.store';
import { OverviewGoalStore } from './overview-goal.store';

const EMPTY_TOTALS = emptyNutrientValues();

@Injectable()
export class OverviewStore {
  private readonly accountContext = inject(AccountContextStore);
  private readonly dataStore = inject(OverviewDataStore);
  private readonly goalStore = inject(OverviewGoalStore);
  private readonly selectedUserIdState = signal<number | null>(null);

  readonly today = new Date();
  readonly selectedUserId = this.selectedUserIdState.asReadonly();
  readonly users = computed(() => this.dataStore.data()?.users ?? []);
  readonly meals = computed(() => this.dataStore.data()?.meals ?? []);
  readonly goal = computed(() => this.goalStore.data());
  readonly pageState = this.dataStore.requestState;
  readonly selectedUser = computed(() => this.users().find(user => user.id === this.selectedUserIdState()));

  readonly mealSummaries = computed<OverviewMealSummary[]>(() => {
    const userId = this.selectedUserIdState();
    if (userId === null) return [];

    return this.meals().map(meal => ({
      meal,
      products: meal.rows.map(row => row.product_name).join(', '),
      totals: this.calculateMealTotals(meal, userId),
    }));
  });

  readonly dayTotals = computed<NutrientValues>(() =>
    this.mealSummaries().reduce<NutrientValues>(
      (totals, summary) => ({
        calories_kcal: totals.calories_kcal + summary.totals.calories_kcal,
        protein_g: totals.protein_g + summary.totals.protein_g,
        fat_g: totals.fat_g + summary.totals.fat_g,
        carbohydrates_g: totals.carbohydrates_g + summary.totals.carbohydrates_g,
        fiber_g: totals.fiber_g + summary.totals.fiber_g,
      }),
      { ...EMPTY_TOTALS },
    ),
  );

  readonly calorieTarget = computed(() => this.goal()?.daily_calories_kcal ?? null);
  readonly caloriePercent = computed(() => this.percent(this.dayTotals().calories_kcal, this.calorieTarget()));
  readonly calorieRemaining = computed(() => {
    const target = this.calorieTarget();
    return target === null ? null : Math.max(target - this.dayTotals().calories_kcal, 0);
  });

  readonly nutrients = computed<OverviewNutrient[]>(() => {
    const totals = this.dayTotals();
    const goal = this.goal();

    return [
      {
        name: 'Белки',
        value: totals.protein_g,
        target: goal?.daily_protein_g ?? null,
        color: '#7559d9',
        percent: this.percent(totals.protein_g, goal?.daily_protein_g ?? null),
      },
      {
        name: 'Жиры',
        value: totals.fat_g,
        target: null,
        color: '#e99a49',
        percent: null,
      },
      {
        name: 'Углеводы',
        value: totals.carbohydrates_g,
        target: null,
        color: '#3e9c68',
        percent: null,
      },
      {
        name: 'Клетчатка',
        value: totals.fiber_g,
        target: goal?.daily_fiber_g ?? null,
        color: '#4e91c7',
        percent: this.percent(totals.fiber_g, goal?.daily_fiber_g ?? null),
      },
    ];
  });

  initialize(): void {
    this.dataStore
      .load({ mealDate: format(this.today, 'yyyy-MM-dd') })
      .pipe(
        tap(data => {
          this.accountContext.setMembers(data.users);
          const selectedUserId = this.accountContext.activeUserId() ?? data.users[0]?.id ?? null;
          this.selectedUserIdState.set(selectedUserId);

          if (selectedUserId === null) {
            this.goalStore.reset();
            return;
          }

          this.loadGoal(data.accountId, selectedUserId);
        }),
      )
      .subscribe();
  }

  selectUser(userId: number): void {
    if (!this.users().some(user => user.id === userId)) return;

    const accountId = this.dataStore.data()?.accountId;
    if (accountId === undefined) return;

    this.selectedUserIdState.set(userId);
    this.accountContext.selectUser(userId);
    this.loadGoal(accountId, userId);
  }

  private loadGoal(accountId: number, userId: number): void {
    this.goalStore.reset();
    this.goalStore.load({ accountId, userId }).subscribe();
  }

  private calculateMealTotals(meal: OverviewMeal, userId: number): NutrientValues {
    return meal.rows.reduce<NutrientValues>(
      (totals, row) => {
        const amount = row.portions.find(portion => portion.user_id === userId)?.amount_g ?? 0;
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
    );
  }

  private percent(value: number, target: number | null): number | null {
    return target && target > 0 ? Math.round((value / target) * 100) : null;
  }
}
