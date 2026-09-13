import type { UserIdentity } from '../../../shared/domain/identity.types';
import type { OverviewMeal } from './overview.types';

export interface OverviewDataParams {
  mealDate: string;
}

export interface OverviewData {
  accountId: number;
  users: UserIdentity[];
  meals: OverviewMeal[];
}

export interface OverviewGoalParams {
  accountId: number;
  userId: number;
}
