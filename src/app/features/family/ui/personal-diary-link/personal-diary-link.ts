import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import type { FamilyUser } from '../../types/family.types';

@Component({
  selector: 'app-personal-diary-link',
  imports: [MatCardModule, MatIconModule, RouterLink],
  templateUrl: './personal-diary-link.html',
  styleUrl: './personal-diary-link.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonalDiaryLinkComponent {
  readonly user = input.required<FamilyUser>();
}
