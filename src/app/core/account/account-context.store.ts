import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import type { AccountIdentity, FamilyMemberIdentity } from './account.types';
import type { AccountContextState } from './account-context.types';

const initialState: AccountContextState = {
  account: null,
  members: [],
  activeUserId: null,
};

export const AccountContextStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(store => ({
    activeUser: computed(() => store.members().find(member => member.id === store.activeUserId()) ?? null),
  })),
  withMethods(store => ({
    setAccount(account: AccountIdentity): void {
      patchState(store, { account });
    },

    setMembers(members: readonly FamilyMemberIdentity[]): void {
      patchState(store, state => ({
        members,
        activeUserId: members.some(member => member.id === state.activeUserId) ? state.activeUserId : (members[0]?.id ?? null),
      }));
    },

    selectUser(userId: number): void {
      if (store.members().some(member => member.id === userId)) patchState(store, { activeUserId: userId });
    },

    reset(): void {
      patchState(store, initialState);
    },
  })),
);
