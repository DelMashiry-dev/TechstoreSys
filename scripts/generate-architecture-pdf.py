#!/usr/bin/env python3
"""TECHSTORESys architecture infographic PDF (printable briefing chart)."""

from __future__ import annotations

from pathlib import Path

from fpdf import FPDF

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "TECHSTORESys-Architecture-Infographic.pdf"

NAVY = (16, 43, 77)
NAVY_MID = (23, 59, 103)
BLUE = (22, 138, 196)
TEAL = (8, 126, 131)
GREEN = (28, 138, 75)
GOLD = (180, 120, 12)
INK = (23, 43, 77)
MUTED = (90, 108, 128)
LINE = (201, 213, 227)
WHITE = (255, 255, 255)
PAPER = (245, 248, 251)
SOFT = (234, 244, 251)
SOFT_G = (237, 248, 241)
SOFT_T = (232, 246, 247)
SOFT_Y = (255, 247, 229)


class ArchPDF(FPDF):
    def header(self):
        pass

    def footer(self):
        self.set_y(-12)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(*MUTED)
        self.cell(0, 8, f"TECHSTORESys architecture  |  09 September 2026  |  Page {self.page_no()}/{{nb}}", align="C")


def rect_fill(pdf: ArchPDF, x, y, w, h, fill, border=None, radius=0):
    pdf.set_fill_color(*fill)
    if border:
        pdf.set_draw_color(*border)
        pdf.set_line_width(0.4)
        style = "FD"
    else:
        pdf.set_draw_color(*fill)
        style = "F"
    if radius:
        pdf.rounded_rect(x, y, w, h, radius, style=style)
    else:
        pdf.rect(x, y, w, h, style=style)


def text_at(pdf: ArchPDF, x, y, w, h, text, size=10, bold=False, color=INK, align="L"):
    pdf.set_xy(x, y)
    pdf.set_font("Helvetica", "B" if bold else "", size)
    pdf.set_text_color(*color)
    pdf.cell(w, h, text, align=align)


def wrapped(pdf: ArchPDF, x, y, w, h, text, size=8, color=MUTED):
    pdf.set_xy(x, y)
    pdf.set_font("Helvetica", "", size)
    pdf.set_text_color(*color)
    pdf.multi_cell(w, h, text)


def arrow_right(pdf: ArchPDF, x1, y, x2):
    pdf.set_draw_color(*BLUE)
    pdf.set_line_width(0.7)
    pdf.line(x1, y, x2 - 2.2, y)
    pdf.set_fill_color(*BLUE)
    pdf.polygon([(x2, y), (x2 - 3.2, y - 1.6), (x2 - 3.2, y + 1.6)], style="F")


