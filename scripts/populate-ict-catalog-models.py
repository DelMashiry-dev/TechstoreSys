"""Insert named ICT catalog models into catalog.js ict-equipment section."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "app" / "js" / "catalog.js"

# One-by-one named models for Catalog Item dropdown (latest / common business lines)
NAMES = [
    # --- Laptops ---
    "HP OmniBook",
    "HP OmniBook Ultra",
    "HP OmniBook Ultra Flip",
    "HP OmniBook X",
    "HP OmniBook 7",
    "HP OmniBook 5",
    "HP OmniBook 3",
    "HP EliteBook",
    "HP EliteBook 8 G2i",
    "HP EliteBook 6 G2i",
    "HP EliteBook 860 G11",
    "HP EliteBook 840 G11",
    "HP EliteBook 830 G11",
    "HP EliteBook x360",
    "HP ProBook",
    "HP ProBook 4 G2i",
    "HP ProBook 450 G10",
    "HP ProBook 440 G11",
    "HP ZBook Firefly",
    "HP ZBook Power",
    "HP ZBook Fury",
    "Dell Latitude 5550",
    "Dell Latitude 5540",
    "Dell Latitude 5450",
    "Dell Latitude 5440",
    "Dell Latitude 7450",
    "Dell Latitude 7440",
    "Dell Latitude 7350",
    "Dell Latitude 5350",
    "Dell Latitude 3340",
    "Dell Precision 5690",
    "Dell Precision 3591",
    "Dell XPS 14",
    "Dell XPS 16",
    "Dell Vostro 3530",
    "Dell Vostro 3520",
    "Lenovo ThinkPad T14 Gen 5",
    "Lenovo ThinkPad T16 Gen 3",
    "Lenovo ThinkPad X1 Carbon Gen 12",
    "Lenovo ThinkPad L14 Gen 5",
    "Lenovo ThinkPad E14 Gen 6",
    "Lenovo ThinkPad P16 Gen 2",
    "Lenovo ThinkPad P14s Gen 5",
    "Lenovo Legion Pro 7i",
    "Lenovo Yoga Slim 7",
    "Apple MacBook Pro 14",
    "Apple MacBook Pro 16",
    "Apple MacBook Air 13",
    "Apple MacBook Air 15",
    "Microsoft Surface Laptop 7",
    "Microsoft Surface Pro 11",
    "ASUS ExpertBook B9",
    "ASUS Vivobook Pro 16",
    "Acer TravelMate P6",
    # --- Desktops / workstations / AIO ---
    "HP EliteDesk 800 G9",
    "HP EliteDesk 805 G9",
    "HP ProDesk 400 G9",
    "HP ProDesk 405 G8",
    "HP Elite Mini 800 G9",
    "HP Z2 Tower G9",
    "HP Z2 Mini G9",
    "HP OmniStudio X",
    "HP All-in-One 27",
    "Dell OptiPlex 7020",
    "Dell OptiPlex 7020 Micro",
    "Dell OptiPlex 7020 SFF",
    "Dell OptiPlex 5420",
    "Dell Precision 3680 Tower",
    "Dell Precision 3280 Compact",
    "Dell Inspiron 27 All-in-One",
    "Lenovo ThinkCentre M90q Gen 4",
    "Lenovo ThinkCentre M70q Gen 4",
    "Lenovo ThinkCentre M90a Gen 5 AIO",
    "Lenovo ThinkStation P3 Tower",
    "Lenovo ThinkStation P620",
    "Apple iMac 24",
    "Apple Mac mini M4",
    "Apple Mac Studio",
    # --- Printers / MFPs ---
    "HP LaserJet Pro 4002dn",
    "HP LaserJet Pro MFP 4102fdw",
    "HP LaserJet Enterprise M507dn",
    "HP LaserJet Enterprise MFP M528dn",
    "HP Color LaserJet Pro MFP 4302fdw",
    "HP Color LaserJet Enterprise M554dn",
    "HP Color LaserJet Enterprise MFP M578dn",
    "HP LaserJet Enterprise Flow MFP M634z",
    "HP PageWide Enterprise Color MFP 586dn",
    "HP DesignJet T650",
    "HP DesignJet T830",
    "Canon imageRUNNER ADVANCE DX C3926i",
    "Canon imageRUNNER ADVANCE DX C5840i",
    "Canon imageRUNNER ADVANCE DX 6980i",
    "Canon imageCLASS MF455dw",
    "Canon PIXMA G3470",
    "Epson EcoTank L3250",
    "Epson EcoTank L15150",
    "Epson WorkForce Pro WF-C5890",
    "Brother MFC-L8390CDW",
    "Brother HL-L6415DW",
    "Kyocera TASKalfa 2554ci",
    "Kyocera ECOSYS M5526cdw",
    "Xerox VersaLink C405",
    "Xerox AltaLink C8155",
    # --- Servers ---
    "HPE ProLiant DL380 Gen11",
    "HPE ProLiant DL360 Gen11",
    "HPE ProLiant ML350 Gen11",
    "HPE ProLiant MicroServer Gen11",
    "Dell PowerEdge R760",
    "Dell PowerEdge R750",
    "Dell PowerEdge R660",
    "Dell PowerEdge T560",
    "Dell PowerEdge XR4000",
    "Lenovo ThinkSystem SR650 V3",
    "Lenovo ThinkSystem SR630 V3",
    "Lenovo ThinkSystem ST650 V3",
    "Cisco UCS C240 M7",
    "Cisco UCS C220 M7",
    "Supermicro SuperServer 1029U",
    # --- Routers ---
    "Cisco ISR 4331",
    "Cisco ISR 4431",
    "Cisco Catalyst 8200",
    "Cisco Catalyst 8300",
    "Cisco ASR 1001-X",
    "Cisco Meraki MX67",
    "Cisco Meraki MX75",
    "Cisco Meraki MX85",
    "MikroTik CCR2004",
    "MikroTik hEX S",
    "Ubiquiti EdgeRouter 4",
    "Ubiquiti UniFi Dream Machine Pro",
    "Fortinet FortiGate 60F",
    "Fortinet FortiGate 100F",
    "Fortinet FortiGate 200F",
    "TP-Link Omada ER7206",
    # --- Access points ---
    "Cisco Catalyst 9105AXI",
    "Cisco Catalyst 9115AXI",
    "Cisco Catalyst 9120AXI",
    "Cisco Catalyst 9130AXI",
    "Cisco Meraki MR36",
    "Cisco Meraki MR46",
    "Cisco Meraki MR56",
    "Cisco Meraki MR76 Outdoor",
    "Ubiquiti UniFi U6 Lite",
    "Ubiquiti UniFi U6 Pro",
    "Ubiquiti UniFi U6 Enterprise",
    "Ubiquiti UniFi U7 Pro",
    "Aruba Instant On AP22",
    "Aruba AP-535",
    "Aruba AP-635",
    "TP-Link Omada EAP670",
    "TP-Link Omada EAP650",
    "Ruckus R550",
    "Ruckus R650",
    # --- Switches ---
    "Cisco Catalyst 9200L 24-Port",
    "Cisco Catalyst 9200L 48-Port",
    "Cisco Catalyst 9300 24-Port",
    "Cisco Catalyst 9300 48-Port",
    "Cisco Catalyst 1000 24-Port",
    "Cisco Catalyst 1000 48-Port",
    "Cisco Catalyst 2960X 24-Port",
    "Cisco Catalyst 3850 24-Port",
    "Cisco Catalyst 3850 48-Port PoE",
    "Cisco CBS350 24-Port PoE",
    "Cisco CBS350 48-Port PoE",
    "Cisco Meraki MS120-24P",
    "Cisco Meraki MS210-48FP",
    "Cisco Meraki MS225-24P",
    "Ubiquiti UniFi Switch Lite 16 PoE",
    "Ubiquiti UniFi Switch Pro 24 PoE",
    "Ubiquiti UniFi Switch Pro 48 PoE",
    "Aruba Instant On 1930 24G PoE",
    "Aruba Instant On 1930 48G PoE",
    "Aruba 2930F 24G PoE",
    "TP-Link Omada SG3428XPP",
    "TP-Link JetStream TL-SG2428P",
    "Netgear GS724TPv2",
    "Netgear GS752TPv2",
    "MikroTik CRS328-24P-4S+",
]


def slugify(name: str) -> str:
    s = name.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")[:64] or "item"


def main() -> None:
    text = CATALOG.read_text(encoding="utf-8")
    # Existing ict ids to avoid duplicates
    existing = set(re.findall(r'"id":\s*"(ict-equipment__[^"]+)"', text))

    new_items = []
    for name in NAMES:
        iid = f"ict-equipment__{slugify(name)}"
        if iid in existing:
            continue
        # also skip if same name already present
        if re.search(rf'"name":\s*"{re.escape(name)}"', text):
            continue
        new_items.append((iid, name))
        existing.add(iid)

    block_lines = []
    for iid, name in new_items:
        block_lines.append("      {")
        block_lines.append(f'        "id": "{iid}",')
        block_lines.append(f'        "name": "{name}"')
        block_lines.append("      },")
    block = "\n".join(block_lines) + "\n"

    marker = '    "key": "ict-equipment",'
    idx = text.find(marker)
    if idx < 0:
        raise SystemExit("ict-equipment section not found")
    items_idx = text.find('"items": [', idx)
    if items_idx < 0:
        raise SystemExit("items array not found")
    insert_at = items_idx + len('"items": [')
    # insert after newline following [
    if text[insert_at:].startswith("\n"):
        insert_at += 1
    else:
        block = "\n" + block

    updated = text[:insert_at] + block + text[insert_at:]
    CATALOG.write_text(updated, encoding="utf-8")
    print(f"Inserted {len(new_items)} ICT catalog items")
    for _, name in new_items[:15]:
        print(" ", name)
    print(" ...")


if __name__ == "__main__":
    main()
