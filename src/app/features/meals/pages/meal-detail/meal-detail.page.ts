import { DatePipe } from '@angular/common';
import type { OnInit } from '@angular/core';
import { Component, computed, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { distinctUntilChanged, filter, map, switchMap } from 'rxjs';

import type { MealType, UIConfirmDialogData } from '../../../../shared/types';
import { UIConfirmDialogComponent } from '../../../../shared/ui/confirm-dialog/confirm-dialog';
import { UIPageComponent } from '../../../../shared/ui/page/page';
import { UIStateContainerComponent } from '../../../../shared/ui/state-container/state-container';
import { mealTypeLabel } from '../../../../shared/utils/meal.utils';
import { MealDetailStore } from '../../data-access/meal-detail.store';
import type { MealEntryPayload, MealRow } from '../../types/meal.types';
import type { EntryDialogData, MealEntryDialogResult, MealPortionInputChange } from '../../types/meal-detail.types';
import { MealDaySummaryComponent, MealEntryDialog, MealPortionMatrixComponent, MealSummaryComponent } from '../../ui';

@Component({
  selector: 'app-meal-detail-page',
  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MealDaySummaryComponent,
    MealPortionMatrixComponent,
    MealSummaryComponent,
    RouterLink,
    UIPageComponent,
    UIStateContainerComponent,
  ],
  templateUrl: './meal-detail.page.html',
  styleUrl: './meal-detail.page.scss',
})
export class MealDetailPage implements OnInit {
  private readonly store = inject(MealDetailStore);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  readonly meal = this.store.meal;
  readonly users = this.store.users;
  readonly products = this.store.products;
  readonly saving = this.store.saving;
  readonly actionError = this.store.actionError;
  readonly pageState = this.store.state;
  readonly familyMealTotals = this.store.familyMealTotals;
  readonly familyDayTotals = this.store.familyDayTotals;
  readonly goals = this.store.goals;
  readonly cellOperations = this.store.cellOperations;
  readonly rowOperations = this.store.rowOperations;
  readonly resolvedMeal = computed(() => {
    const meal = this.meal();
    if (!meal) throw new Error('Resolved meal is unavailable');

    return meal;
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map(params => Number(params.get('mealId'))),
        distinctUntilChanged(),
        switchMap(mealId => this.store.load(mealId)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  addEntry(): void {
    const meal = this.meal();
    if (!meal) return;

    const existingProductIds = new Set(meal.rows.map(row => row.product_id));
    const availableProducts = this.products().filter(product => !existingProductIds.has(product.id));

    this.dialog
      .open<MealEntryDialog, EntryDialogData, MealEntryDialogResult>(MealEntryDialog, {
        width: '820px',
        maxWidth: 'calc(100vw - 32px)',
        data: {
          products: availableProducts,
          users: this.users(),
        },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        map(payload =>
          payload.portions.map<MealEntryPayload>(portion => ({
            ...portion,
            product_id: payload.product_id,
            version: null,
          })),
        ),
        switchMap(entries => this.store.addEntries(entries)),
      )
      .subscribe();
  }

  savePortion({ row, userId, rawValue }: MealPortionInputChange): void {
    const amount = rawValue.trim() === '' ? 0 : Number(rawValue);
    if (!Number.isFinite(amount) || amount < 0) {
      this.store.setActionError('Граммы должны быть неотрицательным числом.');
      return;
    }

    this.store.savePortion({ row, userId, amount }).subscribe();
  }

  confirmDeleteRow(row: MealRow): void {
    if (this.store.isRowDeleting(row.id)) return;

    this.dialog
      .open<UIConfirmDialogComponent, UIConfirmDialogData, boolean>(UIConfirmDialogComponent, {
        data: {
          icon: 'delete_sweep',
          title: 'Удалить продукт из приёма пищи?',
          message: [
            { text: 'Строка ' },
            {
              text: row.product_name,
              emphasis: true,
            },
            { text: ' и порции всех членов семьи будут удалены из этого приёма пищи.' },
          ],
          confirmText: 'Удалить строку',
          tone: 'danger',
          minWidth: 'min(440px, 82vw)',
        },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.store.deleteRow(row)),
      )
      .subscribe();
  }

  typeLabel(type: MealType): string {
    return mealTypeLabel(type);
  }

  dismissActionError(): void {
    this.store.dismissActionError();
  }
}
