# TechStores ↔ Accounting Standing Orders — Compliance Matrix

> **Classification:** RESTRICTED  
> **Source authority:** *Accounting Standing Orders for the Zimbabwe National Army* (QS Branch, Army HQ, August 2011)  
> **System:** IT Dir TechStores Information System (Cost centre Z04P2SP212)  
> **Purpose:** Map each TechStores module to ASO chapters, state compliance level, and list gaps / alignment actions.  
> **Last updated:** 28 July 2026  
> **Printable view:** `docs/ASO-Compliance-Matrix.html`

---

## Compliance legend

| Status | Meaning |
|--------|---------|
| **Aligned** | Module implements the ASO intent for IT Dir Tech Stores scope |
| **Partial** | Core process present; missing form, certificate, frequency, or ledger detail |
| **Gap** | ASO requirement not yet supported in the system |
| **N/A** | Outside IT Dir Tech Stores scope (e.g. rations, ammunition, FOL) |

*ASO amplifies Defence Act / QS Standing Orders; TechStores is a directorate stores aid — it does not replace unit equipment ledgers at Formation/Unit QM where ASO still applies in full.*

---

## 1. Master matrix (module → ASO)

| TechStores module | ASO reference | Status | How TechStores supports ASO | Gap / alignment note |
|-------------------|---------------|--------|-----------------------------|----------------------|
| **Dashboard / Alerts** | Pt 1 Ch 1 (responsibilities); Ch 28 (checks) | Partial | Surfaces open reqs, DP, undelivered POs, loan overstays | No daily/weekly controlled-stores check certificate log (Ch 28) |
| **GL ledgers** (consumables, software, maintenance, spares, ICT) | Pt 1 Ch 2–3 (ledgers & subdivisions); Ch 11 (consumables) | Partial | Separate GL families mirror ledger categories; voucher posting | Not paper ZNA Q 80 / 178 / 183; electronic surrogate |
| **Issue Voucher** | Pt 1 Ch 2 (receipt/issue vouchers); Ch 3 (entries) | Aligned | Receive/issue against inventory; day session | Ensure voucher numbers keep distinct RV/IV series (Ch 3 §2) |
| **Stock Take** | **Pt 1 Ch 9** (stocktaking); Ch 1 §6 (handover board) | Aligned | Full physical vs system; variance; save; push **ZNA Q 987** | Annual CO certificate as at **31 May** (to Bde by 20 Jun) — manual export still required; surplus → bring on charge per Ch 9 §5 (Q 1033 / Q 1049) |
| **Financial Year Bids** | Pt 1 Ch 26 (POs/warrants — planning link); local DAF process | Partial | Bid schedule / packs for vote planning | Not an ASO form; supports buying-power discipline |
| **Unit Equipment Table** | Pt 1 Ch 1; Ch 3 §1(1) Unit Equipment | Partial | Holdings by ZA/unit | Not a formal equipment ledger substitute for unit QM |
| **ZNA ICT Asset Register** | Pt 1 Ch 1 §3; Ch 3 (controlled / numbered stores); Ch 28 | Aligned | Unique **ZA**; status; accountability trail | Weekly serial check certificate (Ch 28 §4) not automated |
| **Accommodation Stores** | Pt 1 Ch 3 §1(3); Ch 13 (camp/accommodation context) | Partial | Furniture / office stores inventory | Barrack expendables still Ch 11 / Q 183 rules if used |
| **Temporary Loans** | **Pt 2 Ch 3** (stores on loan) | Aligned | Bring to view; due date; 14-day max; overstay alerts; return tracking | Extension: apply **2 weeks before expiry** via Bde/Dist HQ (ASO); issue/return should be covered by **ZNA Q 1033**; loan voucher file retained |
| **Unit Requisitions / Loose Minute** | Pt 1 Ch 26 (requisitions / POs & warrants) | Partial | Demand capture before indent/PO | Official indent remains **ZNA Q 982** / **DP F1** |
| **Monthly Returns** | Pt 1 Ch 28 (unit checks); local IT Dir return | Partial | SVC / UNSVC / T/LOAN return | Complements ASO checks; not the annual Ch 9 certificate |
| **Spec Evaluation** | Local procurement aid | N/A | Pre-indent specification | Outside ASO accounting chapters |
| **DP F1 Form** | Pt 1 Ch 26; Ch 2 (indent path) | Partial | Official indent lines | Use with Q 982 where ASO requires Combined Indent |
| **ICT Procurement Cycle** | Ch 26 + DP process | Partial | 8-step tracker (IT Dir → DP → delivery) | Workflow aid; vouchers still Ch 2 |
| **ZNA Q 982** | Pt 1 Ch 2 §3; Ch 15/17; Pt 2 Ch 5 | Aligned | Combined indent / demand & issue | Primary depot indent form per ASO |
| **ZNA Q 178** | Pt 1 Ch 2 §2(c) | Aligned | Sub / distribution ledger sheet | Electronic fillable |
| **ZNA Q 1033** | Pt 1 Ch 2 §3 (local receipt/issue); Ch 9 §5; Pt 2 Ch 3 | Aligned | Issue & receipt voucher | Use for local supplier, sub-unit, loan internal issues, surplus bring-on |
| **ZNA Q 1043** | Pt 1 Ch 15; Pt 2 Ch 5 | Aligned | Condemnation certificate | Attach to Q 982 when indenting replacement |
| **ZNA Q 80** | Pt 1 Ch 2–3; Ch 17 §9 | Aligned | Ledger sheet | Master ledger style for tools/equipment |
| **ZNA SVCS/890** | Pt 1 Ch 2; Ch 17 | Aligned | Demand / issue (workshop / signal spares) | Q 890 numbering in IV series (Ch 3 / Ch 17) |
| **ZNA Q 1179 / Q 1157** | Pt 1 Ch 2 §3(f–g) | Partial | Clothing / personal equipment forms | Limited ICT relevance |
| **ZNA Q 987** | **Pt 1 Ch 9 §4–6** | Aligned | Certificate of stocktaking | Push from Stock Take module |
| **ZNA Q 3977** | Pt 1 Ch 6 (loss/damage path) | Partial | Neglect / damage report | Full write-off may need Q 1 / Q 998 / Board (Ch 6) — **Gap** for Q 1 / Q 998 |
| **ZNA SVCS 1045** | Pt 1 Ch 15; Pt 2 Ch 5 | Aligned | Workshop indent | Repair → condemn → replace chain |
| **Delivery Note** | Pt 1 Ch 2 §4(b) (supplier DN → Q 1033) | Partial | DN lines | Receipt voucher Q 1033 still required for local supplier |
| **Purchase Orders** | **Pt 1 Ch 26** | Aligned | PO register; security/weekly check is procedural | Cancelled POs: retain all copies filed (Ch 26); book security = local control |
| **Undelivered Items** | Pt 1 Ch 7 (consignment discrepancies — related) | Partial | Tracks awaiting delivery | Shortages/excess on receipt → **ZNA Q 985** (**Gap** — form not in system) |
| **Workshop Repairs** | Pt 1 Ch 15; Pt 2 Ch 5; Ch 17 | Aligned | Repair register ↔ 1045 / 1043 / 982 | Follow strike-off when beyond local repair |
| **Suppliers & Contracts** | Ch 26 (commercial supply support) | Partial | Supplier directory | Not ASO-mandated |
| **Release Cut** | Local DAF / GL transfer | N/A | Buying-power transfer between GLs | Not ASO Q accounting |
| **Reports / Period Report** | Ch 8 (audit support); Ch 9; Ch 25 | Partial | Printable evidence packs | Retention: completed books **3 years** then destroy (Ch 25) — apply to backups/prints |
| **User Management / Backup** | Ch 1 (responsibility); Ch 25 (records) | Partial | Access control; JSON/DB backup | Align backup retention with Ch 25 |

