# Multi-unit / multi cost-centre roadmap

## Principle

**Ord Dir** in the ZNA procurement procedure charts is only an **example cost centre**.

The **same process** applies to:

- **IT Dir** (this TechStores deployment — cost centre `Z04P2SP212`)
- Ordnance and other **ZNA cost centres**
- Unit / formation **Quartermasters**
- **Directorate Procurement** desks (with their own module packs)

TechStores today is the **IT Dir instance** of a pattern that should later become **configurable**.

---

## Generic actors (not hard-coded to Ord Dir)

| Actor | Role in process |
|-------|------------------|
| User | Originates need (indent / requisition) |
| **Cost Centre Directorate** | IT Dir, Ord Dir, or any other ZNA cost centre — seeks authority, receives goods, accounts |
| QS Branch | Authority, distribution, minute sheets |
| COS QS / Comd Elm / Comd ZNA | Higher approval |
| DP | Executes purchase, RFQ, PO / contract |
| AIAD | Due diligence on quotations |

Replace “Ord Dir” in any chart with **Cost Centre Dir** when describing this system.

---

## Standard process (Army-wide)

1. User request (indent) → Cost Centre Dir  
2. Cost Centre Dir → QS Br (minute sheet / authority)  
3. QS Br → DP (authority to process)  
4. DP executes / notifies  
5. AIAD due diligence on RFQs  
6. Supplier selection (quality / value, not price alone)  
7. PO / contract  
8. Goods receipt report by Cost Centre Dir  
9. Distribution authorisation  
10. Pro-forma / minute sheet closure  

---

## Supplier evaluation pack (for future vendor module)

Documents for Director Procurement, Army HQ (P Bag 7720, Causeway, Harare):

1. Introductory letter  
2. Certificate of Incorporation  
3. CR14  
4. ZIMRA / VAT11  
5. Tax Clearance  
6. NSSA  
7. PRAZ receipt  
8. Vendor number renewal  
9. Bank statement (≥ 3 months)  
10. Trade references (≥ 3)  
11. Company profile  
12. Bound, valid, certified set  

---

## Future customisation model

| Layer | Customisable? | Notes |
|-------|----------------|-------|
| Process steps | Shared | Same Army workflow |
| Cost centre profile | Yes | Name, code, location, branding |
| Module pack | Yes | TechStores / QM clothing / ammo / DP desk, etc. |
| Forms (Q 982, Q 1033…) | Shared catalogue | Enable/disable per pack |
| Users & roles | Per installation | Admin / store / viewer (+ future QM / DP roles) |
| Database | Per installation or multi-tenant | Start: one `techstores.db` per site |

### Code hook (already started)

`app/js/org-profile.js` holds:

- `ORG_PROFILES['it-dir-techstores']` — live profile  
- `ORG_PROFILES['ord-dir-example']` — sample only  
- `ZNA_PROCUREMENT_PROCESS` — generic steps  
- `SUPPLIER_EVALUATION_REQUIREMENTS` — vendor pack checklist  

Change active profile later with `setOrgProfile('…')` or load from SQLite settings.

---

## Near-term (IT Dir TechStores)

Keep building IT Dir modules; word UI/docs as **Cost Centre Dir** where the process is Army-generic; avoid locking copy to “Ord Dir” only.
