import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { GoalPayload, UserGoal } from '../../data-access/family.models';

export interface GoalFormDialogData {
  goal: UserGoal | null;
  template: UserGoal | null;
}

@Component({
  selector: 'app-goal-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './goal-form-dialog.html',
  styleUrl: './goal-form-dialog.scss',
})
export class GoalFormDialog {
  private readonly dialogRef = inject(MatDialogRef<GoalFormDialog, GoalPayload>);
  protected readonly data = inject<GoalFormDialogData>(MAT_DIALOG_DATA);
  protected readonly goal = this.data.goal;
  private readonly formBuilder = inject(FormBuilder);
  private readonly today = new Date().toISOString().slice(0, 10);
  private readonly initialValues = this.goal ?? this.data.template;

  protected readonly form = this.formBuilder.nonNullable.group({
    daily_calories_kcal: [
      this.initialValues?.daily_calories_kcal ?? 2100,
      [Validators.required, Validators.min(1)],
    ],
    daily_protein_g: [
      this.initialValues?.daily_protein_g ?? 100,
      [Validators.required, Validators.min(0)],
    ],
    daily_fiber_g: [
      this.initialValues?.daily_fiber_g ?? 25,
      [Validators.required, Validators.min(0)],
    ],
    effective_from: [this.goal?.effective_from ?? this.today, Validators.required],
  });

  protected submit(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.getRawValue());
  }
}
