import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FamilyUser, GoalTimelineResponse } from './family.models';
import { DiaryDayTotals, DiaryMeal } from './family-diary.models';

@Injectable()
export class FamilyDiaryApiService {
  private readonly http = inject(HttpClient);

  getUser(accountId: number, userId: number): Observable<FamilyUser> {
    return this.http.get<FamilyUser>(`/api/accounts/${accountId}/users/${userId}`);
  }

  listMeals(accountId: number, mealDate: string): Observable<DiaryMeal[]> {
    const params = new HttpParams().set('meal_date', mealDate);
    return this.http.get<DiaryMeal[]>(`/api/accounts/${accountId}/meals`, { params });
  }

  getDayTotals(accountId: number, mealDate: string): Observable<DiaryDayTotals> {
    return this.http.get<DiaryDayTotals>(`/api/accounts/${accountId}/meal-days/${mealDate}/totals`);
  }

  getGoalForDate(
    accountId: number,
    userId: number,
    diaryDate: string,
  ): Observable<GoalTimelineResponse> {
    const params = new HttpParams().set('date_from', diaryDate).set('date_to', diaryDate);
    return this.http.get<GoalTimelineResponse>(
      `/api/accounts/${accountId}/users/${userId}/goals/timeline`,
      { params },
    );
  }
}
