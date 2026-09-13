import type { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { combineLatest, distinctUntilChanged, map, tap } from 'rxjs';

import { UIPageComponent } from '../../../../shared/ui/page/page';
import { UIStateContainerComponent } from '../../../../shared/ui/state-container/state-container';
import { PersonalDiaryStore } from '../../data-access/personal-diary.store';
import {
  DiaryGoalProgressComponent,
  DiaryNutrientSummaryComponent,
  PersonalDiaryDateFilterComponent,
  PersonalDiaryHeadingComponent,
  PersonalMealsSectionComponent,
} from '../../ui';

@Component({
  selector: 'app-personal-diary-page',
  imports: [
    DiaryGoalProgressComponent,
    DiaryNutrientSummaryComponent,
    MatIconModule,
    PersonalDiaryDateFilterComponent,
    PersonalDiaryHeadingComponent,
    PersonalMealsSectionComponent,
    RouterLink,
    UIPageComponent,
    UIStateContainerComponent,
  ],
  templateUrl: './personal-diary.page.html',
  styleUrl: './personal-diary.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonalDiaryPage implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(PersonalDiaryStore);

  readonly todayDate = this.store.todayDate;
  readonly user = this.store.user;
  readonly goal = this.store.goal;
  readonly dayTotals = this.store.dayTotals;
  readonly dateFilter = this.store.dateFilter;
  readonly refreshError = this.store.refreshError;
  readonly pageState = this.store.pageState;
  readonly goalState = this.store.goalState;
  readonly mealViews = this.store.mealViews;
  readonly mealsState = this.store.mealsState;

  ngOnInit(): void {
    combineLatest([this.route.paramMap.pipe(map(params => Number(params.get('userId')))), this.route.queryParamMap.pipe(map(params => params.get('date') ?? this.todayDate))])
      .pipe(
        distinctUntilChanged(([previousUserId, previousDate], [userId, date]) => previousUserId === userId && previousDate === date),
        tap(([userId, date]) => this.store.initialize(userId, date)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  dismissRefreshError(): void {
    this.store.dismissRefreshError();
  }
}
