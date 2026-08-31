import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-confirm-dialog',
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  template: `<div class="icon"><mat-icon>person_remove</mat-icon></div>
    <h2 mat-dialog-title>Удалить профиль?</h2>
    <mat-dialog-content
      >Профиль <strong>{{ data.name }}</strong
      >, его цели и измерения будут удалены.</mat-dialog-content
    ><mat-dialog-actions align="end"
      ><button mat-button [mat-dialog-close]="false">Отмена</button
      ><button mat-flat-button class="danger" [mat-dialog-close]="true">
        Удалить
      </button></mat-dialog-actions
    >`,
  styles: `
    :host {
      display: block;
      min-width: min(390px, 82vw);
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
    }
  `,
})
export class ConfirmDialog {
  protected readonly data = inject<{ name: string }>(MAT_DIALOG_DATA);
}
