import type { EntityId } from '@ngrx/signals/entities';
import type { Observable } from 'rxjs';

export interface EntityDataAdapter<TEntity, TCreate, TLoadParams = void, TUpdate = TCreate> {
  load(params: TLoadParams): Observable<TEntity[]>;
  create(payload: TCreate): Observable<TEntity>;
  update(id: EntityId, payload: TUpdate): Observable<TEntity>;
  remove(id: EntityId): Observable<void>;
}

export interface EntityDataErrors {
  load: string;
  create: string;
  update: string;
  remove: string;
}

export interface EntityDataConfig<TEntity, TCreate, TLoadParams = void, TUpdate = TCreate> {
  adapter: () => EntityDataAdapter<TEntity, TCreate, TLoadParams, TUpdate>;
  errors: EntityDataErrors;
}

export interface EntityDataState {
  loading: boolean;
  loaded: boolean;
  saving: boolean;
  error: string | null;
  actionError: string | null;
}

export interface EntityDataUpdate<TUpdate> {
  id: EntityId;
  payload: TUpdate;
}
