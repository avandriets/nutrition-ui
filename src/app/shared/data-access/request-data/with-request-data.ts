import type { Signal } from '@angular/core';
import { computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import type { EmptyFeatureResult, SignalStoreFeature } from '@ngrx/signals';
import { patchState, signalStoreFeature, withComputed, withMethods, withState } from '@ngrx/signals';
import type { EventCreator } from '@ngrx/signals/events';
import { Dispatcher } from '@ngrx/signals/events';
import type { Observable } from 'rxjs';
import { defer, EMPTY, map } from 'rxjs';

import type { EntityDataOperationState } from '../../types/entity-data.types';
import type { RequestDataConfig, RequestDataOptions, RequestDataState } from '../../types/request-data.types';
import type { UIStateStatus } from '../../types/state-container.types';

let correlationSequence = 0;

interface RequestDataFeatureResult<TData, TParams> {
  state: RequestDataState<TData>;
  props: {
    loading: Signal<boolean>;
    requestState: Signal<UIStateStatus<string>>;
  };
  methods: {
    load(params: TParams, options?: RequestDataOptions): Observable<TData>;
    setData(data: TData): void;
    setError(error: string): void;
    dismissError(): void;
    reset(): void;
  };
}

function createCorrelationId(): string {
  correlationSequence += 1;
  return `request-${Date.now()}-${correlationSequence}`;
}

function pendingOperation(correlationId: string): EntityDataOperationState {
  return { correlationId, type: 'load', status: 'pending', error: null };
}

function completedOperation(operation: EntityDataOperationState, error: string | null): EntityDataOperationState {
  return { ...operation, status: error ? 'error' : 'success', error };
}

function pendingOperations(operations: Readonly<Record<string, EntityDataOperationState>>): EntityDataOperationState[] {
  return Object.values(operations).filter(operation => operation.status === 'pending');
}

function dispatchEvent<TPayload>(dispatcher: Dispatcher, event: EventCreator<string, TPayload> | undefined, payload: TPayload): void {
  if (event) dispatcher.dispatch(event(payload));
}

export const withRequestData = <TData, TParams = void>(
  config: RequestDataConfig<TData, TParams>,
): SignalStoreFeature<EmptyFeatureResult, RequestDataFeatureResult<TData, TParams>> => {
  const initialState: RequestDataState<TData> = {
    data: null,
    loaded: false,
    error: null,
    operations: {},
  };

  return signalStoreFeature(
    withState(initialState),
    withComputed(store => ({
      loading: computed(() => pendingOperations(store.operations()).length > 0),
      requestState: computed<UIStateStatus<string>>(() => {
        const error = store.error();
        const loading = pendingOperations(store.operations()).length > 0;
        const data = store.data();

        return {
          resolved: store.loaded() && !error,
          rejected: !!error,
          pending: loading,
          err: error,
          empty: store.loaded() && data !== null && !!config.isEmpty?.(data),
        };
      }),
    })),
    withMethods(store => {
      const adapter = config.adapter();
      const dispatcher = inject(Dispatcher);
      const isActive = (correlationId: string): boolean => store.operations()[correlationId]?.status === 'pending';

      return {
        load(params: TParams, options: RequestDataOptions = {}): Observable<TData> {
          const correlationId = options.correlationId ?? createCorrelationId();
          const concurrency = options.concurrency ?? config.concurrency ?? 'latest';

          return defer(() => {
            if (concurrency === 'exhaust' && pendingOperations(store.operations()).length) return EMPTY;

            const processedParams = config.processors?.beforeLoad?.(params) ?? params;
            patchState(store, state => ({
              error: null,
              operations:
                concurrency === 'latest'
                  ? { [correlationId]: pendingOperation(correlationId) }
                  : {
                      ...Object.fromEntries(Object.entries(state.operations).filter(([, operation]) => operation.status === 'pending')),
                      [correlationId]: pendingOperation(correlationId),
                    },
            }));
            return adapter.load(processedParams);
          }).pipe(
            map(data => config.processors?.afterLoad?.(data) ?? data),
            tapResponse({
              next: data => {
                if (!isActive(correlationId)) return;
                patchState(store, state => ({
                  data,
                  loaded: true,
                  error: null,
                  operations: {
                    ...state.operations,
                    [correlationId]: completedOperation(state.operations[correlationId], null),
                  },
                }));
                dispatchEvent(dispatcher, config.events?.loaded, { data, correlationId });
              },
              error: error => {
                if (!isActive(correlationId)) return;
                patchState(store, state => ({
                  error: config.error,
                  operations: {
                    ...state.operations,
                    [correlationId]: completedOperation(state.operations[correlationId], config.error),
                  },
                }));
                dispatchEvent(dispatcher, config.events?.loadFailed, { error, message: config.error, correlationId });
              },
              finalize: () => {
                if (!isActive(correlationId)) return;
                patchState(store, state => {
                  const operations = { ...state.operations };
                  delete operations[correlationId];
                  return { operations };
                });
              },
            }),
          );
        },

        setData(data: TData): void {
          patchState(store, { data, loaded: true, error: null });
        },

        setError(error: string): void {
          patchState(store, { error });
        },

        dismissError(): void {
          patchState(store, { error: null });
        },

        reset(): void {
          patchState(store, initialState);
        },
      };
    }),
  );
};
