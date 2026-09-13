import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import type { FamilyUser } from '../../types/family.types';
import { PersonalDiaryLinkComponent } from './personal-diary-link';

describe('PersonalDiaryLinkComponent', () => {
  it('renders a link to the selected user diary', () => {
    const user: FamilyUser = {
      id: 4,
      account_id: 10,
      name: 'Мария',
      birth_date: null,
      height_cm: null,
      created_at: '2026-09-13T00:00:00Z',
      updated_at: '2026-09-13T00:00:00Z',
    };
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(PersonalDiaryLinkComponent);
    fixture.componentRef.setInput('user', user);
    fixture.detectChanges();

    expect((fixture.nativeElement.querySelector('a') as HTMLAnchorElement).getAttribute('href')).toBe('/family/users/4/diary');
    expect(fixture.nativeElement.textContent).toContain(user.name);
  });
});
