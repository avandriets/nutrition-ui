import { inject } from '@angular/core';
import { signalStore } from '@ngrx/signals';
import { map } from 'rxjs';

import { AccountContextStore } from '../../../core/account/account-context.store';
import { withEntityData } from '../../../shared/data-access/entity-data/with-entity-data';
import type { EntityDataAdapter, EntityDataProcessors } from '../../../shared/types';
import type { MeasurementPayload, UserMeasurement } from '../types/family.types';
import type { UserScopedLoadParams } from '../types/family-data.types';
import { FamilyApiService } from './family-api.service';

const processors: EntityDataProcessors<UserMeasurement, MeasurementPayload, UserScopedLoadParams> = {
  afterLoad: measurements =>
    [...measurements].sort((left, right) => {
      const dateOrder = (right.measured_on ?? '').localeCompare(left.measured_on ?? '');
      return dateOrder || right.id - left.id;
    }),
};

export const UserMeasurementsStore = signalStore(
  withEntityData<UserMeasurement, MeasurementPayload, UserScopedLoadParams>({
    adapter: (): EntityDataAdapter<UserMeasurement, MeasurementPayload, UserScopedLoadParams> => {
      const api = inject(FamilyApiService);
      const accountContext = inject(AccountContextStore);
      const accountId = (): number => {
        const account = accountContext.account();
        if (!account) throw new Error('Family account is not initialized');
        return account.id;
      };
      const selectedUserId = (): number => {
        const userId = accountContext.activeUserId();
        if (userId === null) throw new Error('Family user is not selected');
        return userId;
      };

      return {
        load: ({ userId }) => api.listMeasurements(accountId(), userId).pipe(map(entities => ({ entities }))),
        create: payload => api.createMeasurement(accountId(), selectedUserId(), payload),
        update: (id, payload) => api.updateMeasurement(accountId(), selectedUserId(), Number(id), payload),
        remove: id => api.deleteMeasurement(accountId(), selectedUserId(), Number(id)),
      };
    },
    errors: {
      load: 'Could not load measurement history.',
      create: 'Could not add the measurement.',
      update: 'Could not update the measurement.',
      remove: 'Could not delete the measurement.',
    },
    processors,
  }),
);
