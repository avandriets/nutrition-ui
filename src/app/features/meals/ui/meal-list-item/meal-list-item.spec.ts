import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import type { FamilyMemberIdentity } from '../../../../core/account/account.types';
import type { Meal } from '../../types/meal.types';
import { MealListItemComponent } from './meal-list-item';

describe('MealListItemComponent', () => {
  const user: FamilyMemberIdentity = {
    id: 1,
    name: 'Александр',
  };
  const meal: Meal = {
    id: 20,
    account_id: 10,
    meal_date: '2026-09-13',
    meal_type: 'breakfast',
    name: 'Завтрак',
    rows: [
      {
        id: 30,
        position: 0,
        product_id: 40,
        product_name: 'Овсянка',
        product_brand: null,
        calories_kcal: 200,
        protein_g: 6,
        fat_g: 4,
        carbohydrates_g: 30,
        fiber_g: 3,
        portions: [
          {
            id: 50,
            user_id: user.id,
            amount_g: 150,
            version: 1,
            created_at: '2026-09-13T00:00:00Z',
            updated_at: '2026-09-13T00:00:00Z',
          },
        ],
      },
    ],
    created_at: '2026-09-13T00:00:00Z',
    updated_at: '2026-09-13T00:00:00Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MealListItemComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders meal details and calories for every user', () => {
    const fixture = TestBed.createComponent(MealListItemComponent);
    fixture.componentRef.setInput('meal', meal);
    fixture.componentRef.setInput('users', [user]);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Завтрак');
    expect(text).toContain('Александр');
    expect(text).toContain('300');
    expect(text).toContain('ккал');
  });
});
