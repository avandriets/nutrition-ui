export interface DailyNutritionTarget {
  daily_calories_kcal: number;
  daily_protein_g: number;
  daily_fiber_g: number;
}

export interface GoalTimelineItem extends DailyNutritionTarget {
  goal_id: number;
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
