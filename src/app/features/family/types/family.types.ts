import type { DailyNutritionTarget } from '../../../shared/domain/goal.types';
import type { UserIdentity } from '../../../shared/domain/identity.types';

export interface Account {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyUser extends UserIdentity {
  birth_date: string | null;
  height_cm: number | null;
  created_at: string;
  updated_at: string;
}

export interface UserPayload {
  name: string;
  birth_date: string | null;
  height_cm: number | null;
}

export interface UserGoal extends DailyNutritionTarget {
  id: number;
  user_id: number;
  effective_from: string;
  created_at: string;
  updated_at: string;
}

export interface GoalPayload extends DailyNutritionTarget {
  effective_from: string;
}

export interface UserMeasurement {
  id: number;
  user_id: number;
  measured_on?: string;
  weight_kg?: number | null;
  neck_cm?: number | null;
  waist_cm?: number | null;
  hips_cm?: number | null;
  created_at: string;
  updated_at: string;
}

export interface MeasurementPayload {
  measured_on: string;
  weight_kg: number | null;
  neck_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
}
