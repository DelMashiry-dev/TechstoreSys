# IT-DIR Tech Stores — Demo Guide

## Start the system (with database)

1. Double-click `START-SYSTEM.bat`
2. Open **http://127.0.0.1:8080/app/**
3. Sign in (examples below)

Or in Cursor: Run and Debug → **Tech Stores (Database Server)**

See `ARCHITECTURE.md` for the modular folder layout and security notes.

## Default logins

| Role | Username | Password |
|------|----------|----------|
| Administrator | admin | admin123 |
| Store Officer | store | store123 |
| Viewer | viewer | view123 |

## What is stored in the database

SQLite file: `techstores.db`

- Users and access levels
- All module form data (vouchers, bids, loans, POs, etc.)
- GL budgets
- Release cut transfers
- Audit log of logins and saves

When the green **Database Connected** badge appears in the header, saves go to SQLite.

## Demo tip for superiors

1. Start the server
2. Log in as `store`
3. Enter a voucher / loan / purchase order and click **Save**
4. Refresh the browser — data remains
5. Optionally open `techstores.db` in DB Browser for SQLite to show the tables
