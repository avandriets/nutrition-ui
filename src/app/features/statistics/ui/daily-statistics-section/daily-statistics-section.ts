import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import type { UIState } from '../../../../shared/types';
import { UIStateContainerComponent } from '../../../../shared/ui/state-container/state-container';
import type { DailyGoalReport } from '../../types/statistics.types';
import { DailyGoalReportCardComponent } from '../daily-goal-report-card/daily-goal-report-card';
import { StatisticsDayFilterComponent } from '../statistics-day-filter/statistics-day-filter';

@Component({
  selector: 'app-daily-statistics-section',
  imports: [DailyGoalReportCardComponent, MatIconModule, StatisticsDayFilterComponent, UIStateContainerComponent],
  templateUrl: './daily-statistics-section.html',
  styleUrl: './daily-statistics-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyStatisticsSectionComponent {
  readonly state = input.required<UIState<string>>();
  readonly actionError = input<string | null>(null);
  readonly reports = input.required<readonly DailyGoalReport[]>();
  readonly selectedDay = input.required<string>();
  readonly today = input.required<string>();
  readonly selectedUserName = input.required<string>();
  readonly actionErrorDismissed = output<void>();
}
