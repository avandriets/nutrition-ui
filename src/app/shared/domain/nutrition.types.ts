export interface NutrientValues {
  calories_kcal: number;
  protein_g: number;
  fat_g: number;
  carbohydrates_g: number;
  fiber_g: number;
}

export type NutrientKey = keyof NutrientValues;
