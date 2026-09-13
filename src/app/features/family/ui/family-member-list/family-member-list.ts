import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';

import { initials } from '../../../../shared/utils/name.utils';
import type { FamilyUser } from '../../types/family.types';

@Component({
  selector: 'app-family-member-list',
  imports: [DatePipe, DecimalPipe, MatCardModule, MatIconModule],
  templateUrl: './family-member-list.html',
  styleUrl: './family-member-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FamilyMemberListComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly users = input.required<readonly FamilyUser[]>();
  readonly selectedUserId = input<number | null>(null);
  readonly initials = initials;

  selectUser(userId: number): void {
    if (userId === this.selectedUserId()) return;

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { user: userId },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
