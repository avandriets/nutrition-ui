import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { UserIdentity } from '../../../../shared/types';

@Component({
  selector: 'app-overview-heading',
  imports: [DatePipe],
  templateUrl: './overview-heading.html',
  styleUrl: './overview-heading.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewHeadingComponent {
  readonly today = input.required<Date>();
  readonly user = input<UserIdentity | null>();
}
