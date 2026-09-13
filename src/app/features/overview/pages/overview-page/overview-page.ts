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
import { OverviewStore } from '../../data-access/overview.store';
import { OverviewActionsComponent, OverviewHeadingComponent, OverviewMealsSectionComponent, OverviewNutritionSectionComponent } from '../../ui';

@Component({
  selector: 'app-overview-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    OverviewActionsComponent,
    OverviewHeadingComponent,
    OverviewMealsSectionComponent,
    OverviewNutritionSectionComponent,
    RouterLink,
    UIPageComponent,
    UIStateContainerComponent,
  ],
  templateUrl: './overview-page.html',
  styleUrl: './overview-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewPage implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(OverviewStore);
  private initialized = false;

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
  readonly goalState = this.store.goalState;
  readonly mealsState = this.store.mealsState;

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(
        map(params => {
          const userId = Number(params.get('user'));
          return Number.isInteger(userId) && userId > 0 ? userId : null;
        }),
        distinctUntilChanged(),
        tap(userId => {
          if (this.initialized) {
            this.store.selectUser(userId);
          } else {
            this.initialized = true;
            this.store.initialize(userId);
          }
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
