import { Component, inject, input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-meal-date-filter',
  templateUrl: './meal-date-filter.html',
  styleUrl: './meal-date-filter.scss',
})
export class MealDateFilterComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly date = input.required<string>();
  readonly todayDate = input.required<string>();

  setDate(date: string): void {
    this.updateQueryParam(date === this.todayDate() ? null : date);
  }

  private updateQueryParam(date: string | null): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { date },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
