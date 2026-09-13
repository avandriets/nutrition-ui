import { registerLocaleData } from '@angular/common';
import localeRu from '@angular/common/locales/ru';
import { TestBed } from '@angular/core/testing';

import type { UserMeasurement } from '../../types/family.types';
import { MeasurementHistoryComponent } from './measurement-history';

registerLocaleData(localeRu);

describe('MeasurementHistoryComponent', () => {
  const measurement: UserMeasurement = {
    id: 1,
    user_id: 10,
    measured_on: '2026-09-13',
    weight_kg: 80.5,
    neck_cm: 38,
    waist_cm: 84,
    hips_cm: 96,
    created_at: '2026-09-13T00:00:00Z',
    updated_at: '2026-09-13T00:00:00Z',
  };

  it('renders measurements and emits table actions', () => {
    const fixture = TestBed.configureTestingModule({ imports: [MeasurementHistoryComponent] }).createComponent(MeasurementHistoryComponent);
    fixture.componentRef.setInput('measurements', [measurement]);
    let edited: UserMeasurement | undefined;
    let deleted: UserMeasurement | undefined;
    fixture.componentInstance.editRequested.subscribe(value => (edited = value));
    fixture.componentInstance.deleteRequested.subscribe(value => (deleted = value));
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    buttons[0].click();
    buttons[1].click();

    expect(fixture.nativeElement.textContent).toContain('80.5');
    expect(edited).toBe(measurement);
    expect(deleted).toBe(measurement);
  });

  it('disables actions only for pending measurements', () => {
    const secondMeasurement = { ...measurement, id: 2 };
    const fixture = TestBed.configureTestingModule({ imports: [MeasurementHistoryComponent] }).createComponent(MeasurementHistoryComponent);
    fixture.componentRef.setInput('measurements', [measurement, secondMeasurement]);
    fixture.componentRef.setInput('pendingIds', new Set([measurement.id]));
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    expect(buttons[0].disabled).toBe(true);
    expect(buttons[1].disabled).toBe(true);
    expect(buttons[2].disabled).toBe(false);
    expect(buttons[3].disabled).toBe(false);
  });
});
