import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { initials } from '../../../../shared/utils/name.utils';
import type { FamilyUser } from '../../types/family.types';

@Component({
  selector: 'app-family-member-profile',
  imports: [DatePipe, DecimalPipe, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './family-member-profile.html',
  styleUrl: './family-member-profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FamilyMemberProfileComponent {
  readonly user = input.required<FamilyUser>();
  readonly editRequested = output<FamilyUser>();
  readonly deleteRequested = output<FamilyUser>();
  readonly initials = initials;
}
