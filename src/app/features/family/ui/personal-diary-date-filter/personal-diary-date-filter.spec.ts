import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { vi } from 'vitest';

import { PersonalDiaryDateFilterComponent } from './personal-diary-date-filter';

describe('PersonalDiaryDateFilterComponent', () => {
  it('writes a selected date to the URL', () => {
    const route = {};
    const router = { navigate: vi.fn().mockResolvedValue(true) };
    TestBed.configureTestingModule({
      imports: [PersonalDiaryDateFilterComponent],
      providers: [
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: router },
      ],
    });
    const fixture = TestBed.createComponent(PersonalDiaryDateFilterComponent);
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
});
