import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

export interface MealDayCopyDialogData {
  sourceDate: string;
}

export interface MealDayCopyDialogResult {
  source_date: string;
  target_date: string;
  replace_existing: boolean;
}

function differentDates(control: AbstractControl): ValidationErrors | null {
  return control.get('source_date')?.value === control.get('target_date')?.value
    ? { sameDate: true }
    : null;
}

@Component({
  selector: 'app-meal-day-copy-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './meal-day-copy-dialog.html',
  styleUrl: './meal-day-copy-dialog.scss',
})
export class MealDayCopyDialog {
  private readonly dialogRef = inject(MatDialogRef<MealDayCopyDialog, MealDayCopyDialogResult>);
  private readonly data = inject<MealDayCopyDialogData>(MAT_DIALOG_DATA);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly form = this.formBuilder.nonNullable.group(
    {
      source_date: [this.data.sourceDate, Validators.required],
      target_date: [this.nextDate(this.data.sourceDate), Validators.required],
      replace_existing: [false],
    },
    { validators: differentDates },
  );

  protected submit(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.getRawValue());
  }

  private nextDate(isoDate: string): string {
    const [year, month, day] = isoDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + 1);
    const nextYear = date.getFullYear();
    const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
    const nextDay = String(date.getDate()).padStart(2, '0');
    return `${nextYear}-${nextMonth}-${nextDay}`;
  }
}
