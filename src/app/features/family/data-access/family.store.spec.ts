import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';

import { AccountBootstrapService } from '../../../core/account/account-bootstrap.service';
import { AccountContextStore } from '../../../core/account/account-context.store';
import type { FamilyUser, UserGoal, UserMeasurement } from '../types/family.types';
import { FamilyStore } from './family.store';
import { FamilyApiService } from './family-api.service';
import { FamilyUsersStore } from './family-users.store';
import { UserGoalsStore } from './user-goals.store';
import { UserMeasurementsStore } from './user-measurements.store';

describe('FamilyStore', () => {
  const account = { id: 10, name: 'Семья' };
  const user: FamilyUser = {
    id: 1,
    account_id: account.id,
    name: 'Александр',
    birth_date: null,
    height_cm: 180,
    created_at: '2026-09-12T00:00:00Z',
    updated_at: '2026-09-12T00:00:00Z',
  };
  const goal: UserGoal = {
    id: 2,
    user_id: user.id,
    effective_from: '2026-09-01',
    daily_calories_kcal: 2_000,
    daily_protein_g: 120,
    daily_fiber_g: 30,
    created_at: '2026-09-12T00:00:00Z',
    updated_at: '2026-09-12T00:00:00Z',
  };
  const measurement: UserMeasurement = {
    id: 3,
    user_id: user.id,
    measured_on: '2026-09-12',
    weight_kg: 80,
    created_at: '2026-09-12T00:00:00Z',
    updated_at: '2026-09-12T00:00:00Z',
  };
  const accountBootstrap = {
    ensureAccount: vi.fn(() => of(account)),
  };
  const api = {
    listUsers: vi.fn(() => of([user])),
    createUser: vi.fn(() => of(user)),
    updateUser: vi.fn(() => of(user)),
    deleteUser: vi.fn(() => of(undefined)),
    listGoals: vi.fn(() => of([goal])),
    createGoal: vi.fn(() => of(goal)),
    updateGoal: vi.fn(() => of(goal)),
    listMeasurements: vi.fn(() => of([measurement])),
    createMeasurement: vi.fn(() => of(measurement)),
    updateMeasurement: vi.fn(() => of(measurement)),
    deleteMeasurement: vi.fn(() => of(undefined)),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    api.listUsers.mockReturnValue(of([user]));
    api.listGoals.mockReturnValue(of([goal]));
    api.listMeasurements.mockReturnValue(of([measurement]));

    TestBed.configureTestingModule({
      providers: [
        AccountContextStore,
        FamilyUsersStore,
        UserGoalsStore,
        UserMeasurementsStore,
        FamilyStore,
        { provide: AccountBootstrapService, useValue: accountBootstrap },
        { provide: FamilyApiService, useValue: api },
      ],
    });
  });

  it('loads users and then cascades goals and measurements for the selected user', () => {
    const store = TestBed.inject(FamilyStore);

    store.initialize();

    expect(store.account()).toEqual(account);
    expect(store.users()).toEqual([user]);
    expect(store.selectedUser()).toEqual(user);
    expect(store.goals()).toEqual([goal]);
    expect(store.measurements()).toEqual([measurement]);
    expect(store.currentGoal()).toEqual(goal);
    expect(store.latestMeasurement()).toEqual(measurement);
    expect(api.listUsers).toHaveBeenCalledWith(account.id);
    expect(api.listGoals).toHaveBeenCalledWith(account.id, user.id);
    expect(api.listMeasurements).toHaveBeenCalledWith(account.id, user.id);
    expect(store.loading()).toBe(false);
    expect(store.state()).toEqual({
      resolved: true,
      rejected: false,
      pending: false,
      err: null,
      empty: false,
    });
  });

  it('uses the container empty state when the family has no members', () => {
    api.listUsers.mockReturnValue(of([]));
    const store = TestBed.inject(FamilyStore);

    store.initialize();

    expect(store.state()).toEqual({
      resolved: true,
      rejected: false,
      pending: false,
      err: null,
      empty: true,
    });
  });

  it('keeps goal and measurement empty states independent from the page state', () => {
    api.listGoals.mockReturnValue(of([]));
    api.listMeasurements.mockReturnValue(of([]));
    const store = TestBed.inject(FamilyStore);

    store.initialize();

    expect(store.state().empty).toBe(false);
    expect(store.goalsState().empty).toBe(true);
    expect(store.activeGoalState().empty).toBe(true);
    expect(store.measurementsState().empty).toBe(true);
  });

  it('exposes background progress and pending ids for individual entity operations', () => {
    const response = new Subject<UserMeasurement>();
    api.updateMeasurement.mockReturnValueOnce(response);
    const store = TestBed.inject(FamilyStore);
    store.initialize();

    store.updateMeasurement(measurement.id, {
      measured_on: measurement.measured_on!,
      weight_kg: 81,
      neck_cm: null,
      waist_cm: null,
      hips_cm: null,
    });

    expect(store.measurementsState().pending).toBe(true);
    expect(store.pendingMeasurementIds().has(measurement.id)).toBe(true);

    response.next({ ...measurement, weight_kg: 81 });
    response.complete();

    expect(store.measurementsState().pending).toBe(false);
    expect(store.pendingMeasurementIds().has(measurement.id)).toBe(false);
  });

  it('selects the user requested by the route', () => {
    const requestedUser = { ...user, id: 4, name: 'Мария' };
    api.listUsers.mockReturnValue(of([user, requestedUser]));
    const store = TestBed.inject(FamilyStore);

    store.initialize(requestedUser.id);

    expect(store.selectedUser()).toEqual(requestedUser);
    expect(api.listGoals).toHaveBeenCalledWith(account.id, requestedUser.id);
    expect(api.listMeasurements).toHaveBeenCalledWith(account.id, requestedUser.id);
  });

  it('keeps entity mutations in the specialized stores and synchronizes the account context', () => {
    const store = TestBed.inject(FamilyStore);
    const context = TestBed.inject(AccountContextStore);
    store.initialize();

    store.updateUser(user.id, { name: 'Новое имя', birth_date: null, height_cm: 181 });

    expect(api.updateUser).toHaveBeenCalledWith(account.id, user.id, {
      name: 'Новое имя',
      birth_date: null,
      height_cm: 181,
    });
    expect(context.members()).toEqual([user]);

    store.deleteMeasurement(measurement.id);
    expect(api.deleteMeasurement).toHaveBeenCalledWith(account.id, user.id, measurement.id);
    expect(store.measurements()).toEqual([]);
  });
});
