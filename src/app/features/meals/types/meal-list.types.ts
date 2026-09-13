import type { MealDayCopyPayload } from './meal.types';

export interface MealListParams {
  mealDate?: string;
}

export interface MealDayCopyRequest {
  targetDate: string;
  payload: MealDayCopyPayload;
}
