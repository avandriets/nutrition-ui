import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import type { UserMeasurement } from '../../types/family.types';

@Component({
  selector: 'app-measurement-summary',
  imports: [DatePipe, DecimalPipe, MatCardModule, MatIconModule],
  templateUrl: './measurement-summary.html',
  styleUrl: './measurement-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeasurementSummaryComponent {
  readonly measurement = input.required<UserMeasurement>();
}
