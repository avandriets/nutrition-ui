import { DatePipe, DecimalPipe } from '@angular/common';
import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RouterLink } from '@angular/router';

import { UIPageComponent } from '../../../../shared/ui/page/page';
import { UIStateContainerComponent } from '../../../../shared/ui/state-container/state-container';
import { initials } from '../../../../shared/utils/name.utils';
import { StatisticsStore } from '../../data-access/statistics.store';
import type { DailyGoalReport, NutritionTimelinePoint, StatisticsMetric } from '../../types/statistics.types';

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
    UIPageComponent,
    UIStateContainerComponent,
  ],
  templateUrl: './statistics.page.html',
  styleUrl: './statistics.page.scss',
})
export class StatisticsPage implements OnInit {
  private readonly store = inject(StatisticsStore);

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
  readonly loadingInitial = this.store.loadingInitial;
  readonly loadingDaily = this.store.loadingDaily;
  readonly loadingPeriod = this.store.loadingPeriod;
  readonly dailyError = this.store.dailyError;
  readonly periodError = this.store.periodError;
  readonly initialState = this.store.initialState;

  readonly metricOptions: readonly {
    value: StatisticsMetric;
    label: string;
    shortLabel: string;
    unit: string;
  }[] = [
    { value: 'calories_kcal', label: 'Калории', shortLabel: 'ккал', unit: 'ккал' },
    { value: 'protein_g', label: 'Белки', shortLabel: 'Б', unit: 'г' },
    { value: 'fat_g', label: 'Жиры', shortLabel: 'Ж', unit: 'г' },
    { value: 'carbohydrates_g', label: 'Углеводы', shortLabel: 'У', unit: 'г' },
    { value: 'fiber_g', label: 'Клетчатка', shortLabel: 'F', unit: 'г' },
  ];

  ngOnInit(): void {
    this.store.initialize();
  }

  selectUser(userId: number | null): void {
    this.store.selectUser(userId);
  }

  setDay(date: string): void {
    this.store.setDay(date);
  }

  shiftDay(offset: number): void {
    this.store.shiftDay(offset);
  }

  setDateFrom(date: string): void {
    this.store.setDateFrom(date);
  }

  setDateTo(date: string): void {
    this.store.setDateTo(date);
  }

  setGranularity(value: string): void {
    if (value === 'day' || value === 'week' || value === 'month') this.store.setGranularity(value);
  }

  setIncludeEmptyDays(include: boolean): void {
    this.store.setIncludeEmptyDays(include);
  }

  setSelectedMetric(metric: StatisticsMetric): void {
    this.store.setSelectedMetric(metric);
  }

  applyPeriod(): void {
    this.store.applyPeriod();
  }

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

  completedGoals(report: DailyGoalReport): number {
    if (!report.goal) return 0;
    const pairs: [number, number][] = [
      [report.totals.calories_kcal, report.goal.daily_calories_kcal],
      [report.totals.protein_g, report.goal.daily_protein_g],
      [report.totals.fiber_g, report.goal.daily_fiber_g],
    ];
    return pairs.filter(([value, target]) => target > 0 && value >= target * 0.95).length;
  }

  activeGoals(report: DailyGoalReport): number {
    if (!report.goal) return 0;
    return [report.goal.daily_calories_kcal, report.goal.daily_protein_g, report.goal.daily_fiber_g].filter(target => target > 0).length;
  }

  reportState(report: DailyGoalReport): string {
    if (!report.goal) return 'without-goal';
    const completed = this.completedGoals(report);
    return completed === this.activeGoals(report) ? 'complete' : completed > 0 ? 'partial' : 'pending';
  }

  metricLabel(): string {
    return this.metricOptions.find(option => option.value === this.selectedMetric())?.label ?? '';
  }

  metricUnit(): string {
    return this.metricOptions.find(option => option.value === this.selectedMetric())?.unit ?? '';
  }

  metricValue(point: NutritionTimelinePoint): number {
    return point[this.selectedMetric()];
  }

  barHeight(point: NutritionTimelinePoint, points: NutritionTimelinePoint[]): number {
    const maximum = Math.max(...points.map(item => this.metricValue(item)), 0);
    if (maximum <= 0) return 0;
    const value = this.metricValue(point);
    return value > 0 ? Math.max((value / maximum) * 100, 3) : 0;
  }

  isSingleDay(point: NutritionTimelinePoint): boolean {
    return point.period_start === point.period_end;
  }

  initials(name: string): string {
    return initials(name);
  }
}
