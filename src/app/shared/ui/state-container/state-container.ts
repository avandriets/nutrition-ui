import { NgTemplateOutlet } from '@angular/common';
import type { TemplateRef } from '@angular/core';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import type { UIState, UIStateStatus } from '../../types/state-container.types';

const DEFAULT_STATUS: UIStateStatus = {
  resolved: false,
  rejected: false,
  pending: true,
  err: null,
};

@Component({
  selector: 'app-ui-state-container',
  imports: [MatProgressBarModule, MatProgressSpinnerModule, NgTemplateOutlet],
  templateUrl: './state-container.html',
  styleUrl: './state-container.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-state-container',
    '[style.min-height]': 'height()',
  },
})
export class UIStateContainerComponent {
  readonly state = input<UIState>();
  readonly height = input('200px');
  readonly resolved = input<TemplateRef<unknown>>();
  readonly empty = input<TemplateRef<unknown>>();
  readonly rejected = input<TemplateRef<unknown>>();
  readonly pending = input<TemplateRef<unknown>>();
  readonly updating = input<TemplateRef<unknown>>();

  private readonly statuses = computed<readonly UIStateStatus[]>(() => {
    const state = this.state();

    if (!state) return [DEFAULT_STATUS];
    if (Array.isArray(state)) return state;
    if ('resolved' in state && 'rejected' in state && 'pending' in state) return [state as UIStateStatus];

    return Object.values(state);
  });

  private readonly allResolved = computed(() => this.statuses().every(status => status.resolved));

  readonly showRejected = computed(() => this.statuses().some(status => status.rejected));
  readonly showEmpty = computed(() => !this.showRejected() && this.allResolved() && this.statuses().some(status => status.empty));
  readonly showResolved = computed(() => this.allResolved() && !this.showEmpty());
  readonly showUpdating = computed(() => !this.showRejected() && this.allResolved() && this.statuses().some(status => status.pending));
  readonly showPending = computed(() => !this.showRejected() && !this.allResolved() && this.statuses().some(status => status.pending));
  readonly errorMessage = computed(() => {
    const error = this.statuses().find(status => status.rejected)?.err;

    if (error instanceof Error) return error.message;
    if (typeof error === 'string' && error) return error;

    return 'Не удалось загрузить данные.';
  });
}
