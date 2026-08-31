import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize, switchMap } from 'rxjs';
import { AccountContextService } from '../../../core/account/account-context.service';
import { AccountBootstrapService } from '../../../core/account/account-bootstrap.service';
import { FamilyApiService } from '../data-access/family-api.service';
import {
  FamilyUser,
  GoalPayload,
  MeasurementPayload,
  UserGoal,
  UserMeasurement,
  UserPayload,
} from '../data-access/family.models';

@Injectable()
export class FamilyStore {
  private readonly api = inject(FamilyApiService);
  private readonly accountBootstrap = inject(AccountBootstrapService);
  private readonly accountContext = inject(AccountContextService);
  private readonly accountState = signal<{ id: number; name: string } | null>(null);
  private readonly usersState = signal<FamilyUser[]>([]);
  private readonly selectedUserIdState = signal<number | null>(null);
  private readonly goalsState = signal<UserGoal[]>([]);
  private readonly measurementsState = signal<UserMeasurement[]>([]);

  readonly account = this.accountState.asReadonly();
  readonly users = this.usersState.asReadonly();
  readonly selectedUserId = this.selectedUserIdState.asReadonly();
  readonly goals = this.goalsState.asReadonly();
  readonly currentGoal = computed(() => {
    const today = this.todayIsoDate();
    return this.goalsState().find((goal) => goal.effective_from <= today) ?? null;
  });
  readonly measurements = this.measurementsState.asReadonly();
  readonly latestMeasurement = computed(() => this.measurementsState()[0] ?? null);
  readonly loading = signal(true);
  readonly loadingMeasurements = signal(false);
  readonly loadingGoals = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedUser = computed(() =>
    this.usersState().find((user) => user.id === this.selectedUserIdState()),
  );

  initialize(): void {
    this.loading.set(true);
    this.error.set(null);
    this.accountBootstrap
      .ensureAccount()
      .pipe(
        switchMap((account) => {
          this.accountState.set(account);
          this.accountContext.setAccount(account);
          return this.api.listUsers(account.id);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (users) => {
          this.setUsers(users);
          const activeId = this.accountContext.activeUserId();
          this.selectUser(activeId ?? users[0]?.id ?? null);
        },
        error: () => this.error.set('Не удалось загрузить семейный аккаунт.'),
      });
  }

  selectUser(userId: number | null): void {
    this.selectedUserIdState.set(userId);
    this.goalsState.set([]);
    this.measurementsState.set([]);
    if (userId === null) return;
    this.accountContext.selectUser(userId);
    this.loadGoals(userId);
    this.loadMeasurements(userId);
  }

  createUser(payload: UserPayload): void {
    const account = this.accountState();
    if (!account) return;
    this.saving.set(true);
    this.api
      .createUser(account.id, payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (user) => {
          this.setUsers([...this.usersState(), user]);
          this.selectUser(user.id);
        },
        error: () => this.error.set('Не удалось добавить члена семьи.'),
      });
  }

