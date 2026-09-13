import type { AccountIdentity, FamilyMemberIdentity } from './account.types';

export interface AccountContextState {
  account: AccountIdentity | null;
  members: readonly FamilyMemberIdentity[];
  activeUserId: number | null;
}
