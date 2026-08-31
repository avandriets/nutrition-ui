export type DiaryMealType = 'breakfast' | 'lunch' | 'dinner' | 'other';

export interface DiaryPortion {
  user_id: number;
  amount_g: number;
}

export interface DiaryMealRow {
  id: number;
  product_name: string;
  product_brand: string | null;
  calories_kcal: number;
  protein_g: number;
  fat_g: number;
  carbohydrates_g: number;
  fiber_g: number;
  portions: DiaryPortion[];
}

export interface DiaryMeal {
  id: number;
  meal_date: string;
  meal_type: DiaryMealType;
  name: string | null;
  rows: DiaryMealRow[];
}

export interface DiaryNutrients {
  calories_kcal: number;
  protein_g: number;
  fat_g: number;
  carbohydrates_g: number;
  fiber_g: number;
}

export interface DiaryUserDayTotal extends DiaryNutrients {
  user_id: number;
}

export interface DiaryDayTotals {
  users: DiaryUserDayTotal[];
}
