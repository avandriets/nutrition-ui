import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import type { GoalTimelineItem, UserIdentity } from '../../../../shared/types';
import type { MealMemberSummary } from '../../types/meal-detail.types';
import { MealDaySummaryComponent } from './meal-day-summary';

describe('MealDaySummaryComponent', () => {
  const user: UserIdentity = {
    id: 1,
    account_id: 10,
    name: 'Александр',
  };
  const summary: MealMemberSummary = {
    user,
    totals: {
      calories_kcal: 1800,
      protein_g: 110,
      fat_g: 70,
      carbohydrates_g: 220,
      fiber_g: 31,
    },
  };
  const goal: GoalTimelineItem = {
    goal_id: 20,
    effective_from: '2026-09-13',
    period_start: '2026-09-13',
    period_end: '2026-09-13',
    daily_calories_kcal: 2000,
    daily_protein_g: 120,
    daily_fiber_g: 30,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MealDaySummaryComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders daily totals and progress toward goals', () => {
    const fixture = TestBed.createComponent(MealDaySummaryComponent);
    fixture.componentRef.setInput('mealDate', '2026-09-13');
    fixture.componentRef.setInput('summaries', [summary]);
    fixture.componentRef.setInput('goals', new Map([[user.id, goal]]));
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Итоги за весь день');
    expect(text).toContain('Александр');
    expect(text).toContain('90%');
    expect(text).toContain('Достигнута');
  });
});
