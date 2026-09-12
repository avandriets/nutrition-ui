import type { Signal } from '@angular/core';
import { computed } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import type { EmptyFeatureResult, SignalStoreFeature } from '@ngrx/signals';
import { patchState, signalStoreFeature, withComputed, withMethods, withState } from '@ngrx/signals';
import type { EntityId, EntityProps, EntityState } from '@ngrx/signals/entities';
import { prependEntity, removeEntity, setAllEntities, setEntity, withEntities } from '@ngrx/signals/entities';
import type { Observable } from 'rxjs';

import type { EntityDataConfig, EntityDataState, EntityDataUpdate } from '../../types/entity-data.types';
import type { UIStateStatus } from '../../types/state-container.types';

const initialState: EntityDataState = {
  loading: false,
  loaded: false,
  saving: false,
  error: null,
  actionError: null,
};

interface EntityDataFeatureResult<TEntity, TCreate, TUpdate, TLoadParams> {
  state: EntityState<TEntity> & EntityDataState;
  props: EntityProps<TEntity> & { entityState: Signal<UIStateStatus<string>> };
  methods: {
    load(params: TLoadParams): Observable<TEntity[]>;
    create(payload: TCreate): Observable<TEntity>;
    update(update: EntityDataUpdate<TUpdate>): Observable<TEntity>;
    remove(id: EntityId): Observable<void>;
    dismissActionError(): void;
  };
}

export const withEntityData = <TEntity extends { id: EntityId }, TCreate, TLoadParams = void, TUpdate = TCreate>(
  config: EntityDataConfig<TEntity, TCreate, TLoadParams, TUpdate>,
): SignalStoreFeature<EmptyFeatureResult, EntityDataFeatureResult<TEntity, TCreate, TUpdate, TLoadParams>> =>
  signalStoreFeature(
    withEntities<TEntity>(),
    withState(initialState),
    withComputed(store => ({
      entityState: computed<UIStateStatus<string>>(() => ({
        resolved: store.loaded() && !store.error(),
        rejected: !!store.error(),
        pending: store.loading(),
        err: store.error(),
        empty: store.loaded() && !store.entities().length,
      })),
    })),
    withMethods(store => {
      const adapter = config.adapter();

      return {
        load(params: TLoadParams): Observable<TEntity[]> {
          patchState(store, { loading: true, error: null });

          return adapter.load(params).pipe(
            tapResponse({
              next: entities => patchState(store, setAllEntities(entities), { loaded: true }),
              error: () => patchState(store, { loaded: false, error: config.errors.load }),
              finalize: () => patchState(store, { loading: false }),
            }),
          );
        },

        create(payload: TCreate): Observable<TEntity> {
          patchState(store, { saving: true, actionError: null });

          return adapter.create(payload).pipe(
            tapResponse({
              next: entity => patchState(store, prependEntity(entity)),
              error: () => patchState(store, { actionError: config.errors.create }),
              finalize: () => patchState(store, { saving: false }),
            }),
          );
        },

        update({ id, payload }: EntityDataUpdate<TUpdate>): Observable<TEntity> {
          patchState(store, { saving: true, actionError: null });

          return adapter.update(id, payload).pipe(
            tapResponse({
              next: entity => patchState(store, setEntity(entity)),
              error: () => patchState(store, { actionError: config.errors.update }),
              finalize: () => patchState(store, { saving: false }),
            }),
          );
        },

        remove(id: EntityId): Observable<void> {
          patchState(store, { saving: true, actionError: null });

          return adapter.remove(id).pipe(
            tapResponse({
              next: () => patchState(store, removeEntity(id)),
              error: () => patchState(store, { actionError: config.errors.remove }),
              finalize: () => patchState(store, { saving: false }),
            }),
          );
        },

        dismissActionError(): void {
          patchState(store, { actionError: null });
        },
      };
    }),
  );
