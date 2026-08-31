import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, map, of, switchMap } from 'rxjs';
import { AccountBootstrapService } from '../../../../core/account/account-bootstrap.service';
import { AccountContextService } from '../../../../core/account/account-context.service';
import { StatisticsApiService } from '../../data-access/statistics-api.service';
import {
  AverageReport,
  DailyGoalReport,
  GoalTarget,
  NutritionTimelinePoint,
  NutrientValues,
  StatisticsMetric,
  StatisticsUser,
  TimelineGranularity,
  TimelineReport,
  UserDailyTotal,
} from '../../data-access/statistics.models';

const EMPTY_NUTRIENTS: NutrientValues = {
  calories_kcal: 0,
  protein_g: 0,
  fat_g: 0,
  carbohydrates_g: 0,
  fiber_g: 0,
};

@Component({
  selector: 'app-statistics-page',
  imports: [
    DatePipe,
    DecimalPipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
    RouterLink,
  ],
  templateUrl: './statistics.page.html',
  styleUrl: './statistics.page.scss',
})
export class StatisticsPage implements OnInit {
  private readonly accountBootstrap = inject(AccountBootstrapService);
  private readonly accountContext = inject(AccountContextService);
  private readonly api = inject(StatisticsApiService);
  private accountId: number | null = null;
  private dailyRequestId = 0;
  private periodRequestId = 0;

  protected readonly today = this.todayIsoDate();
  protected readonly users = signal<StatisticsUser[]>([]);
  protected readonly selectedUserId = signal<number | null>(null);
  protected readonly selectedDay = signal(this.today);
  protected readonly dateFrom = signal(this.shiftIsoDate(this.today, -29));
  protected readonly dateTo = signal(this.today);
  protected readonly granularity = signal<TimelineGranularity>('day');
  protected readonly includeEmptyDays = signal(false);
  protected readonly selectedMetric = signal<StatisticsMetric>('calories_kcal');
  protected readonly dailyReports = signal<DailyGoalReport[]>([]);
  protected readonly averageReports = signal<AverageReport[]>([]);
  protected readonly timelineReports = signal<TimelineReport[]>([]);
  protected readonly loadingInitial = signal(true);
  protected readonly loadingDaily = signal(false);
  protected readonly loadingPeriod = signal(false);
  protected readonly initialError = signal<string | null>(null);
  protected readonly dailyError = signal<string | null>(null);
  protected readonly periodError = signal<string | null>(null);

  protected readonly filteredUsers = computed(() => {
    const selectedId = this.selectedUserId();
    return selectedId === null
      ? this.users()
      : this.users().filter((user) => user.id === selectedId);
  });

  protected readonly selectedUserName = computed(
    () => this.filteredUsers()[0]?.name ?? 'Вся семья',
  );

  protected readonly metricOptions: ReadonlyArray<{
    value: StatisticsMetric;
    label: string;
    shortLabel: string;
    unit: string;
  }> = [
    { value: 'calories_kcal', label: 'Калории', shortLabel: 'ккал', unit: 'ккал' },
    { value: 'protein_g', label: 'Белки', shortLabel: 'Б', unit: 'г' },
    { value: 'fat_g', label: 'Жиры', shortLabel: 'Ж', unit: 'г' },
    { value: 'carbohydrates_g', label: 'Углеводы', shortLabel: 'У', unit: 'г' },
    { value: 'fiber_g', label: 'Клетчатка', shortLabel: 'F', unit: 'г' },
  ];

  ngOnInit(): void {
    this.loadInitialData();
  }

  protected selectUser(userId: number | null): void {
    this.selectedUserId.set(userId);
    if (userId !== null) this.accountContext.selectUser(userId);
    this.loadDailyReports();
    this.loadPeriodReports();
  }

  protected setDay(date: string): void {
    if (!date) return;
    this.selectedDay.set(date > this.today ? this.today : date);
    this.loadDailyReports();
  }

  protected shiftDay(offset: number): void {
    this.setDay(this.shiftIsoDate(this.selectedDay(), offset));
  }

