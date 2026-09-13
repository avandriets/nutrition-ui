import type { OnInit } from '@angular/core';
import { Component, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs';

import type { UIConfirmDialogData } from '../../../../shared/types';
import { UIConfirmDialogComponent } from '../../../../shared/ui/confirm-dialog/confirm-dialog';
import { UIPageComponent } from '../../../../shared/ui/page/page';
import { UIStateContainerComponent } from '../../../../shared/ui/state-container/state-container';
import { FamilyStore } from '../../data-access/family.store';
import type { FamilyUser, GoalPayload, MeasurementPayload, UserGoal, UserMeasurement, UserPayload } from '../../types/family.types';
import {
  FamilyGoalsSectionComponent,
  FamilyMeasurementsSectionComponent,
  FamilyMemberListComponent,
  FamilyMemberProfileComponent,
  GoalFormDialog,
  type GoalFormDialogData,
  MeasurementFormDialog,
  MemberFormDialog,
  PersonalDiaryLinkComponent,
} from '../../ui';

function parseUserId(value: string | null): number | null {
  const userId = Number(value);
  return value !== null && Number.isInteger(userId) && userId > 0 ? userId : null;
}

@Component({
  selector: 'app-family-members-page',
  imports: [
    FamilyGoalsSectionComponent,
    FamilyMemberListComponent,
    FamilyMemberProfileComponent,
    FamilyMeasurementsSectionComponent,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatIconModule,
    PersonalDiaryLinkComponent,
    UIPageComponent,
    UIStateContainerComponent,
  ],
  templateUrl: './family-members.page.html',
  styleUrl: './family-members.page.scss',
})
export class FamilyMembersPage implements OnInit {
  readonly store = inject(FamilyStore);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly requestedUserId = toSignal(
    this.route.queryParamMap.pipe(
      map(params => parseUserId(params.get('user'))),
      distinctUntilChanged(),
    ),
    { initialValue: parseUserId(this.route.snapshot.queryParamMap.get('user')) },
  );
  private readonly synchronizeSelectedUser = effect(() => {
    const requestedUserId = this.requestedUserId();
    const users = this.store.users();
    if (this.store.loading()) return;

    if (!users.length) {
      if (requestedUserId !== null) this.updateSelectedUserQueryParam(null);
      return;
    }

    const selectedUserId = users.some(user => user.id === requestedUserId) ? requestedUserId : users[0].id;
    if (this.store.selectedUserId() !== selectedUserId) this.store.selectUser(selectedUserId);
    if (requestedUserId !== selectedUserId) this.updateSelectedUserQueryParam(selectedUserId);
  });
  private goalDialogRequested = this.route.snapshot.queryParamMap.get('editGoal') === 'true';
  private readonly openRequestedGoalDialog = effect(() => {
    const user = this.store.selectedUser();
    if (!this.goalDialogRequested || !this.store.goalsState().resolved || !user) return;

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
    this.store.initialize(this.requestedUserId());
  }

  addMember(): void {
    this.dialog
      .open<MemberFormDialog, null, UserPayload>(MemberFormDialog, { data: null })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(payload => this.store.createUser(payload)),
        tap(user => this.updateSelectedUserQueryParam(user.id)),
      )
      .subscribe();
  }

  editMember(user: FamilyUser): void {
    this.dialog
      .open<MemberFormDialog, FamilyUser, UserPayload>(MemberFormDialog, { data: user })
      .afterClosed()
      .subscribe(payload => {
        if (payload) this.store.updateUser(user.id, payload);
      });
  }

  deleteMember(user: FamilyUser): void {
    this.dialog
      .open<UIConfirmDialogComponent, UIConfirmDialogData, boolean>(UIConfirmDialogComponent, {
        data: {
          icon: 'person_remove',
          title: 'Удалить профиль?',
          message: [{ text: 'Профиль ' }, { text: user.name, emphasis: true }, { text: ', его цели и измерения будут удалены.' }],
          confirmText: 'Удалить',
          tone: 'danger',
          minWidth: 'min(390px, 82vw)',
        },
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) this.store.deleteUser(user.id);
      });
  }

  addGoal(): void {
    this.dialog
      .open<GoalFormDialog, GoalFormDialogData, GoalPayload>(GoalFormDialog, {
        data: { goal: null, template: this.store.currentGoal() },
      })
      .afterClosed()
      .subscribe(payload => {
        if (payload) this.store.createGoal(payload);
      });
  }

  editGoal(goal: UserGoal): void {
    this.dialog
      .open<GoalFormDialog, GoalFormDialogData, GoalPayload>(GoalFormDialog, {
        data: { goal, template: null },
      })
      .afterClosed()
      .subscribe(payload => {
        if (payload) this.store.updateGoal(goal.id, payload);
      });
  }

  addMeasurement(): void {
    this.dialog
      .open<MeasurementFormDialog, null, MeasurementPayload>(MeasurementFormDialog, {
        data: null,
        width: '720px',
        maxWidth: 'calc(100vw - 32px)',
      })
      .afterClosed()
      .subscribe(payload => {
        if (payload) this.store.createMeasurement(payload);
      });
  }

  editMeasurement(measurement: UserMeasurement): void {
    this.dialog
      .open<MeasurementFormDialog, UserMeasurement, MeasurementPayload>(MeasurementFormDialog, {
        data: measurement,
        width: '720px',
        maxWidth: 'calc(100vw - 32px)',
      })
      .afterClosed()
      .subscribe(payload => {
        if (payload) this.store.updateMeasurement(measurement.id, payload);
      });
  }

  confirmDeleteMeasurement(measurement: UserMeasurement): void {
    const measuredOn = measurement.measured_on;
    this.dialog
      .open<UIConfirmDialogComponent, UIConfirmDialogData, boolean>(UIConfirmDialogComponent, {
        data: {
          icon: 'delete_outline',
          title: 'Удалить замер?',
          message: [
            { text: measuredOn ? 'Запись от ' : 'Запись ' },
            ...(measuredOn ? [{ text: format(parseISO(measuredOn), 'd MMMM yyyy', { locale: ru }), emphasis: true }] : []),
            { text: ' будет удалена. Это действие нельзя отменить.' },
          ],
          confirmText: 'Удалить',
          tone: 'danger',
        },
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) this.store.deleteMeasurement(measurement.id);
      });
  }

  private updateSelectedUserQueryParam(userId: number | null): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { user: userId },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
