import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';

import { initials } from '../../../../shared/utils/name.utils';
import type { NutritionTimelinePoint, StatisticsMetric, StatisticsMetricOption, TimelineReport } from '../../types/statistics.types';

const METRIC_OPTIONS: readonly StatisticsMetricOption[] = [
  { value: 'calories_kcal', label: 'Калории', unit: 'ккал' },
  { value: 'protein_g', label: 'Белки', unit: 'г' },
  { value: 'fat_g', label: 'Жиры', unit: 'г' },
  { value: 'carbohydrates_g', label: 'Углеводы', unit: 'г' },
  { value: 'fiber_g', label: 'Клетчатка', unit: 'г' },
];

@Component({
  selector: 'app-nutrition-timeline-chart',
  imports: [DatePipe, DecimalPipe, MatCardModule, MatIconModule, MatSelectModule],
  templateUrl: './nutrition-timeline-chart.html',
  styleUrl: './nutrition-timeline-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NutritionTimelineChartComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly reports = input.required<readonly TimelineReport[]>();
  readonly metric = input.required<StatisticsMetric>();
  readonly includeEmptyDays = input(false);
  readonly metricOptions = METRIC_OPTIONS;
  readonly initials = initials;

  selectMetric(metric: StatisticsMetric): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { metric: metric === 'calories_kcal' ? null : metric },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  metricLabel(): string {
    return this.metricOption()?.label ?? '';
  }

  metricUnit(): string {
    return this.metricOption()?.unit ?? '';
  }

  metricValue(point: NutritionTimelinePoint): number {
    return point[this.metric()];
  }

  barHeight(point: NutritionTimelinePoint, points: readonly NutritionTimelinePoint[]): number {
    const maximum = Math.max(...points.map(item => this.metricValue(item)), 0);
    if (maximum <= 0) return 0;
    const value = this.metricValue(point);
    return value > 0 ? Math.max((value / maximum) * 100, 3) : 0;
  }

  isSingleDay(point: NutritionTimelinePoint): boolean {
    return point.period_start === point.period_end;
  }

  private metricOption(): StatisticsMetricOption | undefined {
    return this.metricOptions.find(option => option.value === this.metric());
  }
}
