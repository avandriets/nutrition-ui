export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'other';

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

export interface MealRow {
  id: number;
  position: number;
  product_id: number | null;
  product_name: string;
  product_brand: string | null;
  calories_kcal: number;
  protein_g: number;
  fat_g: number;
  carbohydrates_g: number;
  fiber_g: number;
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

export interface MealProduct {
  id: number;
  name: string;
  brand: string | null;
  category: string | null;
}

export interface MealUser {
  id: number;
  account_id: number;
  name: string;
}

export interface UserDailyTotal {
  user_id: number;
  calories_kcal: number;
  protein_g: number;
  fat_g: number;
  carbohydrates_g: number;
  fiber_g: number;
}

export interface MealDayTotals {
  account_id: number;
  meal_date: string;
  users: UserDailyTotal[];
}

export interface GoalTimelineItem {
  goal_id: number;
  daily_calories_kcal: number;
  daily_protein_g: number;
  daily_fiber_g: number;
  effective_from: string;
  period_start: string;
  period_end: string;
}

export interface GoalTimelineResponse {
  user_id: number;
  date_from: string;
  date_to: string;
  periods: GoalTimelineItem[];
}

export interface NutrientTotals {
  calories_kcal: number;
  protein_g: number;
  fat_g: number;
  carbohydrates_g: number;
  fiber_g: number;
}
