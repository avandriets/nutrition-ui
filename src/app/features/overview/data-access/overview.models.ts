export type OverviewMealType = 'breakfast' | 'lunch' | 'dinner' | 'other';

export interface OverviewNutrientTotals {
  calories_kcal: number;
  protein_g: number;
  fat_g: number;
  carbohydrates_g: number;
  fiber_g: number;
}

export interface OverviewUser {
  id: number;
  account_id: number;
  name: string;
}

export interface OverviewMealPortion {
  user_id: number;
  amount_g: number;
}

export interface OverviewMealRow {
  product_name: string;
  calories_kcal: number;
  protein_g: number;
  fat_g: number;
  carbohydrates_g: number;
  fiber_g: number;
  portions: OverviewMealPortion[];
}

export interface OverviewMeal {
  id: number;
  meal_date: string;
  meal_type: OverviewMealType;
  name: string | null;
  rows: OverviewMealRow[];
}

export interface OverviewGoal {
  daily_calories_kcal: number;
  daily_protein_g: number;
  daily_fiber_g: number;
}

export interface OverviewMealSummary {
  meal: OverviewMeal;
  products: string;
  totals: OverviewNutrientTotals;
}

export interface OverviewNutrient {
  name: string;
  value: number;
  target: number | null;
  color: string;
  percent: number | null;
}
