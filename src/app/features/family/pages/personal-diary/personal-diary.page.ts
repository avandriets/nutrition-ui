import { DatePipe, DecimalPipe } from '@angular/common';
import type { OnInit } from '@angular/core';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { format } from 'date-fns';
import { catchError, finalize, forkJoin, of, switchMap } from 'rxjs';

import { AccountBootstrapService } from '../../../../core/account/account-bootstrap.service';
import type { GoalTimelineItem } from '../../../../shared/domain/goal.types';
import type { MealType } from '../../../../shared/domain/meal.types';
import type { NutrientValues } from '../../../../shared/domain/nutrition.types';
import { UIPageComponent } from '../../../../shared/ui/page/page';
import { mealTypeIcon, mealTypeLabel } from '../../../../shared/utils/meal.utils';
import { initials } from '../../../../shared/utils/name.utils';
import { emptyNutrientValues } from '../../../../shared/utils/nutrition.utils';
import { FamilyDiaryApiService } from '../../data-access/family-diary-api.service';
import type { FamilyUser } from '../../types/family.types';
import type { DiaryMeal, DiaryMealRow } from '../../types/family-diary.types';

const EMPTY_NUTRIENTS = emptyNutrientValues();

@Component({
  selector: 'app-personal-diary-page',
  imports: [DatePipe, DecimalPipe, MatButtonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule, RouterLink, UIPageComponent],
  templateUrl: './personal-diary.page.html',
  styleUrl: './personal-diary.page.scss',
})
export class PersonalDiaryPage implements OnInit {
  private readonly accountBootstrap = inject(AccountBootstrapService);
  private readonly api = inject(FamilyDiaryApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly userId = Number(this.route.snapshot.paramMap.get('userId'));

  readonly user = signal<FamilyUser | null>(null);
  readonly meals = signal<DiaryMeal[]>([]);
  readonly goal = signal<GoalTimelineItem | null>(null);
  readonly dayTotals = signal<NutrientValues>(EMPTY_NUTRIENTS);
  readonly dateFilter = signal(format(new Date(), 'yyyy-MM-dd'));
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly mealViews = computed(() =>
    this.meals()
      .map(meal => {
        const rows = meal.rows.filter(row => this.portionFor(row) > 0);
        return { meal, rows, totals: this.calculateTotals(rows) };
      })
      .filter(view => view.rows.length > 0),
  );

  ngOnInit(): void {
    this.loadDiary();
  }

  setDate(date: string): void {
    if (!date) return;
    this.dateFilter.set(date);
    this.loadDiary();
  }

  portionFor(row: DiaryMealRow): number {
    return row.portions.find(portion => portion.user_id === this.userId)?.amount_g ?? 0;
  }

  nutrientFor(row: DiaryMealRow, nutrient: keyof NutrientValues): number {
    return (row[nutrient] * this.portionFor(row)) / 100;
  }

  typeLabel(type: MealType): string {
    return mealTypeLabel(type);
  }

  typeIcon(type: MealType): string {
    return mealTypeIcon(type);
  }

  goalPercent(value: number, target: number): number {
    return target > 0 ? Math.min((value / target) * 100, 100) : 0;
  }

  goalState(value: number, target: number): string {
    if (target <= 0 || value < target) return 'pending';
    return value <= target * 1.05 ? 'achieved' : 'exceeded';
  }

  goalCaption(value: number, target: number, unit: string): string {
    if (target <= 0) return 'Цель не задана';
    const difference = target - value;
    if (difference > 0) return `Осталось ${this.formatNumber(difference)} ${unit}`;
    if (Math.abs(difference) <= target * 0.05) return 'Цель достигнута';
    return `Превышено на ${this.formatNumber(Math.abs(difference))} ${unit}`;
  }

  mealsCountLabel(count: number): string {
    const lastTwo = count % 100;
    const last = count % 10;
    if (lastTwo >= 11 && lastTwo <= 14) return `${count} приёмов пищи`;
    if (last === 1) return `${count} приём пищи`;
    if (last >= 2 && last <= 4) return `${count} приёма пищи`;
    return `${count} приёмов пищи`;
  }

  initials(name: string): string {
    return initials(name);
  }

  loadDiary(): void {
    if (!Number.isInteger(this.userId) || this.userId <= 0) {
      this.loading.set(false);
      this.error.set('Некорректный идентификатор пользователя.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.accountBootstrap
      .ensureAccount()
      .pipe(
        switchMap(account =>
          forkJoin({
            user: this.api.getUser(account.id, this.userId),
            meals: this.api.listMeals(account.id, this.dateFilter()),
            totals: this.api.getDayTotals(account.id, this.dateFilter()),
            goalTimeline: this.api.getGoalForDate(account.id, this.userId, this.dateFilter()).pipe(catchError(() => of(null))),
          }),
        ),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: ({ user, meals, totals, goalTimeline }) => {
          this.user.set(user);
          this.meals.set(meals);
          this.goal.set(goalTimeline?.periods[0] ?? null);
          this.dayTotals.set(totals.users.find(total => total.user_id === this.userId) ?? EMPTY_NUTRIENTS);
        },
        error: () => this.error.set('Не удалось загрузить персональный дневник.'),
      });
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

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(value);
  }
}
