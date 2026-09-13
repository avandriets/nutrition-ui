import { registerLocaleData } from '@angular/common';
import localeRu from '@angular/common/locales/ru';
import { TestBed } from '@angular/core/testing';

import type { UserGoal } from '../../types/family.types';
import { GoalHistoryComponent } from './goal-history';

registerLocaleData(localeRu);

describe('GoalHistoryComponent', () => {
  const goal: UserGoal = {
    id: 1,
    user_id: 10,
    effective_from: '2026-09-13',
    daily_calories_kcal: 2_000,
    daily_protein_g: 120,
    daily_fiber_g: 30,
    created_at: '2026-09-13T00:00:00Z',
    updated_at: '2026-09-13T00:00:00Z',
  };

  it('renders goal history and emits an edit action', () => {
    const fixture = TestBed.configureTestingModule({ imports: [GoalHistoryComponent] }).createComponent(GoalHistoryComponent);
    fixture.componentRef.setInput('goals', [goal]);
    fixture.componentRef.setInput('currentGoalId', goal.id);
    let edited: UserGoal | undefined;
    fixture.componentInstance.editRequested.subscribe(value => (edited = value));
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();

    expect(fixture.nativeElement.textContent).toContain('2,000');
    expect(fixture.nativeElement.textContent).toContain('Текущая');
    expect(edited).toBe(goal);
  });

  it('disables editing only for pending goals', () => {
    const secondGoal = { ...goal, id: 2 };
    const fixture = TestBed.configureTestingModule({ imports: [GoalHistoryComponent] }).createComponent(GoalHistoryComponent);
    fixture.componentRef.setInput('goals', [goal, secondGoal]);
    fixture.componentRef.setInput('pendingIds', new Set([goal.id]));
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    expect(buttons[0].disabled).toBe(true);
    expect(buttons[1].disabled).toBe(false);
  });
});
