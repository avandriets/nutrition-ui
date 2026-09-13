import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import type { UIState } from '../../../../shared/types';
import { UIStateContainerComponent } from '../../../../shared/ui/state-container/state-container';
import type { OverviewMealSummary } from '../../types/overview.types';
import { OverviewMealsTableComponent } from '../overview-meals-table/overview-meals-table';

@Component({
  selector: 'app-overview-meals-section',
  imports: [MatButtonModule, MatCardModule, MatIconModule, OverviewMealsTableComponent, RouterLink, UIStateContainerComponent],
  templateUrl: './overview-meals-section.html',
  styleUrl: './overview-meals-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewMealsSectionComponent {
  readonly state = input.required<UIState<string>>();
  readonly userName = input.required<string>();
  readonly summaries = input.required<readonly OverviewMealSummary[]>();
}
