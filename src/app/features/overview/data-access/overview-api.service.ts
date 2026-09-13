import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import type { UserIdentity } from '../../../shared/types';
import type { OverviewGoal, OverviewMeal } from '../types/overview.types';

@Injectable()
export class OverviewApiService {
  private readonly http = inject(HttpClient);

  listUsers(accountId: number): Observable<UserIdentity[]> {
    return this.http.get<UserIdentity[]>(`/api/accounts/${accountId}/users`);
  }

  listMeals(accountId: number, mealDate: string): Observable<OverviewMeal[]> {
    const params = new HttpParams().set('meal_date', mealDate);
    return this.http.get<OverviewMeal[]>(`/api/accounts/${accountId}/meals`, { params });
  }

  getCurrentGoal(accountId: number, userId: number): Observable<OverviewGoal> {
    return this.http.get<OverviewGoal>(`/api/accounts/${accountId}/users/${userId}/goals/current`);
  }
}
