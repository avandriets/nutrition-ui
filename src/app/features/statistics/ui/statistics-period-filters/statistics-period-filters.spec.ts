import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { vi } from 'vitest';

import { StatisticsPeriodFiltersComponent } from './statistics-period-filters';

describe('StatisticsPeriodFiltersComponent', () => {
  it('writes period options to the URL', () => {
    const route = {};
    const router = { navigate: vi.fn().mockResolvedValue(true) };
    TestBed.configureTestingModule({
      imports: [StatisticsPeriodFiltersComponent],
      providers: [
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: router },
      ],
    });
    const fixture = TestBed.createComponent(StatisticsPeriodFiltersComponent);
    fixture.componentRef.setInput('dateFrom', '2026-08-15');
    fixture.componentRef.setInput('dateTo', '2026-09-13');
    fixture.componentRef.setInput('today', '2026-09-13');
    fixture.componentRef.setInput('granularity', 'day');

    fixture.componentInstance.updateGranularity('week');
    fixture.componentInstance.updateIncludeEmptyDays(true);

    expect(router.navigate).toHaveBeenNthCalledWith(1, [], {
      relativeTo: route,
      queryParams: { granularity: 'week' },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    expect(router.navigate).toHaveBeenNthCalledWith(2, [], {
      relativeTo: route,
      queryParams: { empty: 'true' },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });
});
