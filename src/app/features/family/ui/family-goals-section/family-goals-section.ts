import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import type { UIState } from '../../../../shared/types';
import { UIStateContainerComponent } from '../../../../shared/ui/state-container/state-container';
import type { UserGoal } from '../../types/family.types';
import { GoalHistoryComponent } from '../goal-history/goal-history';
import { GoalSummaryComponent } from '../goal-summary/goal-summary';

@Component({
  selector: 'app-family-goals-section',
  imports: [GoalHistoryComponent, GoalSummaryComponent, MatButtonModule, MatCardModule, MatIconModule, UIStateContainerComponent],
  templateUrl: './family-goals-section.html',
  styleUrl: './family-goals-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FamilyGoalsSectionComponent {
  readonly state = input.required<UIState<string>>();
  readonly activeGoalState = input.required<UIState<string>>();
  readonly goals = input.required<readonly UserGoal[]>();
  readonly currentGoal = input<UserGoal | null>(null);
  readonly createPending = input(false);
  readonly pendingIds = input<ReadonlySet<number>>(new Set<number>());
  readonly addRequested = output<void>();
  readonly editRequested = output<UserGoal>();
}
