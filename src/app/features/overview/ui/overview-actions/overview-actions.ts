import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import type { UserIdentity } from '../../../../shared/types';

@Component({
  selector: 'app-overview-actions',
  imports: [MatButtonModule, MatIconModule, MatSelectModule, RouterLink],
  templateUrl: './overview-actions.html',
  styleUrl: './overview-actions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewActionsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly users = input.required<readonly UserIdentity[]>();
  readonly selectedUserId = input<number | null>(null);

  selectUser(userId: number): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { user: userId },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
