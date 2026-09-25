import { registerLocaleData } from '@angular/common';
import localeEn from '@angular/common/locales/en';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import type { FamilyUser } from '../../types/family.types';
import { FamilyMemberProfileComponent } from './family-member-profile';

registerLocaleData(localeEn);

describe('FamilyMemberProfileComponent', () => {
  const user: FamilyUser = {
    id: 1,
    account_id: 10,
    name: 'Alexander Andriets',
    birth_date: '1990-01-01',
    height_cm: 180,
    created_at: '2026-09-13T00:00:00Z',
    updated_at: '2026-09-13T00:00:00Z',
  };

  it('renders the user and emits profile actions', () => {
    const fixture = TestBed.createComponent(FamilyMemberProfileComponent);
    const editRequested = vi.fn();
    const deleteRequested = vi.fn();
    fixture.componentRef.setInput('user', user);
    fixture.componentInstance.editRequested.subscribe(editRequested);
    fixture.componentInstance.deleteRequested.subscribe(deleteRequested);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons[0].click();
    buttons[1].click();

    expect(fixture.nativeElement.textContent).toContain(user.name);
    expect(editRequested).toHaveBeenCalledWith(user);
    expect(deleteRequested).toHaveBeenCalledWith(user);
  });
});
