import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';

import { emptyNutrientValues } from '../../../../shared/utils/nutrition.utils';
import { OverviewStore } from '../../data-access/overview.store';
import { OverviewPage } from './overview-page';

describe('OverviewPage', () => {
  const queryParamMap = new BehaviorSubject(convertToParamMap({ user: '2' }));
  const requestState = signal({ resolved: false, rejected: false, pending: true, err: null });
  const store = {
    today: new Date('2026-09-13T00:00:00Z'),
    users: signal([]),
    selectedUserId: signal(null),
    selectedUser: signal(undefined),
    mealSummaries: signal([]),
    dayTotals: signal(emptyNutrientValues()),
    calorieTarget: signal(null),
    caloriePercent: signal(null),
    calorieRemaining: signal(null),
    nutrients: signal([]),
    pageState: requestState,
    goalState: requestState,
    mealsState: requestState,
    initialize: vi.fn(),
    selectUser: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    queryParamMap.next(convertToParamMap({ user: '2' }));
    await TestBed.configureTestingModule({
      imports: [OverviewPage],
      providers: [
        { provide: OverviewStore, useValue: store },
        { provide: ActivatedRoute, useValue: { queryParamMap } },
      ],
    })
      .overrideComponent(OverviewPage, { set: { template: '' } })
      .compileComponents();
  });

  it('initializes and changes the selected user reactively from the URL', () => {
    const fixture = TestBed.createComponent(OverviewPage);
    fixture.detectChanges();

    expect(store.initialize).toHaveBeenCalledWith(2);

    queryParamMap.next(convertToParamMap({ user: '1' }));

    expect(store.selectUser).toHaveBeenCalledWith(1);
  });
});
