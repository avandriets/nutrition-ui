export type TimelineGranularity = 'day' | 'week' | 'month';
export type StatisticsMetric =
  'calories_kcal' | 'protein_g' | 'fat_g' | 'carbohydrates_g' | 'fiber_g';

export interface StatisticsUser {
  id: number;
  account_id: number;
  name: string;
}

export interface NutrientValues {
  calories_kcal: number;
  protein_g: number;
  fat_g: number;
  carbohydrates_g: number;
  fiber_g: number;
}

export interface UserDailyTotal extends NutrientValues {
  user_id: number;
}

export interface MealDayTotals {
  account_id: number;
  meal_date: string;
  users: UserDailyTotal[];
}

export interface GoalTarget {
  goal_id: number;
  daily_calories_kcal: number;
  daily_protein_g: number;
  daily_fiber_g: number;
  effective_from: string;
}

export interface GoalTimelineItem extends GoalTarget {
  period_start: string;
  period_end: string;
}

export interface GoalRecord {
  id: number;
  user_id: number;
  daily_calories_kcal: number;
  daily_protein_g: number;
  daily_fiber_g: number;
  effective_from: string;
  created_at: string;
  updated_at: string;
}

export interface GoalTimelineResponse {
  user_id: number;
  date_from: string;
  date_to: string;
  periods: GoalTimelineItem[];
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
  user: StatisticsUser;
  totals: UserDailyTotal;
  goal: GoalTarget | null;
  goalIsFallback: boolean;
}

export interface AverageReport {
  user: StatisticsUser;
  average: NutritionAverage;
}

export interface TimelineReport {
  user: StatisticsUser;
  timeline: NutritionTimelineResponse;
}
