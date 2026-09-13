import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';

import { initials } from '../../../../shared/utils/name.utils';
import type { DailyGoalReport } from '../../types/statistics.types';

@Component({
  selector: 'app-daily-goal-report-card',
  imports: [DatePipe, DecimalPipe, MatCardModule, MatIconModule, MatProgressBarModule, RouterLink],
  templateUrl: './daily-goal-report-card.html',
  styleUrl: './daily-goal-report-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyGoalReportCardComponent {
  readonly report = input.required<DailyGoalReport>();
  readonly day = input.required<string>();
  readonly initials = initials;

  percent(value: number, target: number): number {
    return target > 0 ? Math.min((value / target) * 100, 100) : 0;
  }

  goalState(value: number, target: number): 'pending' | 'achieved' | 'exceeded' {
    const ratio = target > 0 ? value / target : 0;
    if (ratio < 0.95) return 'pending';
    return ratio <= 1.05 ? 'achieved' : 'exceeded';
  }

  goalStatus(value: number, target: number): string {
    if (target <= 0) return 'Цель не задана';
    const state = this.goalState(value, target);
    if (state === 'achieved') return 'Достигнута';
    if (state === 'exceeded') return `Перевыполнена на ${Math.round((value / target - 1) * 100)}%`;
    return `Выполнено ${Math.round((value / target) * 100)}%`;
  }

  completedGoals(): number {
    const report = this.report();
    if (!report.goal) return 0;
    return [
      [report.totals.calories_kcal, report.goal.daily_calories_kcal],
      [report.totals.protein_g, report.goal.daily_protein_g],
      [report.totals.fiber_g, report.goal.daily_fiber_g],
    ].filter(([value, target]) => target > 0 && value >= target * 0.95).length;
  }

  activeGoals(): number {
    const goal = this.report().goal;
    if (!goal) return 0;
    return [goal.daily_calories_kcal, goal.daily_protein_g, goal.daily_fiber_g].filter(target => target > 0).length;
  }

  reportState(): string {
    if (!this.report().goal) return 'without-goal';
    const completed = this.completedGoals();
    return completed === this.activeGoals() ? 'complete' : completed > 0 ? 'partial' : 'pending';
  }
}
