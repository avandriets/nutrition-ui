import type { DailyNutritionTarget, NutrientKey, NutrientValues, UserIdentity } from '../../../shared/types';

export type TimelineGranularity = 'day' | 'week' | 'month';
export type StatisticsMetric = NutrientKey;

export interface UserDailyTotal extends NutrientValues {
  user_id: number;
}

export interface MealDayTotals {
  account_id: number;
  meal_date: string;
  users: UserDailyTotal[];
}

export interface GoalTarget extends DailyNutritionTarget {
  goal_id: number;
  effective_from: string;
}

export interface GoalRecord extends DailyNutritionTarget {
  id: number;
  user_id: number;
  effective_from: string;
  created_at: string;
  updated_at: string;
}

export interface NutritionAverage extends NutrientValues {
  user_id: number;
  date_from: string;
  date_to: string;
  calendar_days: number;
  active_days: number;
  include_empty_days: boolean;
}

export interface NutritionTimelinePoint extends NutrientValues {
  period_start: string;
  period_end: string;
  calendar_days: number;
  active_days: number;
}

export interface NutritionTimelineResponse {
  user_id: number;
  date_from: string;
  date_to: string;
  granularity: TimelineGranularity;
  include_empty_days: boolean;
  points: NutritionTimelinePoint[];
}

export interface DailyGoalReport {
  user: UserIdentity;
  totals: UserDailyTotal;
  goal: GoalTarget | null;
  goalIsFallback: boolean;
}

export interface AverageReport {
  user: UserIdentity;
  average: NutritionAverage;
}

export interface TimelineReport {
  user: UserIdentity;
  timeline: NutritionTimelineResponse;
}
