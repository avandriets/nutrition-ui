import { computed, inject, Injectable, signal } from '@angular/core';
import { format } from 'date-fns';
import type { Observable } from 'rxjs';
import { catchError, EMPTY, finalize, switchMap, tap } from 'rxjs';

import { AccountBootstrapService } from '../../../core/account/account-bootstrap.service';
import { AccountContextStore } from '../../../core/account/account-context.store';
import type { UIStateStatus } from '../../../shared/types';
import type { FamilyUser, GoalPayload, MeasurementPayload, UserPayload } from '../types/family.types';
import { FamilyUsersStore } from './family-users.store';
import { UserGoalsStore } from './user-goals.store';
import { UserMeasurementsStore } from './user-measurements.store';

@Injectable()
export class FamilyStore {
  private readonly accountBootstrap = inject(AccountBootstrapService);
  private readonly accountContext = inject(AccountContextStore);
  private readonly usersStore = inject(FamilyUsersStore);
  private readonly goalsStore = inject(UserGoalsStore);
  private readonly measurementsStore = inject(UserMeasurementsStore);
  private readonly initializing = signal(true);
  private readonly initializationError = signal<string | null>(null);

  readonly account = this.accountContext.account;
  readonly users = this.usersStore.entities;
  readonly selectedUserId = this.accountContext.activeUserId;
  readonly goals = this.goalsStore.entities;
  readonly measurements = this.measurementsStore.entities;
  readonly selectedUser = computed(() => this.users().find(user => user.id === this.selectedUserId()));
  readonly currentGoal = computed(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return this.goals().find(goal => goal.effective_from <= today) ?? null;
  });
  readonly latestMeasurement = computed(() => this.measurements()[0] ?? null);
  readonly loading = computed(() => this.initializing() || this.usersStore.loading());
  readonly goalCreatePending = computed(() => Object.values(this.goalsStore.createOperations()).some(operation => operation.status === 'pending'));
  readonly measurementCreatePending = computed(() => Object.values(this.measurementsStore.createOperations()).some(operation => operation.status === 'pending'));
  readonly pendingGoalIds = computed<ReadonlySet<number>>(
    () =>
      new Set(
        Object.entries(this.goalsStore.entityOperations())
          .filter(([, operation]) => operation.status === 'pending' && operation.type !== 'getById')
          .map(([id]) => Number(id)),
      ),
  );
  readonly pendingMeasurementIds = computed<ReadonlySet<number>>(
    () =>
      new Set(
        Object.entries(this.measurementsStore.entityOperations())
          .filter(([, operation]) => operation.status === 'pending' && operation.type !== 'getById')
          .map(([id]) => Number(id)),
      ),
  );
  readonly goalsState = computed<UIStateStatus<string>>(() => {
    const state = this.goalsStore.entityState();
    return { ...state, pending: state.pending || this.goalsStore.saving() };
  });
  readonly measurementsState = computed<UIStateStatus<string>>(() => {
    const state = this.measurementsStore.entityState();
    return { ...state, pending: state.pending || this.measurementsStore.saving() };
  });
  readonly activeGoalState = computed<UIStateStatus<string>>(() => {
    const error = this.goalsStore.error();

    return {
      resolved: this.goalsStore.loaded() && !error,
      rejected: !!error,
      pending: this.goalsStore.loading(),
      err: error,
      empty: this.goalsStore.loaded() && !error && !this.currentGoal(),
    };
  });
  readonly loadError = computed(() => this.initializationError() ?? this.usersStore.error());
  readonly actionError = computed(() => this.usersStore.actionError() ?? this.goalsStore.actionError() ?? this.measurementsStore.actionError());
  readonly state = computed<UIStateStatus<string>>(() => {
    const error = this.loadError();
    const usersLoaded = this.usersStore.loaded();

    return {
      resolved: usersLoaded && !error,
      rejected: !!error,
      pending: this.loading(),
      err: error,
      empty: usersLoaded && !error && !this.users().length,
    };
  });
  readonly selectedUserState = computed<UIStateStatus<string>>(() => {
    const pageState = this.state();

    return {
      ...pageState,
      empty: pageState.resolved && !this.selectedUser(),
    };
  });

  initialize(preferredUserId: number | null = this.selectedUserId()): void {
    this.initializing.set(true);
    this.initializationError.set(null);
    this.dismissError();
    this.accountBootstrap
      .ensureAccount()
      .pipe(
        tap(account => this.accountContext.setAccount(account)),
        switchMap(() => this.usersStore.load(undefined)),
        tap(() => {
          this.syncMembers();
          const selectedUserId = this.users().some(user => user.id === preferredUserId) ? preferredUserId : (this.selectedUserId() ?? this.users()[0]?.id ?? null);
          this.selectUser(selectedUserId);
        }),
        catchError(() => {
          this.initializationError.set('Could not load the family account.');
          return EMPTY;
        }),
        finalize(() => this.initializing.set(false)),
      )
      .subscribe();
  }

  selectUser(userId: number | null): void {
    this.goalsStore.reset();
    this.measurementsStore.reset();
    if (userId === null) return;

    this.accountContext.selectUser(userId);
    this.goalsStore.load({ userId }).subscribe();
    this.measurementsStore.load({ userId }).subscribe();
  }

  createUser(payload: UserPayload): Observable<FamilyUser> {
    return this.usersStore.create(payload).pipe(tap(() => this.syncMembers()));
  }

  updateUser(userId: number, payload: UserPayload): void {
    this.usersStore
      .update({ id: userId, payload })
      .pipe(tap(() => this.syncMembers()))
      .subscribe();
  }

  deleteUser(userId: number): void {
    this.usersStore
      .remove(userId)
      .pipe(
        tap(() => {
          this.syncMembers();
          this.loadSelectedUserData();
        }),
      )
      .subscribe();
  }

  createGoal(payload: GoalPayload): void {
    this.goalsStore.create(payload).subscribe();
  }

  updateGoal(goalId: number, payload: GoalPayload): void {
    this.goalsStore.update({ id: goalId, payload }).subscribe();
  }

  createMeasurement(payload: MeasurementPayload): void {
    this.measurementsStore.create(payload).subscribe();
  }

  updateMeasurement(measurementId: number, payload: MeasurementPayload): void {
    this.measurementsStore.update({ id: measurementId, payload }).subscribe();
  }

  deleteMeasurement(measurementId: number): void {
    this.measurementsStore.remove(measurementId).subscribe();
  }

  dismissError(): void {
    this.initializationError.set(null);
    this.usersStore.dismissError();
    this.goalsStore.dismissError();
    this.measurementsStore.dismissError();
  }

  dismissActionError(): void {
    this.usersStore.dismissActionError();
    this.goalsStore.dismissActionError();
    this.measurementsStore.dismissActionError();
  }

  private syncMembers(): void {
    this.accountContext.setMembers(this.users());
  }

  private loadSelectedUserData(): void {
    this.goalsStore.reset();
    this.measurementsStore.reset();
    const userId = this.selectedUserId();
    if (userId === null) return;

    this.goalsStore.load({ userId }).subscribe();
    this.measurementsStore.load({ userId }).subscribe();
  }
}
