import { computed, inject, Injectable, signal } from '@angular/core';
import { format } from 'date-fns';
import { finalize, switchMap, tap } from 'rxjs';

import { AccountBootstrapService } from '../../../core/account/account-bootstrap.service';
import { AccountContextStore } from '../../../core/account/account-context.store';
import type { GoalPayload, MeasurementPayload, UserPayload } from '../types/family.types';
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
  readonly loadingGoals = this.goalsStore.loading;
  readonly loadingMeasurements = this.measurementsStore.loading;
  readonly saving = computed(() => this.usersStore.saving() || this.goalsStore.saving() || this.measurementsStore.saving());
  readonly error = computed(
    () =>
      this.usersStore.error() ??
      this.usersStore.actionError() ??
      this.goalsStore.error() ??
      this.goalsStore.actionError() ??
      this.measurementsStore.error() ??
      this.measurementsStore.actionError(),
  );

  initialize(): void {
    this.initializing.set(true);
    this.dismissError();
    this.accountBootstrap
      .ensureAccount()
      .pipe(
        tap(account => this.accountContext.setAccount(account)),
        switchMap(() => this.usersStore.load(undefined)),
        tap(() => {
          this.syncMembers();
          this.selectUser(this.selectedUserId() ?? this.users()[0]?.id ?? null);
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

  createUser(payload: UserPayload): void {
    this.usersStore
      .create(payload)
      .pipe(
        tap(user => {
          this.syncMembers();
          this.selectUser(user.id);
        }),
      )
      .subscribe();
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
    this.usersStore.dismissError();
    this.goalsStore.dismissError();
    this.measurementsStore.dismissError();
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
