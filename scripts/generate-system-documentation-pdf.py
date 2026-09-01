#!/usr/bin/env python3
"""Generate TECHSTORESys detailed system documentation PDF."""

from __future__ import annotations

from datetime import date
from pathlib import Path

from fpdf import FPDF

ROOT = Path(__file__).resolve().parents[1]
OUT_ROOT = ROOT / "TECHSTORESys-System-Documentation.pdf"
OUT_APP = ROOT / "app" / "TECHSTORESys-System-Documentation.pdf"
OUT_PORTABLE = ROOT / "dist" / "TECHSTORES-Portable" / "app" / "TECHSTORESys-System-Documentation.pdf"

DOC_VERSION = "1.2"

# ZNA Q forms with fillable in-app modules (from app/js/zna-q-catalogue.js + SVCS)
ZNA_Q_IMPLEMENTED = [
    ("Q 1", "Statement of stores lost or damaged to be written off", "zna-q-1"),
    ("Q 3", "Issue to a Government department on repayment", "zna-q-3"),
    ("Q 31", "Cash purchase/receipt", "zna-q-31"),
    ("Q 40", "Artisan tools list", "zna-q-40"),
    ("Q 80", "Schedule of stores boarded / Ledger sheet", "zna-q-80"),
    ("Q 178", "Ledger (sub / distribution ledger sheet)", "zna-q-178"),
    ("Q 982", "Combined indent and voucher for stores", "zna-q-982"),
    ("Q 985", "Discrepancy report", "zna-q-985"),
    ("Q 987", "Certificate of stocktaking", "zna-q-987"),
    ("Q 998", "Statement of loss, damage or destruction", "zna-q-998"),
    ("Q 1033", "Issue and receipt voucher (large and small)", "zna-q-1033"),
    ("Q 1043", "Report on stores and condemnation certificate", "zna-q-1043"),
    ("Q 1049", "Transfer voucher", "zna-q-1049"),
    ("Q 1157", "Clothing and personal equipment record", "zna-q-1157"),
    ("Q 1179", "Clothing and necessaries issue voucher", "zna-q-1179"),
    ("Q 1229", "Certificate of accidental breakage", "zna-q-1229"),
    ("Q 1571", "Debit voucher", "zna-q-1571"),
    ("Q 1680", "Miscellaneous credit/debit voucher", "zna-q-1680"),
    ("Q 1954", "Recoveries from individuals", "zna-q-1954"),
    ("Q 3977", "Equipment/vehicle neglect, misuse and damage report", "zna-q-3977"),
    ("SVCS 890", "Demand / Issue", "zna-svcs-890"),
    ("SVCS 1045", "Workshop indent", "zna-svcs-1045"),
]

ROLE_HOME_WINDOWS = [
    ("gate / rp", "RP Gate workspace", "Gate Register - ICT in/out at Directorate gate"),
    ("storeman", "Storeman workspace", "Q 1033, delivery notes, stock take, loans, ZNA Q forms"),
    ("workshop", "Workshop workspace", "Workshop Register, spec eval, laptop/H2H compare"),
    ("orderly", "Orderly Room workspace", "Daily File, correspondence, doc import"),
    ("comms", "Department comms", "IT Dir Comms portal only"),
    ("dp", "DP Window", "Stakeholder desk + P/O, suppliers, procurement cycle"),
    ("gs", "GS Branch Window", "Stakeholder desk + F1 endorsement, requisitions"),
    ("daf", "DAF Window", "Stakeholder desk + Creditors tab, financial year bids"),
    ("aiad", "Due Diligence Window", "Stakeholder desk + spec / cost comparative"),
    ("supplier", "Supplier Window", "Stakeholder desk - quotes, D-note, banking"),
]

STAKEHOLDER_WINDOWS = [
    ("dp", "DP Window", "Quotations, adjudication, P/O, AIAD handoff; full DP in-tray"),
    ("gs", "GS Branch Window", "F1 endorsement upload; cases from awaiting_gs onward"),
    ("daf", "DAF Window", "Tab 1: MANAC/payment. Tab 2: Creditors import and chase"),
    ("aiad", "Due Diligence Window", "Price due diligence certificate; AIAD pipeline"),
    ("supplier", "Supplier Window", "RFQ/P/O response; upload quote, spec, invoice"),
]

DEPT_DESKS = [
    ("dept-sysadmin", "Systems Administration Desk", "Demand form CC Dir/DD/AQSO2/TechStores"),
    ("dept-workshop", "Workshop Desk", "Workshop spares/tools demand; link to Workshop Register"),
    ("dept-compengr", "Computer Engineering / DBA Desk", "Servers, storage, network engineering items"),
    ("dept-swengr", "Software Engineering Desk", "Dev tools, licences, project support"),
    ("dept-ictsec", "ICT Security Desk", "Security tools, certificates, appliances"),
    ("dept-itts", "ITTS Desk", "Training school equipment and media"),
    ("dept-admin", "Admin Office Desk", "Admin office ICT and internal requirements"),
    ("dept-gate", "Gate / RP Desk", "Gate equipment demand; link to Gate Register"),
]

PROCUREMENT_FORMS = [
    ("dp-f1-form", "DP F1 ITDIR Form", "Official indent for purchasing/procurement"),
    ("cost-comparative-schedule", "Cost Comparative Schedule", "Vendor price comparison grid"),
    ("spec-evaluation", "Spec/Tech Evaluation", "Technical evaluation of supplier quotes"),
    ("guide-quotation", "Rough Guide Quotation", "Quick estimate before formal quotes"),
    ("purchase-orders", "Purchase Orders", "P/O register - electronic and manual/DAF"),
    ("delivery-note", "Delivery Note", "Supplier delivery documentation"),
    ("workshop-receipt-cert", "Workshop Receipt Certificate", "Workshop receipt of repaired items"),
    ("financial-year-bids", "Financial Year Bids", "Annual bid submissions and votes"),
]

