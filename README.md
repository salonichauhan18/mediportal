<h1 align="center">
  🏥 MediPortal Enterprise
</h1>

<p align="center">
  <strong>The Unified AI-Powered Hospital Management & EHR Platform</strong><br/>
  Multi-Tenant · FHIR R4 · Pharmacogenomics · RPA Auto-Claims · Real-Time Intelligence
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-2.0.0-blue?style=for-the-badge" alt="Version" />
  <img src="https://img.shields.io/badge/Node.js-20+-green?style=for-the-badge&logo=node.js" alt="Node" />
  <img src="https://img.shields.io/badge/NestJS-10-red?style=for-the-badge&logo=nestjs" alt="NestJS" />
  <img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/AI-Gemini%201.5-4285F4?style=for-the-badge&logo=google" alt="Gemini" />
  <img src="https://img.shields.io/badge/Built%20with-Turborepo-EF4444?style=for-the-badge" alt="Turborepo" />
</p>

---

## 🌟 What is MediPortal Enterprise?

MediPortal Enterprise is a production-ready, AI-first Hospital ERP and EHR system built for modern multi-branch healthcare networks. It goes beyond traditional hospital management by embedding intelligence at every layer — from AI-driven symptom triage to automated insurance adjudication and genomic safety shields.

---

## ✨ Key Features at a Glance

| Category | Features |
|---|---|
| **Clinical EHR** | Vitals, SOAP Notes, Prescriptions, Lab Orders, Patient Charts |
| **AI Intelligence** | Symptom Triage, ICD-10/CPT Coding, Trend Analysis, Report Parsing |
| **Precision Medicine** | Genetic Data Vault (CPIC guidelines), Pharmacogenomic Drug Safety Shield |
| **Operations** | Predictive Bed Management, Occupancy Heatmaps, 7-Day AI Forecasting |
| **Finance & RPA** | AI Claim Auditor, Auto-Adjudication Engine, Insurance Control Center |
| **Interoperability** | HL7 FHIR R4 Export/Import, Multi-System Data Exchange |
| **Pharmacy** | Inventory Management, Prescription Dispensing, Expiry Tracking |
| **Telemedicine** | WebRTC Video Consultations, Live Chat |
| **Multi-Tenancy** | Branch-level data isolation, per-branch tax/currency/timezone config |
| **Security** | JWT + RBAC, PII Anonymization on all AI calls, HTTPS, Helmet.js |

---

## 🏗️ Architecture

```
medicure-management/ (Turborepo Monorepo)
│
├── apps/
│   ├── api-server/     → NestJS REST API + WebSockets (Port 4000)
│   ├── admin-hms/      → React/Vite Clinical Dashboard (Port 5173)
│   ├── public-web/     → Next.js Patient-Facing Website (Port 3000)
│   └── mobile-patient/ → Expo React Native Patient App
│
└── packages/
    ├── database/       → Prisma schema & Postgres client
    ├── shared-types/   → Shared TypeScript types
    └── ui-core/        → Reusable React component library
```

**Infrastructure**: PostgreSQL 15 · Redis 7 · Google Gemini 1.5 Flash · Docker · Turborepo

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Node.js 20+, Docker, Docker Compose

### 1. Clone & Install
```bash
git clone <repository-url>
cd medicure-management
cp .env.example .env      # Fill in GEMINI_API_KEY and JWT_SECRET
npm install
```

### 2. Start Infrastructure
```bash
docker compose up -d db redis
```

### 3. Push Database Schema
```bash
cd packages/database && npx prisma db push && cd ../..
```

### 4. Run All Apps
```bash
npm run dev
```

| App | URL |
|---|---|
| 🖥️ **Admin Dashboard** | http://localhost:5173 |
| 🔌 **API Server** | http://localhost:4000 |
| 📖 **Swagger API Docs** | http://localhost:4000/api/docs |
| 🌐 **Public Web** | http://localhost:3000 |

> **Default Login**: `admin@mediportal.com` / `Admin@123`

---

## 📚 Documentation

