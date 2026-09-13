import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { NutrientValues, UIState } from '../../../../shared/types';
import { UIStateContainerComponent } from '../../../../shared/ui/state-container/state-container';
import type { OverviewNutrient } from '../../types/overview.types';
import { OverviewCalorieSummaryComponent } from '../overview-calorie-summary/overview-calorie-summary';
import { OverviewNutrientBalanceComponent } from '../overview-nutrient-balance/overview-nutrient-balance';

@Component({
  selector: 'app-overview-nutrition-section',
  imports: [OverviewCalorieSummaryComponent, OverviewNutrientBalanceComponent, UIStateContainerComponent],
  templateUrl: './overview-nutrition-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewNutritionSectionComponent {
  readonly state = input.required<UIState<string>>();
  readonly userName = input.required<string>();
  readonly totals = input.required<NutrientValues>();
  readonly calorieTarget = input<number | null>(null);
  readonly caloriePercent = input<number | null>(null);
  readonly calorieRemaining = input<number | null>(null);
  readonly nutrients = input.required<readonly OverviewNutrient[]>();
}
