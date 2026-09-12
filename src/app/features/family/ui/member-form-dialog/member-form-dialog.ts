import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import type { FamilyUser, UserPayload } from '../../types/family.types';

@Component({
  selector: 'app-member-form-dialog',
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './member-form-dialog.html',
  styleUrl: './member-form-dialog.scss',
})
export class MemberFormDialog {
  private readonly dialogRef = inject(MatDialogRef<MemberFormDialog, UserPayload>);
  readonly user = inject<FamilyUser | null>(MAT_DIALOG_DATA);
  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.group({
    name: this.formBuilder.nonNullable.control(this.user?.name ?? '', [Validators.required, Validators.maxLength(200)]),
    birth_date: this.formBuilder.nonNullable.control(this.user?.birth_date ?? ''),
    height_cm: this.formBuilder.control<number | null>(this.user?.height_cm ?? null, [Validators.min(1), Validators.max(300)]),
  });

  submit(): void {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    this.dialogRef.close({
      name: value.name.trim(),
      birth_date: value.birth_date || null,
      height_cm: value.height_cm,
    });
  }
}
