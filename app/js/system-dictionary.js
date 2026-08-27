/* system-dictionary.js — Exhaustive TECHSTORESys glossary (in-app) */

const SYSTEM_DICTIONARY_GROUPS = [
    {
        id: 'money',
        title: 'GL accounts & money',
        terms: [
            { t: 'GL (General Ledger)', d: 'A vote / account code used for budgeting and spending. Each GL card on the dashboard shows Target, Committed, Vouchers and Buying Power.', w: 'Dashboard · GL modules' },
            { t: 'GL 6122100009 (ZOFF)', d: 'Office Supplies & Services — toners, media and related consumables. Module path still uses gl-2200600002 (legacy id).', w: 'Dashboard · ZOFF inventory' },
            { t: 'Software licence (expended)', d: 'Online licence purchase (monthly/annual). Enter Day 1; system fills expiry. Not held as stock — renewal alert 5 days before.', w: 'Softwares · Receive · Asset Register' },
            { t: 'GL 220200002', d: 'Tech Equipment Maintenance — printers, photocopiers and workshop maintenance spend.', w: 'Dashboard · Maint' },
            { t: 'GL 2201900002', d: 'Spare Parts — boards, SSDs, LCDs and other technical spares.', w: 'Dashboard · Spares' },
            { t: 'GL 3112210001', d: 'ICT Equipment — computers, servers, UPS, networking and related acquisitions.', w: 'Dashboard · ICT' },
            { t: 'DAF', d: 'Directorate of Army Finance. Votes monthly targets (funds) onto GLs. When a GL has no buying power, procurement must seek DAF funds manually before DP F1.', w: 'Targets · Release Cut · DP cycle' },
            { t: 'Target (DAF monthly vote)', d: 'Amount DAF allocates to a GL for the selected month. This is the ceiling used to compute buying power.', w: 'Dashboard metrics · gl-targets' },
            { t: 'Financial Year Bids', d: 'FY funding requirements recorded against GLs (reference budgets). Demo figures can be seeded from the Bids SUMMARY workbook.', w: 'financial-year-bids' },
            { t: 'Bid (committed)', d: 'Bid line value that counts toward GL commitment before cash is spent.', w: 'Dashboard · Bids' },
            { t: 'Committed', d: 'Money already spoken for this month: Bids + Purchase Orders + DP F1 estimates (as modelled).', w: 'GL cards · KPI strip' },
            { t: 'Vouchers (GL impact)', d: 'Net charge or credit from Issue/Receipt vouchers. Positive (e.g. +$17,150) usually means IV charges reducing buying power; credits can restore power.', w: 'GL cards · Issue Voucher' },
            { t: 'Buying Power', d: 'Still available to buy on a GL this month: roughly Target − Committed − Vouchers (plus Release Cut effects). Electronic DP F1 is allowed only when buying power covers the estimate.', w: 'Dashboard · Route / DP F1' },
            { t: 'Expended', d: 'Amount used against the month’s target (commitments and voucher impact as modelled).', w: 'Overview tables' },
            { t: 'Balance', d: 'Remaining after Target − Committed − Vouchers on the GL card.', w: 'GL cards' },
            { t: 'Release Cut', d: 'Admin-only transfer of buying power from one GL to another for a month (e.g. move ICT vote to ZOFF for urgent toner).', w: 'release-cut · admin' },
            { t: 'DP F1', d: 'Directorate Procurement Form 1 — starts the electronic procurement cycle and commits estimated cost against a GL.', w: 'dp-f1-form · dp-procurement' },
            { t: 'Purchase Order (PO)', d: 'Formal order to a supplier. Electronic POs use buying power; Manual POs wait for / use DAF authority when funds are not on the e-budget path.', w: 'purchase-orders' },
            { t: 'Electronic PO (e-PO)', d: 'PO raised against budgeted/target buying power.', w: 'DP cycle step 5' },
            { t: 'Manual PO', d: 'PO awaiting or authorised by DAF outside the normal electronic budget path.', w: 'DP cycle · undelivered' },
            { t: 'Cost centre', d: 'Directorate/unit vote that owns the requirement. This install: IT Dir cost centre Z04P2SP212.', w: 'Org profile · Learning Centre' },
            { t: 'ZOFF', d: 'Office Supplies & Services family (formerly “IT Consumables”).', w: 'Catalog · inventory' },
            { t: 'On Track / Monitor / Low Balance / Overdrawn / No vote', d: 'Dashboard budget badges for a GL’s health vs target and buying power.', w: 'GL card status badge' }
        ]
    },
    {
        id: 'stock',
        title: 'Stock, inventory & ledgers',
        terms: [
            { t: 'Opening', d: 'Take-on / start balance. In Cumulative view this is the perpetual opening; in Daily view it is start-of-day.', w: 'Issue Voucher inventory' },
            { t: 'Received', d: 'Quantity brought on charge (receipts / RV movements).', w: 'Inventory equation' },
            { t: 'Issued', d: 'Quantity struck off or issued out (IV movements).', w: 'Inventory equation' },
            { t: 'On Hand', d: 'Current book stock: Opening + Received − Issued.', w: 'Inventory · Stock Take · Route' },
            { t: 'Cumulative view', d: 'Shows perpetual opening and all-time received/issued totals.', w: 'Voucher inventory tabs' },
            { t: 'Daily view', d: 'Shows start-of-day opening and that day’s receipts/issues.', w: 'Voucher inventory tabs' },
            { t: 'RV (Receipt Voucher)', d: 'Books stock in and can credit the GL.', w: 'voucher-module · Q 1033' },
            { t: 'IV (Issue Voucher)', d: 'Books stock out and charges the GL. Module title: Issue Voucher.', w: 'voucher-module' },
            { t: 'IRV', d: 'Issue & Receipt Vouchers — duty wording for day-to-day stock paperwork.', w: 'Duties & Roles' },
            { t: 'Bin card / Bin Bal', d: 'Physical shelf card and its balance used during stock take.', w: 'stock-take' },
            { t: 'Ledger Bal / System on hand', d: 'Book figure in the system for variance calculation.', w: 'stock-take' },
            { t: 'Physical count', d: 'What is actually counted on the shelf.', w: 'stock-take' },
            { t: 'Variance', d: 'Physical − system. Positive = surplus; negative = deficit.', w: 'stock-take · Q 985' },
            { t: 'Surplus', d: 'Physical greater than system — typically brought on via Q 1033.', w: 'Stock Take → Q 1033' },
            { t: 'Deficit / Deficient', d: 'Physical less than system — loss/damage path via Q 998 / Q 1 as applicable.', w: 'Stock Take → Q 998' },
            { t: 'VAQS', d: 'Vocabulary of Army Quartermaster Stores catalogue number.', w: 'Q forms' },
            { t: 'Catalog: Toners & Ink', d: 'consumables-toners · default GL 6122100009.', w: 'Issue Voucher categories' },
            { t: 'Catalog: Storage Media', d: 'consumables-media · default GL 6122100009.', w: 'Issue Voucher' },
            { t: 'Catalog: Parts / Spares', d: 'spares-parts · default GL 2201900002.', w: 'Issue Voucher' },
            { t: 'Catalog: Maint. Equipment', d: 'maintenance-equipment · default GL 220200002.', w: 'Issue Voucher' },
            { t: 'Catalog: Software', d: 'software-licences · default GL 2200600003.', w: 'Issue Voucher' },
            { t: 'Catalog: ICT Equipment', d: 'ict-equipment · default GL 3112210001.', w: 'Issue Voucher' },
            { t: 'Parent ledgers', d: 'ZOFF Inventory, Softwares, Spares, ICT, Maintenance — stock families (not the same as money GLs).', w: 'Dashboard stock · inventory-ledgers' },
            { t: 'Stock Take', d: 'Full stores physical count vs system across families; can push surplus to Q 1033 and deficit to Q 998.', w: 'stock-take' },
            { t: 'Unit Check Log', d: 'ASO Ch 28 unit checks recording.', w: 'unit-checks' },
            { t: 'Temporary Loans', d: 'Controlled stores loaned out (max 14 days) with due / overstayed tracking.', w: 'temporary-loans' },
            { t: 'Permanent Loans', d: 'Laptops and iPads issued on permanent loan under Comd/34 to Lt Col and above (command/staff) and Grade Two Staff Officers at Formations / Army HQ. After 3 years: IT Dir → QS Br → Masasa scratch ZA-NO → MID wipe → write-off as personal item.', w: 'permanent-loans' },
            { t: 'Comd/34', d: 'Army HQ policy (06 Nov 2015) on issuing laptops and iPads to individuals on a permanent loan basis.', w: 'permanent-loans' },
            { t: 'Permanent T/loan', d: 'QM issue that replaces the 7-day renewal; only while the member is still serving (QM IT DIR 17 Mar 2020).', w: 'permanent-loans' },
            { t: 'AS(PLANS)/34', d: 'After 3 years from date of issue, IT Dir writes to QS Br for Masasa to scratch the ZA-NO and strike the item off the Master Ledger so the officer may retain it as a personal item.', w: 'permanent-loans' },
            { t: 'MLG Master Ledger', d: 'Masasa Logistics Garrison master ledger options used when striking off ICT assets.', w: 'ICT Asset Register' }
        ]
    },
    {
        id: 'procure',
        title: 'Procurement & requisitions',
        terms: [
            { t: 'Indent', d: 'Official written request for stores (often Q 982). Starts demand on the Cost Centre Directorate.', w: 'Q 982 · Learning Centre' },
            { t: 'Requisition', d: 'Unit/formation written need captured with minute sheet. On save/Route the system chooses Issue, DP F1, Await stock, or Manual DAF.', w: 'unit-requisitions' },
            { t: 'Route (button)', d: 'Runs stock + funds check for a requisition and opens Q 1033 or DP F1, or flags await/manual funds.', w: 'Unit Requisitions' },
            { t: 'Issue (Q 1033) path', d: 'Item is in stock (enough on hand) — issue from TechStores on ZNA Q 1033.', w: 'requisition-procurement' },
            { t: 'Raise DP F1 path', d: 'Not in stock (or shortfall) but GL has buying power — start electronic procurement with DP F1.', w: 'requisition-procurement' },
            { t: 'Await stock path', d: 'Not in stock and cannot fund F1 — wait for replenishment / supplier delivery.', w: 'requisition-procurement' },
            { t: 'Manual DAF funds path', d: 'No buying power — seek funds from DAF manually before a valid electronic DP F1.', w: 'requisition-procurement' },
            { t: 'Procurement process (GL button)', d: 'Opens the ICT Procurement Cycle / DP F1 tools for that GL’s vote.', w: 'GL cards · GL modules' },
            { t: 'Cost Comparative Schedule', d: 'Compares vendor quotations (A–G), selects best value-for-money supplier, and is attached with DP F1 + quotes for AIAD Due Diligence Certificate.', w: 'cost-comparative-schedule' },
            { t: 'AIAD Due Diligence Certificate', d: 'Certificate from Army Internal Audit Directorate after reviewing F1, Cost Comparative Schedule, and quotations — not always the cheapest quote.', w: 'dp-procurement · cost-comparative-schedule' },
            { t: 'Winning vendor', d: 'Supplier selected on the Cost Comparative Schedule for value for money; recorded for AIAD and later PO award.', w: 'cost-comparative-schedule' },
            { t: 'Spec / Tech Evaluation', d: 'Write/search specs to support F1 and later evaluate supplier quotes.', w: 'spec-evaluation' },
            { t: 'Laptop duty profile', d: 'Operational use for a laptop: field (command, UAV/robot, outdoor/rugged, GIS, cyber/EW, secure comms, logistics), technical (software engineering, programming, ML, simulations, architecture, graphic design, database design, server room), or admin (pay run, secretariat, typing pool). Used in Head-to-head compare, Spec Search, and Duties & Roles.', w: 'ict-compare · spec-evaluation · duties-roles' },
            { t: 'Head-to-head compare', d: 'Workshop module: crawl the web for machines that match a duty profile, tick 2–4, and rank a best-buy (duty fit + listed price). Confirm a formal quote before F1.', w: 'ict-compare' },
            { t: 'Rough Guide Quotation', d: 'Draft indicative budget quotes using prevailing market USD/ZiG prices at RBZ rate — for planning before formal RFQ.', w: 'guide-quotation' },
            { t: 'DP (Directorate Procurement)', d: 'Processes RFQ/PO/contract after authority.', w: 'dp-procurement' },
            { t: 'AIAD', d: 'Army Internal Audit Directorate — due diligence on quotes (value, not always cheapest).', w: 'DP cycle step 4' },
            { t: 'RFQ', d: 'Request for Quotations.', w: 'DP cycle' },
            { t: 'Delivery Note (DN)', d: 'Evidence of supply accompanying goods.', w: 'delivery-note · DP step 6' },
            { t: 'Verification of delivery', d: 'Cost centre confirms quantity and condition before payment.', w: 'DP step 7' },
            { t: 'QS Br', d: 'Quartermaster / QS Branch — authority, distribution and supplier selection in the Army process chart.', w: 'Learning Centre' },
            { t: 'GS Branch', d: 'Often authorises unit requisition letters to be actioned.', w: 'Orderly Room · GS auth' },
            { t: 'Minute sheet', d: 'Stamp rows (Dir, DD, AQSO2, OCs, Tech Stores Offr, etc.) for signature and date on a requisition.', w: 'Unit Requisitions' },
            { t: 'First Sight / DF (Daily File)', d: 'Orderly Room filing of incoming correspondence and requisitions.', w: 'orderly-room' }
        ]
    },
    {
        id: 'forms',
        title: 'Q forms & SVCS (in system)',
        terms: [
            { t: 'ZNA Q 1', d: 'Statement of stores lost or damaged to be written off.', w: 'zna-q-1' },
            { t: 'ZNA Q 3', d: 'Issue to a Government department on repayment.', w: 'zna-q-3' },
            { t: 'ZNA Q 31', d: 'Cash purchase / receipt.', w: 'zna-q-31' },
            { t: 'ZNA Q 40', d: 'Artisan tools list.', w: 'zna-q-40' },
            { t: 'ZNA Q 80', d: 'Ledger sheet / schedule of stores boarded.', w: 'zna-q-80' },
            { t: 'ZNA Q 178', d: 'Sub ledger / distribution ledger sheet.', w: 'zna-q-178' },
            { t: 'ZNA Q 982', d: 'Combined indent and voucher for stores.', w: 'zna-q-982' },
            { t: 'ZNA Q 985', d: 'Discrepancy report.', w: 'zna-q-985' },
            { t: 'ZNA Q 987', d: 'Certificate of stocktaking.', w: 'zna-q-987' },
            { t: 'ZNA Q 998', d: 'Statement of loss, damage or destruction.', w: 'zna-q-998' },
            { t: 'ZNA Q 1033', d: 'Issue and receipt voucher — used when requisitions are satisfied from stock.', w: 'zna-q-1033' },
            { t: 'ZNA Q 1043', d: 'Report on stores and condemnation certificate (beyond local repair path).', w: 'zna-q-1043' },
            { t: 'ZNA Q 1049', d: 'Transfer voucher.', w: 'zna-q-1049' },
            { t: 'ZNA Q 1157', d: 'Clothing and personal equipment record.', w: 'zna-q-1157' },
            { t: 'ZNA Q 1179', d: 'Clothing and necessaries issue voucher.', w: 'zna-q-1179' },
            { t: 'ZNA Q 1229', d: 'Certificate of accidental breakage.', w: 'zna-q-1229' },
            { t: 'ZNA Q 1571', d: 'Debit voucher.', w: 'zna-q-1571' },
            { t: 'ZNA Q 1680', d: 'Miscellaneous credit/debit voucher.', w: 'zna-q-1680' },
            { t: 'ZNA Q 1954', d: 'Recoveries from individuals.', w: 'zna-q-1954' },
            { t: 'ZNA Q 3977', d: 'Equipment/vehicle neglect, misuse and damage report.', w: 'zna-q-3977' },
            { t: 'ZNA SVCS 1045', d: 'Workshop indent — must accompany every Workshop Register booking.', w: 'zna-svcs-1045 · workshop' },
            { t: 'ZNA SVCS/890', d: 'Demand / Issue (services form).', w: 'zna-svcs-890' },
            { t: 'SUMMARY OF Q FORMS — Index', d: 'Searchable Annex A catalogue (In system vs Reference-only paper forms).', w: 'zna-q-forms-index' }
        ]
    },
    {
        id: 'modules',
        title: 'Modules & workflows',
        terms: [
            { t: 'Dashboard', d: 'KPIs, Notifications, GL cards, stock overview and navigation hub.', w: 'dashboard' },
            { t: 'Issue Voucher / ZNA-Q-1033', d: 'Post IV/RV stock movements by catalog category against GLs (official form ZNA-Q-1033).', w: 'voucher-module' },
            { t: 'Unit / Formation Requisitions', d: 'Capture loose minutes, age open requests, Route to Q 1033 or DP F1.', w: 'unit-requisitions' },
            { t: 'Orderly Room', d: 'Daily File / First Sight correspondence and TechStores alerts.', w: 'orderly-room' },
            { t: 'Gate Register (RP)', d: 'Equipment in/out at the gate. Does not change inventory balances.', w: 'gate-register' },
            { t: 'TechStores Equipment Register', d: 'Storeman custody stage for repair intake (before Workshop).', w: 'techstores-equipment-register' },
            { t: 'Workshop Register', d: 'Repairs/upgrades booking; SVCS 1045 required; Stores Request for indent/QM.', w: 'workshop-repairs' },
            { t: 'ZNA ICT Asset Register', d: 'Serial/ZA accountability for ICT assets (S/U/S, custody, disposal).', w: 'ict-accountability' },
            { t: 'ICT Distribution Lists', d: 'Proposed / Final / Next distribution exercises for ICT equipment.', w: 'ict-distribution' },
            { t: 'ICT Procurement Cycle', d: 'Tracker for F1 → DP → AIAD → PO → delivery → verification → payment.', w: 'dp-procurement' },
            { t: 'Undelivered Items', d: 'Open PO lines awaiting delivery.', w: 'undelivered-orders' },
            { t: 'Suppliers and Contracts', d: 'Vendor and contract records for evaluation packs.', w: 'suppliers-contracts' },
            { t: 'IT Dir Comms Portal', d: 'Directorate messaging between offices and peer commanders. Compose memo, letter, correspondence, minutes, request.', w: 'it-dir-comms' },
            { t: 'Memo / Compose memo', d: 'Write an internal memo, letter or correspondence in IT Dir Comms → Compose memo. Load sample letters (e.g. fuel request) then Print letter.', w: 'it-dir-comms' },
            { t: 'Sample correspondence', d: 'Ready-made RESTRICTED letters in IT Dir Comms: choose a sample, Load sample, then Print letter.', w: 'it-dir-comms' },
            { t: 'Learning Centre', d: 'Process charts and learning materials for procurement/org flows.', w: 'process-guides' },
            { t: 'System Help', d: 'Standing guidance plus this System Dictionary.', w: 'system-help' },
            { t: 'Notifications', d: 'Numbered/aged operational alerts and office messages.', w: 'Dashboard alerts' },
            { t: 'Fuel request letter (IT/18)', d: 'Sample RESTRICTED correspondence for standby generator diesel — IT Dir Comms → Load sample.', w: 'it-dir-comms' },
            { t: 'Cards / Mail / WhatsIn', d: 'Three layouts for the same alerts & messages (cards, inbox, chat bubbles).', w: 'Notifications view toggle' },
            { t: 'Universal Search', d: 'Ctrl+K jump to modules, GLs, Q forms — and track issued controlled stores by ZA or Serial Number (location / holder).', w: 'Header' },
            { t: 'Load demo figures', d: 'Admin/edit-role button to seed experimental FY 2026 Bids-based budgets and sample stock/POs.', w: 'Dashboard toolbar' }
        ]
    },
    {
        id: 'roles',
        title: 'Roles & access',
        terms: [
            { t: 'Administrator', d: 'Full control: edit, Release Cut, users, backup, reports.', w: 'User Management · admin' },
            { t: 'Oversight roles', d: 'Army Commander, Brig GS/AS/QS, Dir/DD/AQSO2, Dir AIAD/DAF/DP, TechStores Officer — view-wide, generally no operational edit.', w: 'Login · VIEW ONLY' },
            { t: 'RQ / Store Officer', d: 'Stores edit: ledgers, issues, bids, procurement, Q forms.', w: 'rq / store_officer' },
            { t: 'Storeman', d: 'Day-to-day stock: vouchers, stock take, DN, loans, Q 1033, registers.', w: 'storeman' },
            { t: 'Orderly Clerk', d: 'DF / correspondence / routing; no GL/stock ledgers.', w: 'orderly_clerk' },
            { t: 'RP Gate', d: 'Gate register + limited comms.', w: 'rp' },
            { t: 'Workshop Personnel', d: 'Workshop register, SVCS 1045, Q 1043 paths.', w: 'workshop' },
            { t: 'Dept OCs', d: 'Sys Admin, Workshop, Comp Engr, SW Engr, ICT Sec, ITTS, Admin, Gate desks.', w: 'dept-*' },
            { t: 'Viewer', d: 'Read-only dashboard/help/reports.', w: 'viewer' },
            { t: 'VIEW ONLY', d: 'Header badge when the signed-in role cannot edit data.', w: 'Header' },
            { t: 'canReleaseCut', d: 'Admin-only ability to move buying power between GLs.', w: 'Release Cut' }
        ]
    },
    {
        id: 'org',
        title: 'Organisation & offices',
        terms: [
            { t: 'IT Directorate Tech Stores', d: 'This live cost-centre install (Josiah Magama Tongogara Barracks).', w: 'Org profile' },
            { t: 'Cost Centre Z04P2SP212', d: 'IT Dir cost centre code used on bids and vouchers.', w: 'Sidebar · Bids' },
            { t: 'IT DIR TECHSTORES OFFICE', d: 'TechStores Admin & QM office — primary stores messaging target.', w: 'Messages · Orderly' },
            { t: 'Engineering Support (Workshop)', d: 'IT Engineering Support Dept — repairs and SVCS 1045.', w: 'Workshop' },
            { t: 'Systems Administration / DBA / Comp Engr / SW Engr / ICT Sec / ITTS / Admin / Gate / Orderly', d: 'IT Dir departments available for desks and office messages.', w: 'Dept desks · Comms' },
            { t: 'Director / DD / AQSO2 offices', d: 'Dir HQ offices often CC’d on demands.', w: 'IT_DIR_DEMAND_CC' },
            { t: 'Wider alert departments', d: 'Also ZNA Commander, GS/AS/QS Branches, DP, AIAD, DAF, Camp HQ, District, Inspectorate.', w: 'Alert desk' }
        ]
    },
    {
        id: 'status',
        title: 'Statuses',
        terms: [
            { t: 'Requisition: Received', d: 'Newly booked at IT Dir.', w: 'unit-requisitions' },
            { t: 'Requisition: In Progress', d: 'Being actioned (often after Route).', w: 'unit-requisitions' },
            { t: 'Requisition: Part Issued', d: 'Partial stock issue against the request.', w: 'unit-requisitions' },
            { t: 'Requisition: Issued / Closed', d: 'Fully issued or closed.', w: 'unit-requisitions' },
            { t: 'Requisition: Cancelled', d: 'Withdrawn.', w: 'unit-requisitions' },
            { t: 'Priority Urgent / Normal', d: 'Requisition priority for aging alerts.', w: 'unit-requisitions' },
            { t: 'Orderly: Filed in DF / First Sight', d: 'Booked on Daily File or First Sight.', w: 'orderly-room' },
            { t: 'Orderly: Referred — TechStores alerted', d: 'TechStores notified to act.', w: 'orderly-room' },
            { t: 'DP cycle statuses', d: 'Requisition → Spec/F1 → F1 with DP → Quotes eval → AIAD → e-PO/Manual → Delivery → Verified → Paid (or Cancelled).', w: 'dp-procurement' },
            { t: 'Undelivered: Awaiting / Part / Fully / Cancelled', d: 'PO delivery progress.', w: 'undelivered-orders' },
            { t: 'Loan: On loan / Due / Overstayed / Returned', d: 'Temporary loan lifecycle (14-day max).', w: 'temporary-loans' },
            { t: 'Permanent loan: Serving / 3-year due / Return on retirement / Personal', d: 'Laptop/iPad Comd/34 lifecycle — 3-year clock then Masasa scratch-off.', w: 'permanent-loans' },
            { t: 'ICT custody / S · U/S', d: 'In stores, issued, on loan, returned; Serviceable or Unserviceable.', w: 'ict-accountability' },
            { t: 'ICT Distribution Draft / Approved', d: 'List approval state for distribution exercises.', w: 'ict-distribution' },
            { t: 'Priority Normal / Immediate / Urgent / Critical / Flash', d: 'Colour-coded bands for letters, correspondence, minutes and messages: Normal (green), Immediate (orange), Urgent (purple), Critical (red), Flash (lightning).', w: 'Comms · Orderly Room · Notifications' },
            { t: 'Alert priority Critical / High / Normal / Low', d: 'System operational alert urgency (separate from message priority bands).', w: 'Notifications' }
        ]
    }
];

