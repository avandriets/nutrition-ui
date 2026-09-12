import { DatePipe, DecimalPipe } from '@angular/common';
import type { OnInit } from '@angular/core';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { Observable } from 'rxjs';
import { catchError, finalize, forkJoin, of, switchMap } from 'rxjs';

import { AccountBootstrapService } from '../../../../core/account/account-bootstrap.service';
import { AccountContextService } from '../../../../core/account/account-context.service';
import type { GoalTimelineItem } from '../../../../shared/domain/goal.types';
import type { UserIdentity } from '../../../../shared/domain/identity.types';
import type { MealType } from '../../../../shared/domain/meal.types';
import type { NutrientValues } from '../../../../shared/domain/nutrition.types';
import type { UIConfirmDialogData } from '../../../../shared/types/confirm-dialog.types';
import { UIConfirmDialogComponent } from '../../../../shared/ui/confirm-dialog/confirm-dialog';
import { UIPageComponent } from '../../../../shared/ui/page/page';
import { mealTypeLabel } from '../../../../shared/utils/meal.utils';
import { emptyNutrientValues } from '../../../../shared/utils/nutrition.utils';
import { MealsApiService } from '../../data-access/meals-api.service';
import type { Meal, MealDayTotals, MealEntryPayload, MealProduct, MealRow } from '../../types/meal.types';
import type { EntryDialogData, MealEntryDialogResult } from '../../ui/meal-entry-dialog/meal-entry-dialog';
import { MealEntryDialog } from '../../ui/meal-entry-dialog/meal-entry-dialog';

const EMPTY_TOTALS = emptyNutrientValues();

