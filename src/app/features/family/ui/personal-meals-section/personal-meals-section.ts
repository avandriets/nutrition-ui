import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import type { UIState } from '../../../../shared/types';
import { UIStateContainerComponent } from '../../../../shared/ui/state-container/state-container';
import type { PersonalDiaryMealView } from '../../types/personal-diary-store.types';
import { PersonalMealCardComponent } from '../personal-meal-card/personal-meal-card';

@Component({
  selector: 'app-personal-meals-section',
  imports: [MatButtonModule, MatCardModule, MatIconModule, PersonalMealCardComponent, RouterLink, UIStateContainerComponent],
  templateUrl: './personal-meals-section.html',
  styleUrl: './personal-meals-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonalMealsSectionComponent {
  readonly state = input.required<UIState<string>>();
  readonly userName = input.required<string>();
  readonly mealViews = input.required<readonly PersonalDiaryMealView[]>();
}
