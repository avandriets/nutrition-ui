import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import type { GoalTimelineResponse, UserIdentity } from '../../../shared/types';
import type { Meal, MealDay, MealDayCopyPayload, MealDayTotals, MealEntryBatchPayload, MealEntryPayload, MealPayload } from '../types/meal.types';

@Injectable()
export class MealsApiService {
  private readonly http = inject(HttpClient);

  listMeals(accountId: number, mealDate?: string): Observable<Meal[]> {
    const params = mealDate ? new HttpParams().set('meal_date', mealDate) : undefined;
    return this.http.get<Meal[]>(`/api/accounts/${accountId}/meals`, { params });
  }

  getMeal(accountId: number, mealId: number): Observable<Meal> {
    return this.http.get<Meal>(`/api/accounts/${accountId}/meals/${mealId}`);
  }

  createMeal(accountId: number, payload: MealPayload): Observable<Meal> {
    return this.http.post<Meal>(`/api/accounts/${accountId}/meals`, payload);
  }

  copyMealDay(accountId: number, targetDate: string, payload: MealDayCopyPayload): Observable<MealDay> {
    return this.http.post<MealDay>(`/api/accounts/${accountId}/meal-days/${targetDate}/copy`, payload);
  }

  upsertEntry(accountId: number, mealId: number, payload: MealEntryPayload): Observable<unknown> {
    return this.http.put(`/api/accounts/${accountId}/meals/${mealId}/entries`, payload);
  }

  upsertEntries(accountId: number, mealId: number, payload: MealEntryBatchPayload): Observable<unknown> {
    return this.http.put(`/api/accounts/${accountId}/meals/${mealId}/entries/batch`, payload);
  }

  deleteEntry(accountId: number, mealId: number, entryId: number): Observable<void> {
    return this.http.delete<void>(`/api/accounts/${accountId}/meals/${mealId}/entries/${entryId}`);
  }

  listUsers(accountId: number): Observable<UserIdentity[]> {
    return this.http.get<UserIdentity[]>(`/api/accounts/${accountId}/users`);
  }

  getGoalForDate(accountId: number, userId: number, mealDate: string): Observable<GoalTimelineResponse> {
    const params = new HttpParams().set('date_from', mealDate).set('date_to', mealDate);
    return this.http.get<GoalTimelineResponse>(`/api/accounts/${accountId}/users/${userId}/goals/timeline`, { params });
  }

  getDayTotals(accountId: number, mealDate: string): Observable<MealDayTotals> {
    return this.http.get<MealDayTotals>(`/api/accounts/${accountId}/meal-days/${mealDate}/totals`);
  }
}
