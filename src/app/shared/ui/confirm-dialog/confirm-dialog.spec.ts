import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import type { UIConfirmDialogData } from '../../types/confirm-dialog.types';
import { UIConfirmDialogComponent } from './confirm-dialog';

describe('UIConfirmDialogComponent', () => {
  it('renders configured content and danger state', async () => {
    const data: UIConfirmDialogData = {
      icon: 'delete_outline',
      title: 'Delete product?',
      message: [{ text: 'Apple', emphasis: true }, { text: ' will be deleted.' }],
      confirmText: 'Delete',
      tone: 'danger',
      minWidth: 'min(440px, 82vw)',
    };

    await TestBed.configureTestingModule({
      imports: [UIConfirmDialogComponent],
      providers: [{ provide: MAT_DIALOG_DATA, useValue: data }],
    }).compileComponents();

    const fixture = TestBed.createComponent(UIConfirmDialogComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.style.minWidth).toBe('min(440px, 82vw)');
    expect(element.querySelector('h2')?.textContent).toContain('Delete product?');
    expect(element.querySelector('strong')?.textContent).toBe('Apple');
    expect(element.querySelector('.danger')?.textContent).toContain('Delete');
  });
});