/** Known module ids + human aliases → navigateToModule target */
const DICT_NAV_ALIASES = {
    dashboard: 'dashboard',
    'voucher-module': 'voucher-module',
    'issue voucher': 'voucher-module',
    'stock-take': 'stock-take',
    'stock take': 'stock-take',
    'unit-checks': 'unit-checks',
    'unit check': 'unit-checks',
    'financial-year-bids': 'financial-year-bids',
    'release-cut': 'release-cut',
    'release cut': 'release-cut',
    'dp-f1-form': 'dp-f1-form',
    'dp f1': 'dp-f1-form',
    'dp-procurement': 'dp-procurement',
    'purchase-orders': 'purchase-orders',
    'undelivered-orders': 'undelivered-orders',
    undelivered: 'undelivered-orders',
    'unit-requisitions': 'unit-requisitions',
    'unit requisitions': 'unit-requisitions',
    requisitions: 'unit-requisitions',
    'orderly-room': 'orderly-room',
    'orderly room': 'orderly-room',
    'cost-comparative-schedule': 'cost-comparative-schedule',
    'cost comparative': 'cost-comparative-schedule',
    'spec-evaluation': 'spec-evaluation',
    'guide-quotation': 'guide-quotation',
    'guide quotation': 'guide-quotation',
    'delivery-note': 'delivery-note',
    'temporary-loans': 'temporary-loans',
    'temporary loans': 'temporary-loans',
    'permanent-loans': 'permanent-loans',
    'permanent loans': 'permanent-loans',
    'comd/34': 'permanent-loans',
    'permanent t/loan': 'permanent-loans',
    'ict-accountability': 'ict-accountability',
    'ict asset register': 'ict-accountability',
    'ict-distribution': 'ict-distribution',
    'gate-register': 'gate-register',
    'techstores-equipment-register': 'techstores-equipment-register',
    'workshop-repairs': 'workshop-repairs',
    workshop: 'workshop-repairs',
    'suppliers-contracts': 'suppliers-contracts',
    'it-dir-comms': 'it-dir-comms',
    memo: 'it-dir-comms',
    memos: 'it-dir-comms',
    'compose memo': 'it-dir-comms',
    correspondence: 'it-dir-comms',
    letter: 'it-dir-comms',
    letters: 'it-dir-comms',
    'sample correspondence': 'it-dir-comms',
    'fuel request': 'it-dir-comms',
    fuel: 'it-dir-comms',
    'print letter': 'it-dir-comms',
    comms: 'it-dir-comms',
    'communications portal': 'it-dir-comms',
    'process-guides': 'process-guides',
    'learning centre': 'process-guides',
    'system-help': 'system-help',
    'duties-roles': 'duties-roles',
    'duties & roles': 'duties-roles',
    'user-management': 'user-management',
    'user management': 'user-management',
    'zna-q-forms-index': 'zna-q-forms-index',
    'q forms': 'zna-q-forms-index',
    'gl-2200600002': 'gl-2200600002',
    'gl-2200600003': 'gl-2200600003',
    'gl-220200002': 'gl-220200002',
    'gl-2201900002': 'gl-2201900002',
    'gl-3112210001': 'gl-3112210001',
    zoff: 'gl-2200600002',
    '6122100009': 'gl-2200600002',
    '2200600003': 'gl-2200600003',
    '220200002': 'gl-220200002',
    '2201900002': 'gl-2201900002',
    '3112210001': 'gl-3112210001'
};

