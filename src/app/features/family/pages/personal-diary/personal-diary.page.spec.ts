import { signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';

import { emptyNutrientValues } from '../../../../shared/utils/nutrition.utils';
import { PersonalDiaryStore } from '../../data-access/personal-diary.store';
import { PersonalDiaryPage } from './personal-diary.page';

describe('PersonalDiaryPage', () => {
  let fixture: ComponentFixture<PersonalDiaryPage>;
  const paramMap = new BehaviorSubject(convertToParamMap({ userId: '1' }));
  const queryParamMap = new BehaviorSubject(convertToParamMap({ date: '2026-09-12' }));
  const store = {
    todayDate: '2026-09-13',
    user: signal(null),
    goal: signal(null),
    dayTotals: signal(emptyNutrientValues()),
    dateFilter: signal('2026-09-12'),
    refreshError: signal(null),
    pageState: signal({ resolved: false, rejected: false, pending: true, err: null }),
    goalState: signal({ resolved: false, rejected: false, pending: false, err: null }),
    mealViews: signal([]),
    mealsState: signal({ resolved: false, rejected: false, pending: false, err: null }),
    initialize: vi.fn(),
    dismissRefreshError: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    paramMap.next(convertToParamMap({ userId: '1' }));
    queryParamMap.next(convertToParamMap({ date: '2026-09-12' }));
    await TestBed.configureTestingModule({
      imports: [PersonalDiaryPage],
      providers: [provideRouter([]), { provide: PersonalDiaryStore, useValue: store }, { provide: ActivatedRoute, useValue: { paramMap, queryParamMap } }],
    }).compileComponents();
    fixture = TestBed.createComponent(PersonalDiaryPage);
    fixture.detectChanges();
  });

  it('reloads when either route user or query date changes', () => {
    expect(store.initialize).toHaveBeenCalledWith(1, '2026-09-12');

    queryParamMap.next(convertToParamMap({ date: '2026-09-11' }));
    paramMap.next(convertToParamMap({ userId: '2' }));

    expect(store.initialize).toHaveBeenNthCalledWith(2, 1, '2026-09-11');
    expect(store.initialize).toHaveBeenNthCalledWith(3, 2, '2026-09-11');
  });

  it('uses today when the date query parameter is absent', () => {
    queryParamMap.next(convertToParamMap({}));

    expect(store.initialize).toHaveBeenLastCalledWith(1, store.todayDate);
  });
});
