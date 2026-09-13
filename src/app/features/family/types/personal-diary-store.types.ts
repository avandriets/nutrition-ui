import type { GoalTimelineItem, NutrientValues } from '../../../shared/types';
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

export type PersonalDiaryMealRowView = Omit<DiaryMealRow, keyof NutrientValues | 'portions'> &
  NutrientValues & {
    portion_g: number;
  };

export interface PersonalDiaryMealView {
  meal: DiaryMeal;
  rows: PersonalDiaryMealRowView[];
  totals: NutrientValues;
}
