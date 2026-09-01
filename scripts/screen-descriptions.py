"""Short 'what it means' and 'how it works' text for every documented screen."""

from __future__ import annotations

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
_spec = importlib.util.spec_from_file_location(
    "doc_pdf",
    ROOT / "scripts" / "generate-system-documentation-pdf.py",
)
_doc = importlib.util.module_from_spec(_spec)
assert _spec and _spec.loader
_spec.loader.exec_module(_doc)

ZNA_Q_IMPLEMENTED = _doc.ZNA_Q_IMPLEMENTED
MODULE_LABELS = _doc.MODULE_LABELS


def _entry(what: str, how: str) -> dict[str, str]:
    return {"what": what, "how": how}


# --- Explicit descriptions keyed by screenshot slug / module id ---
EXPLICIT: dict[str, dict[str, str]] = {
    "00-login": _entry(
        "Sign-in screen for TECHSTORESys. Controls who sees which modules and whether data saves to the local database.",
        "Enter username and password. Default mode is Database (techstores.db). After sign-in the sidebar and dashboard match your role.",
    ),
    "01-app-shell": _entry(
        "Main application layout: sidebar navigation, header bar, and content area.",
        "Sidebar groups modules (Dashboard, GL, Stores, Portals, ZNA Q, etc.). Header has Import document, Appearance, Logout. Content area shows the active module.",
    ),
    "dashboard": _entry(
        "Operations overview: KPI cards, alerts, universal search, and quick links.",
        "Open from sidebar Home. Cards link to ledgers and registers. Alerts flag overdue items (Creditors, undelivered, loans). Search jumps to any allowed module.",
    ),
    "orderly-room": _entry(
        "Orderly Room Daily File and correspondence routing mirror.",
        "Clerk logs incoming/outgoing correspondence and mirrors requisitions. Links to correspondence files. Used by Orderly Room and Admin AO roles.",
    ),
    "it-dir-comms": _entry(
        "Internal IT Directorate messaging between departments and command.",
        "Departments post demands and replies. OC desks and workshop/orderly roles use this instead of GL screens. Inbox filters by office.",
    ),
    "portals-board": _entry(
        "Visual map of the ICT procurement workflow from F1 raise through supply and payment.",
        "Click a stage tile to open the matching portal desk or register. Shows counts per stage. Entry point for DP, GS, DAF, AIAD, and Supplier users.",
    ),
    "dept-sysadmin": _entry(
        "Systems Administration department desk: demand form, inbox, and establishment view.",
        "Submit ICT demands CC Director, DD, AQSO2 and TechStores. Inbox shows office messages. Establishment panel lists posts and equipment entitlements.",
    ),
    "dept-workshop": _entry(
        "Workshop department desk for spares, tools, and repair support requests.",
        "Same desk pattern as other departments. Primary link is Workshop Register. Demands notify command and TechStores.",
    ),
    "dept-compengr": _entry(
        "Computer Engineering / DBA desk for servers, storage, and network items.",
        "Raise structured demands for infrastructure. Tracks inbox replies and establishment data for the Comp Eng office.",
    ),
    "dept-swengr": _entry(
        "Software Engineering desk for dev tools, licences, and project support.",
        "Submit software and licence needs through the demand form. Messages flow through IT Dir Comms to TechStores procurement when needed.",
    ),
    "dept-ictsec": _entry(
        "ICT Security desk for security appliances, certificates, and tools.",
        "Department-specific demand and inbox. Used by OC ICT Security for authorised security-related ICT requirements.",
    ),
    "dept-itts": _entry(
        "IT Training School desk for training equipment and media.",
        "Raise demands for school ICT. Establishment panel shows ITTS posts. Does not expose full stores ledgers.",
    ),
    "dept-admin": _entry(
        "Admin Office desk for general admin ICT and internal requirements.",
        "Demand form and inbox for Admin Office staff. Shortcuts to orderly and comms workflows from role home.",
    ),
    "dept-gate": _entry(
        "Gate / RP desk for gate equipment demands.",
        "Links to Gate Register from shortcuts. Used when RP needs to request gate-related ICT items through command channels.",
    ),
    "gl-2200600002": _entry(
        "GL vote for office supplies and services (ZOFF / 6122100009).",
        "Track monthly target, receipts, issues, and balance for this vote. Store officer edits; directorate roles view-only. Feeds dashboard KPIs.",
    ),
    "gl-2200600003": _entry(
        "GL vote for software licences.",
        "Records licence purchases and issues against the software vote. Used when procuring or issuing licensed software.",
    ),
    "gl-220200002": _entry(
        "GL vote for tech equipment maintenance contracts and spend.",
        "Tracks maintenance-related expenditure and movements for ICT equipment upkeep.",
    ),
    "gl-2201900002": _entry(
        "GL vote for spare parts and consumables.",
        "Ledger for spare parts issues and receipts linked to workshop and stores operations.",
    ),
    "gl-3112210001": _entry(
        "GL vote for ICT equipment capital purchases.",
        "Primary capital vote for laptops, desktops, servers, and major ICT buys. Links to procurement and accountability registers.",
    ),
    "voucher-module": _entry(
        "Shortcut to ZNA Q 1033 Issue and Receipt Voucher — the main daily stores movement form.",
        "Same form as zna-q-1033. Storeman selects items from catalog, records issue/receipt, prints voucher. Updates stock balances.",
    ),
    "stock-take": _entry(
        "Full stores inventory count and variance recording.",
        "Start a stock take, enter counted quantities, compare to system balance, and record discrepancies. Supports print/export of results.",
    ),
    "unit-checks": _entry(
        "Unit check log per ASO Chapter 28 requirements.",
        "Record periodic checks of stores held at units/formations. Audit trail for compliance visits.",
    ),
    "financial-year-bids": _entry(
        "Annual financial year bid submissions and vote planning.",
        "Enter bid lines per GL vote for the upcoming FY. Used by TechStores and DAF for planning. Import/export bid packs.",
    ),
    "unit-equipment": _entry(
        "Unit-level equipment holdings summary.",
        "View equipment allocated to units/formations. Supports reconciliation with ICT accountability and distribution lists.",
    ),
    "ict-accountability": _entry(
        "ZNA ICT Asset Register — equipment accountability by unit and holder.",
        "Add/edit assets with ZA number, unit, holder, and status. Filter by unit. Struck-off and transfer actions. Core audit register.",
    ),
    "ict-distribution": _entry(
        "ICT equipment distribution lists for bulk issues to units.",
        "Manage named distribution waves (e.g. laptop programmes). Track which units received which tranche.",
    ),
    "temporary-loans": _entry(
        "Temporary loans of controlled stores (typically 14-day limit).",
        "Issue on loan with return date. Alerts when overdue. Separate from permanent loans and Q 1033 permanent issues.",
    ),
    "permanent-loans": _entry(
        "Permanent loans of laptops and iPads under Comd/34 authority.",
        "Long-term personal issue register. Tracks holder, unit, and loan authority. Distinct from temporary loans.",
    ),
    "monthly-returns": _entry(
        "Monthly returns of unit ICT equipment status.",
        "Units report equipment held, serviceability, and changes each month. TechStores consolidates for command returns.",
    ),
    "undelivered-orders": _entry(
        "Orders placed with suppliers but goods not yet received.",
        "Track PO lines awaiting delivery. Age analysis and chase actions. Links to procurement cycle and Creditors when goods arrive.",
    ),
    "supplier-debts": _entry(
        "Creditors register — goods received but not yet paid.",
        "Record GRN against supplier, amount, age of debt. DAF chases payment. Import DAF creditor lists. Intelligence panel flags duplicates.",
    ),
    "workshop-receipt-cert": _entry(
        "Workshop receipt certificate for repaired items returned to holder.",
        "Certify workshop completed repair and item returned. Print certificate. Links to Workshop Register repair record.",
    ),
    "delivery-note": _entry(
        "Supplier delivery note capture for goods inward.",
        "Record delivery note details against PO/supplier. Supports doc import from scanned D-note. Feeds Creditors when unpaid.",
    ),
    "purchase-orders": _entry(
        "Purchase order register — electronic and manual/DAF POs.",
        "Create and track POs through the procurement cycle. Upload signed PO scans. Supplier portal sees assigned POs.",
    ),
    "accommodation-stores": _entry(
        "Inventory of accommodation stores (non-ICT accommodation items).",
        "Separate ledger for accommodation store items. Same movement patterns as main stores where applicable.",
    ),
    "unit-requisitions": _entry(
        "Requisitions in-tray — incoming unit and formation requests.",
        "Units submit requirements; TechStores triages, endorses, or converts to procurement. Age strip shows backlog. Links to PFMS numbers.",
    ),
    "doc-import": _entry(
        "Import document — upload or paste scans to auto-fill forms.",
        "Drop PDF/image or paste text. Server parses minute, quotation, PO, F1, spec, or D-note and applies fields to the matching module.",
    ),
    "spec-evaluation": _entry(
        "Specification and technical evaluation of supplier quotations.",
        "Score quotes against required spec. Record evaluation committee findings. Used before DP adjudication and AIAD diligence.",
    ),
    "laptop-compare": _entry(
        "Laptop Compare — rank catalog laptops by duty profile and pick the best buy.",
        "Select duty profile (e.g. HQ staff, field). System scores RAM, CPU, price. Recommended buy banner and bar chart. For workshop/procurement.",
    ),
    "ict-compare": _entry(
        "H2H ICT Comparison — crawl web specs and compare machines head-to-head.",
        "Search category, select up to several models, side-by-side spec table with winner highlighting. Buy-score chart ranks value for duty.",
    ),
    "guide-quotation": _entry(
        "Rough guide quotation — quick cost estimate before formal quotes.",
        "Build indicative pricing from catalog and benchmarks. Used early in procurement planning. Not a formal DP document.",
    ),
    "dp-f1-form": _entry(
        "DP F1 ITDIR Form — official authority to procure ICT items.",
        "Complete F1 indent, attach spec, route through GS endorsement and DAF MANAC. Print official layout. Central procurement document.",
    ),
    "cost-comparative-schedule": _entry(
        "Cost comparative schedule — grid comparing vendor prices for the same requirement.",
        "Enter vendor columns and line prices. Supports AIAD due diligence and DP adjudication. Print for file.",
    ),
    "dp-procurement": _entry(
        "ICT Procurement Cycle — eight-step tracker for every DP case.",
        "Each case moves F1 → GS → MANAC → quote → eval → PO → delivery → payment. Status filters and case detail. All portals read this pipeline.",
    ),
    "workshop-repairs": _entry(
        "Workshop Register — repairs intake, status, and completion.",
        "Log faulty equipment, track repair progress, assign technician. Links to receipt cert on return. Workshop role primary screen.",
    ),
    "gate-register": _entry(
        "Gate Register — ICT equipment in/out at the Directorate gate (RP).",
        "Record serial, holder, direction in/out, timestamps. Shows equipment still on site. RP Gate role primary screen.",
    ),
    "techstores-equipment-register": _entry(
        "TechStores equipment register — internal equipment asset list.",
        "Catalogue of equipment types and serials held by TechStores. Complements ICT accountability for store-held stock.",
    ),
    "suppliers-contracts": _entry(
        "Suppliers and contracts register.",
        "Maintain supplier master data, contracts, and banking details. Used when raising POs and supplier portal routing.",
    ),
    "zna-q-forms-index": _entry(
        "Index of all ZNA Q and SVCS forms — implemented and reference-only.",
        "Browse ASO form catalogue. Green links open fillable modules; grey entries are paper-only reference. Storeman primary entry to Q forms.",
    ),
    "duties-roles": _entry(
        "Duties and roles reference for TechStores organisation.",
        "Read-only reference of posts, duties, and system role mappings. Used for onboarding and audits.",
    ),
    "process-guides": _entry(
        "Learning Centre — process charts and procurement cycle guides.",
        "Visual flowcharts for stores, procurement, and portals. Supplier and staff training material.",
    ),
    "system-help": _entry(
        "System help and dictionary of terms.",
        "Searchable glossary and how-to notes. Available to all roles including storeman and viewer.",
    ),
    "reports-module": _entry(
        "Reports — export and summary views across registers.",
        "Generate summary reports from ledgers, loans, procurement, and accountability. Print or copy for command briefs.",
    ),
    "user-management": _entry(
        "User management — admin only.",
        "Create users, assign roles, reset access. Admin role only. Changes audit-logged.",
    ),
    "release-cut": _entry(
        "Release cut — transfer buying power between GL votes.",
        "Admin tool to move unspent allocation from one vote to another within the FY. Requires authority and audit trail.",
    ),
    "stakeholder-desk-dp": _entry(
        "DP Window — Directorate Procurement portal for quotations, adjudication, and PO.",
        "Case list shows all DP pipeline items. Open a case to upload quotes, record winner, raise PO, hand to AIAD. Summary stats: action, pipeline, done.",
    ),
    "stakeholder-desk-gs": _entry(
        "GS Branch Window — Colonel SD endorsement of DP F1 forms.",
        "Queue of cases awaiting GS endorsement. Upload signed endorsement scan. Sees full pipeline from F1 raise onward.",
    ),
    "stakeholder-desk-daf-procurement": _entry(
        "DAF Window — MANAC endorsement and supplier payment tab.",
        "Endorse F1 for funds (MANAC). Record payment vouchers after delivery inspection. First tab of DAF portal.",
    ),
    "stakeholder-desk-daf-creditors": _entry(
        "DAF Window — Creditors tab for import and payment chase.",
        "Import DAF creditor/paid lists via drag-drop. Match to TechStores Creditors register. Pay queue links to supplier debts records.",
    ),
    "stakeholder-desk-aiad": _entry(
        "Due Diligence Window — AIAD price audit before contract award.",
        "Review F1, spec, and quotes. Issue Price Due Diligence certificate. Upload signed certificate. Full AIAD pipeline visible.",
    ),
    "stakeholder-desk-supplier": _entry(
        "Supplier Window — Nixzimo and registered suppliers respond to RFQs and POs.",
        "See assigned cases only. Upload quotation, spec compliance, delivery note, invoice, banking. No access to internal ledgers.",
    ),
}

