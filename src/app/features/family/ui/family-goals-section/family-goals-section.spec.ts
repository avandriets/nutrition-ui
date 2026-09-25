import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import type { UIStateStatus } from '../../../../shared/types';
import { FamilyGoalsSectionComponent } from './family-goals-section';

describe('FamilyGoalsSectionComponent', () => {
  it('renders the container empty state and emits add requests', () => {
    const state: UIStateStatus<string> = { resolved: true, rejected: false, pending: false, err: null, empty: true };
    const fixture = TestBed.createComponent(FamilyGoalsSectionComponent);
    const addRequested = vi.fn();
    fixture.componentRef.setInput('state', state);
    fixture.componentRef.setInput('activeGoalState', state);
    fixture.componentRef.setInput('goals', []);
    fixture.componentInstance.addRequested.subscribe(addRequested);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No goal set yet');
    (fixture.nativeElement.querySelector('.empty-goal button') as HTMLButtonElement).click();
    expect(addRequested).toHaveBeenCalledOnce();
  });
});
