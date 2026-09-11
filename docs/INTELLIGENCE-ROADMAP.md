# TechStoreSys intelligence roadmap

Make the app a **thinker**: project, prioritize, suggest, and explain — while humans keep authority.

**Principle:** local SQLite remains source of truth. Intelligence **suggests**; operators **decide**. Every score or forecast should show a short **reason** (features), not a black box.

---

## Layers (capability stack)

| Layer | Goal | Status |
|-------|------|--------|
| Heuristic ranking | Who/what to chase first | Partial (Creditors, Undelivered, ICT compare) |
| **Smart Ops Desk** | Cross-module project + prioritize | **Phase 1 — building** |
| PO intellisense | Predict lines, prices, lead times while typing | Phase 2 |
| Demand / stock forecast | Parts & toner reorder signals | Phase 3 |
| Narrative AI | Explain rankings; draft minutes | Exists (`/api/ai/ask`); wire into Ops Desk |
| Learned models | Delay / pay risk from history | Phase 4 (needs ≥6 months clean history) |

---

## Phase 1 — Smart Ops Desk (now)

**Module id:** `smart-ops-desk`

### Inputs
- Creditors (`supplierDebts`) — age, USD/ZWG, chase status, Creditors Target batch
- Undelivered (`undeliveredOrders`) — age, balance, supplier, PO
- DAF monthly targets / buying power (`glMonthlyTargets`, expended)

### Outputs
- KPI strip: open creditors, undelivered open/overdue, buying power remaining, Creditors Target ZWG
- **Projection:** days of buying power left at current month burn rate
- **Priority lists:** top creditors to chase; top overdue undelivered lines
- **Suggested next actions** with deep-links into Creditors / Undelivered / GL Targets / Purchase Orders
- Optional **AI brief** (uses ranked facts + `/api/ai/ask`)

### Guardrails
- No auto-pay, auto-close, or silent PO edits
- Scores are transparent weighted heuristics until Phase 4

---

## Phase 2 — PO intellisense

**Where:** Purchase Orders / DP procurement line entry

### Behaviour
- As supplier / item text is typed, suggest:
  - Recent lines for that supplier (desc, UOM, last price, GL)
  - Typical lead time (orderDate → first delivery / undelivered age patterns)
  - Price band from real DP POs + prior register rows
- Keyboard: accept suggestion without leaving the field

### Data sources
- `REAL_DP_PURCHASE_ORDERS`, saved PO register, undelivered history, creditors lines

### Deliverables
- `app/js/po-intellisense.js` + light CSS
- Opt-in toggle “Smart suggestions” on PO form

---

## Phase 3 — Demand / stock forecast (parts & toner)

**Where:** Smart Ops Desk panel + optional Stores / Monthly Returns hook

### Behaviour
- Flag consumables (toner, fuser film, drums, RAM) with:
  - Open undelivered demand
  - Issue velocity from stores transactions (when history exists)
  - Suggested reorder qty = max(undelivered gap, projected 30/60-day use − on-hand)
- Confidence low until transaction history is rich — show **signal**, not hard order

### Later
- Seasonal curves; link suggested F1 / requisition draft

---

## Phase 4 — Learned prediction (optional)

Only after Ops Desk + intellisense are trusted:

1. Export anonymised feature rows (age, supplier, category, partial history, chase lag)
2. Fit simple models (logistic / gradient boost) offline or in a small Python job
3. Serve risk scores via `/api/intel/score` with model version + feature list
4. Keep heuristics as fallback when model offline

---

## UX placement

| Surface | Role |
|---------|------|
| Nav → **Smart Ops Desk** | Primary intelligence cockpit |
| Dashboard teaser | “Top pressure” + link to desk |
| Creditors / Undelivered | Keep local intelligence; Ops Desk aggregates |
| PO form | Phase 2 suggestions |

---

## Success measures

- Operator opens Ops Desk daily and clears ≥1 suggested action
- Fewer “0d age” / blind chases (dates + priorities visible)
- PO entry uses suggested price/lead time ≥30% of new lines (Phase 2)
- Toner/parts stockouts catchable ≥7 days ahead when history exists (Phase 3)

---

## Non-goals (near term)

- Full AutoML platform or cloud training pipeline
- Replacing DAF / Dir judgment
- Training on restricted minute text without an explicit retention policy

---

## Build order (agreed)

1. Roadmap (this doc) + **Smart Ops Desk**
2. PO intellisense
3. Demand / stock forecast
4. Optional learned models
