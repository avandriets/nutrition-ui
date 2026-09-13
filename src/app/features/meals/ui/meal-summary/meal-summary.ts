import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import type { MealMemberSummary } from '../../types/meal-detail.types';

@Component({
  selector: 'app-meal-summary',
  imports: [DecimalPipe, MatCardModule, MatIconModule],
  templateUrl: './meal-summary.html',
  styleUrl: './meal-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MealSummaryComponent {
  readonly summaries = input.required<readonly MealMemberSummary[]>();
}
