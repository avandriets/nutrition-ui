import type { OnInit } from '@angular/core';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { format } from 'date-fns';
import { distinctUntilChanged, filter, map, of, switchMap, tap } from 'rxjs';

import { UIPageComponent } from '../../../../shared/ui/page/page';
import { UIStateContainerComponent } from '../../../../shared/ui/state-container/state-container';
import { MealListStore } from '../../data-access/meal-list.store';
import type { MealPayload } from '../../types/meal.types';
import type { MealDayCopyDialogData, MealDayCopyDialogResult, MealListRouteState } from '../../types/meal-list.types';
import { MealDateFilterComponent, MealDayCopyDialog, MealFormDialog, MealListItemComponent } from '../../ui';

@Component({
  selector: 'app-meal-list-page',
  imports: [MatButtonModule, MatCardModule, MatIconModule, MealDateFilterComponent, MealListItemComponent, UIPageComponent, UIStateContainerComponent],
  templateUrl: './meal-list.page.html',
  styleUrl: './meal-list.page.scss',
})
export class MealListPage implements OnInit {
  private readonly store = inject(MealListStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private routeInitialized = false;

  readonly todayDate = this.store.todayDate;
  readonly meals = this.store.meals;
  readonly users = this.store.users;
  readonly loading = this.store.loading;
  readonly saving = this.store.saving;
  readonly actionError = this.store.actionError;
  readonly pageState = this.store.state;
  readonly dateFilter = this.store.dateFilter;

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(
        map(params => {
          const date = params.get('date');
          return {
            date: date === 'all' ? '' : (date ?? this.todayDate),
            create: params.get('create') === 'true',
            copy: params.get('copy'),
          } satisfies MealListRouteState;
        }),
        distinctUntilChanged((previous, current) => previous.date === current.date && previous.create === current.create && previous.copy === current.copy),
        switchMap(routeState => {
          const load$ = this.routeInitialized && routeState.date === this.dateFilter() ? of(this.meals()) : this.store.setDateFilter(routeState.date);
          return load$.pipe(
            tap(() => {
              this.routeInitialized = true;
              this.handleRequestedAction(routeState);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
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
        tap(mealDay => {
          this.updateDateQueryParam(mealDay.meal_date);
          this.snackBar.open('Meal plan copied successfully.', 'Close', { duration: 4000 });
        }),
      )
      .subscribe();
  }

  dismissActionError(): void {
    this.store.dismissActionError();
  }

  private handleRequestedAction(routeState: MealListRouteState): void {
    if (routeState.create) {
      this.clearRequestedAction('create');
      this.createMeal();
      return;
    }

    if (routeState.copy) {
      this.clearRequestedAction('copy');
      this.copyMealDay(routeState.copy);
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

  private updateDateQueryParam(date: string): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { date: date === this.todayDate ? null : date },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
