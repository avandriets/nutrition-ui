import { TestBed } from '@angular/core/testing';
import { convertToParamMap } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';

import { ProductSearchComponent } from './product-search';

describe('ProductSearchComponent', () => {
  const queryParamMap = new BehaviorSubject(convertToParamMap({ search: 'молоко' }));
  const route = {
    queryParamMap,
    snapshot: { queryParamMap: queryParamMap.value },
  };
  const router = {
    navigate: vi.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    queryParamMap.next(convertToParamMap({ search: 'молоко' }));
    route.snapshot.queryParamMap = queryParamMap.value;
    router.navigate.mockClear();

    await TestBed.configureTestingModule({
      imports: [ProductSearchComponent],
      providers: [
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();
  });

  it('writes the search value to the URL after typing stops', async () => {
    vi.useFakeTimers();

    try {
      const fixture = TestBed.createComponent(ProductSearchComponent);
      fixture.detectChanges();

      fixture.componentInstance.searchControl.setValue('  яблоко  ');
      await vi.advanceTimersByTimeAsync(300);

      expect(router.navigate).toHaveBeenCalledWith([], {
        relativeTo: route,
        queryParams: { search: 'яблоко' },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('synchronizes the field when the URL changes', () => {
    const fixture = TestBed.createComponent(ProductSearchComponent);
    fixture.detectChanges();

    queryParamMap.next(convertToParamMap({ search: 'банан' }));
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('банан');
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
