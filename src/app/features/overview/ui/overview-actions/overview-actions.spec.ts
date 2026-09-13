import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { vi } from 'vitest';

import { OverviewActionsComponent } from './overview-actions';

describe('OverviewActionsComponent', () => {
  it('writes the selected user to the URL', () => {
    const route = {};
    const router = { navigate: vi.fn().mockResolvedValue(true) };
    TestBed.configureTestingModule({
      imports: [OverviewActionsComponent],
      providers: [
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: router },
      ],
    });
    const fixture = TestBed.createComponent(OverviewActionsComponent);

    fixture.componentInstance.selectUser(2);

    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: route,
      queryParams: { user: 2 },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });
});
