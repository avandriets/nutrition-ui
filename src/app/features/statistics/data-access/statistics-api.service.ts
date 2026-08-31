import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  GoalRecord,
  GoalTimelineResponse,
  MealDayTotals,
  NutritionAverage,
  NutritionTimelineResponse,
  StatisticsUser,
  TimelineGranularity,
} from './statistics.models';

@Injectable()
export class StatisticsApiService {
  private readonly http = inject(HttpClient);

  listUsers(accountId: number): Observable<StatisticsUser[]> {
    return this.http.get<StatisticsUser[]>(`/api/accounts/${accountId}/users`);
  }

  getDayTotals(accountId: number, date: string): Observable<MealDayTotals> {
    return this.http.get<MealDayTotals>(`/api/accounts/${accountId}/meal-days/${date}/totals`);
  }

  getGoalForDate(
    accountId: number,
    userId: number,
    date: string,
  ): Observable<GoalTimelineResponse> {
    const params = new HttpParams().set('date_from', date).set('date_to', date);
    return this.http.get<GoalTimelineResponse>(
      `/api/accounts/${accountId}/users/${userId}/goals/timeline`,
      { params },
    );
  }

  listGoals(accountId: number, userId: number): Observable<GoalRecord[]> {
    return this.http.get<GoalRecord[]>(`/api/accounts/${accountId}/users/${userId}/goals`);
  }

  getNutritionAverage(
    accountId: number,
    userId: number,
    dateFrom: string,
    dateTo: string,
    includeEmptyDays: boolean,
  ): Observable<NutritionAverage> {
    const params = this.periodParams(dateFrom, dateTo, includeEmptyDays);
    return this.http.get<NutritionAverage>(
      `/api/accounts/${accountId}/users/${userId}/statistics/nutrition/average`,
      { params },
    );
  }

  getNutritionTimeline(
    accountId: number,
    userId: number,
    dateFrom: string,
    dateTo: string,
    granularity: TimelineGranularity,
    includeEmptyDays: boolean,
  ): Observable<NutritionTimelineResponse> {
    const params = this.periodParams(dateFrom, dateTo, includeEmptyDays).set(
      'granularity',
      granularity,
    );
    return this.http.get<NutritionTimelineResponse>(
      `/api/accounts/${accountId}/users/${userId}/statistics/nutrition/timeline`,
      { params },
    );
  }

  private periodParams(dateFrom: string, dateTo: string, includeEmptyDays: boolean): HttpParams {
    return new HttpParams()
      .set('date_from', dateFrom)
      .set('date_to', dateTo)
      .set('include_empty_days', includeEmptyDays);
  }
}
