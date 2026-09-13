import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import type { UserGoal } from '../../types/family.types';

@Component({
  selector: 'app-goal-summary',
  imports: [DatePipe, DecimalPipe, MatCardModule, MatIconModule],
  templateUrl: './goal-summary.html',
  styleUrl: './goal-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoalSummaryComponent {
  readonly goal = input.required<UserGoal>();
}
