import type { MealType } from '../types/meal.types';

interface MealTypeMetadata {
  label: string;
  icon: string;
}

export const MEAL_TYPE_METADATA: Readonly<Record<MealType, MealTypeMetadata>> = {
  breakfast: { label: 'Завтрак', icon: 'bakery_dining' },
  lunch: { label: 'Обед', icon: 'lunch_dining' },
  dinner: { label: 'Ужин', icon: 'dinner_dining' },
  other: { label: 'Другое', icon: 'restaurant' },
};

export function mealTypeLabel(type: MealType): string {
  return MEAL_TYPE_METADATA[type].label;
}

export function mealTypeIcon(type: MealType): string {
  return MEAL_TYPE_METADATA[type].icon;
}
