# Nutrition Calendar Backend API

Этот документ описывает текущую структуру эндпоинтов бэкенда для параллельной разработки фронтенда.

## Base URL

```text
http://localhost:3000
```

## Общие замечания

- Аутентификация в текущей версии API отсутствует.
- Все ответы приходят в `application/json`, кроме `PATCH/DELETE`-методов, которые сейчас возвращают пустой ответ.
- Формат даты для food log: `YYYY-MM-DD`.
- Поддерживаемые `mealType`: `breakfast`, `lunch`, `dinner`, `snack`, `other`.
- В food log в теле запроса используется поле `productId`, но оно должно содержать значение `foodId` из справочника продуктов.
- DTO в коде описаны, но глобальный `ValidationPipe` в приложении сейчас не подключен. Для фронтенда лучше считать требования к полям обязательным контрактом, но бэкенд пока может не валидировать их строго.

## Типы данных

### Account

```json
{
  "accountId": "acc-001",
  "name": "Test Family",
  "createdAt": "2025-12-27T10:15:30.000Z",
  "country": "ES",
  "timezone": "Europe/Madrid",
  "plan": "free",
  "userIds": [
    "97c258a4-76f6-4c14-9d9e-e47a3209b2cc"
  ]
}
```

### User

```json
{
  "accountId": "acc-001",
  "userId": "97c258a4-76f6-4c14-9d9e-e47a3209b2cc",
  "name": "Oleksandr",
  "role": "owner",
  "targetCalories": 2000,
  "targetProtein": 140,
  "createdAt": "2025-12-27T10:20:00.000Z",
  "isActive": true
}
```

### Product

```json
{
  "foodId": "5417ca39-8c3c-45ba-8919-f4f7a1abaeb9",
  "name": "Oats",
  "caloriesPer100g": 370,
  "proteinPer100g": 13,
  "carbsPer100g": 60,
  "fatPer100g": 7
}
```

### FoodLogItem

```json
{
  "accountId": "acc-001",
  "itemId": "a3be1a25-bce6-4c35-a4b5-9f4b2f87a111",
  "userId": "97c258a4-76f6-4c14-9d9e-e47a3209b2cc",
  "date": "2025-12-27",
  "mealType": "breakfast",
  "productId": "5417ca39-8c3c-45ba-8919-f4f7a1abaeb9",
  "amountGrams": 60,
  "createdAt": "2025-12-27T11:00:00.000Z"
}
```

## Accounts

### `POST /accounts`

Создать аккаунт.

Request body:

```json
{
  "accountId": "acc-001",
  "name": "Test Family",
  "country": "ES",
  "timezone": "Europe/Madrid"
}
```

Response `200`:

```json
{
  "accountId": "acc-001",
  "name": "Test Family",
  "createdAt": "2025-12-27T10:15:30.000Z",
  "country": "ES",
  "timezone": "Europe/Madrid",
  "plan": "free",
  "userIds": []
}
```

### `GET /accounts/:accountId`

Получить аккаунт по `accountId`.

Response `200`:

```json
{
  "accountId": "acc-001",
  "name": "Test Family",
  "createdAt": "2025-12-27T10:15:30.000Z",
  "country": "ES",
  "timezone": "Europe/Madrid",
  "plan": "free",
  "userIds": [
    "97c258a4-76f6-4c14-9d9e-e47a3209b2cc"
  ]
}
```

Если запись не найдена, сервис возвращает `null`.

### `GET /accounts/:accountId/users`

Получить список пользователей аккаунта.

Response `200`:

```json
[
  {
    "accountId": "acc-001",
    "userId": "97c258a4-76f6-4c14-9d9e-e47a3209b2cc",
    "name": "Oleksandr",
    "role": "owner",
    "targetCalories": 2000,
    "targetProtein": 140,
    "createdAt": "2025-12-27T10:20:00.000Z",
    "isActive": true
  }
]
```

## Users

### `POST /accounts/:accountId/users`

Создать пользователя в аккаунте.

Request body:

```json
{
  "name": "Oleksandr",
  "role": "owner",
  "targetCalories": 2000,
  "targetProtein": 140
}
```

Поля:

- `name`: string, обязательное
- `role`: `owner | member`, необязательное, по умолчанию `member`
- `targetCalories`: number, необязательное
- `targetProtein`: number, необязательное

Response `200`:

```json
{
  "accountId": "acc-001",
  "userId": "97c258a4-76f6-4c14-9d9e-e47a3209b2cc",
  "name": "Oleksandr",
  "role": "owner",
  "targetCalories": 2000,
  "targetProtein": 140,
  "createdAt": "2025-12-27T10:20:00.000Z",
  "isActive": true
}
```

### `GET /accounts/:accountId/users/:userId`

Получить пользователя по `userId`.

Response `200`:

```json
{
  "accountId": "acc-001",
  "userId": "97c258a4-76f6-4c14-9d9e-e47a3209b2cc",
  "name": "Oleksandr",
  "role": "owner",
  "targetCalories": 2000,
  "targetProtein": 140,
  "createdAt": "2025-12-27T10:20:00.000Z",
  "isActive": true
}
```

Если запись не найдена, сервис возвращает `null`.

### `PATCH /accounts/:accountId/users/:userId/deactivate`

Деактивировать пользователя.

Request body: не требуется.

Response `200`:

```json
null
```

Примечание: контроллер возвращает `void`, то есть фронту лучше ожидать пустой ответ с успешным HTTP-статусом.

## Food Dictionary

### `POST /food`

Создать продукт.

Request body:

```json
{
  "name": "Oats",
  "caloriesPer100g": 370,
  "proteinPer100g": 13,
  "carbsPer100g": 60,
  "fatPer100g": 7
}
```

Response `200`:

```json
{
  "foodId": "5417ca39-8c3c-45ba-8919-f4f7a1abaeb9",
  "name": "Oats",
  "caloriesPer100g": 370,
  "proteinPer100g": 13,
  "carbsPer100g": 60,
  "fatPer100g": 7
}
```

### `GET /food`

Получить все продукты.

Response `200`:

```json
[
  {
    "foodId": "5417ca39-8c3c-45ba-8919-f4f7a1abaeb9",
    "name": "Oats",
    "caloriesPer100g": 370,
    "proteinPer100g": 13,
    "carbsPer100g": 60,
    "fatPer100g": 7
  }
]
```

### `GET /food/:foodId`

Получить продукт по `foodId`.

Response `200`:

```json
{
  "foodId": "5417ca39-8c3c-45ba-8919-f4f7a1abaeb9",
  "name": "Oats",
  "caloriesPer100g": 370,
  "proteinPer100g": 13,
  "carbsPer100g": 60,
  "fatPer100g": 7
}
```

Если запись не найдена, сервис возвращает `null`.

### `PATCH /food/:foodId`

Обновить продукт.

Request body:

```json
{
  "name": "Oats #1",
  "caloriesPer100g": 380,
  "proteinPer100g": 14,
  "carbsPer100g": 61,
  "fatPer100g": 8
}
```

Все поля необязательные. Можно отправлять частичное обновление.

Response `200`:

```json
{
  "foodId": "5417ca39-8c3c-45ba-8919-f4f7a1abaeb9",
  "name": "Oats #1",
  "caloriesPer100g": 380,
  "proteinPer100g": 14,
  "carbsPer100g": 61,
  "fatPer100g": 8
}
```

### `DELETE /food/:foodId`

Удалить продукт.

Response `200`:

```json
{
  "success": true
}
```

Ограничение:

- если продукт уже используется в food log, бэкенд возвращает ошибку `400 Bad Request`

Сообщение ошибки:

```json
{
  "message": "Нельзя удалить продукт: он уже используется в дневнике питания.",
  "error": "Bad Request",
  "statusCode": 400
}
```

## Food Log

### `POST /accounts/:accountId/users/:userId/food`

Добавить запись о приеме пищи для пользователя.

Request body:

```json
{
  "date": "2025-12-27",
  "mealType": "breakfast",
  "productId": "5417ca39-8c3c-45ba-8919-f4f7a1abaeb9",
  "amountGrams": 60
}
```

Response `200`:

```json
{
  "accountId": "acc-001",
  "itemId": "a3be1a25-bce6-4c35-a4b5-9f4b2f87a111",
  "userId": "97c258a4-76f6-4c14-9d9e-e47a3209b2cc",
  "date": "2025-12-27",
  "mealType": "breakfast",
  "productId": "5417ca39-8c3c-45ba-8919-f4f7a1abaeb9",
  "amountGrams": 60,
  "createdAt": "2025-12-27T11:00:00.000Z"
}
```