def build_pdf() -> None:
    pdf = ArchPDF(orientation="L", format="A3", unit="mm")
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=False)
    pdf.add_page()
    pw = pdf.w - 20  # 400 on A3 landscape
    left = 10

    # Banner
    rect_fill(pdf, 0, 0, pdf.w, 38, NAVY)
    text_at(pdf, left, 8, 280, 8, "ZIMBABWE NATIONAL ARMY  |  IT DIRECTORATE", 10, True, (169, 216, 242))
    text_at(pdf, left, 16, 320, 12, "TECHSTORESys -- system architecture", 22, True, WHITE)
    text_at(
        pdf,
        left,
        28,
        390,
        6,
        "Local-first desktop web app: one Python process on this PC serves the browser UI and writes one SQLite file. No cloud tenant. No live DAF/ERP feed.",
        10,
        False,
        (217, 230, 243),
    )

    # Stats
    stats = [
        (":8080", "App + API port"),
        (":8765", "Mode launcher"),
        ("SQLite", "techstores.db (WAL)"),
        ("29 roles", "Named in config.js"),
        ("PyInstaller", "TECHSTORES.exe / Setup"),
    ]
    sy = 44
    sw = (pw - 16) / 5
    for i, (val, lab) in enumerate(stats):
        x = left + i * (sw + 4)
        rect_fill(pdf, x, sy, sw, 22, WHITE, LINE)
        text_at(pdf, x, sy + 2, sw, 10, val, 14, True, NAVY_MID, "C")
        text_at(pdf, x, sy + 12, sw, 7, lab, 8, False, MUTED, "C")

    # Layer stack title
    y = 72
    text_at(pdf, left, y, 200, 8, "LAYERED STACK  (how the system is built)", 12, True, NAVY)
    y = 82

    layers = [
        (
            "L1  ACTORS",
            "Role-based users",
            "Sign-in is local. Sidebar, home shortcuts and edit rights come from the role -- not a remote identity service.",
            "Stores: Store Officer, RQ, Storeman   |   Desks: DP, GS, DAF/MANAC, AIAD, Supplier   |   IT Dir: Orderly Room, Workshop, dept OCs, Gate/RP   |   Oversight: Director, DD, AQSO2, Brigadiers, Commander",
            SOFT,
            BLUE,
        ),
        (
            "L2  PRESENTATION",
            "Browser shell",
            "http://127.0.0.1:8080/app/  -- one HTML shell, CSS theme, HTML fragments per module. No separate frontend build.",
            "app/index.html shell + sidebar + header   |   app/modules/*.html loaded on demand   |   Appearance prefs   |   Role home dashboards after login",
            WHITE,
            LINE,
        ),
        (
            "L3  CLIENT RUNTIME",
            "Vanilla JS application",
            "boot.js wires login and save. config.js holds ROLE_PERMISSIONS. module-loader.js injects each screen. appState is the in-memory ledger of all operational records.",
            "auth.js + POST /api/login   |   config.js modules and accessMode   |   state.js save-revision conflict check   |   Alerts, universal search, ZNA unit pickers",
            SOFT,
            BLUE,
        ),
        (
            "L4  LOCAL SERVER",
            "Python HTTP API  :8080",
            "server.py (TECHSTORES.exe when frozen) is a ThreadingHTTPServer. It serves static files and JSON. A helper on :8765 only switches online / offline mode.",
            "GET/PUT /api/state  -- full app snapshot   |   POST /api/login  -- PBKDF2   |   creditors/parse, parse-paid, bids/parse   |   Optional: /api/ai/*, product-specs, exchange-rate",
            SOFT_T,
            TEAL,
        ),
        (
            "L5  PERSISTENCE",
            "SQLite + parsers",
            "techstores.db sits next to the EXE (WAL). Users, GL budgets, module payloads, release cuts and audit live in tables. Most registers are JSON blobs in settings.",
            "tables: users, settings, gl_budgets, modules, release_cuts, audit_log   |   Excel parsers: creditors, paid list, FY bids   |   Offline fallback: browser IndexedDB until online sync",
            SOFT_G,
            GREEN,
        ),
    ]

    lh = 26
    for kicker, title, summary, items, fill, border in layers:
        rect_fill(pdf, left, y, pw, lh, fill, border)
        rect_fill(pdf, left, y, 48, lh, border)
        text_at(pdf, left + 1, y + 9, 46, 8, kicker, 7, True, WHITE, "C")
        text_at(pdf, left + 52, y + 2, pw - 56, 7, title, 11, True, NAVY)
        wrapped(pdf, left + 52, y + 9, pw - 56, 4.2, summary, 8, INK)
        wrapped(pdf, left + 52, y + 17.5, pw - 56, 4, items, 7.5, MUTED)
        y += lh + 3

    # Request path
    y += 4
    text_at(pdf, left, y, 280, 8, "REQUEST PATH  --  login to durable save (Database mode)", 12, True, NAVY)
    y += 10

    steps = [
        ("START-SYSTEM", "TECHSTORES.exe"),
        ("Login", "POST /api/login"),
        ("Load snapshot", "GET /api/state"),
        ("Role gate", "config.js permissions"),
        ("Module screen", "HTML + JS + appState"),
        ("Save", "PUT /api/state"),
        ("techstores.db", "SQLite WAL"),
    ]
    n = len(steps)
    gap = 8
    bw = (pw - gap * (n - 1)) / n
    bh = 28
    for i, (title, sub) in enumerate(steps):
        x = left + i * (bw + gap)
        fill = SOFT_G if i == n - 1 else WHITE
        border = GREEN if i == n - 1 else BLUE
        rect_fill(pdf, x, y, bw, bh, fill, border)
        text_at(pdf, x, y + 5, bw, 8, title, 9, True, NAVY, "C")
        text_at(pdf, x, y + 15, bw, 7, sub, 7.5, False, MUTED, "C")
        if i < n - 1:
            arrow_right(pdf, x + bw, y + bh / 2, x + bw + gap)

    y += bh + 6
    wrapped(
        pdf,
        left,
        y,
        pw,
        5,
        "PUT /api/state rejects a stale saveRevision with HTTP 409. Offline mode stops at the browser: IndexedDB holds appState until START-SYSTEM runs again. Source: server.py, launcher_service.py, app/js/config.js, app/js/boot.js.",
        8,
        MUTED,
    )

    # Page 2 -- surfaces, data, API
    pdf.add_page()
    rect_fill(pdf, 0, 0, pdf.w, 28, NAVY)
    text_at(pdf, left, 6, 300, 8, "ZIMBABWE NATIONAL ARMY  |  IT DIRECTORATE", 10, True, (169, 216, 242))
    text_at(pdf, left, 14, 360, 10, "Work surfaces, data stores and API", 18, True, WHITE)

    y = 36
    text_at(pdf, left, y, 200, 8, "WORK SURFACES INSIDE THE UI", 12, True, NAVY)
    y = 46
    surfaces = [
        ("General ledger", "Five ICT votes, monthly targets, receipts, issues, buying power", "Store Officer, RQ, admin / oversight"),
        ("Stores operations", "Q 1033, stock take, loans, unit equipment, undelivered, creditors", "Store Officer, Storeman, RQ"),
        ("Intake", "Orderly Room Daily File, unit requisitions, document import", "Orderly clerk, Admin AO, TechStores"),
        ("Procurement portals", "DP F1, quotes, CCS, spec eval, PO, MANAC, due diligence, supplier window", "DP, GS, DAF, AIAD, Nixzimo"),
        ("Workshop", "Repairs register, receipt cert, Laptop Compare, H2H ICT crawl", "Workshop, OC Workshop"),
        ("Control", "Dashboard alerts, reports, duties, user management, release cuts", "Admin; reports also for viewer / DAF"),
    ]
    cw = (pw - 8) / 3
    ch = 38
    for i, (title, owns, roles) in enumerate(surfaces):
        col = i % 3
        row = i // 3
        x = left + col * (cw + 4)
        yy = y + row * (ch + 4)
        rect_fill(pdf, x, yy, cw, ch, WHITE, LINE)
        rect_fill(pdf, x, yy, 4, ch, NAVY_MID)
        text_at(pdf, x + 8, yy + 3, cw - 12, 7, title, 11, True, NAVY)
        wrapped(pdf, x + 8, yy + 11, cw - 14, 4.4, owns, 8, INK)
        wrapped(pdf, x + 8, yy + 25, cw - 14, 4.4, "Roles: " + roles, 8, MUTED)

    y = 46 + 2 * (ch + 4) + 6
    text_at(pdf, left, y, 200, 8, "SQLITE FILE LAYOUT  (techstores.db)", 12, True, NAVY)
    text_at(pdf, left + 210, y, 190, 8, "RUNTIME MODES", 12, True, NAVY)
    y += 10

    tables = [
        ("users", "id, username, PBKDF2 hash, role, active"),
        ("settings", "JSON blobs for most registers (appState keys)"),
        ("gl_budgets", "Vote ceilings per GL code"),
        ("modules", "Per-module payload JSON"),
        ("release_cuts", "Vote transfers between GLs"),
        ("audit_log", "login, save, and action trail"),
    ]
    tw = 196
    th = 10
    text_at(pdf, left, y, 70, 7, "Table", 8, True, MUTED)
    text_at(pdf, left + 50, y, 140, 7, "Holds", 8, True, MUTED)
    y0 = y + 8
    for i, (name, holds) in enumerate(tables):
        yy = y0 + i * th
        bg = PAPER if i % 2 == 0 else WHITE
        rect_fill(pdf, left, yy, tw, th, bg, LINE)
        text_at(pdf, left + 2, yy + 1.5, 46, 7, name, 8, True, NAVY)
        text_at(pdf, left + 50, yy + 1.5, 144, 7, holds, 8, False, INK)

    modes = [
        ("Database", "TECHSTORES.exe / server.py :8080", "techstores.db next to the EXE"),
        ("Offline", "TECHSTORES-OFFLINE.exe", "Browser IndexedDB, sync later"),
        ("Launcher", "TECHSTORES-LAUNCHER.exe :8765", "Does not store data; starts the other two"),
    ]
    mx = left + 210
    for i, (name, proc, store) in enumerate(modes):
        yy = y0 + i * 22
        fill = SOFT_T if i == 0 else WHITE
        rect_fill(pdf, mx, yy, pw - 210, 20, fill, TEAL if i == 0 else LINE)
        text_at(pdf, mx + 4, yy + 2, 80, 7, name, 10, True, NAVY)
        wrapped(pdf, mx + 4, yy + 9, pw - 220, 4.2, proc + "  --  " + store, 8, MUTED)

    note_y = y0 + 6 * th + 8
    rect_fill(pdf, left, note_y, tw, 22, SOFT_Y, GOLD)
    wrapped(
        pdf,
        left + 4,
        note_y + 3,
        tw - 8,
        4.4,
        "Operational lists (requisitions, creditors, inventory, Daily File) are not normalised tables. They round-trip as one appState document. Install: dist/TECHSTORES-Portable (START-SYSTEM.bat) or dist/TECHSTORES-Setup-1.0.0.0.exe. Keep TECHSTORES.exe with the app/ folder.",
        8,
        INK,
    )

    api_y = note_y + 28
    text_at(pdf, left, api_y, 280, 8, "API SURFACE  (server.py)", 12, True, NAVY)
    api_y += 10
    apis = [
        ("GET", "/api/health", "Liveness, DB stats, AI status"),
        ("GET", "/api/state", "Hydrate client appState"),
        ("PUT", "/api/state", "Persist snapshot; 409 on revision conflict"),
        ("POST", "/api/login", "Authenticate against users table"),
        ("POST", "/api/audit", "Append audit_log row"),
        ("POST", "/api/creditors/parse", "IT DIR creditors Excel -> cases"),
        ("POST", "/api/creditors/parse-paid", "DAF paid list -> match / mark paid"),
        ("POST", "/api/bids/parse", "Financial-year bids Excel"),
        ("POST", "/api/ai/*", "Optional OCR, spec extract, ask, draft"),
        ("GET", "/api/product-specs", "Catalog / web spec lookup"),
        ("POST", "/api/mode/switch", "Online <-> offline (localhost only)"),
    ]
    aw = pw
    ah = 8.2
    text_at(pdf, left, api_y, 28, 6, "Method", 8, True, MUTED)
    text_at(pdf, left + 28, api_y, 70, 6, "Path", 8, True, MUTED)
    text_at(pdf, left + 110, api_y, 200, 6, "Job", 8, True, MUTED)
    api_y += 7
    for i, (method, path, job) in enumerate(apis):
        yy = api_y + i * ah
        bg = PAPER if i % 2 == 0 else WHITE
        rect_fill(pdf, left, yy, aw, ah, bg, LINE)
        text_at(pdf, left + 2, yy + 0.8, 24, 6.5, method, 8, True, TEAL if method == "GET" else NAVY_MID)
        text_at(pdf, left + 28, yy + 0.8, 80, 6.5, path, 8, True, INK)
        text_at(pdf, left + 110, yy + 0.8, aw - 114, 6.5, job, 8, False, MUTED)

    bound_y = api_y + len(apis) * ah + 8
    rect_fill(pdf, left, bound_y, pw, 18, SOFT, BLUE)
    wrapped(
        pdf,
        left + 4,
        bound_y + 3,
        pw - 8,
        5,
        "BOUNDARY -- Configured AI/OCR and public product lookups are optional outbound calls. Creditor paid status is import or manual, not a live MANAC payment feed. Multi-PC sharing means copying techstores.db or pointing two clients at the same host; there is no hosted cluster.",
        8,
        INK,
    )

    pdf.output(str(OUT))
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    build_pdf()