---

## 2. ASO chapter → TechStores coverage

| ASO chapter | Title (short) | TechStores coverage | Status |
|-------------|---------------|---------------------|--------|
| Pt 1 Ch 1 | General instructions / CO responsibility / handover | Asset Register, Stock Take, Unit Equipment, Loans | Partial |
| Pt 1 Ch 2 | Accounting documents & forms | All ZNA Q modules, vouchers, DN, PO | Aligned (forms present) |
| Pt 1 Ch 3 | Ledger subdivision & entries | Inventory families + GL modules | Partial (electronic) |
| Pt 1 Ch 4 | Ration accounting | — | N/A |
| Pt 1 Ch 5 | Boarding & sale of Govt property | — | N/A / Gap if disposal needed |
| Pt 1 Ch 6 | Write-off loss/damage/destruction | Q 3977, Q 1043; Workshop | **Partial** — missing Q 1, Q 998, write-off schedule |
| Pt 1 Ch 7 | Discrepancies in consignments | Undelivered / DN (related) | **Gap** — ZNA Q 985 |
| Pt 1 Ch 8 | Audit | Reports, ledgers, backups | Partial |
| Pt 1 Ch 9 | Stocktaking | Stock Take + Q 987 | Aligned |
| Pt 1 Ch 10 | Ammunition | — | N/A |
| Pt 1 Ch 11 | Consumable / expendable stores | Consumables GL + Issue Voucher | Partial |
| Pt 1 Ch 12 | MT spares | Spare Parts GL (ICT/tech only) | Partial / limited scope |
| Pt 1 Ch 13 | Camp equipment | Accommodation Stores (partial) | Partial |
| Pt 1 Ch 14 | Medical stores | — | N/A |
| Pt 1 Ch 15 | Repair & replacement (technical / controlled) | Workshop, SVCS 1045, Q 1043, Q 982 | Aligned |
| Pt 1 Ch 16 | Engineers materials | — | N/A |
| Pt 1 Ch 17 | Signals spares, tools & equipment | Spares GL, SVCS/890, Q 80 | Aligned (IT/Signals-relevant) |
| Pt 1 Ch 18–24 | MoW, FOL, containers, clothing repair, public monies… | — | Mostly N/A |
| Pt 1 Ch 25 | Disposal of Q accounting records | Backup & report archive policy | Partial — enforce **3-year** retention |
| Pt 1 Ch 26 | Requisitions / Purchase Orders & warrants | Requisitions, POs, DP F1, Q 982 | Aligned |
| Pt 1 Ch 27 | Debit vouchers (Q 1680) | — | **Gap** |
| Pt 1 Ch 28 | Unit checks & verifications | Monthly Returns; loan alerts; Asset Register | **Partial** — daily/weekly/monthly % checks not logged |
| Pt 2 Ch 1–2 | Hiring transport / property | — | N/A |
| Pt 2 Ch 3 | Stores received on loan | Temporary Loans | Aligned |
| Pt 2 Ch 4 | Air freight | — | N/A |
| Pt 2 Ch 5 | Repair & replacement (field/emergency tech) | Workshop + QM forms | Aligned |

