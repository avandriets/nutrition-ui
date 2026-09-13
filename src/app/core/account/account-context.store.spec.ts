import { TestBed } from '@angular/core/testing';

import { AccountContextStore } from './account-context.store';

describe('AccountContextStore', () => {
  const account = { id: 10, name: 'Семья' };
  const members = [
    { id: 1, name: 'Александр' },
    { id: 2, name: 'Мария' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [AccountContextStore] });
  });

  it('stores the account and selects the first available member', () => {
    const store = TestBed.inject(AccountContextStore);

    store.setAccount(account);
    store.setMembers(members);

    expect(store.account()).toEqual(account);
    expect(store.activeUserId()).toBe(members[0].id);
    expect(store.activeUser()).toEqual(members[0]);
  });

  it('preserves a valid selection and replaces a removed one', () => {
    const store = TestBed.inject(AccountContextStore);
    store.setMembers(members);
    store.selectUser(members[1].id);

    store.setMembers([...members]);
    expect(store.activeUser()).toEqual(members[1]);

    store.setMembers([members[0]]);
    expect(store.activeUser()).toEqual(members[0]);
  });

  it('ignores unknown users and can reset the global context', () => {
    const store = TestBed.inject(AccountContextStore);
    store.setAccount(account);
    store.setMembers(members);

    store.selectUser(999);
    expect(store.activeUserId()).toBe(members[0].id);

    store.reset();
    expect(store.account()).toBeNull();
    expect(store.members()).toEqual([]);
    expect(store.activeUser()).toBeNull();
  });
});
