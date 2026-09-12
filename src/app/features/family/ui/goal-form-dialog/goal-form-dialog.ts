import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { format } from 'date-fns';

import type { GoalPayload, UserGoal } from '../../types/family.types';

export interface GoalFormDialogData {
  goal: UserGoal | null;
  template: UserGoal | null;
}

@Component({
  selector: 'app-goal-form-dialog',
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './goal-form-dialog.html',
  styleUrl: './goal-form-dialog.scss',
})
export class GoalFormDialog {
  private readonly dialogRef = inject(MatDialogRef<GoalFormDialog, GoalPayload>);
  readonly data = inject<GoalFormDialogData>(MAT_DIALOG_DATA);
  readonly goal = this.data.goal;
  private readonly formBuilder = inject(FormBuilder);
  private readonly today = format(new Date(), 'yyyy-MM-dd');
  private readonly initialValues = this.goal ?? this.data.template;

  readonly form = this.formBuilder.nonNullable.group({
    daily_calories_kcal: [this.initialValues?.daily_calories_kcal ?? 2100, [Validators.required, Validators.min(1)]],
    daily_protein_g: [this.initialValues?.daily_protein_g ?? 100, [Validators.required, Validators.min(0)]],
    daily_fiber_g: [this.initialValues?.daily_fiber_g ?? 25, [Validators.required, Validators.min(0)]],
    effective_from: [this.goal?.effective_from ?? this.today, Validators.required],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.getRawValue());
  }
}
