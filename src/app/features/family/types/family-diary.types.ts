import type { MealType, NutrientValues } from '../../../shared/types';

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
