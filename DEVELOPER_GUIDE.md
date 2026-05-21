# 🏥 MediPortal Enterprise — Developer Running Guide

> **Version**: 2.0.0 | **Stack**: NestJS · React · Prisma · PostgreSQL · Redis · Gemini AI · Turborepo

---

## Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Project Structure](#2-project-structure)
3. [First-Time Setup](#3-first-time-setup)
4. [Running Locally (Development)](#4-running-locally-development)
5. [Environment Variables Reference](#5-environment-variables-reference)
6. [Database Management (Prisma)](#6-database-management-prisma)
7. [Production Deployment (Docker)](#7-production-deployment-docker)
8. [Turborepo Commands](#8-turborepo-commands)
9. [Architecture Quick Reference](#9-architecture-quick-reference)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Prerequisites

Ensure the following are installed on your machine before proceeding:

| Tool | Required Version | Check Command |
|---|---|---|
| **Node.js** | `>= 20.x` | `node -v` |
| **npm** | `>= 10.x` | `npm -v` |
| **Docker** | `>= 24.x` | `docker -v` |
| **Docker Compose** | `>= 2.x` | `docker compose version` |
| **Git** | any | `git --version` |

> **Optional**: [Prisma Studio](https://www.prisma.io/studio) for database GUI, [Postman](https://postman.com) for API testing.

---

## 2. Project Structure

```
medicure-management/             ← Monorepo root (Turborepo)
│
├── apps/
│   ├── api-server/              ← NestJS Backend (Port 4000)
│   ├── admin-hms/               ← React/Vite Admin Dashboard (Port 5173)
│   ├── public-web/              ← Next.js Public Marketing Site (Port 3000)
│   └── mobile-patient/          ← Expo React Native (Mobile)
│
├── packages/
│   ├── database/                ← Prisma schema + generated client
│   ├── shared-types/            ← Shared TypeScript interfaces
│   └── ui-core/                 ← Shared React UI components
│
├── docker-compose.yml           ← Development containers
├── docker-compose.production.yml ← Hardened production containers
├── .env.example                 ← Environment variable template
├── turbo.json                   ← Turborepo pipeline config
└── CHANGELOG.md                 ← Version history
```

---

## 3. First-Time Setup

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd medicure-management
```

### Step 2: Copy Environment Variables
```bash
cp .env.example .env
```

Then open `.env` and fill in your values (see [Section 5](#5-environment-variables-reference)):
```bash
# Minimum required fields to fill:
GEMINI_API_KEY=your_google_gemini_api_key_here
JWT_SECRET=your_secret_here
DATABASE_URL=postgresql://mediportal:mediportal123@localhost:5432/mediportal_db?schema=public
```

### Step 3: Start Infrastructure Services (PostgreSQL + Redis)
```bash
docker compose up -d db redis
```

Wait ~10 seconds for the database to be healthy:
```bash
docker compose ps   # "db" should show "healthy"
```

### Step 4: Install All Dependencies
```bash
npm install
```

### Step 5: Push the Database Schema
```bash
cd packages/database
npx prisma db push
```

### Step 6: Seed the Database (Optional but Recommended)
```bash
npx prisma db seed
```

> This creates a default `SUPER_ADMIN` user:
> - **Email**: `admin@mediportal.com`
> - **Password**: `Admin@123`

---

## 4. Running Locally (Development)

### Option A: Run Everything at Once (Recommended)
```bash
npm run dev
```
Turborepo starts all apps in parallel. Access them at:

| App | URL |
|---|---|
| **Admin HMS Dashboard** | http://localhost:5173 |
| **API Server** | http://localhost:4000 |
| **Swagger API Docs** | http://localhost:4000/api/docs |
| **Public Web** | http://localhost:3000 |

### Option B: Run Individual Apps
```bash
# API Server only
npm run dev --workspace=apps/api-server

# Admin Dashboard only
npm run dev --workspace=apps/admin-hms

# Public Web only
npm run dev --workspace=apps/public-web
```

---

## 5. Environment Variables Reference

Create a `.env` file at the project root with the following:

```env
# ─── PostgreSQL ───────────────────────────────────────────────
POSTGRES_USER=mediportal
POSTGRES_PASSWORD=mediportal123
POSTGRES_DB=mediportal_db
DATABASE_URL="postgresql://mediportal:mediportal123@localhost:5432/mediportal_db?schema=public"

# ─── Redis ────────────────────────────────────────────────────
REDIS_HOST=localhost
REDIS_PORT=6379

# ─── Authentication ───────────────────────────────────────────
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1d

# ─── AI Engine (Required for AI features) ─────────────────────
GEMINI_API_KEY=AIza...your_google_ai_studio_key

# ─── App Ports ────────────────────────────────────────────────
PORT=4000
NODE_ENV=development

# ─── Storage (Optional for file uploads) ──────────────────────
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
AWS_S3_BUCKET=mediportal-clinical-assets
```

> Get your `GEMINI_API_KEY` free at [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

---

## 6. Database Management (Prisma)

All Prisma commands run from `packages/database/`:

```bash
cd packages/database

# Push schema changes to DB (development)
npx prisma db push

# Create & apply a migration (production-safe)
npx prisma migrate dev --name "your_migration_name"

# Open Prisma Studio (GUI)
npx prisma studio

# Regenerate the Prisma client after schema changes
npx prisma generate

# Reset database (⚠️ drops all data)
npx prisma db push --force-reset
```

---

## 7. Production Deployment (Docker)

### Build and Start All Containers
```bash
# Set your production JWT secret
export JWT_SECRET_PROD="your-ultra-secure-production-secret"

docker compose -f docker-compose.production.yml up -d --build
```

This starts:
- `api` — NestJS API on internal port 4000
- `admin` — Nginx-served React dashboard on port 80/443
- `db` — PostgreSQL 15 (internal only, not exposed)
- `redis` — Redis 7 (internal only, not exposed)

### Check Container Health
```bash
docker compose -f docker-compose.production.yml ps
docker compose -f docker-compose.production.yml logs api --tail=50
```

### Run Prisma Migrations in Production
```bash
docker compose -f docker-compose.production.yml exec api \
  npx prisma migrate deploy
```

---

## 8. Turborepo Commands

```bash
# Build all packages
npm run build

# Build all (excluding public-web — avoids React 18/19 conflict)
npx turbo run build --filter="!public-web"

# Run linter across the monorepo
npm run lint

# Run all tests
npm run test

# Clear Turborepo cache
npx turbo daemon stop && rm -rf .turbo node_modules/.cache/turbo
```

---

## 9. Architecture Quick Reference

```
HTTP Request
    │
    ▼
NGINX (Port 80/443)
    │
    ├── /api/*  ──────► NestJS API Server (Port 4000)
    │                       ├── JWT Authentication (AuthGuard)
    │                       ├── RBAC (RolesGuard)
    │                       ├── Tenant Isolation (TenantInterceptor)
    │                       ├── PostgreSQL (via Prisma)
    │                       ├── Redis (Response Caching)
    │                       └── Google Gemini AI (via GeminiService)
    │
    └── /*  ──────────► React Admin Dashboard (Vite, Port 5173)
                            └── Zustand State · React Query · Recharts
```

### Key Tech Choices

| Layer | Technology | Why |
|---|---|---|
| Backend Framework | NestJS | Modular, decorator-based, production-grade |
| Database | PostgreSQL + Prisma | Type-safe ORM, migration support |
| Caching | Redis | Sub-millisecond response for frequent reads |
| Frontend | React 19 + Vite | Fast HMR, modern React features |
| AI Engine | Google Gemini 1.5 Flash | Best-in-class medical reasoning at low latency |
| Monorepo | Turborepo | Parallel builds, intelligent caching |
| Auth | JWT + Passport | Stateless, scalable authentication |

---

## 10. Troubleshooting

### ❌ `database "mediportal" does not exist`
The PostgreSQL container started but the database hasn't been created yet.
```bash
docker compose up -d db
docker compose exec db psql -U mediportal -c "CREATE DATABASE mediportal_db;"
cd packages/database && npx prisma db push
```

### ❌ `Redis connection error`
Redis is not running. Start it:
```bash
docker compose up -d redis
```

### ❌ `Cannot find module '@mediportal/database'`
Run Prisma generate first:
```bash
cd packages/database && npx prisma generate
```

### ❌ `Port 4000 already in use`
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <pid> /F

# macOS/Linux
lsof -ti :4000 | xargs kill -9
```

### ❌ AI features return `AI Service is currently unavailable`
Verify your `GEMINI_API_KEY` in `.env` is valid and has quota available at [https://aistudio.google.com](https://aistudio.google.com).

---

*MediPortal Enterprise v2.0.0 — Built for modern healthcare.*
