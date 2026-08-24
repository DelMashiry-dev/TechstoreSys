# IT-DIR Tech Stores — ZNA National Deployment Note

**RESTRICTED** · Draft for staff / ICT / Tech Stores coordination · August 2026

---

## 1. Purpose

This note describes how **TECHSTORESys** (IT-DIR Tech Stores) would operate when deployed **Army-wide**, with a **single central database in Harare** and **browser access from all ZNA units** (e.g. Bulawayo, Mutare, Gweru, Masvingo).

The objective: **work at any unit updates the national ledger in near real time**, while units can **continue operating during link outages** and sync when connectivity returns.

---

## 2. What “Database” vs “Browser” means (not internet)

| Term in the app | Meaning nationally | Does it need public internet? |
|-----------------|-------------------|-------------------------------|
| **Database** | Connected to the **central stores database server (Harare)** | **No** — needs **ZNA network / VPN / dedicated link** to Harare |
| **Browser** | **Unit cache** — work saved locally when Harare server is unreachable | **No** — fallback only |

**Important:** Turning off Wi‑Fi or losing public internet does **not** test central deployment if the **ZNA WAN to Harare** is still up. Conversely, losing the **link to Harare** (or stopping the central server) is what triggers **Browser** fallback — not loss of internet alone.

---

## 3. Target architecture

```text
┌─────────────────────────────────────────────────────────────┐
│  HARARE — IT Directorate / Tech Stores (primary site)       │
│  • TECHSTORESys application server (HTTPS)                  │
│  • Central database (authoritative national ledger)         │
│  • Backups, audit log, admin & HQ dashboards                │
└────────────────────────────┬────────────────────────────────┘
                             │  ZNA WAN / VPN / MPLS / radio
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
   Bulawayo unit        Mutare unit         Other formations
   (browser only)      (browser only)      (browser only)
```

**Data flow (example — Bulawayo receives 15 laptops):**

1. Storeman posts receipt / Q 1033 issue in the **web app**.
2. Browser sends update to **Harare server** via API.
3. **Central DB** commits the transaction.
4. HQ and authorised users see updated stock / accountability on refresh.

No separate Excel files or email reconciliation — **one transactional source of truth**.

---

## 4. Why a web-based system

| Benefit | Justification |
|---------|----------------|
| **Thin client at units** | Units need only a supported browser and network path to Harare — no per-PC database admin. |
| **Single version Army-wide** | Forms (ZNA Q 982, Q 1033, etc.), catalog, GL targets, and business rules updated **once** on the server. |
| **Real-time national visibility** | Director IT Dir, RQ, AQ, and command see the same figures as the unit that captured the movement. |
| **Role-based access** | Storeman (unit), Tech Stores Officer, RQ, oversight roles — enforced at login against central identity. |
| **Audit & ASO alignment** | Immutable audit trail on central server; supports stock take, loans, strike-off, and procurement chains. |
| **Outage resilience** | **Browser** mode queues unit work; automatic sync when Harare link returns (same design pattern as today’s local offline queue, pointed at central DB). |

The current codebase is already **browser ↔ server ↔ database**. National deployment **relocates the server and database to Harare**; the unit experience stays a URL in the browser.

---

## 5. Infrastructure requirements (Harare — primary)

| Component | Minimum recommendation | Notes |
|-----------|------------------------|-------|
| **Application host** | 1× production VM or physical server (2 vCPU, 8 GB RAM) + 1× DR standby | Runs Python/web stack or packaged TECHSTORES server |
| **Database** | PostgreSQL or SQL Server (preferred for multi-site); SQLite acceptable for pilot only | Single writer in Harare; backups nightly + transaction log |
| **Storage** | 100 GB+ (DB + attachments + audit); grow with national rollout | Include off-site backup |
| **TLS / HTTPS** | Mandatory on all unit-facing URLs | Certificates via ZNA PKI or approved CA |
| **Identity** | Integration with ZNA AD / directory (future); until then, central user registry | Per-unit scoping by formation / cost centre |
| **Monitoring** | Health endpoint, disk, backup success, link latency to regions | Alert ICT Sec / Tech Stores on failure |

---

## 6. Unit / formation requirements (e.g. Bulawayo)

| Item | Requirement |
|------|-------------|
| **Client** | Chrome or Edge (current supported browsers) |
| **Network** | Reliable path to Harare app URL over **ZNA WAN** (not dependent on public internet) |
| **Hardware** | Standard staff laptop or thin client; no local database required |
| **Training** | Storeman, RQ, oversight roles — login, receive/issue stock, Q 1033 custody rules |
| **Local fallback** | Understand **Browser** mode: continue work if Harare link down; do not duplicate manual ledgers |

Optional: **regional read cache** later if latency is high — writes still authoritative through Harare.

---

## 7. Sync and continuity policy (proposed)

1. **Normal operations:** All units in **Database** mode — all saves go to Harare immediately.
2. **Link loss:** App switches to **Browser** cache automatically; user notified; work continues.
3. **Link restored:** Queued movements sync to Harare; conflict resolution by server revision (already implemented locally — extend to central).
4. **No dual active ledgers:** A unit must not maintain a parallel Excel “master” — Browser cache is temporary only.
5. **Q 1033 / ZA custody:** National register enforces **one active issue per person**; return before re-issue (already in application logic).

---

## 8. Security & governance

- **RESTRICTED** classification for operational stock and procurement data.
- Unit users see **only their formation’s data** unless role grants national view.
- All login, save, and release-cut actions logged on **central audit log**.
- DR test at least **annually**; restore verified from Harare backup.

---

## 9. Rollout phases (suggested)

| Phase | Scope | Outcome |
|-------|--------|---------|
| **0 — Pilot** | IT Dir Harare only (current `techstores.db` on local server) | Process proven; training material |
| **1 — Central host** | Migrate DB to Harare DC; IT Dir users hit central URL | Single national IT Dir ledger |
| **2 — Regional units** | Bulawayo, Mutare, … (IT Dir detachments / hub stores) | Real-time cross-site stock |
| **3 — Army pattern** | Other cost centres (Ord Dir, QM packs) via org profile | Same platform, different module packs |

---

## 10. Summary statement (for briefings)

> TECHSTORESys is a **web-based national stores system**: each unit uses a **browser**; **Harare holds the master database**. Bulawayo (and every unit) posts receipts, issues, and Q forms to the centre **in real time** when the ZNA link is up, and **keeps working from a local cache** when it is not. This gives the Army **one ledger**, **standard ASO forms**, and **command visibility**, without installing a database at every desk.

---

**Prepared for:** IT Directorate — Tech Stores  
**System:** TECHSTORESys (`server.py` + web app + SQLite today → central RDBMS nationally)  
**Contact:** IT Dir Sys Admin / Tech Stores Officer for pilot scheduling and Harare hosting coordination.

**RESTRICTED**