@Component({
  selector: 'app-meal-detail-page',
  imports: [DatePipe, DecimalPipe, MatButtonModule, MatCardModule, MatIconModule, MatInputModule, MatProgressSpinnerModule, RouterLink, UIPageComponent],
  templateUrl: './meal-detail.page.html',
  styleUrl: './meal-detail.page.scss',
})
export class MealDetailPage implements OnInit {
  private readonly accountBootstrap = inject(AccountBootstrapService);
  private readonly accountContext = inject(AccountContextService);
  private readonly api = inject(MealsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly mealId = Number(this.route.snapshot.paramMap.get('mealId'));
  private accountId: number | null = null;

  readonly meal = signal<Meal | null>(null);
  readonly users = signal<UserIdentity[]>([]);
  readonly products = signal<MealProduct[]>([]);
  readonly dayTotals = signal<MealDayTotals | null>(null);
  readonly goals = signal<ReadonlyMap<number, GoalTimelineItem | null>>(new Map());
  readonly loading = signal(true);
  readonly loadingDayTotals = signal(false);
  readonly saving = signal(false);
  readonly savingCells = signal<ReadonlySet<string>>(new Set());
  readonly deletingRows = signal<ReadonlySet<number>>(new Set());
  readonly error = signal<string | null>(null);

  readonly familyMealTotals = computed(() => this.users().map(user => ({ user, totals: this.calculateMealTotals(user.id) })));

  readonly familyDayTotals = computed(() => {
    const totalsByUser = new Map((this.dayTotals()?.users ?? []).map(totals => [totals.user_id, totals]));

    return this.users().map(user => ({
      user,
      totals: totalsByUser.get(user.id) ?? EMPTY_TOTALS,
    }));
  });

  ngOnInit(): void {
    this.loadPage();
  }

  addEntry(): void {
    const meal = this.meal();
    if (!meal || !this.accountId) return;

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
      .subscribe(payload => {
        const currentMeal = this.meal();
        if (!payload || !this.accountId || !currentMeal) return;

        const entries: MealEntryPayload[] = payload.portions.map(portion => ({
          ...portion,
          product_id: payload.product_id,
          version: null,
        }));

        this.saving.set(true);
        this.error.set(null);
        this.api
          .upsertEntries(this.accountId, currentMeal.id, { entries })
          .pipe(
            switchMap(() => this.api.getMeal(this.accountId!, currentMeal.id)),
            finalize(() => this.saving.set(false)),
          )
          .subscribe({
            next: updatedMeal => this.applyUpdatedMeal(updatedMeal),
            error: () => this.error.set('Не удалось добавить продукт.'),
          });
      });
  }

  savePortion(row: MealRow, userId: number, rawValue: string): void {
    const meal = this.meal();
    if (!meal || !this.accountId || !row.product_id) return;

    const amount = rawValue.trim() === '' ? 0 : Number(rawValue);
    if (!Number.isFinite(amount) || amount < 0) {
      this.error.set('Граммы должны быть неотрицательным числом.');
      return;
    }

    const existingPortion = row.portions.find(portion => portion.user_id === userId);
    if ((!existingPortion && amount === 0) || existingPortion?.amount_g === amount) return;

    const cellKey = this.cellKey(row.id, userId);
    this.setCellSaving(cellKey, true);
    this.error.set(null);

    const request: Observable<unknown> =
      amount === 0 && existingPortion
        ? this.api.deleteEntry(this.accountId, meal.id, existingPortion.id)
        : this.api.upsertEntry(this.accountId, meal.id, {
            user_id: userId,
            product_id: row.product_id,
            amount_g: amount,
            version: existingPortion?.version ?? null,
          });

    request
      .pipe(
        switchMap(() => this.api.getMeal(this.accountId!, meal.id)),
        finalize(() => this.setCellSaving(cellKey, false)),
      )
      .subscribe({
        next: updatedMeal => this.applyUpdatedMeal(updatedMeal),
        error: () => this.error.set('Не удалось сохранить порцию. Обновите страницу и повторите.'),
      });
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
      .subscribe(confirmed => {
        if (confirmed) this.deleteRow(row);
      });
  }

  isRowDeleting(rowId: number): boolean {
    return this.deletingRows().has(rowId);
  }

  portionFor(row: MealRow, userId: number): number {
    return row.portions.find(portion => portion.user_id === userId)?.amount_g ?? 0;
  }

  nutrientFor(row: MealRow, userId: number, nutrient: keyof NutrientValues): number {
    return (row[nutrient] * this.portionFor(row, userId)) / 100;
  }

  isCellSaving(rowId: number, userId: number): boolean {
    return this.savingCells().has(this.cellKey(rowId, userId));
  }

  goalFor(userId: number): GoalTimelineItem | null {
    return this.goals().get(userId) ?? null;
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

  private loadPage(): void {
    if (!Number.isInteger(this.mealId) || this.mealId <= 0) {
      this.loading.set(false);
      this.error.set('Некорректный идентификатор приёма пищи.');
      return;
    }

    this.loading.set(true);
    this.accountBootstrap
      .ensureAccount()
      .pipe(
        switchMap(account => {
          this.accountId = account.id;
          return forkJoin({
            meal: this.api.getMeal(account.id, this.mealId),
            users: this.api.listUsers(account.id),
            products: this.api.listProducts(),
          });
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: ({ meal, users, products }) => {
          this.meal.set(meal);
          this.users.set(users);
          this.products.set(products);
          this.accountContext.setMembers(users);
          this.loadFamilyProgress();
        },
        error: () => this.error.set('Не удалось загрузить приём пищи.'),
      });
  }

  private loadFamilyProgress(): void {
    const meal = this.meal();
    if (!meal || !this.accountId) return;

    this.loadingDayTotals.set(true);
    const goalRequests = this.users().map(user => this.api.getGoalForDate(this.accountId!, user.id, meal.meal_date).pipe(catchError(() => of(null))));

    forkJoin({
      totals: this.api.getDayTotals(this.accountId, meal.meal_date),
      goals: goalRequests.length ? forkJoin(goalRequests) : of([]),
    })
      .pipe(finalize(() => this.loadingDayTotals.set(false)))
      .subscribe({
        next: ({ totals, goals }) => {
          this.dayTotals.set(totals);
          this.goals.set(new Map(this.users().map((user, index) => [user.id, goals[index]?.periods[0] ?? null])));
        },
        error: () => this.error.set('Не удалось загрузить дневные итоги.'),
      });
  }

  private applyUpdatedMeal(updatedMeal: Meal): void {
    this.meal.set(updatedMeal);
    this.loadFamilyProgress();
  }

  private deleteRow(row: MealRow): void {
    const meal = this.meal();
    if (!meal || !this.accountId) return;

    if (!row.portions.length) {
      this.error.set('Строку без порций нельзя удалить через доступное API.');
      return;
    }

    this.setRowDeleting(row.id, true);
    this.error.set(null);

    forkJoin(row.portions.map(portion => this.api.deleteEntry(this.accountId!, meal.id, portion.id)))
      .pipe(
        switchMap(() => this.api.getMeal(this.accountId!, meal.id)),
        finalize(() => this.setRowDeleting(row.id, false)),
      )
      .subscribe({
        next: updatedMeal => this.applyUpdatedMeal(updatedMeal),
        error: () => {
          this.error.set('Не удалось удалить строку полностью. Данные будут обновлены.');
          this.reloadMeal(meal.id);
        },
      });
  }

  private reloadMeal(mealId: number): void {
    if (!this.accountId) return;

    this.api.getMeal(this.accountId, mealId).subscribe({
      next: updatedMeal => this.applyUpdatedMeal(updatedMeal),
    });
  }

  private calculateMealTotals(userId: number): NutrientValues {
    return (this.meal()?.rows ?? []).reduce<NutrientValues>(
      (totals, row) => {
        const factor = this.portionFor(row, userId) / 100;
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

  private cellKey(rowId: number, userId: number): string {
    return `${rowId}:${userId}`;
  }

  private setCellSaving(cellKey: string, saving: boolean): void {
    this.savingCells.update(current => {
      const next = new Set(current);
      if (saving) {
        next.add(cellKey);
      } else {
        next.delete(cellKey);
      }
      return next;
    });
  }

  private setRowDeleting(rowId: number, deleting: boolean): void {
    this.deletingRows.update(current => {
      const next = new Set(current);
      if (deleting) {
        next.add(rowId);
      } else {
        next.delete(rowId);
      }
      return next;
    });
  }
}