# Role home / nav screens
for key, label in [
    ("gate", "RP Gate"),
    ("storeman", "Storeman"),
    ("workshop", "Workshop"),
    ("orderly", "Orderly Room"),
    ("comms", "Department comms"),
    ("dp", "DP"),
    ("gs", "GS Branch"),
    ("daf", "DAF"),
    ("aiad", "AIAD"),
    ("supplier", "Supplier"),
    ("store_officer", "Store Officer"),
    ("viewer", "Viewer"),
]:
    home_what = {
        "gate": "Tailored home for RP Gate — shortcuts to Gate Register only.",
        "storeman": "Tailored home for Storeman — Q 1033, stock take, loans, ZNA Q forms.",
        "workshop": "Tailored home for Workshop — repairs register, spec eval, comms.",
        "orderly": "Tailored home for Orderly Room — Daily File, doc import, comms.",
        "comms": "Tailored home for department OC — IT Dir Comms only.",
        "dp": "Tailored home for DP — portals board, DP window, PO, suppliers.",
        "gs": "Tailored home for GS Branch — portals, GS window, requisitions.",
        "daf": "Tailored home for DAF — portals, MANAC, Creditors, FY bids.",
        "aiad": "Tailored home for AIAD — due diligence window and cost comparative.",
        "supplier": "Tailored home for Supplier — supplier window and doc import.",
        "store_officer": "Store Officer home — full GL and stores dashboard (no role card; standard KPI dashboard).",
        "viewer": "Viewer home — read-only dashboard with limited module access.",
    }[key]
    home_how = {
        "gate": "Login as rp. Dashboard kicker changes to gate context. Only Gate Register appears in sidebar.",
        "storeman": "Login as storeman. Shortcut buttons open daily stores forms without browsing full GL menu.",
        "workshop": "Login as workshop. Primary button opens Workshop Register; spec eval and comms secondary.",
        "orderly": "Login as orderly. Opens Orderly Room and correspondence workflows; no GL ledgers.",
        "comms": "Login as sysadmin/dba/etc. Single comms shortcut; sidebar hides stores and procurement.",
        "dp": "Login as dp. Buttons open DP portal and procurement cycle; no stores ledgers visible.",
        "gs": "Login as gsdesk. GS Window endorses F1s; sees requisitions for awareness.",
        "daf": "Login as daf. Creditors and payment shortcuts on home; second tab for creditor import.",
        "aiad": "Login as aiad. Due diligence queue and cost comparative access from home.",
        "supplier": "Login as nixzimo. Supplier portal only — RFQ/PO response upload.",
        "store_officer": "Login as store. Full sidebar with all five GL ledgers and operational registers.",
        "viewer": "Login as viewer. Dashboard and help only; save buttons disabled across modules.",
    }[key]
    EXPLICIT[f"role-home-{key}"] = _entry(home_what, home_how)
    EXPLICIT[f"role-nav-{key}"] = _entry(
        f"Sidebar navigation visible to {label} after login.",
        "Only modules allowed by config.js role bundle appear. Submenus (Portals, GL, ZNA Q) expand on click. Compare across roles to see access control.",
    )


