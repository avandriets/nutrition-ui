import type { MealType } from '../../../shared/domain/meal.types';
import type { NutrientValues } from '../../../shared/domain/nutrition.types';

export interface DiaryPortion {
  user_id: number;
  amount_g: number;
}

export interface DiaryMealRow extends NutrientValues {
  id: number;
  product_name: string;
  product_brand: string | null;
  portions: DiaryPortion[];
}

export interface DiaryMeal {
  id: number;
  meal_date: string;
  meal_type: MealType;
  name: string | null;
  rows: DiaryMealRow[];
}

export interface DiaryUserDayTotal extends NutrientValues {
  user_id: number;
}

export interface DiaryDayTotals {
  users: DiaryUserDayTotal[];
}
