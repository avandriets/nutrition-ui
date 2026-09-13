import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import type { UserMeasurement } from '../../types/family.types';
import { recordsCountLabel } from '../../utils/family-labels.utils';

@Component({
  selector: 'app-measurement-history',
  imports: [DatePipe, DecimalPipe, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './measurement-history.html',
  styleUrl: './measurement-history.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeasurementHistoryComponent {
  readonly measurements = input.required<readonly UserMeasurement[]>();
  readonly pendingIds = input<ReadonlySet<number>>(new Set<number>());
  readonly editRequested = output<UserMeasurement>();
  readonly deleteRequested = output<UserMeasurement>();
  readonly recordsCountLabel = recordsCountLabel;
}
