import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MealPayload, MealType } from '../../data-access/meal.models';

function requireOtherMealName(control: AbstractControl): ValidationErrors | null {
  const type = control.get('meal_type')?.value;
  const name = String(control.get('name')?.value ?? '').trim();
  return type === 'other' && !name ? { otherMealName: true } : null;
}

@Component({
  selector: 'app-meal-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './meal-form-dialog.html',
  styleUrl: './meal-form-dialog.scss',
})
export class MealFormDialog {
  private readonly dialogRef = inject(MatDialogRef<MealFormDialog, MealPayload>);
  private readonly initialDate = inject<string>(MAT_DIALOG_DATA);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly mealTypes: { value: MealType; label: string }[] = [
    { value: 'breakfast', label: 'Завтрак' },
    { value: 'lunch', label: 'Обед' },
    { value: 'dinner', label: 'Ужин' },
    { value: 'other', label: 'Другое' },
  ];

  protected readonly form = this.formBuilder.nonNullable.group(
    {
      meal_date: [this.initialDate, Validators.required],
      meal_type: ['breakfast' as MealType, Validators.required],
      name: ['', Validators.maxLength(200)],
    },
    { validators: requireOtherMealName },
  );

  protected submit(): void {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    this.dialogRef.close({ ...value, name: value.name.trim() || null });
  }
}
