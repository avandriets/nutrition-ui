import { registerLocaleData } from '@angular/common';
import localeRu from '@angular/common/locales/ru';
import { TestBed } from '@angular/core/testing';

import type { UserGoal } from '../../types/family.types';
import { GoalSummaryComponent } from './goal-summary';

registerLocaleData(localeRu);

describe('GoalSummaryComponent', () => {
  it('renders the current nutrition goal', () => {
    const goal: UserGoal = {
      id: 1,
      user_id: 2,
      effective_from: '2026-09-13',
      daily_calories_kcal: 2200,
      daily_protein_g: 140,
      daily_fiber_g: 30,
      created_at: '2026-09-13T00:00:00Z',
      updated_at: '2026-09-13T00:00:00Z',
    };
    const fixture = TestBed.createComponent(GoalSummaryComponent);
    fixture.componentRef.setInput('goal', goal);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('2,200');
    expect(fixture.nativeElement.textContent).toContain('140');
  });
});
