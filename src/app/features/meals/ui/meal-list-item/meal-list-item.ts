import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import type { FamilyMemberIdentity } from '../../../../core/account/account.types';
import type { MealType } from '../../../../shared/types';
import { mealTypeIcon, mealTypeLabel } from '../../../../shared/utils/meal.utils';
import type { Meal } from '../../types/meal.types';

@Component({
  selector: 'app-meal-list-item',
  imports: [DatePipe, DecimalPipe, MatCardModule, MatIconModule, RouterLink],
  templateUrl: './meal-list-item.html',
  styleUrl: './meal-list-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MealListItemComponent {
  readonly meal = input.required<Meal>();
  readonly users = input.required<readonly FamilyMemberIdentity[]>();

  typeLabel(type: MealType): string {
    return mealTypeLabel(type);
  }

  typeIcon(type: MealType): string {
    return mealTypeIcon(type);
  }

  userCalories(userId: number): number {
    return this.meal().rows.reduce((mealTotal, row) => {
      const grams = row.portions.find(portion => portion.user_id === userId)?.amount_g ?? 0;
      return mealTotal + (row.calories_kcal * grams) / 100;
    }, 0);
  }
}
