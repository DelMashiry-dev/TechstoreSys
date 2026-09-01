#!/usr/bin/env python3
"""Generate TECHSTORESys progress write-up PDF (Mon 31 Aug - Tue 1 Sep 2026)."""

from __future__ import annotations

from datetime import date
from pathlib import Path

from fpdf import FPDF

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "TECHSTORESys-Progress-Mon31Aug-Tue1Sep-2026.pdf"


class WriteupPDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(27, 94, 59)
        self.cell(0, 8, "TECHSTORESys - IT Directorate", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "", 8)
        self.set_text_color(100, 100, 100)
        self.cell(0, 5, "Progress report: Monday 31 August - Tuesday 1 September 2026", new_x="LMARGIN", new_y="NEXT")
        self.ln(2)
        self.set_draw_color(184, 207, 196)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")

    def section(self, title: str):
        if self.get_y() > 250:
            self.add_page()
        self.ln(2)
        self.set_font("Helvetica", "B", 12)
        self.set_text_color(27, 94, 59)
        self.cell(0, 8, title, new_x="LMARGIN", new_y="NEXT")
        self.ln(1)

    def body(self, text: str):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(30, 30, 30)
        self.multi_cell(0, 5.5, text)
        self.ln(1)

    def bullet(self, text: str):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(30, 30, 30)
        x = self.get_x()
        self.cell(5, 5.5, "-")
        self.set_x(x + 5)
        self.multi_cell(0, 5.5, text)
        self.ln(0.5)

    def subhead(self, text: str):
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(52, 64, 84)
        self.cell(0, 6, text, new_x="LMARGIN", new_y="NEXT")
        self.ln(0.5)


