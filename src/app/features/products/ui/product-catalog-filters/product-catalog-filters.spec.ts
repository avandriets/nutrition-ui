import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { ProductCatalogFiltersComponent } from './product-catalog-filters';

describe('ProductCatalogFiltersComponent', () => {
  const route = {
    queryParamMap: of(convertToParamMap({})),
    snapshot: { queryParamMap: convertToParamMap({}) },
  };
  const router = {
    navigate: vi.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    router.navigate.mockClear();

    await TestBed.configureTestingModule({
      imports: [ProductCatalogFiltersComponent],
      providers: [
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();
  });

  it('writes category and view mode to the URL', () => {
    const fixture = TestBed.createComponent(ProductCatalogFiltersComponent);

    fixture.componentInstance.setCategory('Fruit');
    fixture.componentInstance.setViewMode('table');

    expect(router.navigate).toHaveBeenNthCalledWith(1, [], {
      relativeTo: route,
      queryParams: { category: 'Fruit' },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    expect(router.navigate).toHaveBeenNthCalledWith(2, [], {
      relativeTo: route,
      queryParams: { view: 'table' },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });

  it('removes default filter values from the URL', () => {
    const fixture = TestBed.createComponent(ProductCatalogFiltersComponent);

    fixture.componentInstance.setCategory('all');
    fixture.componentInstance.setViewMode('cards');

    expect(router.navigate).toHaveBeenNthCalledWith(1, [], expect.objectContaining({ queryParams: { category: null } }));
    expect(router.navigate).toHaveBeenNthCalledWith(2, [], expect.objectContaining({ queryParams: { view: null } }));
  });
});
