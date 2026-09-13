import { DatePipe, DecimalPipe } from '@angular/common';
import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';

import type { MealType, NutrientValues } from '../../../../shared/types';
import { UIPageComponent } from '../../../../shared/ui/page/page';
import { UIStateContainerComponent } from '../../../../shared/ui/state-container/state-container';
import { mealTypeIcon, mealTypeLabel } from '../../../../shared/utils/meal.utils';
import { initials } from '../../../../shared/utils/name.utils';
import { PersonalDiaryStore } from '../../data-access/personal-diary.store';
import type { DiaryMealRow } from '../../types/family-diary.types';

@Component({
  selector: 'app-personal-diary-page',
  imports: [DatePipe, DecimalPipe, MatButtonModule, MatCardModule, MatIconModule, RouterLink, UIPageComponent, UIStateContainerComponent],
  templateUrl: './personal-diary.page.html',
  styleUrl: './personal-diary.page.scss',
})
export class PersonalDiaryPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(PersonalDiaryStore);

  readonly user = this.store.user;
  readonly goal = this.store.goal;
  readonly dayTotals = this.store.dayTotals;
  readonly dateFilter = this.store.dateFilter;
  readonly refreshError = this.store.refreshError;
  readonly pageState = this.store.pageState;
  readonly mealViews = this.store.mealViews;

  ngOnInit(): void {
    this.store.initialize(Number(this.route.snapshot.paramMap.get('userId')));
  }

  setDate(date: string): void {
    this.store.setDate(date);
  }

  reload(): void {
    this.store.reload();
  }

  portionFor(row: DiaryMealRow): number {
    return this.store.portionFor(row);
  }

  nutrientFor(row: DiaryMealRow, nutrient: keyof NutrientValues): number {
    return this.store.nutrientFor(row, nutrient);
  }

  typeLabel(type: MealType): string {
    return mealTypeLabel(type);
  }

  typeIcon(type: MealType): string {
    return mealTypeIcon(type);
  }

  goalPercent(value: number, target: number): number {
    return target > 0 ? Math.min((value / target) * 100, 100) : 0;
  }

  goalState(value: number, target: number): string {
    if (target <= 0 || value < target) return 'pending';
    return value <= target * 1.05 ? 'achieved' : 'exceeded';
  }

  goalCaption(value: number, target: number, unit: string): string {
    if (target <= 0) return 'Цель не задана';
    const difference = target - value;
    if (difference > 0) return `Осталось ${this.formatNumber(difference)} ${unit}`;
    if (Math.abs(difference) <= target * 0.05) return 'Цель достигнута';
    return `Превышено на ${this.formatNumber(Math.abs(difference))} ${unit}`;
  }

  mealsCountLabel(count: number): string {
    const lastTwo = count % 100;
    const last = count % 10;
    if (lastTwo >= 11 && lastTwo <= 14) return `${count} приёмов пищи`;
    if (last === 1) return `${count} приём пищи`;
    if (last >= 2 && last <= 4) return `${count} приёма пищи`;
    return `${count} приёмов пищи`;
  }

  initials(name: string): string {
    return initials(name);
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(value);
  }
}