const DICT_KNOWN_MODULES = new Set([
    'dashboard', 'voucher-module', 'stock-take', 'unit-checks', 'financial-year-bids',
    'release-cut', 'dp-f1-form', 'dp-procurement', 'purchase-orders', 'undelivered-orders',
    'unit-requisitions', 'orderly-room', 'spec-evaluation', 'guide-quotation', 'delivery-note', 'temporary-loans', 'permanent-loans',
    'ict-accountability', 'ict-distribution', 'gate-register', 'techstores-equipment-register',
    'workshop-repairs', 'suppliers-contracts', 'it-dir-comms', 'process-guides', 'system-help',
    'duties-roles', 'user-management', 'reports-module', 'zna-q-forms-index', 'cost-comparative-schedule',
    'gl-2200600002', 'gl-2200600003', 'gl-220200002', 'gl-2201900002', 'gl-3112210001',
    'zna-q-1', 'zna-q-3', 'zna-q-31', 'zna-q-40', 'zna-q-80', 'zna-q-178', 'zna-q-982',
    'zna-q-985', 'zna-q-987', 'zna-q-998', 'zna-q-1033', 'zna-q-1043', 'zna-q-1049',
    'zna-q-1157', 'zna-q-1179', 'zna-q-1229', 'zna-q-1571', 'zna-q-1680', 'zna-q-1954',
    'zna-q-3977', 'zna-svcs-1045', 'zna-svcs-890'
]);

