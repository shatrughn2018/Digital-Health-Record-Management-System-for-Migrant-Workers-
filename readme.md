# Migrant Worker Healthcare System

## Overview

This repository contains a client-first web application called "Migrant Worker Healthcare System" — a lightweight healthcare record management system focused on migrant workers. It provides registration, visit tracking, document storage, QR-based quick access, multilingual UI, and simple admin tools. The app is built with Next.js (App Router) and stores data locally (localStorage) with field-level obfuscation and integrity checks for prototyping and low-infrastructure environments.

## Why this project exists

- Provide a portable, low-infrastructure solution for clinics and community health workers to manage basic health records for migrant workers.
- Allow quick identification and access to records via QR codes and a doctor-facing dashboard for triage and follow-ups.
- Demonstrate design patterns for offline-capable client apps with audit logging and simple storage management.

## Key features

- Worker registration and profile management
- Medical visit logging (visits, diagnoses, prescriptions, follow-ups)
- Document upload and management (prescriptions, lab reports)
- Doctor dashboard with search, filters, today’s patients, follow-up alerts and notifications
- Admin panel for system overview, storage stats, and import/export
- Multilingual UI (English, Malayalam, Hindi) via `useTranslations`
- Client-side audit logging and basic data integrity checks
 - Live camera QR scanning (BarcodeDetector) with a simulated fallback and deep-link handling to open printable health cards

## Tech stack

- Next.js 14 (App Router) + React + TypeScript
- Tailwind CSS for styling
- UI primitives in `components/ui/*` (cards, buttons, forms, tabs, selects)
- Utilities in `lib/*` (security, storage, data manager)
- Icons: `lucide-react`
- Local persistence: `localStorage` (with helper wrappers)

## Project structure (important files/folders)

- `app/` — Next.js routes (pages and subpages). Key routes are described below.
- `components/` — reusable UI primitives and `ThemeProvider`.
- `lib/` — application helpers: `utils.ts` (SecurityUtils, DataManager, storage helpers), `translations.ts`.
- `public/` — static assets (placeholder images).
- `styles/` and `app/globals.css` — global styling, Tailwind tokens and theme variables.
- `package.json` — scripts and dependencies.

## Page-by-page walkthrough

Note: file paths are under `app/`.

- `/` — `app/page.tsx` — Landing page and gateway. Language selector, primary CTAs (register, search, worker dashboard, doctor dashboard, admin).
- `/workers` — `app/workers/page.tsx` — List of registered workers, with option to register or view a worker.
- `/workers/register` — (form) Register a new worker, validate inputs, encrypt sensitive fields and store record in localStorage.
- `/workers/[id]` — Worker profile page: personal details, visits, documents, health card/QR. Subpages:
  - `add-visit` — Add a medical visit (doctor notes, diagnosis, prescription, follow-up date).
  - `documents/[id]` — View/download a specific document.
  - `health-card/[id]` — Printable / QR-enabled health card.
- `/workers/search` — Search interface supporting name, id, phone, location, blood group. Includes QR scanner route for quick lookup.
- `/doctors` — `app/doctors/page.tsx` — Doctor dashboard. Loads worker records from localStorage, verifies integrity, decrypts sensitive fields, shows today's patients, follow-up alerts, chronic-condition lists and notifications. Heavy client logic and filters.
- `/doctors/qr-scanner` — QR scanning helper to quickly open a worker profile.
 - `/doctors/qr-scanner` — QR scanning helper to quickly open a worker profile.
  - The scanner now supports live camera scanning in Chromium-based browsers using the `BarcodeDetector` API. When a QR payload contains a health-record JSON (for example: `{"id":"MW123","type":"health_record", ...}`) the scanner deep-links to `/workers/health-card/:id`. A simulated-scan button remains for demo/testing and for browsers without BarcodeDetector support.