def _zna_description(form: str, title: str, module_id: str) -> dict[str, str]:
    return _entry(
        f"Digital ZNA {form}: {title}. Official stores form in Annex A Sec 1 Ch 7 layout.",
        "Complete fields on screen, Save stores to database, Print for signature/file. "
        "Open from ZNA Q submenu or storeman home. Doc Import can pre-fill from scanned copies.",
    )


def _build_all() -> dict[str, dict[str, str]]:
    out = dict(EXPLICIT)
    for form, title, mid in ZNA_Q_IMPLEMENTED:
        if mid not in out:
            out[mid] = _zna_description(form, title, mid)
    for mid, label in MODULE_LABELS.items():
        if mid not in out and mid.startswith("gl-"):
            out[mid] = _entry(
                f"General Ledger window: {label}.",
                "View vote target, receipts, issues, and balance. Store officer edits movements; oversight roles view-only. Syncs to dashboard and reports.",
            )
        elif mid not in out and mid.startswith("dept-"):
            out[mid] = _entry(
                f"IT Dir department desk: {label}.",
                "Demand form CC command and TechStores; inbox for replies; establishment panel for posts. Submit creates office message and demand record.",
            )
    return out


DESCRIPTIONS: dict[str, dict[str, str]] = _build_all()


def get_screen_description(slug: str) -> dict[str, str]:
    if slug in DESCRIPTIONS:
        return DESCRIPTIONS[slug]
    label = MODULE_LABELS.get(slug, slug.replace("-", " ").title())
    return _entry(
        f"Module screen: {label}.",
        "Open from sidebar or dashboard shortcut. Fill or review data, Save to persist to techstores.db, Print where available. Access depends on your role.",
    )
