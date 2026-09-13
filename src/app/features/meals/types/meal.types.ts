import type { MealType, NutrientValues } from '../../../shared/types';

export interface MealPayload {
  meal_date: string;
  meal_type: MealType;
  name: string | null;
}

export interface MealPortion {
  id: number;
  user_id: number;
  amount_g: number;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface MealRow extends NutrientValues {
  id: number;
  position: number;
  product_id: number | null;
  product_name: string;
  product_brand: string | null;
  portions: MealPortion[];
}

export interface Meal {
  id: number;
  account_id: number;
  meal_date: string;
  meal_type: MealType;
  name: string | null;
  rows: MealRow[];
  created_at: string;
  updated_at: string;
}

export interface MealDayCopyPayload {
  source_date: string;
  replace_existing: boolean;
}

export interface MealDay {
  account_id: number;
  meal_date: string;
  meals: Meal[];
}

export interface MealEntryPayload {
  user_id: number;
  product_id: number;
  amount_g: number;
  version: number | null;
}

export interface MealEntryBatchPayload {
  entries: MealEntryPayload[];
}

export interface UserDailyTotal extends NutrientValues {
  user_id: number;
}

export interface MealDayTotals {
  account_id: number;
  meal_date: string;
  users: UserDailyTotal[];
}
