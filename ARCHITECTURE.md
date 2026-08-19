# Architecture — IT-DIR Tech Stores

> **Start here:** [`README.md`](README.md)  
> **Full manual:** [`docs/SYSTEM-DOCUMENTATION.md`](docs/SYSTEM-DOCUMENTATION.md)

## The project already has a structure

| Folder / file | Role |
|---------------|------|
| `app/` | Live frontend (HTML + CSS + JS modules) |
| `server.py` | Local API + static server |
| `techstores.db` | Persistent SQLite database |
| `assets/` | Images / logos |
| `docs/` | Documentation & ASO materials |
| `START-SYSTEM.bat` | One-click launcher |
| `TECHSTORES SYSTEM 2026.html` | Legacy single-file backup (not the live app) |

## Why it can feel unstructured

Root still contains older files (monolith HTML, Excel bids, `node_modules`).
The **live system** is only:

```text
START-SYSTEM.bat  →  server.py  →  app/  →  techstores.db
```

## How to run

1. Double-click `START-SYSTEM.bat`
2. Open **http://127.0.0.1:8080/app/**

## Persistence

Operational data writes to **`techstores.db`** while the server runs.
It survives logout, browser close, and PC shutdown.
