import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';

import type { NutrientValues } from '../../../../shared/types';

@Component({
  selector: 'app-overview-calorie-summary',
  imports: [DecimalPipe, MatCardModule, MatIconModule, MatProgressBarModule, RouterLink],
  templateUrl: './overview-calorie-summary.html',
  styleUrl: './overview-calorie-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewCalorieSummaryComponent {
  readonly totals = input.required<NutrientValues>();
  readonly target = input<number | null>(null);
  readonly percent = input<number | null>(null);
  readonly remaining = input<number | null>(null);
}
