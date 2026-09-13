import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { mealTypeIcon, mealTypeLabel } from '../../../../shared/utils/meal.utils';
import type { OverviewMeal, OverviewMealSummary } from '../../types/overview.types';

@Component({
  selector: 'app-overview-meals-table',
  imports: [DecimalPipe, MatButtonModule, MatCardModule, MatIconModule, RouterLink],
  templateUrl: './overview-meals-table.html',
  styleUrl: './overview-meals-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewMealsTableComponent {
  readonly summaries = input.required<readonly OverviewMealSummary[]>();

  typeLabel(meal: OverviewMeal): string {
    return mealTypeLabel(meal.meal_type);
  }

  typeIcon(meal: OverviewMeal): string {
    return mealTypeIcon(meal.meal_type);
  }

  typeTone(meal: OverviewMeal): string {
    return { breakfast: 'orange', lunch: 'green', dinner: 'purple', other: 'blue' }[meal.meal_type];
  }
}