function resolveDictNavTarget(row) {
    if (row?.go && DICT_KNOWN_MODULES.has(row.go)) return row.go;

    const blob = `${row?.w || ''} ${row?.t || ''} ${row?.d || ''}`.toLowerCase();

    // Prefer explicit module-style tokens in "where" (zna-q-1033, voucher-module, …)
    const tokenMatch = String(row?.w || '').match(
        /\b((?:zna-q-|zna-svcs-|gl-)?[a-z0-9]+(?:-[a-z0-9]+)+)\b/gi
    );
    if (tokenMatch) {
        for (const raw of tokenMatch) {
            const id = raw.toLowerCase();
            if (DICT_KNOWN_MODULES.has(id)) return id;
            if (DICT_NAV_ALIASES[id]) return DICT_NAV_ALIASES[id];
        }
    }

    // Title patterns: "ZNA Q 1033" / "ZNA SVCS 1045"
    const qMatch = String(row?.t || '').match(/zna\s+q\s+(\d+)/i);
    if (qMatch) {
        const id = `zna-q-${qMatch[1]}`;
        if (DICT_KNOWN_MODULES.has(id)) return id;
    }
    const svcsMatch = String(row?.t || '').match(/zna\s+svcs[/ ]?\s*(\d+)/i);
    if (svcsMatch) {
        const id = `zna-svcs-${svcsMatch[1]}`;
        if (DICT_KNOWN_MODULES.has(id)) return id;
    }

    // Alias scan (longer keys first)
    const keys = Object.keys(DICT_NAV_ALIASES).sort((a, b) => b.length - a.length);
    for (const key of keys) {
        if (blob.includes(key)) return DICT_NAV_ALIASES[key];
    }

    // Fallback phrases
    if (/issue voucher|voucher inventory|inventory equation|catalog:/i.test(blob)) return 'voucher-module';
    if (/gl card|buying power|committed|target|dashboard/i.test(blob)) return 'dashboard';
    if (/requisition-procurement|route/i.test(blob)) return 'unit-requisitions';
    if (/learning centre/i.test(blob)) return 'process-guides';
    if (/duties/i.test(blob)) return 'duties-roles';
    if (/user management|admin/i.test(String(row?.w || ''))) return 'user-management';
    if (/workshop/i.test(blob)) return 'workshop-repairs';
    if (/ict asset|mlg/i.test(blob)) return 'ict-accountability';
    if (/q 1033|→ q 1033/i.test(blob)) return 'zna-q-1033';
    if (/q 998|→ q 998/i.test(blob)) return 'zna-q-998';
    if (/q 982/i.test(blob)) return 'zna-q-982';
    if (/q forms/i.test(blob)) return 'zna-q-forms-index';

    return '';
}

