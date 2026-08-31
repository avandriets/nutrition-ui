export interface Account {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyUser {
  id: number;
  account_id: number;
  name: string;
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

export interface UserGoal {
  id: number;
  user_id: number;
  daily_calories_kcal: number;
  daily_protein_g: number;
  daily_fiber_g: number;
  effective_from: string;
  created_at: string;
  updated_at: string;
}

export interface GoalPayload {
  daily_calories_kcal: number;
  daily_protein_g: number;
  daily_fiber_g: number;
  effective_from: string;
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
