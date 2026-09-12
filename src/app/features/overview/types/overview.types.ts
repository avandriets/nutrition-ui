import type { DailyNutritionTarget } from '../../../shared/domain/goal.types';
import type { MealType } from '../../../shared/domain/meal.types';
import type { NutrientValues } from '../../../shared/domain/nutrition.types';

export interface OverviewMealPortion {
  user_id: number;
  amount_g: number;
}

export interface OverviewMealRow extends NutrientValues {
  product_name: string;
  portions: OverviewMealPortion[];
}

export interface OverviewMeal {
  id: number;
  meal_date: string;
  meal_type: MealType;
  name: string | null;
  rows: OverviewMealRow[];
}

export type OverviewGoal = DailyNutritionTarget;

export interface OverviewMealSummary {
  meal: OverviewMeal;
  products: string;
  totals: NutrientValues;
}

export interface OverviewNutrient {
  name: string;
  value: number;
  target: number | null;
  color: string;
  percent: number | null;
}