| Document | Description |
|---|---|
| [**DEVELOPER_GUIDE.md**](./DEVELOPER_GUIDE.md) | Complete setup, running, Docker deployment, Prisma commands & troubleshooting |
| [**USER_GUIDE.md**](./USER_GUIDE.md) | Module-by-module guide for clinical and administrative staff |
| [**ARCHITECTURE.md**](./ARCHITECTURE.md) | System architecture, multi-tenancy, CI/CD pipeline |
| [**CHANGELOG.md**](./CHANGELOG.md) | Version history from Phase 1 → v2.0.0 |
| [**Swagger UI**](http://localhost:4000/api/docs) | Interactive API documentation (when server is running) |

---

## 🧩 Module Overview

| Module | Role Access | Description |
|---|---|---|
| Executive Command Center | Admin, Super Admin | 4-Pillar live intelligence dashboard |
| Scheduling | All Staff | Calendar-based appointment booking |
| Patient Registration | Receptionist, Admin | UHID-based patient onboarding |
| Patient Chart (EHR) | Doctor, Nurse | Full clinical record with AI assistance |
| Lab Portal | Lab Tech, Doctor | Test ordering, result upload & AI interpretation |
| Pharmacy Portal | Pharmacist | Inventory, dispensing, expiry management |
| Billing Portal | Billing Admin | Invoice generation, payment recording |
| Insurance RPA | Billing Admin | AI-powered auto-claims pipeline |
| Bed Management | Nurse, Admin | Live occupancy heatmap + AI forecasting |
| Genomics Vault | Doctor | Pharmacogenomic safety shields |
| Interoperability | Admin | FHIR R4 data import/export |
| Telemedicine | Doctor | WebRTC video consultations |
| System Admin | Super Admin | User management, audit logs, AI logs |

---

## 🛠️ Tech Stack

### Backend (`api-server`)
- **NestJS 10** — Modular, decorator-based Node.js framework
- **Prisma 5** — Type-safe database ORM
- **PostgreSQL 15** — Primary relational database
- **Redis 7** — Response caching & pub/sub
- **@nestjs/schedule** — Cron jobs for RPA engine
- **Passport JWT** — Authentication
- **Swagger / OpenAPI** — Auto-generated API docs
- **Pino** — Structured JSON logging
- **Helmet + CORS** — Security hardening

### Frontend (`admin-hms`)
- **React 19** — UI framework
- **Vite 6** — Lightning-fast dev server
- **Zustand** — Lightweight state management
- **React Hook Form + Zod** — Type-safe form validation
- **Recharts** — Interactive data visualizations
- **i18next** — Internationalization (English, Hindi, Spanish)
- **Lucide React** — Icon system
- **Socket.io Client** — Real-time notifications

### AI Layer
- **Google Gemini 1.5 Flash** — All 9 clinical AI tasks
- **AiAnonymizer** — PII scrubbing before every external call
- **Circuit Breaker** — Automatic fallback if AI is unavailable

---

## 🔐 Security

- **JWT Authentication** — Stateless token-based auth
- **RBAC** — Role-based access control (8 roles)
- **Multi-Tenant Isolation** — Branch-level data partitioning via `TenantInterceptor`
- **PII Anonymization** — All patient data is scrubbed before Gemini API calls
- **Helmet.js** — HTTP security headers
- **Rate Limiting** — 10 req/min via `@nestjs/throttler`
- **Idempotency Keys** — Prevent duplicate financial transactions

---

## 🐳 Production Deployment

```bash
# Set production secret
export JWT_SECRET_PROD="your-production-secret"

# Build and start all containers
docker compose -f docker-compose.production.yml up -d --build

# Run database migrations
docker compose -f docker-compose.production.yml exec api npx prisma migrate deploy
```

> See [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) for full production deployment instructions.

---

## 📊 v2.0.0 Release Highlights

> *Full history in [CHANGELOG.md](./CHANGELOG.md)*

- ✅ **Executive Command Center** — Unified 4-Pillar Intelligence Dashboard
- ✅ **RPA Auto-Claims Engine** — AI-audited, auto-adjudicated insurance claims
- ✅ **Pharmacogenomics Module** — Genetic safety screening for prescriptions
- ✅ **Predictive Bed Management** — 7-day AI occupancy forecasting
- ✅ **FHIR R4 Interoperability** — HL7-compliant data exchange
- ✅ **Production Docker Hardening** — Isolated networks, `restart: always`, secrets management

---

## 📝 License

This project is for educational and demonstration purposes as part of an enterprise HMS final-year project.

---

<p align="center">
  Built with ❤️ for modern healthcare · MediPortal Enterprise v2.0.0
</p>