  protected applyPeriod(): void {
    if (!this.dateFrom() || !this.dateTo()) {
      this.periodError.set('Укажите начало и конец периода.');
      return;
    }
    if (this.dateFrom() > this.dateTo()) {
      this.periodError.set('Начало периода не может быть позже окончания.');
      return;
    }
    this.loadPeriodReports();
  }

  protected percent(value: number, target: number): number {
    return target > 0 ? Math.min((value / target) * 100, 100) : 0;
  }

  protected goalState(value: number, target: number): 'pending' | 'achieved' | 'exceeded' {
    const ratio = target > 0 ? value / target : 0;
    if (ratio < 0.95) return 'pending';
    return ratio <= 1.05 ? 'achieved' : 'exceeded';
  }

  protected goalStatus(value: number, target: number): string {
    if (target <= 0) return 'Цель не задана';
    const state = this.goalState(value, target);
    if (state === 'achieved') return 'Достигнута';
    if (state === 'exceeded') return `Перевыполнена на ${Math.round((value / target - 1) * 100)}%`;
    return `Выполнено ${Math.round((value / target) * 100)}%`;
  }

  protected completedGoals(report: DailyGoalReport): number {
    if (!report.goal) return 0;
    const pairs: Array<[number, number]> = [
      [report.totals.calories_kcal, report.goal.daily_calories_kcal],
      [report.totals.protein_g, report.goal.daily_protein_g],
      [report.totals.fiber_g, report.goal.daily_fiber_g],
    ];
    return pairs.filter(([value, target]) => target > 0 && value >= target * 0.95).length;
  }

  protected activeGoals(report: DailyGoalReport): number {
    if (!report.goal) return 0;
    return [
      report.goal.daily_calories_kcal,
      report.goal.daily_protein_g,
      report.goal.daily_fiber_g,
    ].filter((target) => target > 0).length;
  }

  protected reportState(report: DailyGoalReport): string {
    if (!report.goal) return 'without-goal';
    const completed = this.completedGoals(report);
    return completed === this.activeGoals(report)
      ? 'complete'
      : completed > 0
        ? 'partial'
        : 'pending';
  }

  protected metricLabel(): string {
    return this.metricOptions.find((option) => option.value === this.selectedMetric())?.label ?? '';
  }

  protected metricUnit(): string {
    return this.metricOptions.find((option) => option.value === this.selectedMetric())?.unit ?? '';
  }

  protected metricValue(point: NutritionTimelinePoint): number {
    return point[this.selectedMetric()];
  }

  protected barHeight(point: NutritionTimelinePoint, points: NutritionTimelinePoint[]): number {
    const maximum = Math.max(...points.map((item) => this.metricValue(item)), 0);
    if (maximum <= 0) return 0;
    const value = this.metricValue(point);
    return value > 0 ? Math.max((value / maximum) * 100, 3) : 0;
  }

  protected isSingleDay(point: NutritionTimelinePoint): boolean {
    return point.period_start === point.period_end;
  }

  protected initials(name: string): string {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toLocaleUpperCase('ru');
  }

  private loadInitialData(): void {
    this.loadingInitial.set(true);
    this.initialError.set(null);
    this.accountBootstrap
      .ensureAccount()
      .pipe(
        switchMap((account) => {
          this.accountId = account.id;
          return this.api.listUsers(account.id);
        }),
        finalize(() => this.loadingInitial.set(false)),
      )
      .subscribe({
        next: (users) => {
          this.users.set(users);
          this.accountContext.setMembers(users);
          this.loadDailyReports();
          this.loadPeriodReports();
        },
        error: () => this.initialError.set('Не удалось загрузить семейный аккаунт.'),
      });
  }

