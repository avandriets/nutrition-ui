import { computed, inject, Injectable, signal } from '@angular/core';
import { addDays, format, parseISO } from 'date-fns';
import type { Observable } from 'rxjs';
import { EMPTY, forkJoin, tap } from 'rxjs';

import { AccountContextStore } from '../../../core/account/account-context.store';
import type { StatisticsFilters, StatisticsMetric, TimelineGranularity } from '../types/statistics.types';
import type { DailyStatisticsData, PeriodStatisticsData } from '../types/statistics-store.types';
import { StatisticsDailyStore } from './statistics-daily.store';
import { StatisticsInitialStore } from './statistics-initial.store';
import { StatisticsPeriodStore } from './statistics-period.store';

@Injectable()
export class StatisticsStore {
  private readonly accountContext = inject(AccountContextStore);
  private readonly initialStore = inject(StatisticsInitialStore);
  private readonly dailyStore = inject(StatisticsDailyStore);
  private readonly periodStore = inject(StatisticsPeriodStore);

  readonly today = format(new Date(), 'yyyy-MM-dd');
  readonly defaultDateFrom = format(addDays(parseISO(this.today), -29), 'yyyy-MM-dd');
  readonly selectedUserId = signal<number | null>(null);
  readonly selectedDay = signal(this.today);
  readonly dateFrom = signal(this.defaultDateFrom);
  readonly dateTo = signal(this.today);
  readonly granularity = signal<TimelineGranularity>('day');
  readonly includeEmptyDays = signal(false);
  readonly selectedMetric = signal<StatisticsMetric>('calories_kcal');
  readonly users = computed(() => this.initialStore.data()?.users ?? []);
  readonly filteredUsers = computed(() => {
    const selectedId = this.selectedUserId();
    return selectedId === null ? this.users() : this.users().filter(user => user.id === selectedId);
  });
  readonly selectedUserName = computed(() => this.filteredUsers()[0]?.name ?? 'Whole family');
  readonly dailyReports = computed(() => this.dailyStore.data() ?? []);
  readonly averageReports = computed(() => this.periodStore.data()?.averageReports ?? []);
  readonly timelineReports = computed(() => this.periodStore.data()?.timelineReports ?? []);
  readonly loadingInitial = this.initialStore.loading;
  readonly loadingDaily = this.dailyStore.loading;
  readonly loadingPeriod = this.periodStore.loading;
  readonly initialError = this.initialStore.error;
  readonly initialState = this.initialStore.requestState;
  readonly dailyError = computed(() => (this.dailyStore.data() ? this.dailyStore.error() : null));
  readonly periodError = computed(() => (this.periodStore.data() ? this.periodStore.error() : null));
  readonly dailyState = computed(() => {
    if (!this.dailyStore.data()) return this.dailyStore.requestState();

    return {
      resolved: true,
      rejected: false,
      pending: this.dailyStore.loading(),
      err: null,
      empty: !this.dailyReports().length,
    };
  });
  readonly periodState = computed(() => {
    if (!this.periodStore.data()) return this.periodStore.requestState();

    return {
      resolved: true,
      rejected: false,
      pending: this.periodStore.loading(),
      err: null,
      empty: !this.averageReports().length && !this.timelineReports().length,
    };
  });

  initialize(filters: StatisticsFilters = this.filters()): void {
    this.setFilters(filters);
    this.initialStore
      .load(undefined)
      .pipe(
        tap(data => {
          this.accountContext.setMembers(data.users);
          this.loadReports();
        }),
      )
      .subscribe();
  }

  applyFilters(filters: StatisticsFilters): void {
    const previous = this.filters();
    this.setFilters(filters);

    if (!this.initialStore.data()) return;

    if (previous.userId !== filters.userId) {
      if (filters.userId !== null) this.accountContext.selectUser(filters.userId);
      this.loadReports();
      return;
    }

    if (previous.day !== filters.day) this.loadDailyReports().subscribe();

    if (
      previous.dateFrom !== filters.dateFrom ||
      previous.dateTo !== filters.dateTo ||
      previous.granularity !== filters.granularity ||
      previous.includeEmptyDays !== filters.includeEmptyDays
    ) {
      this.applyPeriod();
    }
  }

  selectUser(userId: number | null): void {
    this.selectedUserId.set(userId);
    if (userId !== null) this.accountContext.selectUser(userId);
    this.loadReports();
  }

  setDay(date: string): void {
    if (!date) return;
    this.selectedDay.set(date > this.today ? this.today : date);
    this.loadDailyReports();
  }

  shiftDay(offset: number): void {
    this.setDay(format(addDays(parseISO(this.selectedDay()), offset), 'yyyy-MM-dd'));
  }

  setDateFrom(date: string): void {
    this.dateFrom.set(date);
  }

  setDateTo(date: string): void {
    this.dateTo.set(date);
  }

  setGranularity(granularity: TimelineGranularity): void {
    this.granularity.set(granularity);
  }

  setIncludeEmptyDays(include: boolean): void {
    this.includeEmptyDays.set(include);
  }

  setSelectedMetric(metric: StatisticsMetric): void {
    this.selectedMetric.set(metric);
  }

  applyPeriod(): void {
    if (!this.dateFrom() || !this.dateTo()) {
      this.periodStore.setError('Enter the start and end dates.');
      return;
    }
    if (this.dateFrom() > this.dateTo()) {
      this.periodStore.setError('The start date cannot be after the end date.');
      return;
    }
    this.loadPeriodReports().subscribe();
  }

  dismissDailyError(): void {
    this.dailyStore.dismissError();
  }

  dismissPeriodError(): void {
    this.periodStore.dismissError();
  }

  private filters(): StatisticsFilters {
    return {
      userId: this.selectedUserId(),
      day: this.selectedDay(),
      dateFrom: this.dateFrom(),
      dateTo: this.dateTo(),
      granularity: this.granularity(),
      includeEmptyDays: this.includeEmptyDays(),
      metric: this.selectedMetric(),
    };
  }

  private setFilters(filters: StatisticsFilters): void {
    this.selectedUserId.set(filters.userId);
    this.selectedDay.set(filters.day > this.today ? this.today : filters.day);
    this.dateFrom.set(filters.dateFrom);
    this.dateTo.set(filters.dateTo > this.today ? this.today : filters.dateTo);
    this.granularity.set(filters.granularity);
    this.includeEmptyDays.set(filters.includeEmptyDays);
    this.selectedMetric.set(filters.metric);
  }

  private loadReports(): void {
    forkJoin([this.loadDailyReports(), this.loadPeriodReports()]).subscribe();
  }

  private loadDailyReports(): Observable<DailyStatisticsData> {
    const initialData = this.initialStore.data();
    if (!initialData) return EMPTY;

    return this.dailyStore.load({
      accountId: initialData.accountId,
      users: this.filteredUsers(),
      selectedDay: this.selectedDay(),
    });
  }

  private loadPeriodReports(): Observable<PeriodStatisticsData> {
    const initialData = this.initialStore.data();
    if (!initialData) return EMPTY;

    return this.periodStore.load({
      accountId: initialData.accountId,
      users: this.filteredUsers(),
      dateFrom: this.dateFrom(),
      dateTo: this.dateTo(),
      granularity: this.granularity(),
      includeEmptyDays: this.includeEmptyDays(),
    });
  }
}
