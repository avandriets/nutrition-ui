import { registerLocaleData } from '@angular/common';
import localeRu from '@angular/common/locales/ru';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { vi } from 'vitest';

import type { FamilyUser } from '../../types/family.types';
import { FamilyMemberListComponent } from './family-member-list';

registerLocaleData(localeRu);

describe('FamilyMemberListComponent', () => {
  const route = {};
  const router = { navigate: vi.fn().mockResolvedValue(true) };
  const user: FamilyUser = {
    id: 1,
    account_id: 10,
    name: 'Александр Андриец',
    birth_date: '1990-01-01',
    height_cm: 180,
    created_at: '2026-09-13T00:00:00Z',
    updated_at: '2026-09-13T00:00:00Z',
  };

  beforeEach(() => {
    router.navigate.mockClear();
    TestBed.configureTestingModule({
      imports: [FamilyMemberListComponent],
      providers: [
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('renders members and writes selection to the URL', () => {
    const fixture = TestBed.createComponent(FamilyMemberListComponent);
    fixture.componentRef.setInput('users', [user]);
    fixture.componentRef.setInput('selectedUserId', null);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.member-row') as HTMLButtonElement).click();

    expect(fixture.nativeElement.textContent).toContain('Александр Андриец');
    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: route,
      queryParams: { user: user.id },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });
});
