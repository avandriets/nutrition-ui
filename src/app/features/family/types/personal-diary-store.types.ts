import type { GoalTimelineItem } from '../../../shared/domain/goal.types';
import type { NutrientValues } from '../../../shared/domain/nutrition.types';
import type { FamilyUser } from './family.types';
import type { DiaryMeal, DiaryMealRow } from './family-diary.types';

export interface PersonalDiaryParams {
  userId: number;
  diaryDate: string;
}

export interface PersonalDiaryData {
  user: FamilyUser;
  meals: DiaryMeal[];
  goal: GoalTimelineItem | null;
  dayTotals: NutrientValues;
}

export interface PersonalDiaryMealView {
  meal: DiaryMeal;
  rows: DiaryMealRow[];
  totals: NutrientValues;
}
