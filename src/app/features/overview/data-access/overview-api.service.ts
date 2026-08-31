import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OverviewGoal, OverviewMeal, OverviewUser } from './overview.models';

@Injectable()
export class OverviewApiService {
  private readonly http = inject(HttpClient);

  listUsers(accountId: number): Observable<OverviewUser[]> {
    return this.http.get<OverviewUser[]>(`/api/accounts/${accountId}/users`);
  }

  listMeals(accountId: number, mealDate: string): Observable<OverviewMeal[]> {
    const params = new HttpParams().set('meal_date', mealDate);
    return this.http.get<OverviewMeal[]>(`/api/accounts/${accountId}/meals`, { params });
  }

  getCurrentGoal(accountId: number, userId: number): Observable<OverviewGoal> {
    return this.http.get<OverviewGoal>(`/api/accounts/${accountId}/users/${userId}/goals/current`);
  }
}