### `GET /accounts/:accountId/users/:userId/food?date=YYYY-MM-DD`

Получить food log пользователя за день.

Пример:

```text
GET /accounts/acc-001/users/97c258a4-76f6-4c14-9d9e-e47a3209b2cc/food?date=2025-12-27
```

Response `200`:

```json
{
  "accountId": "acc-001",
  "userId": "97c258a4-76f6-4c14-9d9e-e47a3209b2cc",
  "date": "2025-12-27",
  "totalCalories": 222,
  "totalProtein": 7.8,
  "totalFat": 4.2,
  "totalCarbs": 36,
  "meals": [
    {
      "mealType": "breakfast",
      "totalCalories": 222,
      "totalProtein": 7.8,
      "totalFat": 4.2,
      "totalCarbs": 36,
      "items": [
        {
          "itemId": "a3be1a25-bce6-4c35-a4b5-9f4b2f87a111",
          "productId": "5417ca39-8c3c-45ba-8919-f4f7a1abaeb9",
          "amountGrams": 60,
          "calories": 222,
          "protein": 7.8,
          "fat": 4.2,
          "carbs": 36
        }
      ]
    }
  ]
}
```

Если записей нет, ответ все равно `200`:

```json
{
  "accountId": "acc-001",
  "userId": "97c258a4-76f6-4c14-9d9e-e47a3209b2cc",
  "date": "2025-12-27",
  "totalCalories": 0,
  "totalProtein": 0,
  "totalFat": 0,
  "totalCarbs": 0,
  "meals": []
}
```

### `PATCH /accounts/:accountId/users/:userId/food/:itemId`

Обновить запись food log.

Request body:

```json
{
  "amountGrams": 80
}
```

Сейчас поддерживается только обновление `amountGrams`.

Response `200`:

```json
null
```

Примечание: контроллер возвращает `void`, фронту лучше ожидать пустой ответ с успешным HTTP-статусом.

### `DELETE /accounts/:accountId/users/:userId/food/:itemId`

Удалить запись food log.

Request body: не требуется.

Response `200`:

```json
null
```

Примечание: контроллер возвращает `void`, фронту лучше ожидать пустой ответ с успешным HTTP-статусом.

### `GET /accounts/:accountId/food?date=YYYY-MM-DD`

Получить сводный food log по всем пользователям аккаунта за день.

Пример:

```text
GET /accounts/acc-001/food?date=2025-12-27
```

Response `200`:

```json
{
  "accountId": "acc-001",
  "date": "2025-12-27",
  "users": {
    "97c258a4-76f6-4c14-9d9e-e47a3209b2cc": {
      "totalCalories": 222,
      "totalProtein": 7.8,
      "totalFat": 4.2,
      "totalCarbs": 36,
      "meals": [
        {
          "mealType": "breakfast",
          "totalCalories": 222,
          "totalProtein": 7.8,
          "totalFat": 4.2,
          "totalCarbs": 36,
          "items": [
            {
              "itemId": "a3be1a25-bce6-4c35-a4b5-9f4b2f87a111",
              "productId": "5417ca39-8c3c-45ba-8919-f4f7a1abaeb9",
              "amountGrams": 60,
              "calories": 222,
              "protein": 7.8,
              "fat": 4.2,
              "carbs": 36
            }
          ]
        }
      ]
    }
  }
}
```

Если у аккаунта нет пользователей или ни у кого нет записей за дату, ответ:

```json
{
  "accountId": "acc-001",
  "date": "2025-12-27",
  "users": {}
}
```

## Быстрый список эндпоинтов

```text
POST   /accounts
GET    /accounts/:accountId
GET    /accounts/:accountId/users
POST   /accounts/:accountId/users
GET    /accounts/:accountId/users/:userId
PATCH  /accounts/:accountId/users/:userId/deactivate

POST   /food
GET    /food
GET    /food/:foodId
PATCH  /food/:foodId
DELETE /food/:foodId

POST   /accounts/:accountId/users/:userId/food
GET    /accounts/:accountId/users/:userId/food?date=YYYY-MM-DD
PATCH  /accounts/:accountId/users/:userId/food/:itemId
DELETE /accounts/:accountId/users/:userId/food/:itemId
GET    /accounts/:accountId/food?date=YYYY-MM-DD
```
