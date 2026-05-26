# Warehouse Frontend

React-приложение для управления складом. Обеспечивает учёт материалов, обработку заявок, управление пользователями и аудит событий. Работает совместно со Spring Boot бэкендом.

## Стек

| Слой | Технология |
|---|---|
| UI | React 19 + Ant Design 6 |
| Язык | TypeScript 6 |
| Сборка | Vite 8 |
| Состояние | Redux Toolkit + RTK Query |
| Роутинг | React Router 7 |
| Графики | Recharts |

## Быстрый старт

```bash
npm install
npm run dev        # Dev-сервер → http://localhost:3000
```

Dev-сервер проксирует `/api/*` → `http://localhost:8080` (Spring Boot).

### Без бэкенда (mock-режим)

```bash
VITE_MOCK=true npm run dev
```

В mock-режиме все RTK Query запросы перехватываются `mockBaseQuery` с задержкой 150 мс. Авторизация не нужна — автоматически подставляется pre-seeded пользователь с ролью `ADMIN`.

## Команды

```bash
npm run dev       # Dev-сервер с HMR
npm run build     # tsc + vite build → dist/
npm run lint      # ESLint
npm run preview   # Локальный просмотр dist/
```

## Переменные окружения

| Переменная | Назначение | По умолчанию |
|---|---|---|
| `VITE_API_BASE_URL` | Базовый URL бэкенда | `/api` |
| `VITE_MOCK` | Включить in-memory mock (без бэкенда) | — |

Файлы:
- `.env.local` — локальная разработка (порт 8080)
- `.env.production` — Railway deployment URL

## Роли и доступ

| Роль | Главная | Склад | Заявки | Пользователи | Журнал событий | Журнал склада |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `ADMIN` | + | + | + | + | + | — |
| `WORKER` | + | + | + | — | — | — |
| `EMPLOYEE` | + | — | + | — | — | — |
| `MANAGER` | + | + | + | + | — | + |

Единый источник истины — `src/utils/roleAccess.ts`. `RoleGuard` в роутере запрещает доступ к маршрутам, не разрешённым для роли.

## Архитектура

### Структура директорий

```
src/
├── api/
│   ├── baseApi.ts          # RTK Query базовый API (единый store)
│   └── mockBaseQuery.ts    # Mock-перехватчик для VITE_MOCK=true
├── app/                    # Redux store
├── features/               # Фича-слайсы и API
│   ├── auth/               # authSlice + authApi
│   ├── materials/          # materialsApi
│   ├── requests/           # requestsApi
│   ├── users/              # usersApi
│   ├── dashboard/          # dashboardApi
│   └── eventLogs/          # eventLogsApi
├── pages/                  # Страницы-оркестраторы
├── components/             # UI-компоненты по доменам
├── router/                 # Роутер, RequireAuth, RoleGuard
├── types/                  # Глобальные TypeScript-типы
└── utils/                  # roleAccess, statusLabels и др.
```

### API-слой

Все эндпоинты инжектируются в единый `baseApi` — не создаются отдельные сторы. `baseApi` автоматически разворачивает бэкенд-конверт `{ message, data: T }` и возвращает `T` напрямую в хуки RTK Query.

Заголовок авторизации использует нестандартный формат: `Bearer_<token>` (нижнее подчёркивание вместо пробела).

При получении `401` `baseApi` автоматически диспатчит `logout()`.

Теги кэша: `Material`, `Request`, `User`, `EventLog`, `Dashboard`.

### Аутентификация

Токен хранится в `localStorage` под ключом `wh_token`. `authSlice` (`src/features/auth/authSlice.ts`) управляет состоянием сессии. `RequireAuth` в роутере перенаправляет на `/login` при отсутствии токена.

### Заявки по ролям

`requestsApi` предоставляет три отдельных эндпоинта в зависимости от роли:

| Эндпоинт | Роль | Описание |
|---|---|---|
| `getMyRequests` | `EMPLOYEE` | Только свои заявки |
| `getAllRequests` | `ADMIN` | Все заявки в системе |
| `getIncomingRequests` | `WORKER`, `MANAGER` | Входящие заявки на склад |

### Типы данных

Основные типы определены в `src/types/index.ts`:

- **`Role`** — `ADMIN` | `WORKER` | `EMPLOYEE` | `MANAGER`
- **`RequestType`** — `ISSUE` | `REPLENISHMENT` | `RECEIPT` | `RETURN`
- **`RequestStatus`** — `UNDER_CONSIDERATION` | `APPROVED` | `WAITING_CONFIRMATION` | `CONFIRMED` | `REJECTED` | `SENT_FOR_REVISION` | `CANCELLED` | `ACCEPTED`
- **`MaterialStatus`** — `NORMAL` | `LOW` | `CRITICAL` | `OUT_OF_STOCK`
- **`MaterialCategory`** — `RAW_MATERIAL` | `CONSUMABLE` | `SPARE_PART` | `EQUIPMENT` | `OTHER`

Все отображения статусов и цветов сосредоточены в `src/utils/statusLabels.ts`.

## Деплой

- **Frontend** — Vercel (SPA rewrite задан в `vercel.json`)
- **Backend** — Railway
