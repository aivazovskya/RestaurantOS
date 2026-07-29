# 🍽️ Restaurant OS Kazakhstan

![Status](https://img.shields.io/badge/Status-Phase_5_Auth_%26_RBAC_Audited-emerald)
![Backend](https://img.shields.io/badge/Backend-NestJS_11_%2B_Prisma_6-blue)
![Frontend](https://img.shields.io/badge/Frontend-React_19_%2B_Vite_8-cyan)
![Auth](https://img.shields.io/badge/Auth-JWT_%2B_CreativeID_SSO_Abstracted-purple)
![Currency](https://img.shields.io/badge/Currency-KZT_₸-green)

**Restaurant OS Kazakhstan** — операционная система для автоматизации ресторанов, кофеен и общепита в Казахстане. Система строится вокруг кассовой системы **Nexium (POS)** и автоматически управляет складом, технологическими картами, списаниями сырья, лояльностью, курьерской доставкой, аналитикой и разграничением прав доступа (RBAC).

---

## 📐 Архитектура системы & Авторизация (RBAC)

```
       ┌─────────────────────────┐
       │     Nexium POS System   │  (Чеки, оплаты)
       └────────────┬────────────┘
                    │ Webhooks
                    ▼
 ┌──────────────────────────────────────────────┐      ┌─────────────────────────┐
 │          Restaurant OS Core Backend          │ ────►│ CreativeID Credential   │
 │  - Strict JWT_SECRET Environment Guard       │      │ Provider (Future SSO)   │
 │  - Decoupled CredentialProvider Interface    │      └─────────────────────────┘
 │  - Real-time WebSockets Auth & Guest Slug    │
 └──────────────────┬───────────────────────────┘
                    │ REST API (Bearer JWT) & WS (Token Handshake)
                    ▼
 ┌──────────────────────────────────────────────┐
 │           Executive Web Dashboard            │
 │  - React 19 + AuthContext + LoginModal       │
 │  - Multi-role UX (Owner, Manager, Chef...)   │
 │  - PWA Courier App with PIN Code Auth        │
 └──────────────────────────────────────────────┘
```

---

## 🔐 Аккаунты для тестирования Авторизации & RBAC

При запуске сидов в базу данных записываются следующие демо-учётные записи:

| Роль | Email / Логин | Пароль / PIN | Доступ |
|---|---|---|---|
| **OWNER** (Владелец) | `owner@restaurantos.demo` | `password123` | Полный доступ ко всем модулям, аналитике и настройкам |
| **MANAGER** (Менеджер) | `manager@restaurantos.demo` | `password123` | Управление меню, складом, купонами, баллами лояльности |
| **STOREKEEPER** (Кладовщик) | `storekeeper@restaurantos.demo` | `password123` | Просмотр остатков, создание приходов и списаний сырья |
| **CHEF** (Шеф-Повар) | `chef@restaurantos.demo` | `password123` | Доступ к KDS (экрану кухни) и смене статусов блюд |
| **COURIER** (Курьер) | `+77071112233` | `1234` (PIN) | Вход в экран курьера, управление статусом своих доставок |

---

## 🛡️ Безопасность и архитектурные решения по JWT

1. **Строгая валидация `JWT_SECRET` при старте**:
   - Отсутствие значения `JWT_SECRET` в переменных окружения вызовет немедленную ошибку инициализации сервера NestJS (`JwtStrategy`), исключая возможность запуска с компрометированным дефолтным секретом.
2. **Хранение JWT токенов в `localStorage` (Пилотный компромисс UX/Security)**:
   - В текущей демо/пилотной версии `accessToken` сохраняется в `localStorage` для предотвращения нежелательного разлогинивания пользователя при перезагрузке страницы.
   - **Roadmap для Production**: Переход на хранение short-lived `accessToken` исключительно в оперативной памяти (React State) с установкой long-lived `refreshToken` в защищённую `httpOnly`, `Secure`, `SameSite=Strict` cookie на бэкенде.
3. **Хэширование PIN-кодов курьеров**:
   - PIN-коды новых курьеров, создаваемых диспетчером через UI, хэшируются с использованием `bcrypt`. Открытый PIN показывается один раз при создании/сбросе.

---

## ✨ Реализованный функционал

### 🔹 Фаза 5 — Авторизация и RBAC (с заделом под CreativeID SSO)
- **Абстракция `CredentialProvider`**:
  - Логика проверки пароля/PIN вынесена в `LocalCredentialProvider`.
  - Замена на CreativeID SSO в будущем не затронет бизнес-логику модулей — только binding в `auth.module.ts`.
- **JWT & Глобальные Guards**:
  - `JwtAuthGuard` по умолчанию защищает все API и WebSocket эндпоинты.
  - `@Public()` для открытых ручек (QR-меню гостя, вызов официанта, публичные заказы, вебхук Nexium).
  - `@Roles(...)` & `RolesGuard` на критических операциях (списания сырья, стоп-лист, корр. баллов).
- **Безопасность WebSockets**:
  - Проверка JWT токена при handshake и сверка прав доступа пользователя к `branchId`.
  - Отдельный гостевой канал live-обновлений стоп-листа по `guestQrSlug`.
- **Управление Курьерами & PIN-кодами**:
  - Генерация, `bcrypt`-хэширование и сброс PIN-кода через эндпоинт `POST /api/v1/couriers/:id/reset-pin` и UI диспетчера.

---

## 🛠️ Запуск проекта локально

### 1. Бэкенд (NestJS)

```bash
cd backend
npm install
npx prisma db push
npm run start:dev
```
> Бэкенд запустится на `http://localhost:3001`

### 2. Фронтенд (React + Vite)

```bash
cd frontend
npm install
npm run dev
```
> Веб-панель запустится на `http://localhost:5173`

---

## 📄 Лицензия
Proprietary — Restaurant OS Kazakhstan.
