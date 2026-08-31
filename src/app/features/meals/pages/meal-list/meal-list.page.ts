import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, forkJoin, switchMap } from 'rxjs';
import { AccountBootstrapService } from '../../../../core/account/account-bootstrap.service';
import { Meal, MealPayload, MealType, MealUser } from '../../data-access/meal.models';
import { MealsApiService } from '../../data-access/meals-api.service';
import {
  MealDayCopyDialog,
  MealDayCopyDialogData,
  MealDayCopyDialogResult,
} from '../../ui/meal-day-copy-dialog/meal-day-copy-dialog';
import { MealFormDialog } from '../../ui/meal-form-dialog/meal-form-dialog';

@Component({
  selector: 'app-meal-list-page',
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    RouterLink,
  ],
  templateUrl: './meal-list.page.html',
  styleUrl: './meal-list.page.scss',
})
export class MealListPage implements OnInit {
  private readonly accountBootstrap = inject(AccountBootstrapService);
  private readonly api = inject(MealsApiService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private accountId: number | null = null;
  private createRequested = this.route.snapshot.queryParamMap.get('create') === 'true';
  private copyRequested = this.route.snapshot.queryParamMap.get('copy');

  protected readonly todayDate = this.todayIsoDate();
  protected readonly meals = signal<Meal[]>([]);
  protected readonly users = signal<MealUser[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly dateFilter = signal(this.todayDate);

  ngOnInit(): void {
    this.loadMeals();
  }

  protected loadMeals(): void {
    this.loading.set(true);
    this.error.set(null);
    this.accountBootstrap
      .ensureAccount()
      .pipe(
        switchMap((account) => {
          this.accountId = account.id;
          return forkJoin({
            meals: this.api.listMeals(account.id, this.dateFilter() || undefined),
            users: this.api.listUsers(account.id),
          });
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: ({ meals, users }) => {
          this.meals.set(meals);
          this.users.set(users);
          if (this.createRequested) {
            this.createRequested = false;
            void this.router.navigate([], {
              relativeTo: this.route,
              queryParams: { create: null },
              queryParamsHandling: 'merge',
              replaceUrl: true,
            });
            this.createMeal();
          } else if (this.copyRequested) {
            const sourceDate = this.copyRequested;
            this.copyRequested = null;
            void this.router.navigate([], {
              relativeTo: this.route,
              queryParams: { copy: null },
              queryParamsHandling: 'merge',
              replaceUrl: true,
            });
            this.copyMealDay(sourceDate);
          }
        },
        error: () => this.error.set('Не удалось загрузить приёмы пищи.'),
      });
  }

  protected setDateFilter(date: string): void {
    this.dateFilter.set(date);
    this.loadMeals();
  }

  protected createMeal(): void {
    const initialDate = this.dateFilter() || this.todayIsoDate();
    this.dialog
      .open<MealFormDialog, string, MealPayload>(MealFormDialog, { data: initialDate })
      .afterClosed()
      .subscribe((payload) => {
        if (!payload || !this.accountId) return;
        this.saving.set(true);
        this.api
          .createMeal(this.accountId, payload)
          .pipe(finalize(() => this.saving.set(false)))
          .subscribe({
            next: (meal) => void this.router.navigate(['/meals', meal.id]),
            error: () => this.error.set('Не удалось создать приём пищи.'),
          });
      });
  }

  protected copyMealDay(requestedSourceDate?: string): void {
    const sourceDate = requestedSourceDate || this.dateFilter() || this.todayIsoDate();
    this.dialog
      .open<MealDayCopyDialog, MealDayCopyDialogData, MealDayCopyDialogResult>(MealDayCopyDialog, {
        width: '720px',
        maxWidth: 'calc(100vw - 32px)',
        data: { sourceDate },
      })
      .afterClosed()
      .subscribe((result) => {
        if (!result || !this.accountId) return;

        this.saving.set(true);
        this.error.set(null);
        this.api
          .copyMealDay(this.accountId, result.target_date, {
            source_date: result.source_date,
            replace_existing: result.replace_existing,
          })
          .pipe(finalize(() => this.saving.set(false)))
          .subscribe({
            next: (mealDay) => {
              this.dateFilter.set(mealDay.meal_date);
              this.meals.set(mealDay.meals);
              this.snackBar.open('Рацион успешно скопирован.', 'Закрыть', {
                duration: 4000,
              });
            },
            error: () =>
              this.error.set(
                'Не удалось скопировать рацион. Если целевой день уже заполнен, включите замену существующих приёмов.',
              ),
          });
      });
  }

  protected typeLabel(type: MealType): string {
    return { breakfast: 'Завтрак', lunch: 'Обед', dinner: 'Ужин', other: 'Другое' }[type];
  }

  protected typeIcon(type: MealType): string {
    return {
      breakfast: 'bakery_dining',
      lunch: 'lunch_dining',
      dinner: 'dinner_dining',
      other: 'restaurant',
    }[type];
  }

  protected userCalories(meal: Meal, userId: number): number {
    return meal.rows.reduce((mealTotal, row) => {
      const grams = row.portions.find((portion) => portion.user_id === userId)?.amount_g ?? 0;
      return mealTotal + (row.calories_kcal * grams) / 100;
    }, 0);
  }

  private todayIsoDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
