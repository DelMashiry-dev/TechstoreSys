# IT-DIR Tech Stores

Persistent stores / GL system for **IT Directorate Tech Stores** (Cost Centre Z04P2SP212).

## Quick start

1. Double-click **`START-SYSTEM.bat`**
2. Open **http://127.0.0.1:8080/app/**
3. Sign in: `admin` / `admin123` (or `store` / `store123`, `viewer` / `view123`)

Data saves to **`techstores.db`** on disk (survives logout and PC shutdown).

### Portable package / Windows installer (v1.0.0.0)

1. Double-click **`scripts\build-release.bat`**
   - Builds `TECHSTORES.exe` (portable folder)
   - Creates `dist\TECHSTORES-Portable-1.0.0.0.zip`
   - Creates `dist\TECHSTORES-Setup-1.0.0.0.exe` (requires [Inno Setup 6](https://jrsoftware.org/isinfo.php); the script will try to install it via winget)
2. **Install on a PC:** run `TECHSTORES-Setup-1.0.0.0.exe`
3. **Or no install:** copy `dist\TECHSTORES-Portable\` (or the ZIP) and run `START-SYSTEM.bat`

Portable-only rebuild: **`scripts\build-portable.bat`**

See `docs\PORTABLE-DEMO-README.txt` inside the package.

---

## Project structure (this is the real layout)

```text
TECHSTORESys/
│
├── START-SYSTEM.bat          ← start the system here
├── server.py                 ← Python API + file server
├── techstores.db             ← PERSISTENT database (on disk)
├── index.html                ← redirects to /app/
├── product_specs_lookup.py   ← product specs helper
│
├── app/                      ← ★ LIVE APPLICATION (use this)
│   ├── index.html            ← shell: login, sidebar, dashboard
│   ├── modules/              ← ★ each form stands alone (HTML fragment)
│   │   ├── stock-take.html
│   │   ├── zna-q-1033.html
│   │   ├── manifest.json
│   │   └── …
│   ├── css/
│   │   └── main.css          ← styling
│   └── js/                   ← modular logic (one job per file)
│       ├── module-loader.js    loads app/modules/<id>.html on demand
│       ├── boot.js             startup
│       ├── config.js           roles, GLs, module IDs
│       ├── state.js            load/save + DB sync
│       ├── auth.js             login / permissions
│       ├── dashboard.js        KPIs + navigation
│       └── … other domain modules
│
├── assets/                   ← logos & infographics
├── docs/                     ← manuals, ASO matrix, diagrams
│
├── README.md                 ← this map
├── ARCHITECTURE.md           ← short architecture note
├── DEMO-GUIDE.md             ← demo tips
│
├── TECHSTORES SYSTEM 2026.html   ← legacy monolith (reference only)
├── IT DIR BIDS *.xlsx            ← source bid workbooks
└── node_modules/                 ← tooling (not the app)
```

### What matters day-to-day

| Need | Where |
|------|--------|
| Run system | `START-SYSTEM.bat` → http://127.0.0.1:8080/app/ |
| Edit shell / dashboard | `app/index.html` |
| Edit a form screen | `app/modules/<module-id>.html` |
| Edit behaviour | `app/js/*.js` |
| Edit look | `app/css/main.css` |
| Server / API | `server.py` |
| Durable data | `techstores.db` |
| Docs | `docs/` |
| Old single-file system | `TECHSTORES SYSTEM 2026.html` (do **not** demo from this) |

### Standalone modules

Each form is its own file under `app/modules/`. The shell loads them on demand via `module-loader.js`.

Re-extract from a full backup shell if needed:

```bat
python tools\extract_modules.py
```

(Use only against a full `index.html` that still embeds forms — keep `app/index.html.pre-modules-bak` as reference.)

### Layers

```text
Users (Admin / Store Officer / Viewer)
        ↓
Browser UI   →  app/
        ↓
server.py    →  http://127.0.0.1:8080
        ↓
techstores.db   (persistent file on disk)
```

---

## TechStoreSys V2.0.0.0 (React)

A separate React frontend lives in **`v2/`** — same `techstores.db` and `server.py` API as V1.

1. Start the backend: **`START-SYSTEM.bat`**
2. Install [Node.js 20+](https://nodejs.org), then run **`START-V2.bat`** (or `cd v2 && npm install && npm run dev`)
3. Open **http://127.0.0.1:5173/v2/**

See **[v2/README.md](v2/README.md)** for architecture and migration plan.

---

## More reading

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [docs/SYSTEM-DOCUMENTATION.md](docs/SYSTEM-DOCUMENTATION.md)
- [docs/ASO-COMPLIANCE-MATRIX.md](docs/ASO-COMPLIANCE-MATRIX.md)
- [docs/SYSTEM-DIAGRAMS.html](docs/SYSTEM-DIAGRAMS.html)
- Structure infographic: `assets/techstores-system-structure-infographic.png`
- Current structure (modular): `assets/techstores-system-structure-now.png`
- Multi-unit future (Ord Dir = example cost centre): [docs/MULTI-UNIT-ROADMAP.md](docs/MULTI-UNIT-ROADMAP.md)
