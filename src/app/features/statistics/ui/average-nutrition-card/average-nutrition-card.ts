import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { initials } from '../../../../shared/utils/name.utils';
import type { AverageReport } from '../../types/statistics.types';

@Component({
  selector: 'app-average-nutrition-card',
  imports: [DecimalPipe, MatCardModule, MatIconModule],
  templateUrl: './average-nutrition-card.html',
  styleUrl: './average-nutrition-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AverageNutritionCardComponent {
  readonly report = input.required<AverageReport>();
  readonly initials = initials;
}
