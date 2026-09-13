import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { format } from 'date-fns';

import type { UserGoal } from '../../types/family.types';
import { recordsCountLabel } from '../../utils/family-labels.utils';

@Component({
  selector: 'app-goal-history',
  imports: [DatePipe, DecimalPipe, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './goal-history.html',
  styleUrl: './goal-history.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoalHistoryComponent {
  readonly goals = input.required<readonly UserGoal[]>();
  readonly currentGoalId = input<number | null>(null);
  readonly pendingIds = input<ReadonlySet<number>>(new Set<number>());
  readonly editRequested = output<UserGoal>();
  readonly recordsCountLabel = recordsCountLabel;

  goalStatusLabel(goal: UserGoal): string {
    if (this.currentGoalId() === goal.id) return 'Текущая';
    return goal.effective_from > format(new Date(), 'yyyy-MM-dd') ? 'Запланирована' : 'Завершена';
  }

  goalStatusClass(goal: UserGoal): string {
    if (this.currentGoalId() === goal.id) return 'current';
    return goal.effective_from > format(new Date(), 'yyyy-MM-dd') ? 'scheduled' : 'past';
  }
}