  updateUser(userId: number, payload: UserPayload): void {
    const account = this.accountState();
    if (!account) return;
    this.saving.set(true);
    this.api
      .updateUser(account.id, userId, payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (updated) =>
          this.setUsers(this.usersState().map((user) => (user.id === updated.id ? updated : user))),
        error: () => this.error.set('Не удалось обновить профиль.'),
      });
  }

  deleteUser(userId: number): void {
    const account = this.accountState();
    if (!account) return;
    this.saving.set(true);
    this.api
      .deleteUser(account.id, userId)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          const users = this.usersState().filter((user) => user.id !== userId);
          this.setUsers(users);
          this.selectUser(users[0]?.id ?? null);
        },
        error: () => this.error.set('Не удалось удалить профиль.'),
      });
  }

  createGoal(payload: GoalPayload): void {
    const account = this.accountState();
    const user = this.selectedUser();
    if (!account || !user) return;
    this.saving.set(true);
    this.error.set(null);
    this.api
      .createGoal(account.id, user.id, payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (savedGoal) => this.setGoals([savedGoal, ...this.goalsState()]),
        error: () => this.error.set('Не удалось сохранить цель.'),
      });
  }

  updateGoal(goalId: number, payload: GoalPayload): void {
    const account = this.accountState();
    const user = this.selectedUser();
    if (!account || !user) return;

    this.saving.set(true);
    this.error.set(null);
    this.api
      .updateGoal(account.id, user.id, goalId, payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (updated) =>
          this.setGoals(this.goalsState().map((goal) => (goal.id === updated.id ? updated : goal))),
        error: () => this.error.set('Не удалось обновить цель.'),
      });
  }

  createMeasurement(payload: MeasurementPayload): void {
    const account = this.accountState();
    const user = this.selectedUser();
    if (!account || !user) return;

    this.saving.set(true);
    this.error.set(null);
    this.api
      .createMeasurement(account.id, user.id, payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (measurement) => this.setMeasurements([measurement, ...this.measurementsState()]),
        error: () => this.error.set('Не удалось добавить замер.'),
      });
  }

  updateMeasurement(measurementId: number, payload: MeasurementPayload): void {
    const account = this.accountState();
    const user = this.selectedUser();
    if (!account || !user) return;

    this.saving.set(true);
    this.error.set(null);
    this.api
      .updateMeasurement(account.id, user.id, measurementId, payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (updated) =>
          this.setMeasurements(
            this.measurementsState().map((measurement) =>
              measurement.id === updated.id ? updated : measurement,
            ),
          ),
        error: () => this.error.set('Не удалось обновить замер.'),
      });
  }

  deleteMeasurement(measurementId: number): void {
    const account = this.accountState();
    const user = this.selectedUser();
    if (!account || !user) return;

    this.saving.set(true);
    this.error.set(null);
    this.api
      .deleteMeasurement(account.id, user.id, measurementId)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () =>
          this.setMeasurements(
            this.measurementsState().filter((measurement) => measurement.id !== measurementId),
          ),
        error: () => this.error.set('Не удалось удалить замер.'),
      });
  }

  dismissError(): void {
    this.error.set(null);
  }

  private setUsers(users: FamilyUser[]): void {
    this.usersState.set(users);
    this.accountContext.setMembers(users);
  }

  private loadGoals(userId: number): void {
    const account = this.accountState();
    if (!account) return;

    this.loadingGoals.set(true);
    this.api
      .listGoals(account.id, userId)
      .pipe(
        finalize(() => {
          if (this.selectedUserIdState() === userId) this.loadingGoals.set(false);
        }),
      )
      .subscribe({
        next: (goals) => {
          if (this.selectedUserIdState() === userId) this.setGoals(goals);
        },
        error: () => {
          if (this.selectedUserIdState() === userId) {
            this.error.set('Не удалось загрузить историю целей пользователя.');
          }
        },
      });
  }

  private loadMeasurements(userId: number): void {
    const account = this.accountState();
    if (!account) return;

    this.loadingMeasurements.set(true);
    this.api
      .listMeasurements(account.id, userId)
      .pipe(
        finalize(() => {
          if (this.selectedUserIdState() === userId) this.loadingMeasurements.set(false);
        }),
      )
      .subscribe({
        next: (measurements) => {
          if (this.selectedUserIdState() === userId) this.setMeasurements(measurements);
        },
        error: () => {
          if (this.selectedUserIdState() === userId) {
            this.error.set('Не удалось загрузить историю замеров.');
          }
        },
      });
  }

  private setMeasurements(measurements: UserMeasurement[]): void {
    this.measurementsState.set(
      [...measurements].sort((left, right) => {
        const dateOrder = (right.measured_on ?? '').localeCompare(left.measured_on ?? '');
        return dateOrder || right.id - left.id;
      }),
    );
  }

  private setGoals(goals: UserGoal[]): void {
    this.goalsState.set(
      [...goals].sort(
        (left, right) =>
          right.effective_from.localeCompare(left.effective_from) || right.id - left.id,
      ),
    );
  }

  private todayIsoDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
