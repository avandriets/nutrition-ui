import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

import type { OverviewNutrient } from '../../types/overview.types';

@Component({
  selector: 'app-overview-nutrient-balance',
  imports: [DecimalPipe, MatCardModule],
  templateUrl: './overview-nutrient-balance.html',
  styleUrl: './overview-nutrient-balance.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewNutrientBalanceComponent {
  readonly userName = input.required<string>();
  readonly nutrients = input.required<readonly OverviewNutrient[]>();
}
