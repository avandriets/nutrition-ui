import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import type { UIStateStatus } from '../../../../shared/types';
import { FamilyMeasurementsSectionComponent } from './family-measurements-section';

describe('FamilyMeasurementsSectionComponent', () => {
  it('renders the container empty state and emits add requests', () => {
    const state: UIStateStatus<string> = { resolved: true, rejected: false, pending: false, err: null, empty: true };
    const fixture = TestBed.createComponent(FamilyMeasurementsSectionComponent);
    const addRequested = vi.fn();
    fixture.componentRef.setInput('state', state);
    fixture.componentRef.setInput('measurements', []);
    fixture.componentInstance.addRequested.subscribe(addRequested);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Замеров пока нет');
    (fixture.nativeElement.querySelector('.empty-measurements button') as HTMLButtonElement).click();
    expect(addRequested).toHaveBeenCalledOnce();
  });
});