  private loadDailyReports(): void {
    if (!this.accountId) return;
    const requestId = ++this.dailyRequestId;
    const users = this.filteredUsers();
    if (!users.length) {
      this.dailyReports.set([]);
      this.loadingDaily.set(false);
      return;
    }

    this.loadingDaily.set(true);
    this.dailyError.set(null);
    const selectedDay = this.selectedDay();
    const goalRequests = users.map((user) =>
      this.api.getGoalForDate(this.accountId!, user.id, selectedDay).pipe(
        switchMap((timeline) => {
          const activeGoal = timeline.periods[0];
          if (activeGoal) return of({ goal: activeGoal, goalIsFallback: false });

          return this.api.listGoals(this.accountId!, user.id).pipe(
            map((goals) => {
              const nextGoal = [...goals]
                .filter((goal) => goal.effective_from > selectedDay)
                .sort(
                  (left, right) =>
                    left.effective_from.localeCompare(right.effective_from) || left.id - right.id,
                )[0];
              const goal: GoalTarget | null = nextGoal
                ? {
                    goal_id: nextGoal.id,
                    daily_calories_kcal: nextGoal.daily_calories_kcal,
                    daily_protein_g: nextGoal.daily_protein_g,
                    daily_fiber_g: nextGoal.daily_fiber_g,
                    effective_from: nextGoal.effective_from,
                  }
                : null;
              return { goal, goalIsFallback: goal !== null };
            }),
          );
        }),
        catchError(() => of({ goal: null, goalIsFallback: false })),
      ),
    );

    forkJoin({
      totals: this.api.getDayTotals(this.accountId, selectedDay),
      goals: goalRequests.length ? forkJoin(goalRequests) : of([]),
    })
      .pipe(
        finalize(() => {
          if (requestId === this.dailyRequestId) this.loadingDaily.set(false);
        }),
      )
      .subscribe({
        next: ({ totals, goals }) => {
          if (requestId !== this.dailyRequestId) return;
          const totalsByUser = new Map(totals.users.map((total) => [total.user_id, total]));
          this.dailyReports.set(
            users.map((user, index) => ({
              user,
              totals: totalsByUser.get(user.id) ?? this.emptyUserTotals(user.id),
              goal: goals[index]?.goal ?? null,
              goalIsFallback: goals[index]?.goalIsFallback ?? false,
            })),
          );
        },
        error: () => {
          if (requestId === this.dailyRequestId) {
            this.dailyError.set('Не удалось загрузить достижения за выбранный день.');
          }
        },
      });
  }

  private loadPeriodReports(): void {
    if (!this.accountId) return;
    const requestId = ++this.periodRequestId;
    const users = this.filteredUsers();
    if (!users.length) {
      this.averageReports.set([]);
      this.timelineReports.set([]);
      this.loadingPeriod.set(false);
      return;
    }

    this.loadingPeriod.set(true);
    this.periodError.set(null);
    const requests = users.map((user) =>
      forkJoin({
        average: this.api.getNutritionAverage(
          this.accountId!,
          user.id,
          this.dateFrom(),
          this.dateTo(),
          this.includeEmptyDays(),
        ),
        timeline: this.api.getNutritionTimeline(
          this.accountId!,
          user.id,
          this.dateFrom(),
          this.dateTo(),
          this.granularity(),
          this.includeEmptyDays(),
        ),
      }).pipe(map(({ average, timeline }) => ({ user, average, timeline }))),
    );

    forkJoin(requests)
      .pipe(
        finalize(() => {
          if (requestId === this.periodRequestId) this.loadingPeriod.set(false);
        }),
      )
      .subscribe({
        next: (reports) => {
          if (requestId !== this.periodRequestId) return;
          this.averageReports.set(reports.map(({ user, average }) => ({ user, average })));
          this.timelineReports.set(reports.map(({ user, timeline }) => ({ user, timeline })));
        },
        error: () => {
          if (requestId === this.periodRequestId) {
            this.periodError.set('Не удалось загрузить статистику за выбранный период.');
          }
        },
      });
  }

  private emptyUserTotals(userId: number): UserDailyTotal {
    return { user_id: userId, ...EMPTY_NUTRIENTS };
  }

  private todayIsoDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private shiftIsoDate(value: string, offset: number): string {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + offset);
    const shiftedYear = date.getFullYear();
    const shiftedMonth = String(date.getMonth() + 1).padStart(2, '0');
    const shiftedDay = String(date.getDate()).padStart(2, '0');
    return `${shiftedYear}-${shiftedMonth}-${shiftedDay}`;
  }
}
