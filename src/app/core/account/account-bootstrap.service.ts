import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { of, shareReplay, switchMap, tap } from 'rxjs';

import type { AccountIdentity } from './account.types';
import { AccountContextStore } from './account-context.store';

const DEFAULT_ACCOUNT_NAME = 'Наша семья';

@Injectable({ providedIn: 'root' })
export class AccountBootstrapService {
  private readonly http = inject(HttpClient);
  private readonly context = inject(AccountContextStore);
  private readonly account$ = this.loadOrCreateAccount().pipe(
    tap(account => this.context.setAccount(account)),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  ensureAccount(): Observable<AccountIdentity> {
    return this.account$;
  }

  private loadOrCreateAccount(): Observable<AccountIdentity> {
    const params = new HttpParams().set('skip', 0).set('limit', 1);

    return this.http.get<AccountIdentity[]>('/api/accounts', { params }).pipe(
      switchMap(accounts => {
        const [account] = accounts;

        if (account) {
          return of(account);
        }

        return this.http.post<AccountIdentity>('/api/accounts', {
          name: DEFAULT_ACCOUNT_NAME,
        });
      }),
    );
  }
}
