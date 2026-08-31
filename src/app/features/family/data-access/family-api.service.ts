import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  FamilyUser,
  GoalPayload,
  MeasurementPayload,
  UserGoal,
  UserMeasurement,
  UserPayload,
} from './family.models';

@Injectable()
export class FamilyApiService {
  private readonly http = inject(HttpClient);

  listUsers(accountId: number): Observable<FamilyUser[]> {
    return this.http.get<FamilyUser[]>(`/api/accounts/${accountId}/users`);
  }

  createUser(accountId: number, payload: UserPayload): Observable<FamilyUser> {
    return this.http.post<FamilyUser>(`/api/accounts/${accountId}/users`, payload);
  }

  updateUser(accountId: number, userId: number, payload: UserPayload): Observable<FamilyUser> {
    return this.http.put<FamilyUser>(`/api/accounts/${accountId}/users/${userId}`, payload);
  }

  deleteUser(accountId: number, userId: number): Observable<void> {
    return this.http.delete<void>(`/api/accounts/${accountId}/users/${userId}`);
  }

  listGoals(accountId: number, userId: number): Observable<UserGoal[]> {
    return this.http.get<UserGoal[]>(`/api/accounts/${accountId}/users/${userId}/goals`);
  }

  createGoal(accountId: number, userId: number, payload: GoalPayload): Observable<UserGoal> {
    return this.http.post<UserGoal>(`/api/accounts/${accountId}/users/${userId}/goals`, payload);
  }

  updateGoal(
    accountId: number,
    userId: number,
    goalId: number,
    payload: GoalPayload,
  ): Observable<UserGoal> {
    return this.http.put<UserGoal>(
      `/api/accounts/${accountId}/users/${userId}/goals/${goalId}`,
      payload,
    );
  }

  listMeasurements(accountId: number, userId: number): Observable<UserMeasurement[]> {
    return this.http.get<UserMeasurement[]>(
      `/api/accounts/${accountId}/users/${userId}/measurements`,
    );
  }

  createMeasurement(
    accountId: number,
    userId: number,
    payload: MeasurementPayload,
  ): Observable<UserMeasurement> {
    return this.http.post<UserMeasurement>(
      `/api/accounts/${accountId}/users/${userId}/measurements`,
      payload,
    );
  }

  updateMeasurement(
    accountId: number,
    userId: number,
    measurementId: number,
    payload: MeasurementPayload,
  ): Observable<UserMeasurement> {
    return this.http.put<UserMeasurement>(
      `/api/accounts/${accountId}/users/${userId}/measurements/${measurementId}`,
      payload,
    );
  }

  deleteMeasurement(accountId: number, userId: number, measurementId: number): Observable<void> {
    return this.http.delete<void>(
      `/api/accounts/${accountId}/users/${userId}/measurements/${measurementId}`,
    );
  }
}
