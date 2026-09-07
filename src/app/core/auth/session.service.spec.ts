import { TestBed } from '@angular/core/testing';
import { AuthService } from '@auth0/auth0-angular';
import { BehaviorSubject } from 'rxjs';
import { SessionService } from './session.service';

describe('SessionService', () => {
  const authenticated = new BehaviorSubject(false);
  const loading = new BehaviorSubject(false);
  const error = new BehaviorSubject<Error | null>(null);
  const auth = {
    isAuthenticated$: authenticated,
    isLoading$: loading,
    error$: error,
    loginWithRedirect: vi.fn(),
    logout: vi.fn(),
  };

  beforeEach(() => {
    authenticated.next(false);
    loading.next(false);
    error.next(null);
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: auth }],
    });
  });

  it('exposes the authentication state from Auth0', () => {
    const session = TestBed.inject(SessionService);

    authenticated.next(true);

    expect(session.authenticated()).toBe(true);
  });

  it('starts Auth0 authorization', () => {
    TestBed.inject(SessionService).login();

    expect(auth.loginWithRedirect).toHaveBeenCalledOnce();
  });

  it('logs out through Auth0 and returns to the configured origin', () => {
    TestBed.inject(SessionService).logout();

    expect(auth.logout).toHaveBeenCalledWith({
      logoutParams: { returnTo: 'http://localhost:4200/' },
    });
  });
});
