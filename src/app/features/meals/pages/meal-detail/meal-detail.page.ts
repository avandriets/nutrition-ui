import { DatePipe, DecimalPipe } from '@angular/common';
import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { filter, map, switchMap } from 'rxjs';

import type { GoalTimelineItem } from '../../../../shared/domain/goal.types';
import type { MealType } from '../../../../shared/domain/meal.types';
import type { NutrientValues } from '../../../../shared/domain/nutrition.types';
import type { UIConfirmDialogData } from '../../../../shared/types/confirm-dialog.types';
import { UIConfirmDialogComponent } from '../../../../shared/ui/confirm-dialog/confirm-dialog';
import { UIPageComponent } from '../../../../shared/ui/page/page';
import { UIStateContainerComponent } from '../../../../shared/ui/state-container/state-container';
import { mealTypeLabel } from '../../../../shared/utils/meal.utils';
import { MealDetailStore } from '../../data-access/meal-detail.store';
import type { MealEntryPayload, MealRow } from '../../types/meal.types';
import type { EntryDialogData, MealEntryDialogResult } from '../../ui/meal-entry-dialog/meal-entry-dialog';
import { MealEntryDialog } from '../../ui/meal-entry-dialog/meal-entry-dialog';

@Component({
  selector: 'app-meal-detail-page',
  imports: [DatePipe, DecimalPipe, MatButtonModule, MatCardModule, MatIconModule, MatInputModule, MatProgressSpinnerModule, RouterLink, UIPageComponent, UIStateContainerComponent],
  templateUrl: './meal-detail.page.html',
  styleUrl: './meal-detail.page.scss',
})
export class MealDetailPage implements OnInit {
  private readonly store = inject(MealDetailStore);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly mealId = Number(this.route.snapshot.paramMap.get('mealId'));

  readonly meal = this.store.meal;
  readonly users = this.store.users;
  readonly products = this.store.products;
  readonly dayTotals = this.store.dayTotals;
  readonly loadingDayTotals = this.store.loadingProgress;
  readonly saving = this.store.saving;
  readonly actionError = this.store.actionError;
  readonly pageState = this.store.state;
  readonly familyMealTotals = this.store.familyMealTotals;
  readonly familyDayTotals = this.store.familyDayTotals;

  ngOnInit(): void {
    this.store.load(this.mealId).subscribe();
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

  savePortion(row: MealRow, userId: number, rawValue: string): void {
    const amount = rawValue.trim() === '' ? 0 : Number(rawValue);
    if (!Number.isFinite(amount) || amount < 0) {
      this.store.setActionError('Граммы должны быть неотрицательным числом.');
      return;
    }

    this.store.savePortion({ row, userId, amount }).subscribe();
  }

  confirmDeleteRow(row: MealRow): void {
    if (this.isRowDeleting(row.id)) return;

    this.dialog
      .open<UIConfirmDialogComponent, UIConfirmDialogData, boolean>(UIConfirmDialogComponent, {
        data: {
          icon: 'delete_sweep',
          title: 'Удалить продукт из приёма пищи?',
          message: [{ text: 'Строка ' }, { text: row.product_name, emphasis: true }, { text: ' и порции всех членов семьи будут удалены из этого приёма пищи.' }],
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

  isRowDeleting(rowId: number): boolean {
    return this.store.isRowDeleting(rowId);
  }

  portionFor(row: MealRow, userId: number): number {
    return this.store.portionFor(row, userId);
  }

  nutrientFor(row: MealRow, userId: number, nutrient: keyof NutrientValues): number {
    return (row[nutrient] * this.portionFor(row, userId)) / 100;
  }

  isCellSaving(rowId: number, userId: number): boolean {
    return this.store.isCellSaving(rowId, userId);
  }

  goalFor(userId: number): GoalTimelineItem | null {
    return this.store.goalFor(userId);
  }

  goalStatus(value: number, target: number): string {
    if (target <= 0) return 'Не задана';
    const ratio = value / target;
    if (ratio < 1) return `${Math.round(ratio * 100)}%`;
    if (ratio <= 1.05) return 'Достигнута';
    return `+\u00a0${Math.round((ratio - 1) * 100)}%`;
  }

  goalStatusClass(value: number, target: number): string {
    const ratio = target > 0 ? value / target : 0;
    if (ratio < 1) return 'pending';
    return ratio <= 1.05 ? 'achieved' : 'exceeded';
  }

  typeLabel(type: MealType): string {
    return mealTypeLabel(type);
  }

  dismissActionError(): void {
    this.store.dismissActionError();
  }
}
