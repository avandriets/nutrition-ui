import { registerLocaleData } from '@angular/common';
import localeRu from '@angular/common/locales/ru';
import { TestBed } from '@angular/core/testing';

import type { UserMeasurement } from '../../types/family.types';
import { MeasurementSummaryComponent } from './measurement-summary';

registerLocaleData(localeRu);

describe('MeasurementSummaryComponent', () => {
  it('renders the latest measurement values', () => {
    const measurement: UserMeasurement = {
      id: 1,
      user_id: 2,
      measured_on: '2026-09-13',
      weight_kg: 81.5,
      neck_cm: 39,
      waist_cm: 88,
      hips_cm: 96,
      created_at: '2026-09-13T00:00:00Z',
      updated_at: '2026-09-13T00:00:00Z',
    };
    const fixture = TestBed.createComponent(MeasurementSummaryComponent);
    fixture.componentRef.setInput('measurement', measurement);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('81.5');
    expect(fixture.nativeElement.textContent).toContain('88');
  });
});
