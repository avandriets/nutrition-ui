import type { MealType } from '../types/meal.types';

interface MealTypeMetadata {
  label: string;
  icon: string;
}

export const MEAL_TYPE_METADATA: Readonly<Record<MealType, MealTypeMetadata>> = {
  breakfast: { label: 'Breakfast', icon: 'bakery_dining' },
  lunch: { label: 'Lunch', icon: 'lunch_dining' },
  dinner: { label: 'Dinner', icon: 'dinner_dining' },
  other: { label: 'Other', icon: 'restaurant' },
};

export function mealTypeLabel(type: MealType): string {
  return MEAL_TYPE_METADATA[type].label;
}

export function mealTypeIcon(type: MealType): string {
  return MEAL_TYPE_METADATA[type].icon;
}
