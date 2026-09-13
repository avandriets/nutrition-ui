import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import type { UIState } from '../../../../shared/types';
import { UIStateContainerComponent } from '../../../../shared/ui/state-container/state-container';
import type { UserMeasurement } from '../../types/family.types';
import { MeasurementHistoryComponent } from '../measurement-history/measurement-history';
import { MeasurementSummaryComponent } from '../measurement-summary/measurement-summary';

@Component({
  selector: 'app-family-measurements-section',
  imports: [MatButtonModule, MatCardModule, MatIconModule, MeasurementHistoryComponent, MeasurementSummaryComponent, UIStateContainerComponent],
  templateUrl: './family-measurements-section.html',
  styleUrl: './family-measurements-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FamilyMeasurementsSectionComponent {
  readonly state = input.required<UIState<string>>();
  readonly measurements = input.required<readonly UserMeasurement[]>();
  readonly createPending = input(false);
  readonly pendingIds = input<ReadonlySet<number>>(new Set<number>());
  readonly addRequested = output<void>();
  readonly editRequested = output<UserMeasurement>();
  readonly deleteRequested = output<UserMeasurement>();
  readonly latestMeasurement = computed(() => this.measurements()[0]);
}
