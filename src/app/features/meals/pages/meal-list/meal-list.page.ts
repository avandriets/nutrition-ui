import { DatePipe, DecimalPipe } from '@angular/common';
import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { format } from 'date-fns';
import { filter, switchMap, tap } from 'rxjs';

import type { MealType } from '../../../../shared/types';
import { UIPageComponent } from '../../../../shared/ui/page/page';
import { UIStateContainerComponent } from '../../../../shared/ui/state-container/state-container';
import { mealTypeIcon, mealTypeLabel } from '../../../../shared/utils/meal.utils';
import { MealListStore } from '../../data-access/meal-list.store';
import type { Meal, MealPayload } from '../../types/meal.types';
import type { MealDayCopyDialogData, MealDayCopyDialogResult } from '../../ui/meal-day-copy-dialog/meal-day-copy-dialog';
import { MealDayCopyDialog } from '../../ui/meal-day-copy-dialog/meal-day-copy-dialog';
import { MealFormDialog } from '../../ui/meal-form-dialog/meal-form-dialog';

@Component({
  selector: 'app-meal-list-page',
  imports: [DatePipe, DecimalPipe, MatButtonModule, MatCardModule, MatIconModule, RouterLink, UIPageComponent, UIStateContainerComponent],
  templateUrl: './meal-list.page.html',
  styleUrl: './meal-list.page.scss',
})
export class MealListPage implements OnInit {
  private readonly store = inject(MealListStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private createRequested = this.route.snapshot.queryParamMap.get('create') === 'true';
  private copyRequested = this.route.snapshot.queryParamMap.get('copy');

  readonly todayDate = this.store.todayDate;
  readonly meals = this.store.meals;
  readonly users = this.store.users;
  readonly loading = this.store.loading;
  readonly saving = this.store.saving;
  readonly actionError = this.store.actionError;
  readonly pageState = this.store.state;
  readonly dateFilter = this.store.dateFilter;

  ngOnInit(): void {
    this.loadMeals();
  }

  loadMeals(): void {
    this.store
      .load()
      .pipe(tap(() => this.handleRequestedAction()))
      .subscribe();
  }

  setDateFilter(date: string): void {
    this.store.setDateFilter(date).subscribe();
  }

  createMeal(): void {
    const initialDate = this.dateFilter() || format(new Date(), 'yyyy-MM-dd');
    this.dialog
      .open<MealFormDialog, string, MealPayload>(MealFormDialog, { data: initialDate })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(payload => this.store.create(payload)),
        tap(meal => void this.router.navigate(['/meals', meal.id])),
      )
      .subscribe();
  }

  copyMealDay(requestedSourceDate?: string): void {
    const sourceDate = requestedSourceDate || this.dateFilter() || format(new Date(), 'yyyy-MM-dd');
    this.dialog
      .open<MealDayCopyDialog, MealDayCopyDialogData, MealDayCopyDialogResult>(MealDayCopyDialog, {
        width: '720px',
        maxWidth: 'calc(100vw - 32px)',
        data: { sourceDate },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(result =>
          this.store.copyDay({
            targetDate: result.target_date,
            payload: {
              source_date: result.source_date,
              replace_existing: result.replace_existing,
            },
          }),
        ),
        tap(() => this.snackBar.open('Рацион успешно скопирован.', 'Закрыть', { duration: 4000 })),
      )
      .subscribe();
  }

  dismissActionError(): void {
    this.store.dismissActionError();
  }

  typeLabel(type: MealType): string {
    return mealTypeLabel(type);
  }

  typeIcon(type: MealType): string {
    return mealTypeIcon(type);
  }

  userCalories(meal: Meal, userId: number): number {
    return meal.rows.reduce((mealTotal, row) => {
      const grams = row.portions.find(portion => portion.user_id === userId)?.amount_g ?? 0;
      return mealTotal + (row.calories_kcal * grams) / 100;
    }, 0);
  }

  private handleRequestedAction(): void {
    if (this.createRequested) {
      this.createRequested = false;
      this.clearRequestedAction('create');
      this.createMeal();
      return;
    }

    if (this.copyRequested) {
      const sourceDate = this.copyRequested;
      this.copyRequested = null;
      this.clearRequestedAction('copy');
      this.copyMealDay(sourceDate);
    }
  }

  private clearRequestedAction(queryParam: 'copy' | 'create'): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [queryParam]: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
