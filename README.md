# NutriFlow Frontend

An English-language family nutrition diary built with Angular 21, Angular Material, NgRx SignalStore, and RxJS. Manage a shared product catalog, family meals with individual portions, personal diaries, dated nutrition goals, body measurements, and nutrition statistics.

## Requirements

- Node.js 24.14 or later within version 24 (`.nvmrc` pins the development version)
- npm 11.11 or later within version 11
- The `nutrition-calendar` backend, available at `http://127.0.0.1:8000` for local development
- An Auth0 SPA application and API configured as described below
- Docker only for container builds and deployment

## Local development

Start the backend and apply its migrations first, following its README. Then run:

```bash
nvm use
npm ci
npm start
```

Open [http://localhost:4200](http://localhost:4200). The development server proxies `/api/*` to `http://127.0.0.1:8000` and strips the `/api` prefix. Edit `proxy.conf.json` to use a different backend.

The frontend uses English labels and the `en-US` locale for Angular date and number formatting. Product names and other user-entered content are displayed as stored by the API.

## Authentication

The application uses `@auth0/auth0-angular` with Authorization Code Flow and PKCE. Configure the tenant domain, SPA client ID, audience, and return URL in `src/app/core/auth/auth.config.ts` before building for a different environment.

For local development, allow these URLs in the Auth0 application:

```text
Allowed Callback URLs: http://localhost:4200/
Allowed Logout URLs:   http://localhost:4200/
Allowed Web Origins:   http://localhost:4200/
```

Create an Auth0 API with the identifier `https://nutrition-api`, matching the frontend audience and the backend `AUTH0_AUDIENCE`. The Auth0 interceptor attaches `Authorization: Bearer <access-token>` to `/api` and `/api/*` requests. Sign in again after changing the audience.

For deployment, update the return URL and Auth0 allowlists to match the public frontend URL. Authentication configuration is compiled into the frontend; changing Docker environment variables does not replace it. A SPA does not use a client secret.

## Development commands

| Command                     | Purpose                                                       |
| --------------------------- | ------------------------------------------------------------- |
| `npm start`                 | Run the development server                                    |
| `npm run build`             | Build production assets in `dist/nutrition-dashboard/browser` |
| `npm run watch`             | Rebuild development assets on changes                         |
| `npm test`                  | Run unit tests with the Angular Vitest runner                 |
| `npm test -- --watch=false` | Run unit tests once                                           |
| `npm run check`             | Check formatting, lint, and application/test types            |
| `npm run lint`              | Run ESLint for TypeScript and HTML                            |
| `npm run typecheck`         | Check application templates and TypeScript types              |
| `npm run format`            | Format the project with Prettier and HTML with js-beautify    |

Before submitting changes, run:

```bash
npm run check
npm test -- --watch=false
npm run build
```

## Application structure

- `src/app/core`: authentication, account context, application shell, and shared infrastructure.
- `src/app/features/overview`: daily nutrition overview.
- `src/app/features/products`: product catalog and editing.
- `src/app/features/meals`: shared meals, portion editing, and copying meal plans between dates.
- `src/app/features/family`: member profiles, personal diaries, goals, and measurements.
- `src/app/features/statistics`: daily goal progress, averages, and trends.
- `src/app/shared`: reusable UI, types, utilities, and data access.

Feature routes are lazy-loaded. API requests use relative `/api` URLs. `openapi.json` is the checked-in API reference; the running backend serves its current schema at `/openapi.json` and interactive documentation at `/docs`.

Deleting a meal row removes all its portions in one API request. Updating a catalog product synchronizes its name and nutrition values across existing meals, including past dates; deploy the corresponding backend changes and migrations alongside this frontend.

## Docker and Compose

The Dockerfile builds Angular with Node and serves the static assets with Nginx. Nginx supports client-side routes, proxies `/api/*` to the backend, and exposes `/health`. The container listens on port `8080`.

For a backend running on the host:

```bash
cp .env.example .env
docker compose up --build
```

Compose uses `FRONTEND_PORT=4200` and `API_UPSTREAM=http://host.docker.internal:8000` by default. These variables configure the published port and Nginx backend destination; `.env` is not an Angular runtime configuration file.

To run without Compose:

```bash
docker build -t nutriflow-frontend .
docker run --rm \
  --name nutriflow-frontend \
  --add-host host.docker.internal:host-gateway \
  -e API_UPSTREAM=http://host.docker.internal:8000 \
  -p 4200:8080 \
  nutriflow-frontend
```

When the backend is on the same Docker network under the service name `api`, set `API_UPSTREAM=http://api:8000`. The destination must be reachable from the frontend container; `localhost` inside it refers to that container.

Check Nginx availability with:

```bash
curl http://localhost:4200/health
```

This checks the frontend container. Check the backend’s own `/health` endpoint separately. Keep local `.env` files, secrets, dependencies, and build output out of Git.
