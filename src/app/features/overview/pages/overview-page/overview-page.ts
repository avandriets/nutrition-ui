import { DatePipe, DecimalPipe } from '@angular/common';
import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';

import { UIPageComponent } from '../../../../shared/ui/page/page';
import { UIStateContainerComponent } from '../../../../shared/ui/state-container/state-container';
import { mealTypeIcon, mealTypeLabel } from '../../../../shared/utils/meal.utils';
import { OverviewStore } from '../../data-access/overview.store';
import type { OverviewMeal } from '../../types/overview.types';

@Component({
  selector: 'app-overview-page',
  imports: [DatePipe, DecimalPipe, MatButtonModule, MatCardModule, MatIconModule, MatProgressBarModule, MatSelectModule, RouterLink, UIPageComponent, UIStateContainerComponent],
  templateUrl: './overview-page.html',
  styleUrl: './overview-page.scss',
})
export class OverviewPage implements OnInit {
  private readonly store = inject(OverviewStore);

  readonly today = this.store.today;
  readonly users = this.store.users;
  readonly selectedUserId = this.store.selectedUserId;
  readonly selectedUser = this.store.selectedUser;
  readonly mealSummaries = this.store.mealSummaries;
  readonly dayTotals = this.store.dayTotals;
  readonly calorieTarget = this.store.calorieTarget;
  readonly caloriePercent = this.store.caloriePercent;
  readonly calorieRemaining = this.store.calorieRemaining;
  readonly nutrients = this.store.nutrients;
  readonly pageState = this.store.pageState;

  ngOnInit(): void {
    this.store.initialize();
  }

  selectUser(userId: number): void {
    this.store.selectUser(userId);
  }

  typeLabel(meal: OverviewMeal): string {
    return mealTypeLabel(meal.meal_type);
  }

  typeIcon(meal: OverviewMeal): string {
    return mealTypeIcon(meal.meal_type);
  }

  typeTone(meal: OverviewMeal): string {
    return {
      breakfast: 'orange',
      lunch: 'green',
      dinner: 'purple',
      other: 'blue',
    }[meal.meal_type];
  }
}
