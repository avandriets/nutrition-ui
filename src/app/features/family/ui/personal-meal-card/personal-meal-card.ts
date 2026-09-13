import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { mealTypeIcon, mealTypeLabel } from '../../../../shared/utils/meal.utils';
import type { PersonalDiaryMealView } from '../../types/personal-diary-store.types';

@Component({
  selector: 'app-personal-meal-card',
  imports: [DecimalPipe, MatButtonModule, MatCardModule, MatIconModule, RouterLink],
  templateUrl: './personal-meal-card.html',
  styleUrl: './personal-meal-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonalMealCardComponent {
  readonly view = input.required<PersonalDiaryMealView>();
  readonly typeIcon = mealTypeIcon;
  readonly typeLabel = mealTypeLabel;
}