OPERATIONAL_REGISTERS = [
    ("unit-requisitions", "Requisitions in-tray", "Incoming unit/formation requests"),
    ("orderly-room", "Orderly Room Daily File", "Correspondence and requisition mirror"),
    ("supplier-debts", "Creditors register", "Non-paid goods received; DAF chase"),
    ("undelivered-orders", "Undelivered Items", "Ordered but not yet received"),
    ("ict-accountability", "ZNA ICT Asset Register", "Equipment accountability by unit"),
    ("voucher-module", "Issue/Receipt Voucher", "Alias screen for ZNA Q 1033"),
    ("temporary-loans", "Temporary Loans", "14-day controlled stores loans"),
    ("permanent-loans", "Permanent Loans", "Laptops/iPads under Comd/34"),
    ("workshop-repairs", "Workshop Register", "Repairs intake and status"),
    ("gate-register", "Gate Register", "RP gate movements in/out"),
    ("stock-take", "Stock Take", "Full stores inventory count"),
    ("monthly-returns", "Monthly Returns", "Unit ICT equipment monthly returns"),
]

# Module id -> display label (from app/js/dashboard.js getModuleLabel)
MODULE_LABELS: dict[str, str] = {
    "dashboard": "Dashboard Overview",
    "gl-2200600002": "GL 6122100009 - ZOFF / Office Supplies & Services",
    "gl-2200600003": "GL 2200600003 - Software Licenses",
    "gl-220200002": "GL 220200002 - Tech Equipment Maintenance",
    "gl-3112210001": "GL 3112210001 - ICT Equipment",
    "gl-2201900002": "GL 2201900002 - Spare Parts",
    "voucher-module": "Issue Voucher / ZNA-Q-1033",
    "stock-take": "Stock Take - Full Stores Inventory",
    "unit-checks": "Unit Check Log - ASO Ch 28",
    "financial-year-bids": "Financial Year Bids",
    "unit-equipment": "Unit Equipment",
    "ict-accountability": "ZNA ICT Asset Register",
    "ict-distribution": "ICT Equipment Distribution Lists",
    "temporary-loans": "Temporary Loans - Controlled Stores",
    "permanent-loans": "Permanent Loans - Laptops & iPads",
    "orderly-room": "Orderly Room - DF & Correspondence Files",
    "it-dir-comms": "IT Directorate - Communications Portal",
    "unit-requisitions": "Requisitions - In-tray",
    "monthly-returns": "Monthly Returns - Unit ICT Equipment",
    "spec-evaluation": "Spec/Tech Evaluation",
    "laptop-compare": "Laptop Compare - buy the winner",
    "ict-compare": "H2H ICT Comparison - crawl & compare",
    "guide-quotation": "Rough Guide Quotation",
    "dp-f1-form": "DP F1 Form",
    "cost-comparative-schedule": "Cost Comparative Schedule",
    "stakeholder-desk": "Portals - DP / GS / DAF / AIAD / Supplier",
    "portals-board": "Portals - procurement workflow dashboard",
    "dp-procurement": "ICT Procurement Cycle",
    "zna-q-982": "ZNA Q 982 - Combined Indent",
    "zna-q-178": "ZNA Q 178 - Sub Ledger Sheet",
    "zna-q-1033": "ZNA Q 1033 - Issue & Receipt Voucher",
    "zna-q-1043": "ZNA Q 1043 - Condemnation Certificate",
    "zna-q-80": "ZNA Q 80 - Ledger Sheet",
    "zna-svcs-890": "ZNA SVCS/890 - Demand / Issue",
    "zna-q-1179": "ZNA Q 1179 - Clothing Issue Voucher",
    "zna-q-987": "ZNA Q 987 - Stocktaking Certificate",
    "zna-q-3977": "ZNA Q 3977 - Neglect / Damage Report",
    "zna-q-985": "ZNA Q 985 - Discrepancy Report",
    "zna-q-1": "ZNA Q 1 - Stores lost/damaged write-off",
    "zna-q-998": "ZNA Q 998 - Loss / Damage / Destruction",
    "zna-q-1680": "ZNA Q 1680 - Miscellaneous credit/debit voucher",
    "zna-q-forms-index": "SUMMARY OF Q FORMS - Index",
    "zna-q-3": "ZNA Q 3 - Issue on repayment",
    "zna-q-31": "ZNA Q 31 - Cash purchase / receipt",
    "zna-q-40": "ZNA Q 40 - Artisan tools list",
    "zna-q-1049": "ZNA Q 1049 - Transfer voucher",
    "zna-q-1229": "ZNA Q 1229 - Accidental breakage certificate",
    "zna-q-1571": "ZNA Q 1571 - Debit voucher",
    "zna-q-1954": "ZNA Q 1954 - Recoveries from individuals",
    "zna-svcs-1045": "ZNA SVCS 1045 - Workshop Indent",
    "zna-q-1157": "ZNA Q 1157 - Clothing & Equipment Record",
    "accommodation-stores": "Inventory of Accommodation Stores",
    "delivery-note": "Delivery Note",
    "purchase-orders": "Purchase Orders",
    "undelivered-orders": "Undelivered Items",
    "supplier-debts": "Creditors - non-paid goods / DAF payment register",
    "workshop-repairs": "Workshop Register",
    "workshop-receipt-cert": "Workshop Receipt Certificate",
    "gate-register": "Gate Register (RP)",
    "techstores-equipment-register": "TechStores Equipment Register",
    "suppliers-contracts": "Suppliers and Contracts",
    "release-cut": "Release Cut",
    "duties-roles": "Duties & Roles",
    "process-guides": "Learning Centre - Process & Charts",
    "system-help": "System Help / Dictionary",
    "reports-module": "Reports",
    "user-management": "User Management",
    "doc-import": "Import Document",
    "dept-sysadmin": "Dept Desk - Systems Administration",
    "dept-workshop": "Dept Desk - Workshop",
    "dept-compengr": "Dept Desk - Computer Engineering",
    "dept-swengr": "Dept Desk - Software Engineering",
    "dept-ictsec": "Dept Desk - ICT Security",
    "dept-itts": "Dept Desk - ITTS",
    "dept-admin": "Dept Desk - Admin Office",
    "dept-gate": "Dept Desk - Gate / RP",
}

