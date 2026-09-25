import { describe, expect, it } from 'vitest';

import { mealTypeIcon, mealTypeLabel } from './meal.utils';

describe('meal utils', () => {
  it('provides one label and icon source for every meal type', () => {
    expect(mealTypeLabel('breakfast')).toBe('Breakfast');
    expect(mealTypeIcon('breakfast')).toBe('bakery_dining');
    expect(mealTypeLabel('other')).toBe('Other');
    expect(mealTypeIcon('other')).toBe('restaurant');
  });
});