function dictEscape(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function getSystemDictionaryFlat() {
    const out = [];
    SYSTEM_DICTIONARY_GROUPS.forEach((g) => {
        (g.terms || []).forEach((term) => {
            const go = resolveDictNavTarget(term);
            out.push({ ...term, go, groupId: g.id, groupTitle: g.title });
        });
    });
    return out;
}

function filterSystemDictionary(query, groupId) {
    const q = String(query || '').trim().toLowerCase();
    return getSystemDictionaryFlat().filter((row) => {
        if (groupId && groupId !== 'all' && row.groupId !== groupId) return false;
        if (!q) return true;
        const blob = `${row.t} ${row.d} ${row.w} ${row.groupTitle} ${row.go || ''}`.toLowerCase();
        return blob.includes(q);
    });
}

function renderSystemDictionary() {
    const host = document.getElementById('systemDictionaryList');
    const countEl = document.getElementById('systemDictionaryCount');
    const emptyEl = document.getElementById('systemDictionaryEmpty');
    if (!host) return;

    const query = document.getElementById('systemDictionarySearch')?.value || '';
    const groupId = document.getElementById('systemDictionaryGroup')?.value || 'all';
    const rows = filterSystemDictionary(query, groupId);

    if (countEl) countEl.textContent = `${rows.length} term${rows.length === 1 ? '' : 's'}`;
    if (emptyEl) emptyEl.hidden = rows.length > 0;

    const byGroup = new Map();
    rows.forEach((row) => {
        if (!byGroup.has(row.groupId)) byGroup.set(row.groupId, []);
        byGroup.get(row.groupId).push(row);
    });

    const groupOrder = SYSTEM_DICTIONARY_GROUPS.map((g) => g.id);
    host.innerHTML = groupOrder
        .filter((id) => byGroup.has(id))
        .map((id) => {
            const title = SYSTEM_DICTIONARY_GROUPS.find((g) => g.id === id)?.title || id;
            const items = byGroup.get(id)
                .map((row) => {
                    const go = row.go || '';
                    const clickable = !!go;
                    const tag = clickable ? 'button' : 'article';
                    const attrs = clickable
                        ? `type="button" class="sys-dict-term is-link" data-dict-go="${dictEscape(go)}" title="Open ${dictEscape(go)}"`
                        : 'class="sys-dict-term"';
                    const hint = clickable
                        ? `<span class="sys-dict-go">Open →</span>`
                        : '';
                    return `
                    <${tag} ${attrs} id="dict-${dictEscape(row.groupId)}-${dictEscape(row.t).replace(/\s+/g, '-').slice(0, 40)}">
                        <h4>${dictEscape(row.t)}</h4>
                        <p>${dictEscape(row.d)}</p>
                        <span class="sys-dict-where">${dictEscape(row.w || '')}</span>
                        ${hint}
                    </${tag}>`;
                })
                .join('');
            return `
                <section class="sys-dict-group" data-group="${dictEscape(id)}">
                    <h3>${dictEscape(title)}</h3>
                    <div class="sys-dict-terms">${items}</div>
                </section>`;
        })
        .join('');
}

function openDictNavTarget(moduleId) {
    if (!moduleId || typeof navigateToModule !== 'function') return;
    navigateToModule(moduleId);
}

function fillSystemDictionaryGroupSelect() {
    const sel = document.getElementById('systemDictionaryGroup');
    if (!sel || sel.dataset.ready === '1') return;
    sel.innerHTML = [
        '<option value="all">All sections</option>',
        ...SYSTEM_DICTIONARY_GROUPS.map((g) =>
            `<option value="${dictEscape(g.id)}">${dictEscape(g.title)}</option>`)
    ].join('');
    sel.dataset.ready = '1';
}

function initSystemDictionary() {
    const root = document.getElementById('systemDictionary');
    if (!root) return;
    fillSystemDictionaryGroupSelect();
    renderSystemDictionary();

    if (root.dataset.inited === '1') return;
    root.dataset.inited = '1';

    document.getElementById('systemDictionarySearch')?.addEventListener('input', renderSystemDictionary);
    document.getElementById('systemDictionaryGroup')?.addEventListener('change', renderSystemDictionary);
    document.getElementById('systemDictionaryClear')?.addEventListener('click', () => {
        const search = document.getElementById('systemDictionarySearch');
        const group = document.getElementById('systemDictionaryGroup');
        if (search) search.value = '';
        if (group) group.value = 'all';
        renderSystemDictionary();
        search?.focus();
    });

    root.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-dict-go]');
        if (!btn) return;
        e.preventDefault();
        openDictNavTarget(btn.getAttribute('data-dict-go'));
    });
}

window.SYSTEM_DICTIONARY_GROUPS = SYSTEM_DICTIONARY_GROUPS;
window.getSystemDictionaryFlat = getSystemDictionaryFlat;
window.renderSystemDictionary = renderSystemDictionary;
window.initSystemDictionary = initSystemDictionary;
window.resolveDictNavTarget = resolveDictNavTarget;
