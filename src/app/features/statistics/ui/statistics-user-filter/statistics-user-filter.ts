import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';

import type { UserIdentity } from '../../../../shared/types';

@Component({
  selector: 'app-statistics-user-filter',
  imports: [MatIconModule, MatSelectModule],
  templateUrl: './statistics-user-filter.html',
  styleUrl: './statistics-user-filter.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatisticsUserFilterComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly users = input.required<readonly UserIdentity[]>();
  readonly selectedUserId = input<number | null>(null);

  selectUser(userId: number | null): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { user: userId },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
