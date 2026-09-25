import { TestBed } from '@angular/core/testing';

import type { EntityDataOperationState, UserIdentity } from '../../../../shared/types';
import type { MealRow } from '../../types/meal.types';
import type { MealPortionInputChange } from '../../types/meal-detail.types';
import { MealPortionMatrixComponent } from './meal-portion-matrix';

describe('MealPortionMatrixComponent', () => {
  const user: UserIdentity = {
    id: 1,
    account_id: 10,
    name: 'Alexander',
  };
  const row: MealRow = {
    id: 20,
    position: 0,
    product_id: 30,
    product_name: 'Apple',
    product_brand: null,
    calories_kcal: 52,
    protein_g: 0.3,
    fat_g: 0.2,
    carbohydrates_g: 14,
    fiber_g: 2.4,
    portions: [
      {
        id: 40,
        user_id: user.id,
        amount_g: 100,
        version: 1,
        created_at: '2026-09-13T00:00:00Z',
        updated_at: '2026-09-13T00:00:00Z',
      },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MealPortionMatrixComponent] }).compileComponents();
  });

  it('renders portions and emits typed editing events', () => {
    const fixture = TestBed.createComponent(MealPortionMatrixComponent);
    fixture.componentRef.setInput('rows', [row]);
    fixture.componentRef.setInput('users', [user]);
    fixture.componentRef.setInput('cellOperations', {});
    fixture.componentRef.setInput('rowOperations', {});
    let portionChange: MealPortionInputChange | undefined;
    let deletedRow: MealRow | undefined;
    fixture.componentInstance.portionChanged.subscribe(event => (portionChange = event));
    fixture.componentInstance.deleteRequested.subscribe(event => (deletedRow = event));
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input[type="number"]') as HTMLInputElement;
    input.value = '125';
    input.dispatchEvent(new Event('blur'));
    (fixture.nativeElement.querySelector('.delete-row-button') as HTMLButtonElement).click();

    expect(fixture.nativeElement.textContent).toContain('Apple');
    expect(fixture.nativeElement.textContent).toContain('Cal-52');
    expect(portionChange).toEqual({ row, userId: user.id, rawValue: '125' });
    expect(deletedRow).toBe(row);
  });

  it('blocks only the saving cell and deletion of its row', () => {
    const fixture = TestBed.createComponent(MealPortionMatrixComponent);
    const operation: EntityDataOperationState = {
      correlationId: 'update-1',
      type: 'update',
      status: 'pending',
      error: null,
    };
    fixture.componentRef.setInput('rows', [row]);
    fixture.componentRef.setInput('users', [user]);
    fixture.componentRef.setInput('cellOperations', { [`${row.id}:${user.id}`]: operation });
    fixture.componentRef.setInput('rowOperations', {});
    fixture.detectChanges();

    expect((fixture.nativeElement.querySelector('input[type="number"]') as HTMLInputElement).disabled).toBe(true);
    expect((fixture.nativeElement.querySelector('.delete-row-button') as HTMLButtonElement).disabled).toBe(true);
  });
});
