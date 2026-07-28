# 🍽️ Restaurant OS Kazakhstan

![Status](https://img.shields.io/badge/Status-Phase_0_%2B_Phase_1_MVP-emerald)
![Backend](https://img.shields.io/badge/Backend-NestJS_11_%2B_Prisma_6-blue)
![Frontend](https://img.shields.io/badge/Frontend-React_19_%2B_Vite_8-cyan)
![POS](https://img.shields.io/badge/Integration-Nexium_POS_Event_Bus-orange)
![Currency](https://img.shields.io/badge/Currency-KZT_₸-green)

**Restaurant OS Kazakhstan** — операционная система для автоматизации ресторанов, кофеен и общепита в Казахстане. Система строится вокруг существующей кассовой системы **Nexium (POS)** и автоматически управляет складом, технологическими картами (техкартами), списаниями сырья, лояльностью и аналитикой в реальном времени.

---

## 📐 Архитектура системы

```
       ┌─────────────────────────┐
       │     Nexium POS System   │  (Источник транзакционных данных: чеки, оплаты)
       └────────────┬────────────┘
                    │ POS_TRANSACTION_CREATED (Event Bus / Webhooks)
                    ▼
 ┌──────────────────────────────────────────────┐
 │          Restaurant OS Core Backend          │
 │  - NestJS Framework                          │
 │  - Prisma ORM + SQLite / PostgreSQL          │
 │  - Real-time Auto-Deduction Engine           │
 └──────────────────┬───────────────────────────┘
                    │ REST API & WebSockets
                    ▼
 ┌──────────────────────────────────────────────┐
 │           Executive Web Dashboard            │
 │  - React 19 + Vite + Glassmorphism UI        │
 │  - Real-time Stock & Recipe Ledger           │
 │  - Interactive Nexium POS Simulator          │
 └──────────────────────────────────────────────┘
```

---

## ✨ Реализованный функционал (Фаза 0 + Фаза 1 MVP)

### 🔹 Фаза 0 — Интеграционный фундамент
- **Модели данных**: Организации, Филиалы, Склады ("Главный склад кухни", "Бар"), Пользователи и настройки интеграции с Nexium.
- **Webhook Ingestion**: Прием событий кассы Nexium через `POST /api/v1/nexium/webhook` с ключами идемпотентности (`receiptId`).

### 🔹 Фаза 1 — Склад, Меню и Движок Автосписания
- **Складской учет сырья**:
  - Сырье и полуфабрикаты (ПФ) с учетом процента холодного/горячего отхода (брутто -> нетто).
  - Единицы измерения (`KG`, `G`, `L`, `ML`, `PCS`) и автоматическая конвертация.
  - Пороги минимального запаса и учет себестоимости в тенге (KZT ₸).
  - Формы ручного прихода от поставщиков и ручного списания (порча, бракераж).
- **Меню и Технологические карты (Техкарты)**:
  - Связка блюд с Nexium POS ID (`posItemId`).
  - Состав ингредиентов с нормами брутто/нетто.
  - Расчет теоретической себестоимости и **Food Cost %**.
- **Движок автосписания в реальном времени (`AutoDeductionService`)**:
  - Мгновенное списание сырья при поступлении чека с кассы Nexium.
  - Рекурсивное списание полуфабрикатов (ПФ).
  - Запись инцидентов дефицита сырья при отрицательном остатке (`DeductionIncident`).
  - Неразрывный аудиторский журнал всех движений (`StockMovement`).
- **Интерактивный симулятор кассы Nexium POS**:
  - Наглядное проведение чека через Event Bus с моментальной демонстрацией списания сырья со склада.

---

## 🛠️ Запуск проекта локально

### Требования
- **Node.js**: v18+ (проверено на Node 24)
- **npm**: v9+

### 1. Бэкенд (NestJS)

```bash
cd backend
npm install
npx prisma db push
npx ts-node src/main.ts
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

## 📂 Структура репозитория

```
RestaurantOS/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma        # Схема базы данных Prisma
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auto-deduction/  # Движок автосписания по чекам
│   │   │   ├── menu/            # Блюда и технологические карты
│   │   │   ├── nexium-pos/      # Прием вебхуков Nexium & Симулятор
│   │   │   ├── organization/    # Организации, филиалы, KPI дашборд
│   │   │   └── warehouse/       # Остатки, приходы, списания, инциденты
│   │   ├── prisma/
│   │   │   ├── prisma.service.ts
│   │   │   └── seed.service.ts  # Начальное наполнение данными KZ
│   │   ├── main.ts
│   │   └── app.module.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/          # Дашборд, Склад, Меню, История, Симулятор
│   │   ├── services/            # API клиенты
│   │   ├── App.tsx
│   │   └── index.css
│   └── package.json
├── .gitignore
└── README.md
```

---

## 📄 Лицензия
Proprietary — Restaurant OS Kazakhstan.
