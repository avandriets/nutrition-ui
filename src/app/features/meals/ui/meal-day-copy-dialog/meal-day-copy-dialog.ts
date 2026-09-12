import { Component, inject } from '@angular/core';
import type { AbstractControl, ValidationErrors } from '@angular/forms';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { addDays, format, parseISO } from 'date-fns';

export interface MealDayCopyDialogData {
  sourceDate: string;
}

export interface MealDayCopyDialogResult {
  source_date: string;
  target_date: string;
  replace_existing: boolean;
}

function differentDates(control: AbstractControl): ValidationErrors | null {
  return control.get('source_date')?.value === control.get('target_date')?.value ? { sameDate: true } : null;
}

@Component({
  selector: 'app-meal-day-copy-dialog',
  imports: [ReactiveFormsModule, MatButtonModule, MatCheckboxModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './meal-day-copy-dialog.html',
  styleUrl: './meal-day-copy-dialog.scss',
})
export class MealDayCopyDialog {
  private readonly dialogRef = inject(MatDialogRef<MealDayCopyDialog, MealDayCopyDialogResult>);
  private readonly data = inject<MealDayCopyDialogData>(MAT_DIALOG_DATA);
  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.nonNullable.group(
    {
      source_date: [this.data.sourceDate, Validators.required],
      target_date: [format(addDays(parseISO(this.data.sourceDate), 1), 'yyyy-MM-dd'), Validators.required],
      replace_existing: [false],
    },
    { validators: differentDates },
  );

  submit(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.getRawValue());
  }
}
