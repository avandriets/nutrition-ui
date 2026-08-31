import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly authenticatedState = signal(true);

  readonly authenticated = this.authenticatedState.asReadonly();

  login(): void {
    this.authenticatedState.set(true);
  }

  logout(): void {
    this.authenticatedState.set(false);
  }
}
