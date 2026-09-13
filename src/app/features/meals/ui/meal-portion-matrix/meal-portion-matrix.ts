import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import type { EntityDataOperationState, NutrientValues, UserIdentity } from '../../../../shared/types';
import type { MealRow } from '../../types/meal.types';
import type { MealPortionInputChange } from '../../types/meal-detail.types';

@Component({
  selector: 'app-meal-portion-matrix',
  imports: [DecimalPipe, MatButtonModule, MatCardModule, MatIconModule, MatInputModule, MatProgressSpinnerModule],
  templateUrl: './meal-portion-matrix.html',
  styleUrl: './meal-portion-matrix.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MealPortionMatrixComponent {
  readonly rows = input.required<readonly MealRow[]>();
  readonly users = input.required<readonly UserIdentity[]>();
  readonly cellOperations = input.required<Readonly<Record<string, EntityDataOperationState>>>();
  readonly rowOperations = input.required<Readonly<Record<number, EntityDataOperationState>>>();
  readonly portionChanged = output<MealPortionInputChange>();
  readonly deleteRequested = output<MealRow>();

  portionFor(row: MealRow, userId: number): number {
    return row.portions.find(portion => portion.user_id === userId)?.amount_g ?? 0;
  }

  nutrientFor(row: MealRow, userId: number, nutrient: keyof NutrientValues): number {
    return (row[nutrient] * this.portionFor(row, userId)) / 100;
  }

  isCellSaving(rowId: number, userId: number): boolean {
    return this.cellOperations()[`${rowId}:${userId}`]?.status === 'pending';
  }

  isRowDeleting(rowId: number): boolean {
    return this.rowOperations()[rowId]?.status === 'pending';
  }

  isRowSaving(rowId: number): boolean {
    const rowKeyPrefix = `${rowId}:`;
    return Object.entries(this.cellOperations()).some(([key, operation]) => key.startsWith(rowKeyPrefix) && operation.status === 'pending');
  }
}
