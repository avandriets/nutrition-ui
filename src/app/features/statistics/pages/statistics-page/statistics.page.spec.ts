import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';

import { StatisticsStore } from '../../data-access/statistics.store';
import { StatisticsPage } from './statistics.page';

describe('StatisticsPage', () => {
  const queryParamMap = new BehaviorSubject(
    convertToParamMap({ user: '2', day: '2026-09-12', from: '2026-08-01', to: '2026-09-12', granularity: 'week', empty: 'true', metric: 'protein_g' }),
  );
  const requestState = signal({ resolved: false, rejected: false, pending: true, err: null });
  const store = {
    today: '2026-09-13',
    defaultDateFrom: '2026-08-15',
    users: signal([]),
    selectedUserId: signal(null),
    selectedDay: signal('2026-09-13'),
    dateFrom: signal('2026-08-15'),
    dateTo: signal('2026-09-13'),
    granularity: signal('day'),
    includeEmptyDays: signal(false),
    selectedMetric: signal('calories_kcal'),
    selectedUserName: signal('Whole family'),
    dailyReports: signal([]),
    averageReports: signal([]),
    timelineReports: signal([]),
    initialState: requestState,
    dailyState: requestState,
    periodState: requestState,
    dailyError: signal(null),
    periodError: signal(null),
    initialize: vi.fn(),
    applyFilters: vi.fn(),
    dismissDailyError: vi.fn(),
    dismissPeriodError: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    queryParamMap.next(convertToParamMap({ user: '2', day: '2026-09-12', from: '2026-08-01', to: '2026-09-12', granularity: 'week', empty: 'true', metric: 'protein_g' }));
    await TestBed.configureTestingModule({
      imports: [StatisticsPage],
      providers: [
        { provide: StatisticsStore, useValue: store },
        { provide: ActivatedRoute, useValue: { queryParamMap } },
      ],
    })
      .overrideComponent(StatisticsPage, { set: { template: '' } })
      .compileComponents();
  });

  it('initializes from URL and applies subsequent URL changes', () => {
    const fixture = TestBed.createComponent(StatisticsPage);
    fixture.detectChanges();

    expect(store.initialize).toHaveBeenCalledWith({
      userId: 2,
      day: '2026-09-12',
      dateFrom: '2026-08-01',
      dateTo: '2026-09-12',
      granularity: 'week',
      includeEmptyDays: true,
      metric: 'protein_g',
    });

    queryParamMap.next(convertToParamMap({ metric: 'fiber_g' }));

    expect(store.applyFilters).toHaveBeenCalledWith({
      userId: null,
      day: store.today,
      dateFrom: store.defaultDateFrom,
      dateTo: store.today,
      granularity: 'day',
      includeEmptyDays: false,
      metric: 'fiber_g',
    });
  });
});
