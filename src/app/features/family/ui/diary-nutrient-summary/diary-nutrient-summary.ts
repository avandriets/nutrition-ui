import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import type { NutrientValues } from '../../../../shared/types';

@Component({
  selector: 'app-diary-nutrient-summary',
  imports: [DatePipe, DecimalPipe, MatCardModule, MatIconModule],
  templateUrl: './diary-nutrient-summary.html',
  styleUrl: './diary-nutrient-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiaryNutrientSummaryComponent {
  readonly date = input.required<string>();
  readonly totals = input.required<NutrientValues>();
  readonly mealsCount = input(0);

  mealsCountLabel(): string {
    const count = this.mealsCount();
    return `${count} ${count === 1 ? 'meal' : 'meals'}`;
  }
}