def build_pdf() -> None:
    pdf = WriteupPDF()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(27, 94, 59)
    pdf.cell(0, 12, "Work completed since Monday", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(60, 60, 60)
    pdf.cell(0, 7, "TECHSTORESys - Zimbabwe National Army, IT Directorate", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 7, f"Report date: {date.today().strftime('%d %B %Y')}", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    pdf.body(
        "This document summarises development work carried out from Monday 31 August 2026 "
        "through Tuesday 1 September 2026. Changes span requisitions and orderly-room UX, "
        "system documentation (flow chart and data-flow diagram), Workshop comparison tools, "
        "form controls (typeable dropdowns and ZNA unit pickers), and a major Creditors "
        "register upgrade with intelligence panels across procurement workflows."
    )

    # Monday
    pdf.section("Monday 31 August 2026 - Requisitions & documentation")

    pdf.subhead("Requisitions in-tray - table and actions")
    pdf.bullet(
        "Requisitions table restyled for a cleaner, more readable layout (spacing, alignment, "
        "and column presentation)."
    )
    pdf.bullet(
        "Removed separate In stock / Out of stock filter buttons from the toolbar to reduce "
        "clutter; stock status remains visible in the table columns."
    )
    pdf.bullet(
        "Row action buttons standardised: Route, Edit, Progress, Close arranged in a consistent "
        "pill/toolbar style; Delete removed from the main requisitions in-tray."
    )
    pdf.bullet(
        "Undelivered Items row actions (Edit, Done, Del) aligned to the same visual style."
    )

    pdf.subhead("Orderly Room integration")
    pdf.bullet(
        "Requisitions in-tray mirror added to Orderly Room so clerks see incoming unit "
        "requests in the same tabular format (date in, unit, items, stock status, age)."
    )

    pdf.subhead("System flow chart & data-flow diagram")
    pdf.bullet(
        "HTML system flow chart page created showing end-to-end TECHSTORESys modules and "
        "process paths (requisition through issue, procurement, creditors, workshop, etc.)."
    )
    pdf.bullet(
        "Separate HTML Data Flow Diagram (DFD) page added using standard notation: external "
        "entities, processes, data stores, and labelled flows."
    )
    pdf.bullet(
        "PDF copies of both the operational flow chart and the DFD generated for printing "
        "and briefing."
    )

    pdf.subhead("Desktop deployment")
    pdf.bullet(
        "Guidance and launcher/installation packaging work so TECHSTORESys can run from "
        "the desktop (portable EXE / START-SYSTEM batch workflow)."
    )
    pdf.bullet(
        "Git commit and push of the above changes; subsequent pull/push to sync dev and "
        "desktop copies."
    )
    pdf.bullet(
        "Investigated version drift: an earlier Laptop Compare concept existed on the desktop "
        "build but had diverged from the repository - root cause was unsynced portable build "
        "vs active development branch."
    )

    pdf.subhead("Workshop - comparison tools (first pass)")
    pdf.bullet(
        "Laptop Compare module restored under Workshop navigation - catalog-based ranking "
        "with duty-profile scoring and recommended buy."
    )
    pdf.bullet(
        "H2H ICT Comparison extended beyond laptops to desktops, printers, servers, and "
        "other ICT categories via category/extra filters."
    )
    pdf.bullet(
        "Removed the previous four-machine selection cap; all ranked candidates can be "
        "selected and compared."
    )
    pdf.bullet(
        "Recommended Buy banner and Buy Score Ranking chart restyled (green winner card, "
        "purple/red score bars, spec-score inset, side-by-side comparison table)."
    )

    # Tuesday
    pdf.add_page()
    pdf.section("Tuesday 1 September 2026 - Workshop, forms & Creditors")

    pdf.subhead("Two separate Workshop comparison modules")
    pdf.bullet(
        "Laptop Compare and H2H ICT Comparison kept as distinct nav buttons under Workshop:"
    )
    pdf.bullet(
        "    Laptop Compare - buy-the-winner from local catalog and duty profiles."
    )
    pdf.bullet(
        "    H2H ICT Comparison - web crawl, head-to-head ranking, search history."
    )
    pdf.bullet(
        "Both modules wired into config roles, dashboard labels, module loader, manifest, "
        "and universal search."
    )

    pdf.subhead("H2H crawl quality improvements")
    pdf.bullet(
        "Tightened article/product detection to exclude Amazon category pages, CPU-only "
        "benchmark articles, and generic shopping landing pages."
    )
    pdf.bullet(
        "Visible-item filtering respects selected category and extra keyword so irrelevant "
        "rows drop out of the grid and comparison."
    )
    pdf.bullet(
        "Search history retained so repeat duty/category searches recall cached results "
        "without re-crawling."
    )

    pdf.subhead("Typeable combobox fields (mountTypeableSelect)")
    pdf.bullet(
        "New reusable typeable select component in utils.js: type to filter, scrollable "
        "dropdown, keyboard navigation, optional custom values."
    )
    pdf.bullet(
        "Applied to Laptop Compare search fields: Duty profile, Brand, Minimum RAM, "
        "Minimum storage."
    )
    pdf.bullet(
        "Fixed dropdown clipping (portal list to document body, z-index 15000, overflow "
        "visible on compare panels) and restored duty-profile list on focus."
    )

    pdf.subhead("ZNA Units, Formations and Establishments")
    pdf.bullet(
        "Official establishment manual data consolidated in zna-units.js with grouped "
        "formations and units."
    )
    pdf.bullet(
        "wireAllZnaUnitFields() runs on every loaded module; legacy filter+select pairs "
        "replaced with single typeable unit pickers."
    )
    pdf.bullet(
        "Unit/formation fields upgraded across: Requisitions, ICT Accountability, Monthly "
        "Returns, Orderly Room, Workshop Receipt Cert, Accommodation Stores, Repair Intake, "
        "Temporary/Permanent Loans, Office Messages, Doc Import apply-path, and table cells."
    )

    pdf.subhead("Creditors register (formerly Supplier Debts)")
    pdf.bullet(
        "Imported IT DIR creditors Excel: IT CREDITORS RETURN AS AT 05 NOV 2025 RQ.xlsx."
    )
    pdf.bullet(
        "Python parser (creditors_parse.py) + seed file (it-dir-creditors-seed.js): "
        "24 supplier cases, 70 invoice lines, USD 958,449.69 total, register date "
        "2025-11-05. Vendor-code grouping merges duplicate supplier name variants."
    )
    pdf.bullet(
        "Module renamed user-facing to Creditors (nav, dashboard, alerts, dept home, "
        "process guides); internal ID remains supplier-debts for data compatibility."
    )
    pdf.bullet(
        "Import panel with built-in seed load, merge modes, drag-and-drop Excel import "
        "via POST /api/creditors/parse (requires START-SYSTEM)."
    )
    pdf.bullet(
        "DAF payment-proof import: POST /api/creditors/parse-paid + creditors_paid_parse.py; "
        "matches supplier/PO/invoice/amount and marks cases paid after preview."
    )

    pdf.subhead("Intelligence panels - smart system upgrades")
    pdf.bullet(
        "Creditors: priority DAF chase ranking, duplicate supplier detection, one-click "
        "merge of duplicate cases, paid-list drop zone."
    )
    pdf.bullet(
        "Undelivered Items: priority supplier follow-up list and supplier backlog statistics."
    )
    pdf.bullet(
        "Requisitions: respond-first list (urgent + oldest), in-tray checks for overdue, "
        "urgent, and out-of-stock lines."
    )

    pdf.section("Key files touched")
    pdf.body(
        "Frontend: app/js/requisitions.js, orderly-room.js, undelivered.js, supplier-debts.js, "
        "creditors-import.js, it-dir-creditors-seed.js, laptop-compare.js, ict-compare.js, "
        "utils.js, zna-units.js, module-loader.js, dashboard.js, config.js, doc-import.js, "
        "ict-accountability.js, and related module HTML/CSS.\n\n"
        "Backend: server.py (creditors parse endpoints), creditors_parse.py, "
        "creditors_paid_parse.py, scripts/parse-it-creditors-xlsx.py.\n\n"
        "Documentation: app/system-flow or data-flow-diagram HTML pages and companion PDFs."
    )

    pdf.section("How to verify")
    pdf.bullet("Hard refresh the browser (Ctrl+F5) after pulling latest code.")
    pdf.bullet("Restart START-SYSTEM for creditors Excel import and paid-list APIs.")
    pdf.bullet("Workshop: confirm both Laptop Compare and H2H ICT Comparison nav buttons.")
    pdf.bullet("Laptop Compare: type in duty profile - dropdown should list all profiles.")
    pdf.bullet("Creditors: open module - seed loads 24 cases; try drag-drop import panel.")
    pdf.bullet("Requisitions / Undelivered: check intelligence panels at top of each module.")

    pdf.section("Outstanding / notes")
    pdf.bullet(
        "Portable dist/TECHSTORES-Portable/ may need rebuild to match dev branch on desktop."
    )
    pdf.bullet(
        "Dampack may appear twice (detailed seed case + register row) - manual merge available."
    )
    pdf.bullet("Live DAF/ERP payment feed not connected - paid status is import/manual only.")
    pdf.bullet("No git commit was made for this write-up unless explicitly requested.")

    pdf.ln(4)
    pdf.set_font("Helvetica", "I", 9)
    pdf.set_text_color(100, 100, 100)
    pdf.multi_cell(
        0,
        5,
        "Prepared from development session transcript and repository diff. "
        "Restricted source documents supplied for design only are not retained in the system.",
    )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(OUT))
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    build_pdf()
