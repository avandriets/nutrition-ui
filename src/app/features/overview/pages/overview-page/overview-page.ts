import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, of, switchMap } from 'rxjs';
import { AccountBootstrapService } from '../../../../core/account/account-bootstrap.service';
import { AccountContextService } from '../../../../core/account/account-context.service';
import { OverviewApiService } from '../../data-access/overview-api.service';
import {
  OverviewGoal,
  OverviewMeal,
  OverviewMealSummary,
  OverviewNutrient,
  OverviewNutrientTotals,
  OverviewUser,
} from '../../data-access/overview.models';

const EMPTY_TOTALS: OverviewNutrientTotals = {
  calories_kcal: 0,
  protein_g: 0,
  fat_g: 0,
  carbohydrates_g: 0,
  fiber_g: 0,
};

@Component({
  selector: 'app-overview-page',
  imports: [
    DatePipe,
    DecimalPipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    RouterLink,
  ],
  templateUrl: './overview-page.html',
  styleUrl: './overview-page.scss',
})
export class OverviewPage implements OnInit {
  private readonly accountBootstrap = inject(AccountBootstrapService);
  private readonly accountContext = inject(AccountContextService);
  private readonly api = inject(OverviewApiService);
  private accountId: number | null = null;

  protected readonly today = new Date();
  protected readonly users = signal<OverviewUser[]>([]);
  protected readonly meals = signal<OverviewMeal[]>([]);
  protected readonly selectedUserId = signal<number | null>(null);
  protected readonly goal = signal<OverviewGoal | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly selectedUser = computed(() =>
    this.users().find((user) => user.id === this.selectedUserId()),
  );

  protected readonly mealSummaries = computed<OverviewMealSummary[]>(() => {
    const userId = this.selectedUserId();
    if (!userId) return [];

    return this.meals().map((meal) => ({
      meal,
      products: meal.rows.map((row) => row.product_name).join(', '),
      totals: this.calculateMealTotals(meal, userId),
    }));
  });

  protected readonly dayTotals = computed<OverviewNutrientTotals>(() =>
    this.mealSummaries().reduce<OverviewNutrientTotals>(
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

  protected readonly calorieTarget = computed(() => this.goal()?.daily_calories_kcal ?? null);
  protected readonly caloriePercent = computed(() =>
    this.percent(this.dayTotals().calories_kcal, this.calorieTarget()),
  );
  protected readonly calorieRemaining = computed(() => {
    const target = this.calorieTarget();
    return target === null ? null : Math.max(target - this.dayTotals().calories_kcal, 0);
  });

  protected readonly nutrients = computed<OverviewNutrient[]>(() => {
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

  ngOnInit(): void {
    this.loadOverview();
  }

  protected selectUser(userId: number): void {
    this.selectedUserId.set(userId);
    this.goal.set(null);
    this.accountContext.selectUser(userId);
    this.loadGoal(userId);
  }

  protected typeLabel(meal: OverviewMeal): string {
    return {
      breakfast: 'Завтрак',
      lunch: 'Обед',
      dinner: 'Ужин',
      other: 'Другое',
    }[meal.meal_type];
  }

  protected typeIcon(meal: OverviewMeal): string {
    return {
      breakfast: 'bakery_dining',
      lunch: 'lunch_dining',
      dinner: 'dinner_dining',
      other: 'restaurant',
    }[meal.meal_type];
  }

  protected typeTone(meal: OverviewMeal): string {
    return {
      breakfast: 'orange',
      lunch: 'green',
      dinner: 'purple',
      other: 'blue',
    }[meal.meal_type];
  }

  private loadOverview(): void {
    this.loading.set(true);
    this.error.set(null);
    this.accountBootstrap
      .ensureAccount()
      .pipe(
        switchMap((account) => {
          this.accountId = account.id;
          return forkJoin({
            users: this.api.listUsers(account.id),
            meals: this.api.listMeals(account.id, this.toLocalIsoDate(this.today)),
          });
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: ({ users, meals }) => {
          this.users.set(users);
          this.meals.set(meals);
          this.accountContext.setMembers(users);
          const selectedId = this.accountContext.activeUserId() ?? users[0]?.id ?? null;
          this.selectedUserId.set(selectedId);
          if (selectedId) this.loadGoal(selectedId);
        },
        error: () => this.error.set('Не удалось загрузить сводку.'),
      });
  }

  private loadGoal(userId: number): void {
    if (!this.accountId) return;
    this.api
      .getCurrentGoal(this.accountId, userId)
      .pipe(catchError(() => of(null)))
      .subscribe((goal) => {
        if (this.selectedUserId() === userId) this.goal.set(goal);
      });
  }

  private calculateMealTotals(meal: OverviewMeal, userId: number): OverviewNutrientTotals {
    return meal.rows.reduce<OverviewNutrientTotals>(
      (totals, row) => {
        const amount = row.portions.find((portion) => portion.user_id === userId)?.amount_g ?? 0;
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

  private toLocalIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
