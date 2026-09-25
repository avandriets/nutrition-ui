import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import localeEn from '@angular/common/locales/en';
import type { ApplicationConfig } from '@angular/core';
import { LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { authHttpInterceptorFn, provideAuth0 } from '@auth0/auth0-angular';

import { routes } from './app.routes';
import { auth0Config } from './core/auth/auth.config';

registerLocaleData(localeEn);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAuth0(auth0Config),
    provideHttpClient(withInterceptors([authHttpInterceptorFn])),
    provideRouter(routes),
    { provide: LOCALE_ID, useValue: 'en-US' },
  ],
};
