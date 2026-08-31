import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, effect, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  FamilyUser,
  GoalPayload,
  MeasurementPayload,
  UserGoal,
  UserMeasurement,
  UserPayload,
} from '../../data-access/family.models';
import { FamilyStore } from '../../state/family.store';
import { ConfirmDialog } from '../../ui/confirm-dialog/confirm-dialog';
import { GoalFormDialog, GoalFormDialogData } from '../../ui/goal-form-dialog/goal-form-dialog';
import {
  MeasurementDeleteDialog,
  MeasurementDeleteDialogData,
} from '../../ui/measurement-delete-dialog/measurement-delete-dialog';
import { MeasurementFormDialog } from '../../ui/measurement-form-dialog/measurement-form-dialog';
import { MemberFormDialog } from '../../ui/member-form-dialog/member-form-dialog';

@Component({
  selector: 'app-family-members-page',
  imports: [
    DatePipe,
    DecimalPipe,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './family-members.page.html',
  styleUrl: './family-members.page.scss',
})
export class FamilyMembersPage implements OnInit {
  protected readonly store = inject(FamilyStore);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private goalDialogRequested = this.route.snapshot.queryParamMap.get('editGoal') === 'true';
  private readonly openRequestedGoalDialog = effect(() => {
    const user = this.store.selectedUser();
    if (!this.goalDialogRequested || this.store.loading() || !user) return;

    this.goalDialogRequested = false;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { editGoal: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    this.addGoal();
  });

  ngOnInit(): void {
    this.store.initialize();
  }

  protected addMember(): void {
    this.dialog
      .open<MemberFormDialog, null, UserPayload>(MemberFormDialog, { data: null })
      .afterClosed()
      .subscribe((payload) => {
        if (payload) this.store.createUser(payload);
      });
  }

  protected editMember(user: FamilyUser): void {
    this.dialog
      .open<MemberFormDialog, FamilyUser, UserPayload>(MemberFormDialog, { data: user })
      .afterClosed()
      .subscribe((payload) => {
        if (payload) this.store.updateUser(user.id, payload);
      });
  }

  protected deleteMember(user: FamilyUser): void {
    this.dialog
      .open<ConfirmDialog, { name: string }, boolean>(ConfirmDialog, { data: { name: user.name } })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) this.store.deleteUser(user.id);
      });
  }

  protected addGoal(): void {
    this.dialog
      .open<GoalFormDialog, GoalFormDialogData, GoalPayload>(GoalFormDialog, {
        data: { goal: null, template: this.store.currentGoal() },
      })
      .afterClosed()
      .subscribe((payload) => {
        if (payload) this.store.createGoal(payload);
      });
  }

  protected editGoal(goal: UserGoal): void {
    this.dialog
      .open<GoalFormDialog, GoalFormDialogData, GoalPayload>(GoalFormDialog, {
        data: { goal, template: null },
      })
      .afterClosed()
      .subscribe((payload) => {
        if (payload) this.store.updateGoal(goal.id, payload);
      });
  }

  protected addMeasurement(): void {
    this.dialog
      .open<MeasurementFormDialog, null, MeasurementPayload>(MeasurementFormDialog, {
        data: null,
        width: '720px',
        maxWidth: 'calc(100vw - 32px)',
      })
      .afterClosed()
      .subscribe((payload) => {
        if (payload) this.store.createMeasurement(payload);
      });
  }

  protected editMeasurement(measurement: UserMeasurement): void {
    this.dialog
      .open<MeasurementFormDialog, UserMeasurement, MeasurementPayload>(MeasurementFormDialog, {
        data: measurement,
        width: '720px',
        maxWidth: 'calc(100vw - 32px)',
      })
      .afterClosed()
      .subscribe((payload) => {
        if (payload) this.store.updateMeasurement(measurement.id, payload);
      });
  }

  protected confirmDeleteMeasurement(measurement: UserMeasurement): void {
    this.dialog
      .open<MeasurementDeleteDialog, MeasurementDeleteDialogData, boolean>(
        MeasurementDeleteDialog,
        { data: { measuredOn: measurement.measured_on } },
      )
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) this.store.deleteMeasurement(measurement.id);
      });
  }

  protected initials(name: string): string {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toLocaleUpperCase('ru');
  }

  protected goalStatusLabel(goal: UserGoal): string {
    if (this.store.currentGoal()?.id === goal.id) return 'Текущая';
    return goal.effective_from > this.todayIsoDate() ? 'Запланирована' : 'Завершена';
  }

  protected goalStatusClass(goal: UserGoal): string {
    if (this.store.currentGoal()?.id === goal.id) return 'current';
    return goal.effective_from > this.todayIsoDate() ? 'scheduled' : 'past';
  }

  protected recordsCountLabel(count: number): string {
    const lastTwo = count % 100;
    const last = count % 10;
    if (lastTwo >= 11 && lastTwo <= 14) return `${count} записей`;
    if (last === 1) return `${count} запись`;
    if (last >= 2 && last <= 4) return `${count} записи`;
    return `${count} записей`;
  }

  private todayIsoDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
