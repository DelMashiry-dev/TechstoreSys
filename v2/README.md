# TechStoreSys V2.0.0.0 (React)

Separate React frontend for **IT-DIR Tech Stores**. Shares the same Python backend and `techstores.db` as V1 — no database migration required.

## Stack

- **React 19** + **TypeScript**
- **Vite 6** dev server
- **React Router 7**
- API: existing `server.py` (`/api/state`, `/api/login`, …)

## Prerequisites

1. **Node.js 20+** — [https://nodejs.org](https://nodejs.org)
2. **V1 backend running** — double-click `START-SYSTEM.bat` in the repo root (port **8080**)

## Quick start

```bat
cd v2
npm install
npm run dev
```

Open **http://127.0.0.1:5173/v2/**

Sign in with the same accounts as V1 (e.g. `admin` / `admin123`).

## Production build

```bat
cd v2
npm run build
```

Output: `v2/dist/` — serve via `server.py` or any static host with `/api` proxied to port 8080.

## Architecture

```text
v2/
├── src/
│   ├── api/           # fetch wrappers (state, login, audit)
│   ├── auth/          # AuthProvider, ProtectedRoute
│   ├── config/        # branding, navigation, RBAC
│   ├── layout/        # AppShell, Sidebar, Header
│   ├── pages/         # Dashboard, Login, module placeholders
│   ├── routes/        # React Router map (mirrors V1 module IDs)
│   ├── store/         # AppStateProvider (syncs to /api/state)
│   └── types/         # AppState TypeScript types
├── vite.config.ts     # proxies /api → localhost:8080
└── package.json       # version 2.0.0.0
```

## V1 vs V2

| | V1 | V2 |
|---|----|----|
| UI | Vanilla HTML/JS | React + TypeScript |
| Version | 1.0.0.0 | **2.0.0.0** |
| URL | http://127.0.0.1:8080/app/ | http://127.0.0.1:5173/v2/ (dev) |
| Backend | server.py | **Same server.py** |
| Data | techstores.db | **Same techstores.db** |

## Migration plan

1. ✅ Shell, auth, state sync, dashboard KPIs
2. ✅ ICT Asset Register (read-only table, filters, boarded search)
3. ⬜ Port voucher inventory, requisitions
3. ⬜ ZNA Q forms batch
4. ⬜ AI assistant + craft query (React components)
5. ⬜ Optional: serve `v2/dist` from `server.py` at `/v2/`

Module pages currently show **placeholders** with links back to V1 for parity testing.

## Launcher

From repo root:

```bat
START-V2.bat
```

(Requires Node.js on PATH.)