---

## 3. Official forms crosswalk (ASO ↔ system)

| ASO form | Purpose (ASO) | In TechStores? |
|----------|---------------|----------------|
| ZNA Q 982 | Combined demand & issue / depot indent | Yes — `zna-q-982` |
| ZNA Q 1033 | Issue & receipt (local / sub-unit / loan) | Yes — `zna-q-1033` |
| ZNA Q 178 | Distribution / sub ledger | Yes — `zna-q-178` |
| ZNA Q 80 | Ledger sheet | Yes — `zna-q-80` |
| ZNA Q 987 | Stocktaking certificate | Yes — `zna-q-987` (+ push from Stock Take) |
| ZNA Q 1043 | Condemnation | Yes — `zna-q-1043` |
| ZNA SVCS 1045 | Workshop indent | Yes — `zna-svcs-1045` |
| ZNA Q / SVCS 890 | Workshop / signal spares demand | Yes — `zna-svcs-890` |
| ZNA Q 1157 / 1179 | Clothing & personal equipment | Yes (limited use) |
| ZNA Q 985 | Discrepancy report | Yes — `zna-q-985` |
| ZNA Q 1049 | Transfer / surplus bring-on numbering | Referenced in Ch 9; use Q 1033 process |
| ZNA Q 1 | Write-off schedule | Yes — `zna-q-1` |
| ZNA Q 998 | Statement of loss / damage / destruction | Yes — `zna-q-998` |
| ZNA Q 1680 | Debit voucher (recoveries) | Yes — `zna-q-1680` |
| DP F1 | Procurement indent (DP) | Yes — `dp-f1-form` |

---

## 4. Priority gap backlog (alignment roadmap)

| Priority | Gap | ASO | Recommended action |
|----------|-----|-----|--------------------|
| P1 | Annual stock-take certificate workflow | Ch 9 §8 | Reminder + export pack dated **31 May** / due Bde **20 Jun** |
| P2 | Unit check certificates | Ch 28 | Log daily/weekly serial / monthly 10% checks for controlled ICT |
| P3 | Records disposal schedule | Ch 25 | Document 3-year retention for printed ledgers & backups |
| Done | ZNA Q 985 / Q 1 / Q 998 / Q 1680 | Ch 7, 6, 27 | Added as fillable modules (Jul 2026) |

---

## 5. Operating rules (IT Dir Tech Stores — ASO-aligned)

1. **Every receipt and issue** must be supportable by an ASO form (normally Q 982, Q 1033, or SVCS 890/1045).  
2. **Stock takes** record results on **ZNA Q 987**; surpluses brought on charge; deficiencies actioned under **Ch 6**.  
3. **Loans** returned by the date on the loan voucher; extensions sought **two weeks before** expiry; covered by **Q 1033** for internal issues.  
4. **Beyond local repair** → Workshop Indent **SVCS 1045** → Condemnation **Q 1043** → Indent replacement **Q 982** → strike off on **Q 1033**.  
5. **Local supplier receipt** → check against Delivery Note → raise **Q 1033**; attach to PO / invoice path as per Ch 2.  
6. **Consignment shortage/excess** between military units → **Q 985** (when implemented); do not amend voucher copies casually (Ch 7).  
7. Retain completed Q accounting records **three years** before destruction (Ch 25).

---

## 6. Document control

| Item | Value |
|------|-------|
| ASO edition used | August 2011 (desktop file `ACCOUNTING STANDING ORDERS.doc.sm.doc`) |
| Matrix owner | IT Dir Tech Stores |
| Review | After each ASO circular amendment from QS Branch |

**Related**

- `docs/SYSTEM-DOCUMENTATION.md` — full system manual (§ ASO alignment)  
- `docs/ASO-Compliance-Matrix.html` — printable matrix  
- `docs/IT-Dir-TechStores-System-Documentation.docx` — Word export (regenerate via `python docs/md_to_docx.py`)
