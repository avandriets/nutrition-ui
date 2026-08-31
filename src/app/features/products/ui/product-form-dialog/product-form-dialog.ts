import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Product, ProductPayload } from '../../data-access/product.model';

@Component({
  selector: 'app-product-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './product-form-dialog.html',
  styleUrl: './product-form-dialog.scss',
})
export class ProductFormDialog {
  private readonly dialogRef = inject(MatDialogRef<ProductFormDialog, ProductPayload>);
  protected readonly product = inject<Product | null>(MAT_DIALOG_DATA);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly form = this.formBuilder.nonNullable.group({
    name: [
      this.product?.name ?? '',
      [Validators.required, Validators.pattern(/\S/), Validators.maxLength(200)],
    ],
    brand: [this.product?.brand ?? '', Validators.maxLength(200)],
    category: [this.product?.category ?? '', Validators.maxLength(100)],
    description: [this.product?.description ?? ''],
    calories_kcal: [this.product?.calories_kcal ?? 0, [Validators.required, Validators.min(0)]],
    protein_g: [this.product?.protein_g ?? 0, [Validators.required, Validators.min(0)]],
    fat_g: [this.product?.fat_g ?? 0, [Validators.required, Validators.min(0)]],
    carbohydrates_g: [this.product?.carbohydrates_g ?? 0, [Validators.required, Validators.min(0)]],
    fiber_g: [this.product?.fiber_g ?? 0, [Validators.required, Validators.min(0)]],
  });

  protected submit(): void {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    this.dialogRef.close({
      ...value,
      name: value.name.trim(),
      brand: this.optional(value.brand),
      category: this.optional(value.category),
      barcode: null,
      description: this.optional(value.description),
    });
  }

  private optional(value: string): string | null {
    return value.trim() || null;
  }
}
