import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import type { AbstractControl, ValidationErrors } from '@angular/forms';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { map, startWith } from 'rxjs';

import type { UserIdentity } from '../../../../shared/domain/identity.types';
import type { MealProduct } from '../../types/meal.types';

function selectedProduct(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  return typeof value === 'object' && value?.id ? null : { productNotSelected: true };
}

export interface EntryDialogData {
  products: MealProduct[];
  users: UserIdentity[];
}

export interface MealEntryDialogResult {
  product_id: number;
  portions: { user_id: number; amount_g: number }[];
}

@Component({
  selector: 'app-meal-entry-dialog',
  imports: [ReactiveFormsModule, MatAutocompleteModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './meal-entry-dialog.html',
  styleUrl: './meal-entry-dialog.scss',
})
export class MealEntryDialog {
  private readonly dialogRef = inject(MatDialogRef<MealEntryDialog, MealEntryDialogResult>);
  readonly data = inject<EntryDialogData>(MAT_DIALOG_DATA);
  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.nonNullable.group({
    product: this.formBuilder.nonNullable.control<string | MealProduct>('', [Validators.required, selectedProduct]),
    portions: this.formBuilder.array(this.data.users.map(() => this.formBuilder.nonNullable.control(0, [Validators.min(0)]))),
  });

  readonly filteredProducts = toSignal(
    this.form.controls.product.valueChanges.pipe(
      startWith(this.form.controls.product.value),
      map(value => this.filterProducts(value)),
    ),
    { initialValue: this.data.products },
  );

  readonly displayProduct = (product: string | MealProduct | null): string => (typeof product === 'string' ? product : (product?.name ?? ''));

  hasPositivePortion(): boolean {
    return this.form.controls.portions.getRawValue().some(amount => amount > 0);
  }

  submit(): void {
    if (this.form.invalid || !this.hasPositivePortion()) return;

    const { product, portions } = this.form.getRawValue();
    if (typeof product === 'string') return;

    this.dialogRef.close({
      product_id: product.id,
      portions: portions.map((amount, index) => ({ user_id: this.data.users[index].id, amount_g: amount })).filter(portion => portion.amount_g > 0),
    });
  }

  private filterProducts(value: string | MealProduct): MealProduct[] {
    const query = (typeof value === 'string' ? value : value.name).trim().toLocaleLowerCase('ru');
    if (!query) return this.data.products;

    return this.data.products.filter(product => [product.name, product.brand, product.category].filter(Boolean).some(field => field!.toLocaleLowerCase('ru').includes(query)));
  }
}
