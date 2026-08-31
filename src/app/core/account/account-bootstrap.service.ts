import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of, shareReplay, switchMap, tap } from 'rxjs';
import { AccountContextService, AccountIdentity } from './account-context.service';

const DEFAULT_ACCOUNT_NAME = 'Наша семья';

@Injectable({ providedIn: 'root' })
export class AccountBootstrapService {
  private readonly http = inject(HttpClient);
  private readonly context = inject(AccountContextService);
  private readonly account$ = this.loadOrCreateAccount().pipe(
    tap((account) => this.context.setAccount(account)),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  ensureAccount(): Observable<AccountIdentity> {
    return this.account$;
  }

  private loadOrCreateAccount(): Observable<AccountIdentity> {
    const params = new HttpParams().set('skip', 0).set('limit', 1);
    return this.http
      .get<AccountIdentity[]>('/api/accounts', { params })
      .pipe(
        switchMap((accounts) =>
          accounts[0]
            ? of(accounts[0])
            : this.http.post<AccountIdentity>('/api/accounts', { name: DEFAULT_ACCOUNT_NAME }),
        ),
      );
  }
}
