import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { initials } from '../../../../shared/utils/name.utils';
import type { FamilyUser } from '../../types/family.types';

@Component({
  selector: 'app-personal-diary-heading',
  templateUrl: './personal-diary-heading.html',
  styleUrl: './personal-diary-heading.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonalDiaryHeadingComponent {
  readonly user = input<FamilyUser | null>(null);
  readonly initials = initials;
}