- `/admin` — `app/admin/page.tsx` — Admin dashboard: system stats (workers, documents, storage), audit logs and import/export JSON for backup.
- `/security/audit-logs` — View and filter audit logs stored locally.
- `/storage/management` — Storage stats and cleanup utilities.
- `/system-status` — System health and configuration overview.
- `/help` — User help and documentation page.

Other nested routes exist (patients, prescriptions, documents) and follow the same patterns.

## Data model & storage

- Worker (decrypted): { workerId, fullName, dateOfBirth, gender, nativeState, nativeDistrict, currentAddress, phoneNumber, healthHistory, allergies, currentMedication, bloodGroup, consent, createdAt, lastModified }
- Encrypted worker stored shape: sensitive fields moved to `field_encrypted` (e.g., `healthHistory_encrypted`) plus `dataIntegrityHash` computed by `DataManager`.
- Documents: stored as `DocumentRecord` with base64 file data, metadata, checksum, versioning fields.
- Visit history: arrays stored with keys like `medical_visits_<workerId>`.
- Audit logs: `audit_logs` and `critical_audit_logs` kept in localStorage; helper functions append and prune logs.

Storage keys are consistent; helper classes in `lib/utils.ts` provide read/write, integrity verification and cleanup functions.

## Security & privacy notes

- Current encryption implementation (`SecurityUtils.encrypt`) is a simple XOR + base64 method intended for prototyping only. It obfuscates data but is not cryptographically secure.
- Storing sensitive medical data in `localStorage` is inherently risky (exposure to XSS, device compromise). For production, migrate to server-side storage or an encrypted client DB with authenticated access.
- Audit logs are client-side; in production logs should also be aggregated to a secure server for tamper-resistant auditing and compliance.
- Import/export produces unencrypted JSON backups. Protect backup files with a passphrase or move backups to server-side encrypted storage.

## How to run (local development)

The repository includes `package.json` scripts. `pnpm` is recommended because `pnpm-lock.yaml` is present.

Windows (cmd.exe):

```cmd
pnpm install
pnpm dev
```

Main scripts from `package.json`:

- `pnpm dev` — runs the Next.js dev server
- `pnpm build` — builds the project for production
- `pnpm start` — starts the production server after build
- `pnpm lint` — runs linting (if configured)

Open http://localhost:3000 after `pnpm dev` to use the app.

## Testing the QR scanner (live & simulated)

# Migrant Worker Healthcare System

A lightweight, client-first prototype for registering and managing health records of migrant workers. Built with Next.js (App Router), TypeScript and Tailwind CSS. The app demonstrates local persistence patterns, QR-based quick access, and role-based UI for workers, doctors and administrators.

---

## Quick summary

- Local-first prototype using `localStorage` for portability and low-infrastructure deployments.
- Role-based flows: worker portal, doctor dashboard, admin console.
- Features: register workers, log visits, upload documents, QR health cards, audit logs, import/export backup.
- Built with: Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Mongoose (optional server-side), Lucide icons.

---

## Table of contents

1. Features
2. Project structure
3. Getting started (dev)
4. Environment variables
5. APIs (server-side routes)
6. Authentication and roles
7. Data model and storage
8. Security considerations
9. Development notes & testing
10. Next steps
11. License & contribution

---

## 1) Features

- Worker registration and profile management
- Medical visit logging and prescriptions
- Document uploads and versioning
- QR-enabled health cards and scanner
- Doctor dashboard with search, filters and follow-up list
- Admin panel with system stats, audit logs and import/export
- Multi-language support via `useTranslations`

---

## 2) Project structure (important files)

- `app/` - Next.js App Router routes and pages
  - `/` - Landing page (`app/page.tsx`)
  - `/workers` - Worker portal (auth + dashboard) (`app/workers/page.tsx`, `app/workers/dashboard`)
  - `/doctors` - Doctor portal (`app/doctors/page.tsx`, `app/doctors/dashboard`)
  - `/admin` - Admin console (`app/admin/page.tsx`, `app/admin/dashboard`)
  - `app/api/*` - server routes for authentication, workers and utilities
