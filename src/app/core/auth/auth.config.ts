import { AuthConfig } from '@auth0/auth0-angular';

export const AUTH0_RETURN_URI = 'http://localhost:4200/';
export const AUTH0_AUDIENCE = 'https://nutrition-api';

export const auth0Config: AuthConfig = {
  domain: 'dev-oqmeiat8opcvxeul.us.auth0.com',
  clientId: 'ZwF4cKnd0QdMUp3oorGmYFhAsfsI0yWB',
  authorizationParams: {
    redirect_uri: AUTH0_RETURN_URI,
    audience: AUTH0_AUDIENCE,
  },
  httpInterceptor: {
    allowedList: ['/api', '/api/*'],
  },
};
