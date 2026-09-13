import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { vi } from 'vitest';

import { StatisticsDayFilterComponent } from './statistics-day-filter';

describe('StatisticsDayFilterComponent', () => {
  it('writes the selected day to the URL', () => {
    const route = {};
    const router = { navigate: vi.fn().mockResolvedValue(true) };
    TestBed.configureTestingModule({
      imports: [StatisticsDayFilterComponent],
      providers: [
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: router },
      ],
    });
    const fixture = TestBed.createComponent(StatisticsDayFilterComponent);
    fixture.componentRef.setInput('day', '2026-09-12');
    fixture.componentRef.setInput('today', '2026-09-13');

    fixture.componentInstance.shiftDay(-1);

    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: route,
      queryParams: { day: '2026-09-11' },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });
});
