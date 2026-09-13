import type { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { distinctUntilChanged, map, tap } from 'rxjs';

import { UIPageComponent } from '../../../../shared/ui/page/page';
import { UIStateContainerComponent } from '../../../../shared/ui/state-container/state-container';
import { StatisticsStore } from '../../data-access/statistics.store';
import type { StatisticsFilters, StatisticsMetric, TimelineGranularity } from '../../types/statistics.types';
import { DailyStatisticsSectionComponent, PeriodStatisticsSectionComponent, StatisticsUserFilterComponent } from '../../ui';

const GRANULARITIES: readonly TimelineGranularity[] = ['day', 'week', 'month'];
const METRICS: readonly StatisticsMetric[] = ['calories_kcal', 'protein_g', 'fat_g', 'carbohydrates_g', 'fiber_g'];

@Component({
  selector: 'app-statistics-page',
  imports: [
    DailyStatisticsSectionComponent,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    PeriodStatisticsSectionComponent,
    RouterLink,
    StatisticsUserFilterComponent,
    UIPageComponent,
    UIStateContainerComponent,
  ],
  templateUrl: './statistics.page.html',
  styleUrl: './statistics.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatisticsPage implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(StatisticsStore);
  private initialized = false;

  readonly today = this.store.today;
  readonly users = this.store.users;
  readonly selectedUserId = this.store.selectedUserId;
  readonly selectedDay = this.store.selectedDay;
  readonly dateFrom = this.store.dateFrom;
  readonly dateTo = this.store.dateTo;
  readonly granularity = this.store.granularity;
  readonly includeEmptyDays = this.store.includeEmptyDays;
  readonly selectedMetric = this.store.selectedMetric;
  readonly selectedUserName = this.store.selectedUserName;
  readonly dailyReports = this.store.dailyReports;
  readonly averageReports = this.store.averageReports;
  readonly timelineReports = this.store.timelineReports;
  readonly initialState = this.store.initialState;
  readonly dailyState = this.store.dailyState;
  readonly periodState = this.store.periodState;
  readonly dailyError = this.store.dailyError;
  readonly periodError = this.store.periodError;

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(
        map(params => {
          const userId = Number(params.get('user'));
          const granularity = params.get('granularity');
          const metric = params.get('metric');

          return {
            userId: Number.isInteger(userId) && userId > 0 ? userId : null,
            day: params.get('day') ?? this.today,
            dateFrom: params.get('from') ?? this.store.defaultDateFrom,
            dateTo: params.get('to') ?? this.today,
            granularity: GRANULARITIES.includes(granularity as TimelineGranularity) ? (granularity as TimelineGranularity) : 'day',
            includeEmptyDays: params.get('empty') === 'true',
            metric: METRICS.includes(metric as StatisticsMetric) ? (metric as StatisticsMetric) : 'calories_kcal',
          } satisfies StatisticsFilters;
        }),
        distinctUntilChanged((previous, current) => this.sameFilters(previous, current)),
        tap(filters => {
          if (this.initialized) {
            this.store.applyFilters(filters);
          } else {
            this.initialized = true;
            this.store.initialize(filters);
          }
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  dismissDailyError(): void {
    this.store.dismissDailyError();
  }

  dismissPeriodError(): void {
    this.store.dismissPeriodError();
  }

  private sameFilters(previous: StatisticsFilters, current: StatisticsFilters): boolean {
    return (
      previous.userId === current.userId &&
      previous.day === current.day &&
      previous.dateFrom === current.dateFrom &&
      previous.dateTo === current.dateTo &&
      previous.granularity === current.granularity &&
      previous.includeEmptyDays === current.includeEmptyDays &&
      previous.metric === current.metric
    );
  }
}
