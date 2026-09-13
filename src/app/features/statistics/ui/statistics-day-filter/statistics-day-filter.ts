import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { addDays, format, parseISO } from 'date-fns';

@Component({
  selector: 'app-statistics-day-filter',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './statistics-day-filter.html',
  styleUrl: './statistics-day-filter.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatisticsDayFilterComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly day = input.required<string>();
  readonly today = input.required<string>();

  setDay(day: string): void {
    if (!day) return;
    const normalized = day > this.today() ? this.today() : day;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { day: normalized === this.today() ? null : normalized },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  shiftDay(offset: number): void {
    this.setDay(format(addDays(parseISO(this.day()), offset), 'yyyy-MM-dd'));
  }
}
