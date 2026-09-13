import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-personal-diary-date-filter',
  templateUrl: './personal-diary-date-filter.html',
  styleUrl: './personal-diary-date-filter.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonalDiaryDateFilterComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly date = input.required<string>();
  readonly todayDate = input.required<string>();

  setDate(date: string): void {
    if (!date) return;

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { date: date === this.todayDate() ? null : date },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
