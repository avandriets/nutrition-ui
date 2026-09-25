import { TestBed } from '@angular/core/testing';
import { convertToParamMap } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';

import { ProductSearchComponent } from './product-search';

describe('ProductSearchComponent', () => {
  const queryParamMap = new BehaviorSubject(convertToParamMap({ search: 'milk' }));
  const route = {
    queryParamMap,
    snapshot: { queryParamMap: queryParamMap.value },
  };
  const router = {
    navigate: vi.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    queryParamMap.next(convertToParamMap({ search: 'milk' }));
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

      fixture.componentInstance.searchControl.setValue('  apple  ');
      await vi.advanceTimersByTimeAsync(300);

      expect(router.navigate).toHaveBeenCalledWith([], {
        relativeTo: route,
        queryParams: { search: 'apple' },
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

    queryParamMap.next(convertToParamMap({ search: 'banana' }));
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('banana');
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