MODULE_IDS = [
    "dashboard", "orderly-room", "it-dir-comms",
    "dept-sysadmin", "dept-workshop", "dept-compengr", "dept-swengr", "dept-ictsec", "dept-itts", "dept-admin", "dept-gate",
    "gl-2200600002", "gl-2200600003", "gl-220200002", "gl-2201900002", "gl-3112210001",
    "voucher-module", "stock-take", "unit-checks", "financial-year-bids", "unit-equipment",
    "ict-accountability", "ict-distribution", "temporary-loans", "permanent-loans", "monthly-returns",
    "undelivered-orders", "supplier-debts", "workshop-receipt-cert", "delivery-note", "purchase-orders", "accommodation-stores",
    "unit-requisitions", "doc-import", "spec-evaluation", "laptop-compare", "ict-compare", "guide-quotation",
    "dp-f1-form", "cost-comparative-schedule", "dp-procurement", "portals-board", "stakeholder-desk",
    "workshop-repairs", "gate-register", "techstores-equipment-register", "suppliers-contracts",
    "zna-q-forms-index", "zna-q-982", "zna-q-178", "zna-q-1033", "zna-q-1043", "zna-q-80", "zna-svcs-890",
    "zna-q-1179", "zna-q-987", "zna-q-3977", "zna-q-1157", "zna-q-985", "zna-q-1", "zna-q-998", "zna-q-1680",
    "zna-q-3", "zna-q-31", "zna-q-40", "zna-q-1049", "zna-q-1229", "zna-q-1571", "zna-q-1954", "zna-svcs-1045",
    "duties-roles", "process-guides", "system-help", "reports-module", "user-management", "release-cut",
]

APP_STATE_KEYS = [
    "users", "auditLog", "glLedgers", "glMonthlyTargets", "storesInventory", "customInventoryLedgers",
    "customCatalogItems", "stockTakes", "monthlyReturns", "ictAccountability", "ictDistributionLists",
    "requisitions", "orderlyDailyFile", "correspondenceFiles", "undeliveredOrders", "supplierDebts",
    "workshopReceiptCerts", "dpProcurements", "costComparativeSchedules", "unitChecks", "officeMessages",
    "alertDesk", "ictCompareHistory", "navMenuOrder",
]

ROLE_MATRIX = [
    ("admin", "All (*)", "Yes", "Yes", "Yes", "Yes"),
    ("director / dd / aqso2 / rq / tso", "All (*)", "No (view)", "No", "Yes", "Yes"),
    ("army_commander / brig_*", "All (*)", "No (view)", "No", "Yes", "Yes"),
    ("store_officer / rq", "Stores + procurement", "Yes", "No", "No", "Yes"),
    ("storeman", "Issues, loans, ZNA Q", "Yes", "No", "No", "No"),
    ("workshop / oc_workshop", "Workshop + compare", "Yes", "No", "No", "No"),
    ("orderly_clerk / oc_admin", "Orderly + comms", "Yes", "No", "No", "No"),
    ("gs_sd", "GS portal + F1", "Yes", "No", "No", "No"),
    ("dir_daf", "DAF portal + creditors", "Yes", "No", "No", "Yes"),
    ("dir_dp", "DP portal + P/O", "Yes", "No", "No", "Yes"),
    ("dir_aiad", "AIAD portal + spec", "Yes", "No", "No", "Yes"),
    ("supplier", "Supplier portal", "Yes", "No", "No", "No"),
    ("rp / oc_gate", "Gate register", "Yes", "No", "No", "No"),
    ("oc_* comms desks", "IT Dir comms only", "Yes", "No", "No", "No"),
    ("viewer", "Dashboard + help", "No", "No", "No", "Yes"),
]