- `components/` - UI primitives and theme provider
- `lib/` - helper utilities (security, storage, data manager, translations)
- `public/` - placeholder assets

---

## 3) Getting started (development)

Prerequisites:
- Node 18+ (LTS recommended)
- pnpm (recommended) or npm/yarn

Setup (Windows, cmd.exe):

```cmd
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

---

## 4) Environment variables

The app supports optional server-side features (MongoDB, JWT) when environment variables are provided.

Example `.env` variables used by server-side code:

- `MONGO_URI` - MongoDB connection string
- `DB_NAME` - (optional) database name, defaults to `migrant-worker-system`
- `JWT_SECRET` - secret for signing access tokens
- `JWT_REFRESH_SECRET` - secret for signing refresh tokens

If you don't provide these, many features will fall back to local-only storage and the client-first behavior.

---

## 5) APIs (server routes)

Server routes live under `app/api`. Key endpoints:

- `POST /api/auth/register` — register a new user (worker/doctor/admin). Expects JSON: `{ name, email, password, role, profileData }`.
- `POST /api/auth/login` — login, returns `{ user, tokens }` on success.
- `POST /api/auth/refresh` — refresh JWT
- `GET  /api/auth/verify?token=...` — verify an account or token
- `GET  /api/workers/[id]` — get worker profile and decrypted fields
- `POST /api/workers/[id]` — update worker profile
- `GET  /api/status` — lightweight status endpoint (name, version, uptime)

Note: API behavior adapts to presence of `MONGO_URI` and auth configuration. If no DB is available, the app will primarily use `localStorage` (client-side) helpers in `lib/utils.ts`.

---

## 6) Authentication & roles

Roles: `worker`, `doctor`, `admin`.

- Registration endpoints create a user account and (optionally) a profile document.
- Login endpoint returns JWT access & refresh tokens. Client stores tokens in `localStorage` under `authTokens` and `currentUser`.
- Protected dashboards check `currentUser.role` and redirect to role-specific auth pages when not authenticated.

---

## 7) Data model & storage

This is summarized from the app's utilities and README:

- Worker (decrypted): `{ workerId, fullName, dateOfBirth, gender, phoneNumber, nativeState, nativeDistrict, currentAddress, healthHistory, allergies, currentMedication, bloodGroup, consent, createdAt, lastModified }`
- Encrypted worker fields: sensitive fields stored as `<field>_encrypted` with a `dataIntegrityHash` produced by `DataManager`.
- Documents: base64 payload plus metadata and checksum.
- Visit history: arrays per-worker (keyed by `medical_visits_<workerId>`)
- Audit logs: `audit_logs` and `critical_audit_logs` in localStorage

Helpers and encryption live in `lib/`.

---

## 8) Security considerations

- Current encryption is lightweight and intended for prototyping only. Do not rely on it for production use.
- Storing sensitive health data in `localStorage` risks exposure to XSS and device compromise.
- For production, move data to a server-side DB, use secure storage, and implement strong authentication and key management.

---

## 9) Development notes & testing

- The app is client-heavy; many pages use `"use client"`.
- Run `pnpm dev` to start. Use the QR scanner simulation when camera is not available.
- If you enable server-side MongoDB and JWT env vars, the app will use the server routes for persistence and auth.

---

## 10) Next steps / Recommendations

1. Replace ad-hoc encryption with Web Crypto API (AES-GCM) and proper key management.
2. Move sensitive data to server-side storage with authentication and TLS.
3. Harden against XSS and CSRF; add Content Security Policy.
4. Add unit tests for `lib/utils.ts` and integration tests for API routes.
5. Add E2E tests for register -> login -> create visit -> view flow.

---

## 11) License & contribution

Add a `LICENSE` file if the project will be shared.
Contributions are welcome—open an issue or a PR with a clear description.

---
