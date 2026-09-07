# NutriFlow Frontend

Angular-приложение для семейного планирования питания: каталог продуктов, общие приёмы пищи, персональные дневники, цели, замеры и статистика.

## Требования

- Node.js 24.14 (`.nvmrc`)
- npm 11.11
- Backend API, доступный локально на `http://127.0.0.1:8000`
- Docker — только для контейнерного запуска

## Локальная разработка

```bash
npm ci
npm start
```

Приложение откроется на [http://localhost:4200](http://localhost:4200). Запросы `/api/*` проксируются на `http://127.0.0.1:8000`, настройка находится в `proxy.conf.json`.

Полезные команды:

```bash
npm run check        # Prettier и проверка типов
npm run build        # production-сборка
npm test             # unit-тесты
npm run format       # форматирование проекта
```

## Docker

Образ собирается в два этапа: Angular компилируется в Node-контейнере, затем статические файлы обслуживает Nginx. Nginx поддерживает Angular Router, healthcheck и проксирует `/api/*` в backend.

### Запуск через Docker

Если backend работает на хосте на порту `8000`:

```bash
docker build -t nutriflow-frontend .
docker run --rm \
  --name nutriflow-frontend \
  --add-host host.docker.internal:host-gateway \
  -e API_UPSTREAM=http://host.docker.internal:8000 \
  -p 4200:8080 \
  nutriflow-frontend
```

Проверка контейнера:

```bash
curl http://localhost:4200/health
```

### Запуск через Compose

Создайте локальный `.env` из примера при необходимости:

```bash
cp .env.example .env
docker compose up --build
```

`.env` не попадает в Git. Значения по умолчанию уже подходят для backend на локальной машине.

### Развёртывание вместе с backend

Передайте `API_UPSTREAM` как URL backend, доступный **из frontend-контейнера**. Например, если сервис backend в одной Docker-сети называется `api`:

```yaml
environment:
  API_UPSTREAM: http://api:8000
```

Не используйте `localhost` в `API_UPSTREAM`: внутри контейнера он указывает на сам frontend-контейнер.

Контейнер слушает порт `8080`, healthcheck доступен по `/health`.

## Авторизация через Auth0

Frontend использует официальный пакет `@auth0/auth0-angular` и Authorization Code Flow with PKCE.
Конфигурация tenant и SPA client находится в `src/app/core/auth/auth.config.ts`.

В Auth0 Application должны быть разрешены следующие адреса:

```text
Allowed Callback URLs: http://localhost:4200/
Allowed Logout URLs:   http://localhost:4200/
Allowed Web Origins:   http://localhost:4200/
```

Встроенный interceptor Auth0 получает access token и добавляет
`Authorization: Bearer <access-token>` ко всем запросам `/api` и `/api/*`.
Клиент запрашивает JWT с audience `https://nutrition-api`; в Auth0 Dashboard
должен существовать API с точно таким Identifier.

## Структура приложения

Функциональные области загружаются лениво и находятся в `src/app/features`:

- `overview` — дневная сводка;
- `products` — каталог продуктов;
- `meals` — семейные приёмы пищи;
- `family` — пользователи, цели, замеры и дневники;
- `statistics` — дневные и периодические отчёты.

Описание backend API хранится в `openapi.json`.

## Подготовка Git-репозитория

В проекте уже настроены `.gitignore`, `.gitattributes` и `.dockerignore`. Секреты и локальный `.env` коммитить не нужно.

```bash
git init
git add .
git commit -m "Initial NutriFlow frontend"
git branch -M main
git remote add origin <repository-url>
git push -u origin main
```

Перед коммитом рекомендуется выполнить:

```bash
npm run check
docker build -t nutriflow-frontend .
```
