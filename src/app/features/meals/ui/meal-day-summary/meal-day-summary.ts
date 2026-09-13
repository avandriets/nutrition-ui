import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import type { GoalTimelineItem } from '../../../../shared/types';
import type { MealMemberSummary } from '../../types/meal-detail.types';

@Component({
  selector: 'app-meal-day-summary',
  imports: [DatePipe, DecimalPipe, MatCardModule, MatIconModule, RouterLink],
  templateUrl: './meal-day-summary.html',
  styleUrl: './meal-day-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MealDaySummaryComponent {
  readonly mealDate = input.required<string>();
  readonly summaries = input.required<readonly MealMemberSummary[]>();
  readonly goals = input.required<ReadonlyMap<number, GoalTimelineItem | null>>();

  goalFor(userId: number): GoalTimelineItem | null {
    return this.goals().get(userId) ?? null;
  }

  goalStatus(value: number, target: number): string {
    if (target <= 0) return 'Не задана';
    const ratio = value / target;
    if (ratio < 1) return `${Math.round(ratio * 100)}%`;
    if (ratio <= 1.05) return 'Достигнута';
    return `+\u00a0${Math.round((ratio - 1) * 100)}%`;
  }

  goalStatusClass(value: number, target: number): string {
    const ratio = target > 0 ? value / target : 0;
    if (ratio < 1) return 'pending';
    return ratio <= 1.05 ? 'achieved' : 'exceeded';
  }
}
