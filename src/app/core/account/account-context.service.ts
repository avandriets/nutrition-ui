import { computed, Injectable, signal } from '@angular/core';

export interface AccountIdentity {
  id: number;
  name: string;
}

export interface FamilyMemberIdentity {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class AccountContextService {
  private readonly accountState = signal<AccountIdentity | null>(null);
  private readonly membersState = signal<FamilyMemberIdentity[]>([]);
  private readonly activeUserIdState = signal<number | null>(null);

  readonly account = this.accountState.asReadonly();
  readonly members = this.membersState.asReadonly();
  readonly activeUserId = this.activeUserIdState.asReadonly();
  readonly activeUser = computed(() => {
    const activeUserId = this.activeUserIdState();
    return this.membersState().find((member) => member.id === activeUserId) ?? null;
  });

  setAccount(account: AccountIdentity): void {
    this.accountState.set(account);
  }

  setMembers(members: FamilyMemberIdentity[]): void {
    this.membersState.set(members);
    const activeExists = members.some((member) => member.id === this.activeUserIdState());
    if (!activeExists) this.activeUserIdState.set(members[0]?.id ?? null);
  }

  selectUser(userId: number): void {
    if (this.membersState().some((member) => member.id === userId)) {
      this.activeUserIdState.set(userId);
    }
  }
}