class DocPDF(FPDF):
    def header(self):
        if self.page_no() == 1:
            return
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(27, 94, 59)
        self.cell(0, 7, "TECHSTORESys - IT Directorate System Documentation", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "", 8)
        self.set_text_color(110, 110, 110)
        self.cell(0, 4, f"Zimbabwe National Army | v{DOC_VERSION} | {date.today().strftime('%d %B %Y')}", new_x="LMARGIN", new_y="NEXT")
        self.ln(2)
        self.set_draw_color(184, 207, 196)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(3)

    def footer(self):
        self.set_y(-14)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 8, f"Page {self.page_no()}/{{nb}}", align="C")

    def cover(self):
        self.add_page()
        self.set_font("Helvetica", "B", 22)
        self.set_text_color(27, 94, 59)
        self.ln(24)
        self.cell(0, 12, "TECHSTORESys", new_x="LMARGIN", new_y="NEXT", align="C")
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(30, 58, 95)
        self.cell(0, 10, "Detailed System Documentation", new_x="LMARGIN", new_y="NEXT", align="C")
        self.ln(6)
        self.set_font("Helvetica", "", 12)
        self.set_text_color(60, 60, 60)
        self.cell(0, 7, "Information Technology Directorate", new_x="LMARGIN", new_y="NEXT", align="C")
        self.cell(0, 7, "Zimbabwe National Army - Tech Stores & Procurement", new_x="LMARGIN", new_y="NEXT", align="C")
        self.ln(8)
        self.set_font("Helvetica", "", 10)
        self.cell(0, 6, f"Document version {DOC_VERSION} | {date.today().strftime('%d %B %Y')}", new_x="LMARGIN", new_y="NEXT", align="C")
        self.ln(14)
        self.set_font("Helvetica", "I", 9)
        self.set_text_color(100, 100, 100)
        self.multi_cell(0, 5, (
            "Comprehensive reference: architecture, roles, modules, procurement workflow, "
            "stakeholder portals, creditors, data model, API, and appendices. "
            "Visual companions: app/system-flow.html and app/data-flow-diagram.html."
        ), align="C")

    def toc(self, entries: list[tuple[str, str]]):
        self.add_page()
        self.section("Table of Contents")
        for num, title in entries:
            self.set_font("Helvetica", "", 10)
            self.set_text_color(30, 30, 30)
            self.cell(12, 6, num)
            self.cell(0, 6, title, new_x="LMARGIN", new_y="NEXT")
        self.ln(4)

    def section(self, title: str):
        if self.get_y() > 248:
            self.add_page()
        self.ln(2)
        self.set_font("Helvetica", "B", 13)
        self.set_text_color(27, 94, 59)
        self.cell(0, 8, title, new_x="LMARGIN", new_y="NEXT")
        self.ln(1)

    def subhead(self, title: str):
        if self.get_y() > 258:
            self.add_page()
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(52, 64, 84)
        self.cell(0, 6, title, new_x="LMARGIN", new_y="NEXT")
        self.ln(0.5)

    def body(self, text: str):
        self.set_font("Helvetica", "", 9.5)
        self.set_text_color(30, 30, 30)
        self.multi_cell(0, 5.2, text)
        self.ln(1)

    def bullet(self, text: str):
        self.set_font("Helvetica", "", 9.5)
        self.set_text_color(30, 30, 30)
        x = self.get_x()
        self.cell(4, 5.2, "-")
        self.set_x(x + 4)
        self.multi_cell(0, 5.2, text)
        self.ln(0.3)

    def table(self, headers: list[str], rows: list[list[str]], col_widths: list[int] | None = None):
        if self.get_y() > 240:
            self.add_page()
        widths = col_widths or [int(190 / len(headers))] * len(headers)
        h = 6

        def draw_header():
            self.set_font("Helvetica", "B", 7.5)
            self.set_fill_color(232, 244, 237)
            for i, hdr in enumerate(headers):
                self.cell(widths[i], h, hdr[:48], border=1, fill=True)
            self.ln()

        draw_header()
        self.set_font("Helvetica", "", 7.5)
        for row in rows:
            if self.get_y() > 272:
                self.add_page()
                draw_header()
            for i, cell in enumerate(row):
                txt = str(cell).replace("\n", " ")[:72]
                self.cell(widths[i], h, txt, border=1)
            self.ln()
        self.ln(2)


