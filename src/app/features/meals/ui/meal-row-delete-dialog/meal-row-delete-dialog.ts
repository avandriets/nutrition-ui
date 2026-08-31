import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface MealRowDeleteDialogData {
  productName: string;
}

@Component({
  selector: 'app-meal-row-delete-dialog',
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  template: `<div class="icon"><mat-icon>delete_sweep</mat-icon></div>
    <h2 mat-dialog-title>Удалить продукт из приёма пищи?</h2>
    <mat-dialog-content>
      Строка <strong>{{ data.productName }}</strong> и порции всех членов семьи будут удалены из
      этого приёма пищи.
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">Отмена</button>
      <button mat-flat-button class="danger" [mat-dialog-close]="true">Удалить строку</button>
    </mat-dialog-actions>`,
  styles: `
    :host {
      display: block;
      min-width: min(440px, 82vw);
      padding-top: 24px;
      text-align: center;
    }

    .icon {
      display: grid;
      place-items: center;
      width: 54px;
      height: 54px;
      margin: auto;
      border-radius: 17px;
      background: #fff0ed;
      color: #c65c4d;
    }

    h2 {
      padding-bottom: 6px !important;
    }

    mat-dialog-content {
      color: #76827b;
      line-height: 1.5;
    }

    .danger {
      background: #ba4f43 !important;
      color: white !important;
    }
  `,
})
export class MealRowDeleteDialog {
  protected readonly data = inject<MealRowDeleteDialogData>(MAT_DIALOG_DATA);
}
