import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, of, switchMap } from 'rxjs';
import { AccountBootstrapService } from '../../../../core/account/account-bootstrap.service';
import { FamilyDiaryApiService } from '../../data-access/family-diary-api.service';
import {
  DiaryMeal,
  DiaryMealRow,
  DiaryMealType,
  DiaryNutrients,
} from '../../data-access/family-diary.models';
import { FamilyUser, GoalTimelineItem } from '../../data-access/family.models';

const EMPTY_NUTRIENTS: DiaryNutrients = {
  calories_kcal: 0,
  protein_g: 0,
  fat_g: 0,
  carbohydrates_g: 0,
  fiber_g: 0,
};

@Component({
  selector: 'app-personal-diary-page',
  imports: [
    DatePipe,
    DecimalPipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './personal-diary.page.html',
  styleUrl: './personal-diary.page.scss',
})
export class PersonalDiaryPage implements OnInit {
  private readonly accountBootstrap = inject(AccountBootstrapService);
  private readonly api = inject(FamilyDiaryApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly userId = Number(this.route.snapshot.paramMap.get('userId'));

  protected readonly user = signal<FamilyUser | null>(null);
  protected readonly meals = signal<DiaryMeal[]>([]);
  protected readonly goal = signal<GoalTimelineItem | null>(null);
  protected readonly dayTotals = signal<DiaryNutrients>(EMPTY_NUTRIENTS);
  protected readonly dateFilter = signal(this.todayIsoDate());
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly mealViews = computed(() =>
    this.meals()
      .map((meal) => {
        const rows = meal.rows.filter((row) => this.portionFor(row) > 0);
        return { meal, rows, totals: this.calculateTotals(rows) };
      })
      .filter((view) => view.rows.length > 0),
  );

  ngOnInit(): void {
    this.loadDiary();
  }

  protected setDate(date: string): void {
    if (!date) return;
    this.dateFilter.set(date);
    this.loadDiary();
  }

  protected portionFor(row: DiaryMealRow): number {
    return row.portions.find((portion) => portion.user_id === this.userId)?.amount_g ?? 0;
  }

  protected nutrientFor(row: DiaryMealRow, nutrient: keyof DiaryNutrients): number {
    return (row[nutrient] * this.portionFor(row)) / 100;
  }

  protected typeLabel(type: DiaryMealType): string {
    return { breakfast: 'Завтрак', lunch: 'Обед', dinner: 'Ужин', other: 'Другое' }[type];
  }

  protected typeIcon(type: DiaryMealType): string {
    return {
      breakfast: 'bakery_dining',
      lunch: 'lunch_dining',
      dinner: 'dinner_dining',
      other: 'restaurant',
    }[type];
  }

  protected goalPercent(value: number, target: number): number {
    return target > 0 ? Math.min((value / target) * 100, 100) : 0;
  }

  protected goalState(value: number, target: number): string {
    if (target <= 0 || value < target) return 'pending';
    return value <= target * 1.05 ? 'achieved' : 'exceeded';
  }

  protected goalCaption(value: number, target: number, unit: string): string {
    if (target <= 0) return 'Цель не задана';
    const difference = target - value;
    if (difference > 0) return `Осталось ${this.formatNumber(difference)} ${unit}`;
    if (Math.abs(difference) <= target * 0.05) return 'Цель достигнута';
    return `Превышено на ${this.formatNumber(Math.abs(difference))} ${unit}`;
  }

  protected mealsCountLabel(count: number): string {
    const lastTwo = count % 100;
    const last = count % 10;
    if (lastTwo >= 11 && lastTwo <= 14) return `${count} приёмов пищи`;
    if (last === 1) return `${count} приём пищи`;
    if (last >= 2 && last <= 4) return `${count} приёма пищи`;
    return `${count} приёмов пищи`;
  }

  protected initials(name: string): string {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toLocaleUpperCase('ru');
  }

  protected loadDiary(): void {
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
        switchMap((account) =>
          forkJoin({
            user: this.api.getUser(account.id, this.userId),
            meals: this.api.listMeals(account.id, this.dateFilter()),
            totals: this.api.getDayTotals(account.id, this.dateFilter()),
            goalTimeline: this.api
              .getGoalForDate(account.id, this.userId, this.dateFilter())
              .pipe(catchError(() => of(null))),
          }),
        ),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: ({ user, meals, totals, goalTimeline }) => {
          this.user.set(user);
          this.meals.set(meals);
          this.goal.set(goalTimeline?.periods[0] ?? null);
          this.dayTotals.set(
            totals.users.find((total) => total.user_id === this.userId) ?? EMPTY_NUTRIENTS,
          );
        },
        error: () => this.error.set('Не удалось загрузить персональный дневник.'),
      });
  }

  private calculateTotals(rows: DiaryMealRow[]): DiaryNutrients {
    return rows.reduce<DiaryNutrients>(
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

  private todayIsoDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
