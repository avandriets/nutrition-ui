import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ActivatedRoute, Router } from '@angular/router';

import type { TimelineGranularity } from '../../types/statistics.types';

@Component({
  selector: 'app-statistics-period-filters',
  imports: [MatSelectModule, MatSlideToggleModule],
  templateUrl: './statistics-period-filters.html',
  styleUrl: './statistics-period-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatisticsPeriodFiltersComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly dateFrom = input.required<string>();
  readonly dateTo = input.required<string>();
  readonly today = input.required<string>();
  readonly granularity = input.required<TimelineGranularity>();
  readonly includeEmptyDays = input(false);

  updateDateFrom(dateFrom: string): void {
    if (dateFrom) this.update({ from: dateFrom });
  }

  updateDateTo(dateTo: string): void {
    if (dateTo) this.update({ to: dateTo > this.today() ? this.today() : dateTo });
  }

  updateGranularity(granularity: TimelineGranularity): void {
    this.update({ granularity: granularity === 'day' ? null : granularity });
  }

  updateIncludeEmptyDays(includeEmptyDays: boolean): void {
    this.update({ empty: includeEmptyDays ? 'true' : null });
  }

  private update(queryParams: Record<string, string | null>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
