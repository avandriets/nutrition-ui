import type { GoalTimelineItem } from '../../../shared/domain/goal.types';
import type { UserIdentity } from '../../../shared/domain/identity.types';
import type { EntityDataOperationState } from '../../../shared/types/entity-data.types';
import type { Meal, MealDayTotals, MealProduct, MealRow } from './meal.types';

export interface MealDetailLoadResult {
  meal: Meal;
  users: UserIdentity[];
  products: MealProduct[];
}

export interface MealDetailProgress {
  totals: MealDayTotals;
  goals: ReadonlyMap<number, GoalTimelineItem | null>;
}

export interface MealDetailState {
  accountId: number | null;
  meal: Meal | null;
  users: UserIdentity[];
  products: MealProduct[];
  dayTotals: MealDayTotals | null;
  goals: ReadonlyMap<number, GoalTimelineItem | null>;
  loading: boolean;
  loadingProgress: boolean;
  loadError: string | null;
  actionError: string | null;
  progressCorrelationId: string | null;
  addOperation: EntityDataOperationState | null;
  cellOperations: Readonly<Record<string, EntityDataOperationState>>;
  rowOperations: Readonly<Record<number, EntityDataOperationState>>;
}

export interface MealPortionUpdate {
  row: MealRow;
  userId: number;
  amount: number;
}
