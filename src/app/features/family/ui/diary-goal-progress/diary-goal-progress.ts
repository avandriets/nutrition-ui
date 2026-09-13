import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import type { GoalTimelineItem, NutrientValues, UIState } from '../../../../shared/types';
import { UIStateContainerComponent } from '../../../../shared/ui/state-container/state-container';

@Component({
  selector: 'app-diary-goal-progress',
  imports: [DatePipe, DecimalPipe, MatButtonModule, MatCardModule, MatIconModule, RouterLink, UIStateContainerComponent],
  templateUrl: './diary-goal-progress.html',
  styleUrl: './diary-goal-progress.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiaryGoalProgressComponent {
  readonly state = input.required<UIState<string>>();
  readonly goal = input<GoalTimelineItem | null>(null);
  readonly totals = input.required<NutrientValues>();

  goalPercent(value: number, target: number): number {
    return target > 0 ? Math.min((value / target) * 100, 100) : 0;
  }

  goalState(value: number, target: number): string {
    if (target <= 0 || value < target) return 'pending';
    return value <= target * 1.05 ? 'achieved' : 'exceeded';
  }

  goalCaption(value: number, target: number, unit: string): string {
    if (target <= 0) return 'Цель не задана';
    const difference = target - value;
    if (difference > 0) return `Осталось ${this.formatNumber(difference)} ${unit}`;
    if (Math.abs(difference) <= target * 0.05) return 'Цель достигнута';
    return `Превышено на ${this.formatNumber(Math.abs(difference))} ${unit}`;
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(value);
  }
}
