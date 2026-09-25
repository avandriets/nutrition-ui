import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import type { UIConfirmDialogData } from '../../types/confirm-dialog.types';

@Component({
  selector: 'app-ui-confirm-dialog',
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
  host: {
    '[style.min-width]': 'minWidth',
  },
})
export class UIConfirmDialogComponent {
  readonly data = inject<UIConfirmDialogData>(MAT_DIALOG_DATA);
  readonly minWidth = this.data.minWidth ?? 'min(410px, 82vw)';
  readonly icon = this.data.icon ?? 'help_outline';
  readonly confirmText = this.data.confirmText ?? 'Confirm';
  readonly cancelText = this.data.cancelText ?? 'Cancel';
  readonly tone = this.data.tone ?? 'primary';
}
