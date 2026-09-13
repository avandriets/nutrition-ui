import { DatePipe, DecimalPipe } from '@angular/common';
import type { OnInit } from '@angular/core';
import { Component, effect, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

import type { UIConfirmDialogData } from '../../../../shared/types/confirm-dialog.types';
import { UIConfirmDialogComponent } from '../../../../shared/ui/confirm-dialog/confirm-dialog';
import { UIPageComponent } from '../../../../shared/ui/page/page';
import { initials } from '../../../../shared/utils/name.utils';
import { FamilyStore } from '../../data-access/family.store';
import type { FamilyUser, GoalPayload, MeasurementPayload, UserGoal, UserMeasurement, UserPayload } from '../../types/family.types';
import type { GoalFormDialogData } from '../../ui/goal-form-dialog/goal-form-dialog';
import { GoalFormDialog } from '../../ui/goal-form-dialog/goal-form-dialog';
import { MeasurementFormDialog } from '../../ui/measurement-form-dialog/measurement-form-dialog';
import { MemberFormDialog } from '../../ui/member-form-dialog/member-form-dialog';

@Component({
  selector: 'app-family-members-page',
  imports: [DatePipe, DecimalPipe, MatButtonModule, MatCardModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule, RouterLink, UIPageComponent],
  templateUrl: './family-members.page.html',
  styleUrl: './family-members.page.scss',
})
export class FamilyMembersPage implements OnInit {
  readonly store = inject(FamilyStore);
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

  addMember(): void {
    this.dialog
      .open<MemberFormDialog, null, UserPayload>(MemberFormDialog, { data: null })
      .afterClosed()
      .subscribe(payload => {
        if (payload) this.store.createUser(payload);
      });
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

  initials(name: string): string {
    return initials(name);
  }

  goalStatusLabel(goal: UserGoal): string {
    if (this.store.currentGoal()?.id === goal.id) return 'Текущая';
    return goal.effective_from > format(new Date(), 'yyyy-MM-dd') ? 'Запланирована' : 'Завершена';
  }

  goalStatusClass(goal: UserGoal): string {
    if (this.store.currentGoal()?.id === goal.id) return 'current';
    return goal.effective_from > format(new Date(), 'yyyy-MM-dd') ? 'scheduled' : 'past';
  }

  recordsCountLabel(count: number): string {
    const lastTwo = count % 100;
    const last = count % 10;
    if (lastTwo >= 11 && lastTwo <= 14) return `${count} записей`;
    if (last === 1) return `${count} запись`;
    if (last >= 2 && last <= 4) return `${count} записи`;
    return `${count} записей`;
  }
}
