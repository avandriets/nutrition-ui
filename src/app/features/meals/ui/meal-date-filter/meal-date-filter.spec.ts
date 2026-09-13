import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { vi } from 'vitest';

import { MealDateFilterComponent } from './meal-date-filter';

describe('MealDateFilterComponent', () => {
  const route = {};
  const router = {
    navigate: vi.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    router.navigate.mockClear();

    await TestBed.configureTestingModule({
      imports: [MealDateFilterComponent],
      providers: [
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();
  });

  it('writes a selected date to the URL', () => {
    const fixture = TestBed.createComponent(MealDateFilterComponent);
    fixture.componentRef.setInput('date', '2026-09-12');
    fixture.componentRef.setInput('todayDate', '2026-09-13');

    fixture.componentInstance.setDate('2026-09-11');

    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: route,
      queryParams: { date: '2026-09-11' },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });

  it('removes today from the URL because it is the default', () => {
    const fixture = TestBed.createComponent(MealDateFilterComponent);
    fixture.componentRef.setInput('date', '2026-09-12');
    fixture.componentRef.setInput('todayDate', '2026-09-13');

    fixture.componentInstance.setDate('2026-09-13');

    expect(router.navigate).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: { date: null } }));
  });
});
