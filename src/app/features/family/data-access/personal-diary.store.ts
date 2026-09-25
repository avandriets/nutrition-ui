import { computed, inject, Injectable, signal } from '@angular/core';
import { format } from 'date-fns';

import type { NutrientValues, UIStateStatus } from '../../../shared/types';
import { emptyNutrientValues } from '../../../shared/utils/nutrition.utils';
import type { DiaryMealRow } from '../types/family-diary.types';
import type { PersonalDiaryMealRowView, PersonalDiaryMealView } from '../types/personal-diary-store.types';
import { PersonalDiaryDataStore } from './personal-diary-data.store';

const EMPTY_NUTRIENTS = emptyNutrientValues();

@Injectable()
export class PersonalDiaryStore {
  private readonly dataStore = inject(PersonalDiaryDataStore);
  readonly todayDate = format(new Date(), 'yyyy-MM-dd');
  private readonly dateFilterState = signal(this.todayDate);
  private userId: number | null = null;

  readonly dateFilter = this.dateFilterState.asReadonly();
  readonly user = computed(() => this.dataStore.data()?.user ?? null);
  readonly meals = computed(() => this.dataStore.data()?.meals ?? []);
  readonly goal = computed(() => this.dataStore.data()?.goal ?? null);
  readonly dayTotals = computed(() => this.dataStore.data()?.dayTotals ?? EMPTY_NUTRIENTS);
  readonly refreshError = computed(() => (this.dataStore.data() ? this.dataStore.error() : null));
  readonly pageState = computed<UIStateStatus<string>>(() => {
    if (!this.dataStore.data()) return this.dataStore.requestState();

    return {
      resolved: true,
      rejected: false,
      pending: this.dataStore.loading(),
      err: null,
    };
  });
  readonly goalState = computed<UIStateStatus<string>>(() => {
    const state = this.pageState();
    return { ...state, pending: false, empty: state.resolved && !this.goal() };
  });

  readonly mealViews = computed<PersonalDiaryMealView[]>(() =>
    this.meals()
      .map(meal => {
        const rows = meal.rows.map(row => this.toRowView(row)).filter(row => row.portion_g > 0);
        return { meal, rows, totals: this.calculateTotals(rows) };
      })
      .filter(view => view.rows.length > 0),
  );
  readonly mealsState = computed<UIStateStatus<string>>(() => {
    const state = this.pageState();
    return { ...state, pending: false, empty: state.resolved && !this.mealViews().length };
  });

  initialize(userId: number, diaryDate = this.todayDate): void {
    if (!Number.isInteger(userId) || userId <= 0) {
      this.userId = null;
      this.dataStore.setError('Invalid user ID.');
      return;
    }

    this.userId = userId;
    this.dateFilterState.set(diaryDate);
    this.load();
  }

  setDate(date: string): void {
    if (!date || this.userId === null) return;

    this.dateFilterState.set(date);
    this.load();
  }

  reload(): void {
    if (this.userId !== null) this.load();
  }

  dismissRefreshError(): void {
    this.dataStore.dismissError();
  }

  private portionFor(row: DiaryMealRow): number {
    if (this.userId === null) return 0;
    return row.portions.find(portion => portion.user_id === this.userId)?.amount_g ?? 0;
  }

  private load(): void {
    if (this.userId === null) return;
    this.dataStore.load({ userId: this.userId, diaryDate: this.dateFilterState() }).subscribe();
  }

  private toRowView(row: DiaryMealRow): PersonalDiaryMealRowView {
    const portion = this.portionFor(row);
    const factor = portion / 100;

    return {
      id: row.id,
      product_name: row.product_name,
      product_brand: row.product_brand,
      portion_g: portion,
      calories_kcal: row.calories_kcal * factor,
      protein_g: row.protein_g * factor,
      fat_g: row.fat_g * factor,
      carbohydrates_g: row.carbohydrates_g * factor,
      fiber_g: row.fiber_g * factor,
    };
  }

  private calculateTotals(rows: PersonalDiaryMealRowView[]): NutrientValues {
    return rows.reduce<NutrientValues>(
      (totals, row) => {
        return {
          calories_kcal: totals.calories_kcal + row.calories_kcal,
          protein_g: totals.protein_g + row.protein_g,
          fat_g: totals.fat_g + row.fat_g,
          carbohydrates_g: totals.carbohydrates_g + row.carbohydrates_g,
          fiber_g: totals.fiber_g + row.fiber_g,
        };
      },
      { ...EMPTY_NUTRIENTS },
    );
  }
}
