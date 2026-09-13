import { computed, inject, Injectable, signal } from '@angular/core';
import { format } from 'date-fns';

import type { NutrientValues, UIStateStatus } from '../../../shared/types';
import { emptyNutrientValues } from '../../../shared/utils/nutrition.utils';
import type { DiaryMealRow } from '../types/family-diary.types';
import type { PersonalDiaryMealView } from '../types/personal-diary-store.types';
import { PersonalDiaryDataStore } from './personal-diary-data.store';

const EMPTY_NUTRIENTS = emptyNutrientValues();

@Injectable()
export class PersonalDiaryStore {
  private readonly dataStore = inject(PersonalDiaryDataStore);
  private readonly dateFilterState = signal(format(new Date(), 'yyyy-MM-dd'));
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

  readonly mealViews = computed<PersonalDiaryMealView[]>(() =>
    this.meals()
      .map(meal => {
        const rows = meal.rows.filter(row => this.portionFor(row) > 0);
        return { meal, rows, totals: this.calculateTotals(rows) };
      })
      .filter(view => view.rows.length > 0),
  );

  initialize(userId: number): void {
    if (!Number.isInteger(userId) || userId <= 0) {
      this.userId = null;
      this.dataStore.setError('Некорректный идентификатор пользователя.');
      return;
    }

    this.userId = userId;
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

  portionFor(row: DiaryMealRow): number {
    if (this.userId === null) return 0;
    return row.portions.find(portion => portion.user_id === this.userId)?.amount_g ?? 0;
  }

  nutrientFor(row: DiaryMealRow, nutrient: keyof NutrientValues): number {
    return (row[nutrient] * this.portionFor(row)) / 100;
  }

  private load(): void {
    if (this.userId === null) return;
    this.dataStore.load({ userId: this.userId, diaryDate: this.dateFilterState() }).subscribe();
  }

  private calculateTotals(rows: DiaryMealRow[]): NutrientValues {
    return rows.reduce<NutrientValues>(
      (totals, row) => {
        const factor = this.portionFor(row) / 100;
        return {
          calories_kcal: totals.calories_kcal + row.calories_kcal * factor,
          protein_g: totals.protein_g + row.protein_g * factor,
          fat_g: totals.fat_g + row.fat_g * factor,
          carbohydrates_g: totals.carbohydrates_g + row.carbohydrates_g * factor,
          fiber_g: totals.fiber_g + row.fiber_g * factor,
        };
      },
      { ...EMPTY_NUTRIENTS },
    );
  }
}