def build_pdf() -> None:
    pdf = DocPDF()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=16)
    pdf.cover()

    toc_entries = [
        ("1", "Executive Summary"),
        ("2", "System Architecture"),
        ("3", "Users, Roles and Access Control"),
        ("4", "Module Catalog (by function)"),
        ("5", "End-to-End Operational Flows"),
        ("6", "ICT Procurement Workflow"),
        ("7", "Stakeholder Portals"),
        ("8", "Creditors Register"),
        ("9", "Smart / Intelligence Features"),
        ("10", "Data Persistence and API"),
        ("11", "User Interface Conventions"),
        ("12", "Operations and Maintenance"),
        ("13", "Glossary"),
        ("14", "Application Windows"),
        ("15", "Forms Catalogue"),
        ("A", "Appendix: Module ID Reference"),
        ("B", "Appendix: Role Permission Matrix"),
        ("C", "Appendix: Application State Keys"),
        ("D", "Appendix: ZNA Q Forms (fillable)"),
        ("E", "Appendix: Procurement & register forms"),
    ]
    pdf.toc(toc_entries)
    pdf.add_page()

    # 1
    pdf.section("1. Executive Summary")
    pdf.body(
        "TECHSTORESys is the IT Directorate integrated stores, requisitions, procurement, "
        "and accountability system for the Zimbabwe National Army (ZNA). It digitises "
        "Tech Stores ledgers (GL accounts), issue and receipt vouchers (ZNA Q 1033), "
        "unit requisitions, the DP procurement cycle, stakeholder portals (GS Branch, "
        "DAF, DP, AIAD, Supplier), the Creditors register, workshop repairs, ICT "
        "equipment accountability, and management reporting."
    )
    pdf.body(
        "The application is a browser-based single-page system (SPA) served locally by "
        "server.py. Application state persists in SQLite via REST /api/state. A portable "
        "Windows build (PyInstaller) ships in dist/TECHSTORES-Portable for deployment "
        "without a separate Python install."
    )
    pdf.subhead("1.1 Design principles")
    pdf.bullet("Role-scoped navigation - users see only modules permitted for their role.")
    pdf.bullet("Single source of truth - one appState synced to server; modules share data.")
    pdf.bullet("Procurement traceability - every buy tracked from requisition through payment.")
    pdf.bullet("ZNA form fidelity - digital Q forms mirror official store paperwork.")
    pdf.bullet("Offline resilience - localStorage fallback when server unavailable.")

    # 2
    pdf.section("2. System Architecture")
    pdf.subhead("2.1 Components")
    pdf.bullet("Frontend SPA: app/index.html, app/css/main.css, app/js/*.js")
    pdf.bullet("Module loader: lazy-loads app/modules/{moduleId}.html fragments.")
    pdf.bullet("Backend: server.py - ThreadingHTTPServer, SQLite, JSON API.")
    pdf.bullet("Boot chain: boot.js -> auth.js -> config.js -> module scripts -> dashboard.js.")
    pdf.bullet("Portable EXE: TECHSTORES.exe wraps server; TECHSTORES-LAUNCHER opens browser.")

    pdf.subhead("2.2 Deployment modes")
    pdf.table(
        ["Mode", "Launcher", "Description"],
        [
            ["Full system", "START-SYSTEM.bat", "Python server + default browser on localhost"],
            ["Portable", "OPEN-TECHSTORES.bat", "Bundled EXE + app folder on USB/desktop"],
            ["Offline shell", "START-OFFLINE.bat", "Precached assets; limited API"],
        ],
        [32, 58, 100],
    )

    pdf.subhead("2.3 Directory layout")
    pdf.table(
        ["Path", "Purpose"],
        [
            ["app/", "UI, modules, CSS, JS, flow diagrams"],
            ["app/js/", "Business logic per functional area"],
            ["app/modules/", "HTML fragments loaded on demand"],
            ["data/", "SQLite DB, exchange rate, product cache"],
            ["assets/", "Icons, nav images, ZNA crest"],
            ["scripts/", "Build, PDF, parse utilities"],
            ["dist/", "Shipped portable executables"],
        ],
        [45, 145],
    )

    # 3
    pdf.section("3. Users, Roles and Access Control")
    pdf.body(
        "Login uses username/password against appState.users. Each user has a role key "
        "mapped in ROLE_PERMISSIONS (app/js/config.js). Permissions: canEdit, canReleaseCut, "
        "canManageUsers, canBackup, canReports. Oversight roles (Director, DD, AQSO2, "
        "RQ, Army Commander, Brigadiers) receive modules=['*'] with canEdit=false."
    )
    pdf.subhead("3.1 Stakeholder desk roles")
    pdf.table(
        ["Role key", "Portal window", "Module bundle"],
        [
            ["gs_sd", "GS Branch", "MODULES_DESK_GS"],
            ["dir_daf", "DAF", "MODULES_DESK_DAF + Creditors"],
            ["dir_dp", "DP Contracts", "MODULES_DESK_DP"],
            ["dir_aiad", "Due Diligence", "MODULES_DESK_AIAD"],
            ["supplier", "Supplier", "MODULES_DESK_SUPPLIER"],
        ],
        [28, 40, 122],
    )

    pdf.subhead("3.2 Default demo accounts (change in production)")
    pdf.body(
        "server.py ships DEFAULT_PLAIN_PASSWORDS for demo: admin/admin123, rq/rq123, "
        "daf/daf123, dp/dp123, gsdesk/gsdesk123, aiad/aiad123, orderly/orderly123, etc. "
        "Replace before operational use."
    )

    # 4
    pdf.add_page()
    pdf.section("4. Module Catalog (by function)")
    pdf.subhead("4.1 Command & oversight")
    pdf.bullet("dashboard - KPIs, alerts watch, role-scoped home shortcuts.")
    pdf.bullet("universal-search - cross-module search with history.")
    pdf.bullet("reports-module - TechStores period and template reports.")
    pdf.bullet("process-guides - Learning Centre with procurement charts.")
    pdf.bullet("system-help / system-dictionary - terminology reference.")

    pdf.subhead("4.2 Requisitions & correspondence")
    pdf.bullet("unit-requisitions - in-tray with age, stock status, intelligence panel.")
    pdf.bullet("orderly-room - Daily File mirror; correspondence routing.")
    pdf.bullet("doc-import - AI/server parse; apply extracted fields to forms.")
    pdf.bullet("it-dir-comms - department messaging portal.")

    pdf.subhead("4.3 Stores & GL ledgers")
    pdf.bullet("Five GL ledgers: office supplies, software, maintenance, spare parts, ICT equipment.")
    pdf.bullet("voucher-module (ZNA Q 1033) - issues/receipts with ZA numbers.")
    pdf.bullet("delivery-note, stock-take, unit-checks, accommodation-stores.")
    pdf.bullet("financial-year-bids, release-cut (admin), gl-targets monthly proposals.")
    pdf.bullet("temporary-loans (14-day) and permanent-loans (Comd/34).")

    pdf.subhead("4.4 ICT accountability")
    pdf.bullet("ict-accountability - ZNA ICT Asset Register; typeable unit picker.")
    pdf.bullet("ict-distribution, unit-equipment, monthly-returns.")
    pdf.bullet("techstores-equipment-register, gate-register (RP).")
    pdf.bullet("workshop-repairs, workshop-receipt-cert.")

    pdf.subhead("4.5 Procurement")
    pdf.bullet("dp-f1-form, cost-comparative-schedule, spec-evaluation.")
    pdf.bullet("dp-procurement - 8-step ICT procurement cycle tracker.")
    pdf.bullet("portals-board - visual workflow dashboard with deep links.")
    pdf.bullet("stakeholder-desk - GS/DAF/DP/AIAD/Supplier windows.")
    pdf.bullet("purchase-orders, suppliers-contracts, undelivered-orders, supplier-debts (Creditors).")

    pdf.subhead("4.6 Workshop buy tools")
    pdf.bullet("laptop-compare - duty-profile ranking from local catalog.")
    pdf.bullet("ict-compare - web crawl H2H compare; buy-score chart.")
    pdf.bullet("guide-quotation - rough estimate helper.")

    pdf.subhead("4.7 ZNA Q / SVCS forms")
    pdf.body(
        "22+ digital forms including Q 1033, Q 982, Q 178, Q 1043, Q 80, SVCS 890, "
        "Q 1179, Q 987, Q 3977, Q 985, Q 1, Q 998, Q 1680, Q 3, Q 31, Q 40, Q 1049, "
        "Q 1229, Q 1571, Q 1954, SVCS 1045. Index: zna-q-forms-index."
    )

    # 5
    pdf.section("5. End-to-End Operational Flows")
    pdf.subhead("5.1 Requisition to issue (in stock)")
    pdf.body(
        "Unit submits requisition -> Orderly Room / Requisitions in-tray -> RQ checks "
        "stock on GL ledger -> if available, raise ZNA Q 1033 issue voucher -> record "
        "ZA number on ICT Accountability if applicable -> close requisition."
    )
    pdf.subhead("5.2 Requisition to purchase (out of stock)")
    pdf.body(
        "Requisition marked out-of-stock -> raise DP F1 -> GS endorsement -> MANAC (DAF) "
        "-> PFMS number -> DP call for quotes -> IT Dir spec eval -> AIAD due diligence "
        "-> P/O -> supply/D-note -> delivery verified -> Creditors entry -> DAF payment."
    )
    pdf.subhead("5.3 Creditors lifecycle")
    pdf.body(
        "Goods received and verified -> Creditors case opened -> chased_daf when memo sent "
        "-> DAF pays -> upload paid-list or mark paid -> status paid. Undelivered Items "
        "covers the opposite case (ordered, not yet received)."
    )

    # 6
    pdf.add_page()
    pdf.section("6. ICT Procurement Workflow")
    pdf.table(
        ["Step", "Status code", "Responsible actor"],
        [
            ["1", "spec_raise_f1", "IT Dir / Unit"],
            ["2b", "awaiting_gs", "Colonel SD (GS Branch)"],
            ["2c", "awaiting_manac", "DAF"],
            ["2d", "pfms_req_no", "IT Dir RQ"],
            ["3", "f1_with_dp", "DP Contracts"],
            ["3b", "quotes_itdir_eval", "IT Dir / Workshop"],
            ["3c", "spec_returned_dp", "DP"],
            ["4", "aiad_due_diligence", "AIAD"],
            ["4b", "aiad_cert_issued", "AIAD"],
            ["5", "po_raised / po_manual_pending_daf", "DP / DAF"],
            ["6", "supply_delivery", "Supplier"],
            ["7", "delivery_verified", "IT Dir"],
            ["8", "payment_complete", "DAF"],
        ],
        [16, 58, 116],
    )

    # 7
    pdf.section("7. Stakeholder Portals")
    pdf.body(
        "Each portal (stakeholder-desk.js) shows the full in-tray for that actor from "
        "their entry point onward, not only active-step cases. Cases needing action sort "
        "first and display an Action marker."
    )
    pdf.subhead("7.1 GS Branch")
    pdf.bullet("Queue: all cases from awaiting_gs onward plus GS stakeholder touch.")
    pdf.bullet("Action: awaiting_gs without gs.endorsedAt - upload signed endorsement.")

    pdf.subhead("7.2 DAF")
    pdf.bullet("Tab Procurement cycle: MANAC, payment vouchers, procurement pay queue.")
    pdf.bullet("Tab Creditors & payment: stats strip, intelligence, Excel import, paid-list.")
    pdf.bullet("Action: awaiting_manac, po_manual_pending_daf, delivery verified unpaid.")

    pdf.subhead("7.3 DP")
    pdf.bullet("Queue: from f1_with_dp onward plus quotes_itdir_eval and DP touch.")
    pdf.bullet("Action: call quotes, record winner, send AIAD, raise P/O.")

    pdf.subhead("7.4 AIAD")
    pdf.bullet("Queue: from aiad_due_diligence / spec_returned_dp onward.")
    pdf.bullet("Action: issue Price Due Diligence certificate; upload signed form.")

    pdf.subhead("7.5 Supplier")
    pdf.bullet("Cases visible when supplier named on P/O or invited in stakeholder slot.")
    pdf.bullet("Upload quotation, spec compliance, D-note, invoice, banking details.")

    # 8
    pdf.section("8. Creditors Register")
    pdf.bullet("Module id: supplier-debts (nav label: Creditors).")
    pdf.bullet("Seed: it-dir-creditors-seed.js - IT DIR register 05 Nov 2025.")
    pdf.bullet("Import: POST /api/creditors/parse - drag-drop Excel in module or DAF tab.")
    pdf.bullet("Paid list: POST /api/creditors/parse-paid - batch mark matched suppliers paid.")
    pdf.bullet("Intelligence: priority chase, duplicate supplier groups, merge helper.")
    pdf.bullet("Statuses: open, chased_daf, part_paid, paid, cancelled.")
    pdf.bullet("Chase memo printable for DAF action.")

    # 9
    pdf.section("9. Smart / Intelligence Features")
    pdf.bullet("Requisitions: respond-first (urgent + oldest), overdue/out-of-stock flags.")
    pdf.bullet("Undelivered: priority supplier follow-up ranking.")
    pdf.bullet("Creditors: DAF chase queue, duplicate detection, paid-list matching.")
    pdf.bullet("Alerts desk: cross-module watch with navigateToModule deep links.")
    pdf.bullet("ICT compare: ictCompareHistory avoids repeat web crawls.")
    pdf.bullet("Typeable select (utils.js): combobox with type-to-filter; used for ZNA units.")

    # 10
    pdf.add_page()
    pdf.section("10. Data Persistence and API")
    pdf.subhead("10.1 Storage modes")
    pdf.body(
        "storageMode: online | offline-shell | offline-local | local-only. "
        "Auto-save debounced to PUT /api/state. SQLite file under data/."
    )
    pdf.subhead("10.2 REST API")
    pdf.table(
        ["Endpoint", "Method", "Purpose"],
        [
            ["/api/health", "GET", "Health check"],
            ["/api/state", "GET/PUT", "Load/save appState"],
            ["/api/login", "POST", "Authenticate user"],
            ["/api/audit", "POST", "Audit log entry"],
            ["/api/mode", "GET", "Current storage mode"],
            ["/api/mode/switch", "POST", "Switch online/offline"],
            ["/api/exchange-rate", "GET", "RBZ USD/ZWL cache"],
            ["/api/product-specs", "POST", "Product spec enrichment"],
            ["/api/product-enrich", "POST", "Product web enrich"],
            ["/api/product-images", "POST", "Product image fetch"],
            ["/api/market-catalog", "GET/POST", "Market catalog cache"],
            ["/api/creditors/parse", "POST", "Parse creditors Excel"],
            ["/api/creditors/parse-paid", "POST", "Parse DAF paid-list Excel"],
            ["/api/ai/ask", "POST", "Offline assistant"],
            ["/api/ai/import-document", "POST", "Document import parse"],
            ["/api/ai/spec-document", "POST", "Spec document parse"],
            ["/api/ai/draft-justification", "POST", "Draft justification text"],
        ],
        [52, 22, 116],
    )

    # 11
    pdf.section("11. User Interface Conventions")
    pdf.bullet("Sidebar nav grouped: Stores, Requisitions, Procurement, Workshop, etc.")
    pdf.bullet("Role filter hides unauthorized nav items at render time.")
    pdf.bullet("navigateToModule(id, opts) - opts: stkDesk, stkDafTab, sdId for deep links.")
    pdf.bullet("ZNA unit picker: wireZnaUnitPicker / fillZnaUnitSelect - establishment groups.")
    pdf.bullet("Print: body.printing-* classes hide chrome; voucher and memo layouts.")
    pdf.bullet("Cache bust: ?v=YYYYMMDDtag on script/link tags in index.html.")

    # 12
    pdf.section("12. Operations and Maintenance")
    pdf.bullet("Start: START-SYSTEM.bat or python server.py (default port from server.py).")
    pdf.bullet("Build portable: scripts/build-portable.bat (icon: assets/techstores.ico).")
    pdf.bullet("Regenerate icon: python scripts/build-icon.py.")
    pdf.bullet("Backup: admin menu; copy data/*.db for cold backup.")
    pdf.bullet("Regenerate this PDF: python scripts/generate-system-documentation-pdf.py.")

    pdf.subhead("12.1 Related files")
    pdf.bullet("app/system-flow.html + TECHSTORESys-System-Flow.pdf")
    pdf.bullet("app/data-flow-diagram.html + TECHSTORESys-Data-Flow-Diagram.pdf")
    pdf.bullet("TECHSTORESys-Progress-Mon31Aug-Tue1Sep-2026.pdf - recent changes")

    # 13 Glossary
    pdf.add_page()
    pdf.section("13. Glossary")
    for term, definition in [
        ("DAF", "Directorate of Army Finance - MANAC endorsement and supplier payment"),
        ("DP F1", "Directorate Procurement Form 1 - authority to procure"),
        ("MANAC", "Management Accounting - DAF funds endorsement on F1"),
        ("PFMS", "Public Financial Management System - ministry requisition number"),
        ("AIAD", "Army Internal Audit Directorate - price due diligence audit"),
        ("GS Branch", "General Staff - Colonel SD endorses F1 before MANAC"),
        ("Q 1033", "ZNA Issue and Receipt Voucher for store movements"),
        ("ZA No.", "ZNA asset number assigned to issued ICT equipment"),
        ("Creditors", "Suppliers who delivered goods/services but are not yet paid"),
        ("Undelivered", "Orders placed with supplier but goods not yet received"),
        ("Release Cut", "Admin transfer of buying power between GL votes"),
        ("H2H Compare", "Head-to-head ICT equipment comparison via web crawl"),
        ("Typeable select", "Combobox control: type to filter long option lists"),
        ("Stakeholder desk", "Role-specific portal window for external directorates"),
        ("Window", "Full-screen module opened from nav or dashboard (form-container)"),
        ("Form", "Fillable data-entry screen inside a module window"),
    ]:
        pdf.subhead(term)
        pdf.body(definition)

    # 14 Windows
    pdf.add_page()
    pdf.section("14. Application Windows")
    pdf.body(
        "In TECHSTORESys a window is a full-screen module opened from the sidebar, dashboard "
        "shortcut, or portals board. Each window loads an HTML fragment from app/modules/ "
        "and is controlled by matching JavaScript. Windows are role-filtered at login."
    )

    pdf.subhead("14.1 Role-scoped home workspaces")
    pdf.body(
        "On login, non-RQ roles see a tailored dashboard home (dept-home.js) with shortcuts "
        "to their primary windows."
    )
    pdf.table(
        ["Role preset", "Window title", "Primary screens"],
        ROLE_HOME_WINDOWS,
        [28, 42, 120],
    )

    pdf.subhead("14.2 Stakeholder portal windows")
    pdf.body(
        "All five external directorate windows share module stakeholder-desk. The desk "
        "parameter (data-stk-desk) selects GS, DAF, DP, AIAD, or Supplier chrome. "
        "Layout: case list (left) + case detail (right). DAF has a second tab for Creditors."
    )
    pdf.table(
        ["Desk key", "Window name", "Purpose"],
        STAKEHOLDER_WINDOWS,
        [22, 38, 130],
    )
    pdf.bullet("Open via: sidebar Portals submenu, portals-board tiles, or role home shortcuts.")
    pdf.bullet("Deep link: navigateToModule('stakeholder-desk', { stkDesk: 'daf', stkDafTab: 'creditors' }).")

    pdf.subhead("14.3 IT Directorate department desks")
    pdf.body(
        "Eight internal department windows (dept-desk.js). Each has: demand/requisition form, "
        "inbox, demands log, and Establishment panel (nav sub-link). Submit copies Dir, DD, "
        "AQSO2 and TechStores."
    )
    pdf.table(
        ["Module ID", "Desk title", "Function"],
        DEPT_DESKS,
        [38, 52, 100],
    )

    pdf.subhead("14.4 Other major windows")
    pdf.table(
        ["Module ID", "Window", "Notes"],
        [
            ["portals-board", "Portals dashboard", "Clickable procurement workflow map"],
            ["dp-procurement", "ICT Procurement Cycle", "8-step tracker for all DP cases"],
            ["it-dir-comms", "IT Dir Comms", "Department messaging portal"],
            ["doc-import", "Import Document", "Parse scan/text into form fields"],
            ["dashboard", "Dashboard Overview", "KPIs, alerts, universal search"],
            ["gl-3112210001", "GL ICT Equipment ledger", "One of five GL account windows"],
            ["laptop-compare", "Laptop Compare", "Catalog duty-profile ranking"],
            ["ict-compare", "H2H ICT Comparison", "Web crawl compare with buy-score chart"],
        ],
        [42, 48, 100],
    )

    pdf.subhead("14.5 Window UI pattern")
    pdf.bullet("Header bar: form-title + close button (returns to dashboard).")
    pdf.bullet("class form-container on root div; id matches module ID for navigation.")
    pdf.bullet("Print: body.printing-{moduleId} hides other containers.")
    pdf.bullet("Module loader caches loaded HTML; init*Module() runs on first open.")

    # 15 Forms
    pdf.add_page()
    pdf.section("15. Forms Catalogue")
    pdf.body(
        "Forms are fillable data-entry screens inside module windows. ZNA Q forms follow "
        "Annex A Sec 1 Ch 7 (ASO). Procurement forms follow DP/DAF/AIAD cycle. Registers "
        "are structured lists with add/edit/print rather than single-page official layouts."
    )

    pdf.subhead("15.1 ZNA Q and SVCS forms (official stores forms)")
    pdf.body(
        f"{len(ZNA_Q_IMPLEMENTED)} forms are implemented as fillable modules. "
        "The full ASO catalogue (90+ entries) is indexed at zna-q-forms-index; "
        "reference-only forms are listed for completeness but open on paper."
    )
    pdf.table(
        ["Form", "Title", "Module ID"],
        [[f[0], f[1], f[2]] for f in ZNA_Q_IMPLEMENTED],
        [22, 98, 70],
    )
    pdf.bullet("Primary daily form: Q 1033 (also voucher-module shortcut in nav).")
    pdf.bullet("Q 982 combined indent links to procurement indent workflow.")
    pdf.bullet("SVCS 1045 used for workshop stores indents.")

    pdf.subhead("15.2 Procurement and evaluation forms")
    pdf.table(
        ["Module ID", "Form name", "Use in cycle"],
        [[f[0], f[1], f[2]] for f in PROCUREMENT_FORMS],
        [48, 52, 90],
    )

    pdf.subhead("15.3 Operational registers (structured forms)")
    pdf.table(
        ["Module ID", "Register", "Purpose"],
        OPERATIONAL_REGISTERS,
        [42, 48, 100],
    )

    pdf.subhead("15.4 Form features")
    pdf.bullet("Doc Import: upload or paste document; server parses and fills target form fields.")
    pdf.bullet("ZNA unit picker: typeable combobox on unit/formation fields (zna-units.js).")
    pdf.bullet("Print layouts: most Q forms and DP F1 have print-optimised CSS.")
    pdf.bullet("Table search: many forms include data-search-target toolbar filters.")
    pdf.bullet("Auto-save: edits persist to appState on change (debounced server sync).")

    # Appendix A
    pdf.add_page()
    pdf.section("Appendix A: Module ID Reference")
    pdf.body(f"Complete list of {len(MODULE_IDS)} registered module IDs and display labels.")
    module_rows = []
    for mid in MODULE_IDS:
        label = MODULE_LABELS.get(mid, mid.replace("-", " ").title())
        module_rows.append([mid, label])
    pdf.table(["Module ID", "Display label"], module_rows, [55, 135])

    # Appendix B
    pdf.add_page()
    pdf.section("Appendix B: Role Permission Matrix")
    pdf.body("Summary of ROLE_PERMISSIONS flags. Modules column describes scope; (*) = all modules.")
    pdf.table(
        ["Role", "Modules", "Edit", "Release cut", "Users", "Reports"],
        list(ROLE_MATRIX),
        [42, 48, 14, 22, 16, 18],
    )
    pdf.subhead("Desk module lists (config.js)")
    pdf.bullet("MODULES_DESK_GS: portals + requisitions + dp-f1 + dp-procurement")
    pdf.bullet("MODULES_DESK_DAF: portals + dp-procurement + supplier-debts + financial-year-bids")
    pdf.bullet("MODULES_DESK_DP: portals + dp-procurement + spec + P/O + undelivered + suppliers")
    pdf.bullet("MODULES_DESK_AIAD: portals + dp-procurement + cost-comparative + spec-evaluation")
    pdf.bullet("MODULES_DESK_SUPPLIER: portals shared bundle only")
    pdf.bullet("MODULES_RQ: full stores ledgers + procurement + reports (no orderly-room)")

    # Appendix C
    pdf.section("Appendix C: Application State Keys")
    pdf.body("Top-level keys persisted in appState / SQLite (server.py STATE_KEYS subset):")
    key_rows = [[k] for k in APP_STATE_KEYS]
    pdf.table(["State key"], key_rows, [190])

    pdf.add_page()
    pdf.section("Appendix D: ZNA Q Forms (fillable in system)")
    pdf.body(
        "Complete list of official ZNA Q / SVCS forms with digital modules. "
        "Source: app/js/zna-q-catalogue.js. Index module: zna-q-forms-index."
    )
    pdf.table(
        ["Form no.", "Official title", "Module ID", "Nav path"],
        [
            [f[0], f[1], f[2], f"Sidebar > ZNA Q Forms > {f[0]}"]
            for f in ZNA_Q_IMPLEMENTED
        ],
        [20, 78, 42, 50],
    )

    pdf.section("Appendix E: Procurement and register forms")
    pdf.table(
        ["Category", "Module ID", "Form / register name"],
        [[ "Procurement", p[0], p[1] ] for p in PROCUREMENT_FORMS]
        + [[ "Register", r[0], r[1] ] for r in OPERATIONAL_REGISTERS],
        [28, 52, 110],
    )

    pdf.section("Document control")
    pdf.body(
        f"Auto-generated v{DOC_VERSION} on {date.today().strftime('%d %B %Y')} from TECHSTORESys "
        "source. Authoritative module/role definitions: app/js/config.js. "
        "For visual architecture see app/system-flow.html and app/data-flow-diagram.html."
    )

    outputs = [OUT_ROOT, OUT_APP]
    if OUT_PORTABLE.parent.exists():
        outputs.append(OUT_PORTABLE)
    for out in outputs:
        out.parent.mkdir(parents=True, exist_ok=True)
        pdf.output(str(out))
        print(f"Wrote {out}")


if __name__ == "__main__":
    build_pdf()
