import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import type { UIState } from '../../../../shared/types';
import { UIStateContainerComponent } from '../../../../shared/ui/state-container/state-container';
import type { AverageReport, StatisticsMetric, TimelineGranularity, TimelineReport } from '../../types/statistics.types';
import { AverageNutritionCardComponent } from '../average-nutrition-card/average-nutrition-card';
import { NutritionTimelineChartComponent } from '../nutrition-timeline-chart/nutrition-timeline-chart';
import { StatisticsPeriodFiltersComponent } from '../statistics-period-filters/statistics-period-filters';

@Component({
  selector: 'app-period-statistics-section',
  imports: [AverageNutritionCardComponent, DatePipe, MatIconModule, NutritionTimelineChartComponent, StatisticsPeriodFiltersComponent, UIStateContainerComponent],
  templateUrl: './period-statistics-section.html',
  styleUrl: './period-statistics-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PeriodStatisticsSectionComponent {
  readonly state = input.required<UIState<string>>();
  readonly actionError = input<string | null>(null);
  readonly averageReports = input.required<readonly AverageReport[]>();
  readonly timelineReports = input.required<readonly TimelineReport[]>();
  readonly dateFrom = input.required<string>();
  readonly dateTo = input.required<string>();
  readonly today = input.required<string>();
  readonly granularity = input.required<TimelineGranularity>();
  readonly includeEmptyDays = input(false);
  readonly metric = input.required<StatisticsMetric>();
  readonly actionErrorDismissed = output<void>();
}
