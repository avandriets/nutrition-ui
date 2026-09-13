import { computed, inject, Injectable, signal } from '@angular/core';
import { addDays, format, parseISO } from 'date-fns';
import type { Observable } from 'rxjs';
import { EMPTY, forkJoin, tap } from 'rxjs';

import { AccountContextStore } from '../../../core/account/account-context.store';
import type { StatisticsMetric, TimelineGranularity } from '../types/statistics.types';
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
  readonly selectedUserId = signal<number | null>(null);
  readonly selectedDay = signal(this.today);
  readonly dateFrom = signal(format(addDays(parseISO(this.today), -29), 'yyyy-MM-dd'));
  readonly dateTo = signal(this.today);
  readonly granularity = signal<TimelineGranularity>('day');
  readonly includeEmptyDays = signal(false);
  readonly selectedMetric = signal<StatisticsMetric>('calories_kcal');
  readonly users = computed(() => this.initialStore.data()?.users ?? []);
  readonly filteredUsers = computed(() => {
    const selectedId = this.selectedUserId();
    return selectedId === null ? this.users() : this.users().filter(user => user.id === selectedId);
  });
  readonly selectedUserName = computed(() => this.filteredUsers()[0]?.name ?? 'Вся семья');
  readonly dailyReports = computed(() => this.dailyStore.data() ?? []);
  readonly averageReports = computed(() => this.periodStore.data()?.averageReports ?? []);
  readonly timelineReports = computed(() => this.periodStore.data()?.timelineReports ?? []);
  readonly loadingInitial = this.initialStore.loading;
  readonly loadingDaily = this.dailyStore.loading;
  readonly loadingPeriod = this.periodStore.loading;
  readonly initialError = this.initialStore.error;
  readonly dailyError = this.dailyStore.error;
  readonly periodError = this.periodStore.error;
  readonly initialState = this.initialStore.requestState;

  initialize(): void {
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
      this.periodStore.setError('Укажите начало и конец периода.');
      return;
    }
    if (this.dateFrom() > this.dateTo()) {
      this.periodStore.setError('Начало периода не может быть позже окончания.');
      return;
    }
    this.loadPeriodReports();
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
