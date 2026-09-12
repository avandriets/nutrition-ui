export interface UIConfirmDialogMessagePart {
  text: string;
  emphasis?: boolean;
}

export interface UIConfirmDialogData {
  title: string;
  message: readonly UIConfirmDialogMessagePart[];
  icon?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: 'primary' | 'danger';
  minWidth?: string;
}
