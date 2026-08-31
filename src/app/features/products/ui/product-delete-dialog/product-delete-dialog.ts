import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-product-delete-dialog',
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  template: `<div class="icon"><mat-icon>delete_outline</mat-icon></div>
    <h2 mat-dialog-title>Удалить продукт?</h2>
    <mat-dialog-content
      ><strong>{{ data.name }}</strong> будет удалён из общего каталога. Это действие нельзя
      отменить.</mat-dialog-content
    ><mat-dialog-actions align="end"
      ><button mat-button [mat-dialog-close]="false">Отмена</button
      ><button mat-flat-button class="danger" [mat-dialog-close]="true">
        Удалить
      </button></mat-dialog-actions
    >`,
  styles: `
    :host {
      display: block;
      min-width: min(410px, 82vw);
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
    .danger {
      background: #ba4f43 !important;
      color: white !important;
    }
    mat-dialog-content {
      color: #76827b;
      line-height: 1.5;
    }
  `,
})
export class ProductDeleteDialog {
  protected readonly data = inject<{ name: string }>(MAT_DIALOG_DATA);
}
