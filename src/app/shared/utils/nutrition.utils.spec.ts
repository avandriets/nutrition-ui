import { describe, expect, it } from 'vitest';

import { emptyNutrientValues } from './nutrition.utils';

describe('nutrition utils', () => {
  it('creates independent zeroed nutrient values', () => {
    const first = emptyNutrientValues();
    const second = emptyNutrientValues();

    expect(first).toEqual({ calories_kcal: 0, protein_g: 0, fat_g: 0, carbohydrates_g: 0, fiber_g: 0 });
    expect(first).not.toBe(second);
  });
});
