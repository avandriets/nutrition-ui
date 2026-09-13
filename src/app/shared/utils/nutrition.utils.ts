import type { NutrientValues } from '../types/nutrition.types';

export function emptyNutrientValues(): NutrientValues {
  return {
    calories_kcal: 0,
    protein_g: 0,
    fat_g: 0,
    carbohydrates_g: 0,
    fiber_g: 0,
  };
}
