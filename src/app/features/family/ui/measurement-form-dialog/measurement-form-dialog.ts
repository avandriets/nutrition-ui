import { Component, inject } from '@angular/core';
import { AbstractControl, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder } from '@angular/forms';
import { MeasurementPayload, UserMeasurement } from '../../data-access/family.models';

function atLeastOneMeasurement(control: AbstractControl): ValidationErrors | null {
  const value = control.value as Record<string, unknown>;
  const fields = ['weight_kg', 'neck_cm', 'waist_cm', 'hips_cm'];
  return fields.some((field) => value[field] !== null && value[field] !== '')
    ? null
    : { measurementRequired: true };
}

@Component({
  selector: 'app-measurement-form-dialog',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './measurement-form-dialog.html',
  styleUrl: './measurement-form-dialog.scss',
})
export class MeasurementFormDialog {
  private readonly data = inject<UserMeasurement | null>(MAT_DIALOG_DATA);
  private readonly dialogRef =
    inject<MatDialogRef<MeasurementFormDialog, MeasurementPayload>>(MatDialogRef);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly editing = Boolean(this.data);
  protected readonly form = this.formBuilder.group(
    {
      measured_on: this.formBuilder.nonNullable.control(
        this.data?.measured_on ?? this.todayIsoDate(),
        Validators.required,
      ),
      weight_kg: this.formBuilder.control<number | null>(this.data?.weight_kg ?? null, [
        Validators.min(0.1),
      ]),
      neck_cm: this.formBuilder.control<number | null>(this.data?.neck_cm ?? null, [
        Validators.min(0.1),
      ]),
      waist_cm: this.formBuilder.control<number | null>(this.data?.waist_cm ?? null, [
        Validators.min(0.1),
      ]),
      hips_cm: this.formBuilder.control<number | null>(this.data?.hips_cm ?? null, [
        Validators.min(0.1),
      ]),
    },
    { validators: atLeastOneMeasurement },
  );

  protected save(): void {
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

  private todayIsoDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
