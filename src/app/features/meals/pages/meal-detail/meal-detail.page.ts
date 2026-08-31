import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, Observable, of, switchMap } from 'rxjs';
import { AccountBootstrapService } from '../../../../core/account/account-bootstrap.service';
import { AccountContextService } from '../../../../core/account/account-context.service';
import {
  Meal,
  GoalTimelineItem,
  MealDayTotals,
  MealEntryPayload,
  MealProduct,
  MealRow,
  MealType,
  MealUser,
  NutrientTotals,
} from '../../data-access/meal.models';
import { MealsApiService } from '../../data-access/meals-api.service';
import {
  EntryDialogData,
  MealEntryDialog,
  MealEntryDialogResult,
} from '../../ui/meal-entry-dialog/meal-entry-dialog';
import {
  MealRowDeleteDialog,
  MealRowDeleteDialogData,
} from '../../ui/meal-row-delete-dialog/meal-row-delete-dialog';

const EMPTY_TOTALS: NutrientTotals = {
  calories_kcal: 0,
  protein_g: 0,
  fat_g: 0,
  carbohydrates_g: 0,
  fiber_g: 0,
};

@Component({
  selector: 'app-meal-detail-page',
  imports: [
    DatePipe,
    DecimalPipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
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

  protected readonly meal = signal<Meal | null>(null);
  protected readonly users = signal<MealUser[]>([]);
  protected readonly products = signal<MealProduct[]>([]);
  protected readonly dayTotals = signal<MealDayTotals | null>(null);
  protected readonly goals = signal<ReadonlyMap<number, GoalTimelineItem | null>>(new Map());
  protected readonly loading = signal(true);
  protected readonly loadingDayTotals = signal(false);
  protected readonly saving = signal(false);
  protected readonly savingCells = signal<ReadonlySet<string>>(new Set());
  protected readonly deletingRows = signal<ReadonlySet<number>>(new Set());
  protected readonly error = signal<string | null>(null);

  protected readonly familyMealTotals = computed(() =>
    this.users().map((user) => ({ user, totals: this.calculateMealTotals(user.id) })),
  );

  protected readonly familyDayTotals = computed(() => {
    const totalsByUser = new Map(
      (this.dayTotals()?.users ?? []).map((totals) => [totals.user_id, totals]),
    );

    return this.users().map((user) => ({
      user,
      totals: totalsByUser.get(user.id) ?? EMPTY_TOTALS,
    }));
  });

  ngOnInit(): void {
    this.loadPage();
  }

  protected addEntry(): void {
    const meal = this.meal();
    if (!meal || !this.accountId) return;

    const existingProductIds = new Set(meal.rows.map((row) => row.product_id));
    const availableProducts = this.products().filter(
      (product) => !existingProductIds.has(product.id),
    );

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
      .subscribe((payload) => {
        const currentMeal = this.meal();
        if (!payload || !this.accountId || !currentMeal) return;

        const entries: MealEntryPayload[] = payload.portions.map((portion) => ({
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
            next: (updatedMeal) => this.applyUpdatedMeal(updatedMeal),
            error: () => this.error.set('Не удалось добавить продукт.'),
          });
      });
  }

  protected savePortion(row: MealRow, userId: number, rawValue: string): void {
    const meal = this.meal();
    if (!meal || !this.accountId || !row.product_id) return;

    const amount = rawValue.trim() === '' ? 0 : Number(rawValue);
    if (!Number.isFinite(amount) || amount < 0) {
      this.error.set('Граммы должны быть неотрицательным числом.');
      return;
    }

    const existingPortion = row.portions.find((portion) => portion.user_id === userId);
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
        next: (updatedMeal) => this.applyUpdatedMeal(updatedMeal),
        error: () => this.error.set('Не удалось сохранить порцию. Обновите страницу и повторите.'),
      });
  }

  protected confirmDeleteRow(row: MealRow): void {
    if (this.isRowDeleting(row.id)) return;

    this.dialog
      .open<MealRowDeleteDialog, MealRowDeleteDialogData, boolean>(MealRowDeleteDialog, {
        data: { productName: row.product_name },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) this.deleteRow(row);
      });
  }

  protected isRowDeleting(rowId: number): boolean {
    return this.deletingRows().has(rowId);
  }

  protected portionFor(row: MealRow, userId: number): number {
    return row.portions.find((portion) => portion.user_id === userId)?.amount_g ?? 0;
  }

  protected nutrientFor(row: MealRow, userId: number, nutrient: keyof NutrientTotals): number {
    return (row[nutrient] * this.portionFor(row, userId)) / 100;
  }

  protected isCellSaving(rowId: number, userId: number): boolean {
    return this.savingCells().has(this.cellKey(rowId, userId));
  }

  protected goalFor(userId: number): GoalTimelineItem | null {
    return this.goals().get(userId) ?? null;
  }

  protected goalStatus(value: number, target: number): string {
    if (target <= 0) return 'Не задана';
    const ratio = value / target;
    if (ratio < 1) return `${Math.round(ratio * 100)}%`;
    if (ratio <= 1.05) return 'Достигнута';
    return `+ ${Math.round((ratio - 1) * 100)}%`;
  }

  protected goalStatusClass(value: number, target: number): string {
    const ratio = target > 0 ? value / target : 0;
    if (ratio < 1) return 'pending';
    return ratio <= 1.05 ? 'achieved' : 'exceeded';
  }

  protected typeLabel(type: MealType): string {
    return { breakfast: 'Завтрак', lunch: 'Обед', dinner: 'Ужин', other: 'Другое' }[type];
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
        switchMap((account) => {
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
    const goalRequests = this.users().map((user) =>
      this.api
        .getGoalForDate(this.accountId!, user.id, meal.meal_date)
        .pipe(catchError(() => of(null))),
    );

    forkJoin({
      totals: this.api.getDayTotals(this.accountId, meal.meal_date),
      goals: goalRequests.length ? forkJoin(goalRequests) : of([]),
    })
      .pipe(finalize(() => this.loadingDayTotals.set(false)))
      .subscribe({
        next: ({ totals, goals }) => {
          this.dayTotals.set(totals);
          this.goals.set(
            new Map(this.users().map((user, index) => [user.id, goals[index]?.periods[0] ?? null])),
          );
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

    forkJoin(
      row.portions.map((portion) => this.api.deleteEntry(this.accountId!, meal.id, portion.id)),
    )
      .pipe(
        switchMap(() => this.api.getMeal(this.accountId!, meal.id)),
        finalize(() => this.setRowDeleting(row.id, false)),
      )
      .subscribe({
        next: (updatedMeal) => this.applyUpdatedMeal(updatedMeal),
        error: () => {
          this.error.set('Не удалось удалить строку полностью. Данные будут обновлены.');
          this.reloadMeal(meal.id);
        },
      });
  }

  private reloadMeal(mealId: number): void {
    if (!this.accountId) return;

    this.api.getMeal(this.accountId, mealId).subscribe({
      next: (updatedMeal) => this.applyUpdatedMeal(updatedMeal),
    });
  }

  private calculateMealTotals(userId: number): NutrientTotals {
    return (this.meal()?.rows ?? []).reduce<NutrientTotals>(
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
    this.savingCells.update((current) => {
      const next = new Set(current);
      saving ? next.add(cellKey) : next.delete(cellKey);
      return next;
    });
  }

  private setRowDeleting(rowId: number, deleting: boolean): void {
    this.deletingRows.update((current) => {
      const next = new Set(current);
      deleting ? next.add(rowId) : next.delete(rowId);
      return next;
    });
  }
}
