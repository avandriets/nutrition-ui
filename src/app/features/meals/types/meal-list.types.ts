import type { MealDayCopyPayload } from './meal.types';

export interface MealListParams {
  mealDate?: string;
}

export interface MealDayCopyRequest {
  targetDate: string;
  payload: MealDayCopyPayload;
}

export interface MealDayCopyDialogData {
  sourceDate: string;
}

export interface MealDayCopyDialogResult {
  source_date: string;
  target_date: string;
  replace_existing: boolean;
}

export interface MealListRouteState {
  date: string;
  create: boolean;
  copy: string | null;
}
