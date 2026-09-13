import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
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
