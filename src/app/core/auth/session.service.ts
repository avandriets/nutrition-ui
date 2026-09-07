import { inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '@auth0/auth0-angular';
import { AUTH0_RETURN_URI } from './auth.config';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly auth = inject(AuthService);

  readonly authenticated = toSignal(this.auth.isAuthenticated$, { initialValue: false });
  readonly loading = toSignal(this.auth.isLoading$, { initialValue: true });
  readonly error = toSignal(this.auth.error$, { initialValue: null });

  login(): void {
    this.auth.loginWithRedirect();
  }

  logout(): void {
    this.auth.logout({ logoutParams: { returnTo: AUTH0_RETURN_URI } });
  }
}
