import { type as eventPayload } from '@ngrx/signals';
import type { EntityId } from '@ngrx/signals/entities';
import { eventGroup } from '@ngrx/signals/events';

import type { EntityDataFailure, EntityDataPage, EntityDataSuccess } from '../../types/entity-data.types';
import type { Product } from '../../types/product.types';

export const productsEvents = eventGroup({
  source: 'Products API',
  events: {
    loaded: eventPayload<EntityDataSuccess<EntityDataPage<Product>>>(),
    loadFailed: eventPayload<EntityDataFailure>(),
    retrieved: eventPayload<EntityDataSuccess<Product>>(),
    retrieveFailed: eventPayload<EntityDataFailure>(),
    created: eventPayload<EntityDataSuccess<Product>>(),
    createFailed: eventPayload<EntityDataFailure>(),
    updated: eventPayload<EntityDataSuccess<Product>>(),
    updateFailed: eventPayload<EntityDataFailure>(),
    removed: eventPayload<EntityDataSuccess<EntityId>>(),
    removeFailed: eventPayload<EntityDataFailure>(),
  },
});
