import { Component, inject } from '@angular/core';
import type { AbstractControl, ValidationErrors } from '@angular/forms';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { FormBuilder } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { format } from 'date-fns';

import type { MeasurementPayload, UserMeasurement } from '../../types/family.types';

function atLeastOneMeasurement(control: AbstractControl): ValidationErrors | null {
  const value = control.value as Record<string, unknown>;
  const fields = ['weight_kg', 'neck_cm', 'waist_cm', 'hips_cm'];
  return fields.some(field => value[field] !== null && value[field] !== '') ? null : { measurementRequired: true };
}

@Component({
  selector: 'app-measurement-form-dialog',
  imports: [MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, ReactiveFormsModule],
  templateUrl: './measurement-form-dialog.html',
  styleUrl: './measurement-form-dialog.scss',
})
export class MeasurementFormDialog {
  private readonly data = inject<UserMeasurement | null>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<MeasurementFormDialog, MeasurementPayload>>(MatDialogRef);
  private readonly formBuilder = inject(FormBuilder);

  readonly editing = Boolean(this.data);
  readonly form = this.formBuilder.group(
    {
      measured_on: this.formBuilder.nonNullable.control(this.data?.measured_on ?? format(new Date(), 'yyyy-MM-dd'), Validators.required),
      weight_kg: this.formBuilder.control<number | null>(this.data?.weight_kg ?? null, [Validators.min(0.1)]),
      neck_cm: this.formBuilder.control<number | null>(this.data?.neck_cm ?? null, [Validators.min(0.1)]),
      waist_cm: this.formBuilder.control<number | null>(this.data?.waist_cm ?? null, [Validators.min(0.1)]),
      hips_cm: this.formBuilder.control<number | null>(this.data?.hips_cm ?? null, [Validators.min(0.1)]),
    },
    { validators: atLeastOneMeasurement },
  );

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.dialogRef.close({
      measured_on: value.measured_on,
      weight_kg: this.numberOrNull(value.weight_kg),
      neck_cm: this.numberOrNull(value.neck_cm),
      waist_cm: this.numberOrNull(value.waist_cm),
      hips_cm: this.numberOrNull(value.hips_cm),
    });
  }

  private numberOrNull(value: number | null): number | null {
    return value === null || value === undefined ? null : Number(value);
  }
}
