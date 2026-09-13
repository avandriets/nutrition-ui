import { TestBed } from '@angular/core/testing';

import type { MealMemberSummary } from '../../types/meal-detail.types';
import { MealSummaryComponent } from './meal-summary';

describe('MealSummaryComponent', () => {
  it('renders nutrition totals for each family member', () => {
    const summaries: readonly MealMemberSummary[] = [
      {
        user: { id: 1, account_id: 10, name: 'Александр' },
        totals: {
          calories_kcal: 640,
          protein_g: 38.5,
          fat_g: 21.2,
          carbohydrates_g: 74.8,
          fiber_g: 8.4,
        },
      },
    ];

    const fixture = TestBed.configureTestingModule({
      imports: [MealSummaryComponent],
    }).createComponent(MealSummaryComponent);

    fixture.componentRef.setInput('summaries', summaries);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain('Итоги этого приёма пищи');
    expect(content).toContain('Александр');
    expect(content).toContain('640');
  });
});
