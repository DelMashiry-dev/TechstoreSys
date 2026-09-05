/* catalog.js — IT Directorate stores master catalog (procure / receive / issue) */

const STORES_CATALOG_SECTIONS = [
  {
    "key": "consumables-toners",
    "label": "ZOFF / Office Supplies \u2014 Toners & Ink",
    "gl": "6122100009",
    "detail": "Toners, ink cartridges, printheads and related consumables",
    "items": [
      {
        "id": "consumables-toners__hp-ce505a-toner",
        "name": "HP CE505A toner"
      },
      {
        "id": "consumables-toners__hp-ce278a-toner",
        "name": "HP CE278A toner"
      },
      {
        "id": "consumables-toners__hp-ce255a-toner",
        "name": "HP CE255A toner"
      },
      {
        "id": "consumables-toners__hp-cf226a-toner",
        "name": "HP CF226A toner"
      },
      {
        "id": "consumables-toners__hp-ce283a-toner",
        "name": "HP CE283A toner"
      },
      {
        "id": "consumables-toners__hp-ce280a-toner",
        "name": "HP CE280A toner"
      },
      {
        "id": "consumables-toners__hp-cf259a-toner",
        "name": "HP CF259A toner"
      },
      {
        "id": "consumables-toners__hp-cf214a-toner",
        "name": "HP CF214A toner"
      },
      {
        "id": "consumables-toners__hp-ce285a-toner",
        "name": "HP CE285A toner"
      },
      {
        "id": "consumables-toners__hp-cf130a-toner",
        "name": "HP CF130A toner"
      },
      {
        "id": "consumables-toners__hp-ce256a-toner",
        "name": "HP CE256A toner"
      },
      {
        "id": "consumables-toners__hp-cf325x-toner",
        "name": "HP CF325X toner"
      },
      {
        "id": "consumables-toners__hp-ce237a-toner",
        "name": "HP CE237A toner"
      },
      {
        "id": "consumables-toners__hp-ce281a-toner",
        "name": "HP CE281A toner"
      },
      {
        "id": "consumables-toners__hp-ce230a-toner",
        "name": "HP CE230A toner"
      },
      {
        "id": "consumables-toners__hp-ce232a-toner",
        "name": "HP CE232A toner"
      },
      {
        "id": "consumables-toners__hp-ce410a-toner-black-410",
        "name": "HP CE410A toner black (410)"
      },
      {
        "id": "consumables-toners__hp-ce411a-toner-cyan-410",
        "name": "HP CE411A toner cyan (410)"
      },
      {
        "id": "consumables-toners__hp-ce412a-toner-yellow-410",
        "name": "HP CE412A toner yellow (410)"
      },
      {
        "id": "consumables-toners__hp-ce413a-toner-magenta-410",
        "name": "HP CE413A toner magenta (410)"
      },
      {
        "id": "consumables-toners__hp-cf400a-toner-black-201",
        "name": "HP CF400A toner black (201)"
      },
      {
        "id": "consumables-toners__hp-cf401a-toner-cyan-201",
        "name": "HP CF401A toner cyan (201)"
      },
      {
        "id": "consumables-toners__hp-cf402a-toner-yellow-201",
        "name": "HP CF402A toner yellow (201)"
      },
      {
        "id": "consumables-toners__hp-cf403a-toner-magenta-201",
        "name": "HP CF403A toner magenta (201)"
      },
      {
        "id": "consumables-toners__hp-ce410a-toner-305",
        "name": "HP CE410A toner (305)"
      },
      {
        "id": "consumables-toners__hp-ce411a-toner-305",
        "name": "HP CE411A toner (305)"
      },
      {
        "id": "consumables-toners__hp-ce412a-toner-305",
        "name": "HP CE412A toner (305)"
      },
      {
        "id": "consumables-toners__hp-ce413a-toner-305",
        "name": "HP CE413A toner (305)"
      },
      {
        "id": "consumables-toners__hp-cf210a-toner-black-131",
        "name": "HP CF210A toner black (131)"
      },
      {
        "id": "consumables-toners__hp-cf211a-toner-cyan-131",
        "name": "HP CF211A toner cyan (131)"
      },
      {
        "id": "consumables-toners__hp-cf212a-toner-yellow-131",
        "name": "HP CF212A toner yellow (131)"
      },
      {
        "id": "consumables-toners__hp-cf213a-toner-magenta-131",
        "name": "HP CF213A toner magenta (131)"
      },
      {
        "id": "consumables-toners__hp-w2030a-toner-black-415",
        "name": "HP W2030A toner black (415)"
      },
      {
        "id": "consumables-toners__hp-w2031a-toner-cyan-415",
        "name": "HP W2031A toner cyan (415)"
      },
      {
        "id": "consumables-toners__hp-w2032a-toner-yellow-415",
        "name": "HP W2032A toner yellow (415)"
      },
      {
        "id": "consumables-toners__hp-w2033a-toner-magenta-415",
        "name": "HP W2033A toner magenta (415)"
      },
      {
        "id": "consumables-toners__hp-ink-652-black",
        "name": "HP Ink 652 black"
      },
      {
        "id": "consumables-toners__hp-ink-652-colour",
        "name": "HP Ink 652 colour"
      },
      {
        "id": "consumables-toners__hp-ink-901-black",
        "name": "HP Ink 901 black"
      },
      {
        "id": "consumables-toners__hp-ink-901-colour",
        "name": "HP Ink 901 colour"
      },
      {
        "id": "consumables-toners__hp-650-inkjet-colour",
        "name": "HP 650 inkjet colour"
      },
      {
        "id": "consumables-toners__hp-650-inkjet-black",
        "name": "HP 650 inkjet black"
      },
      {
        "id": "consumables-toners__canon-451xl-black",
        "name": "Canon 451XL black"
      },
      {
        "id": "consumables-toners__canon-451xl-cyan",
        "name": "Canon 451XL cyan"
      },
      {
        "id": "consumables-toners__canon-451xl-magenta",
        "name": "Canon 451XL magenta"
      },
      {
        "id": "consumables-toners__canon-451xl-yellow",
        "name": "Canon 451XL yellow"
      },
      {
        "id": "consumables-toners__olivetti-b1237-black",
        "name": "Olivetti B1237 black"
      },
      {
        "id": "consumables-toners__olivetti-b1238-cyan",
        "name": "Olivetti B1238 cyan"
      },
      {
        "id": "consumables-toners__olivetti-b1239-yellow",
        "name": "Olivetti B1239 yellow"
      },
      {
        "id": "consumables-toners__olivetti-b1240-magenta",
        "name": "Olivetti B1240 magenta"
      },
      {
        "id": "consumables-toners__canon-exv54-black",
        "name": "Canon EXV54 black"
      },
      {
        "id": "consumables-toners__canon-exv54-cyan",
        "name": "Canon EXV54 cyan"
      },
      {
        "id": "consumables-toners__canon-exv54-magenta",
        "name": "Canon EXV54 magenta"
      },
      {
        "id": "consumables-toners__canon-exv54-yellow",
        "name": "Canon EXV54 Yellow"
      },
      {
        "id": "consumables-toners__canon-c3025i-waste-toner-cartridges",
        "name": "Canon C3025i waste toner cartridges"
      },
      {
        "id": "consumables-toners__hp-ce740a-toner-black-307",
        "name": "HP CE740A toner black (307)"
      },
      {
        "id": "consumables-toners__hp-ce741a-toner-cyan-307",
        "name": "HP CE741A toner cyan (307)"
      },
      {
        "id": "consumables-toners__hp-ce742a-toner-yellow-307",
        "name": "HP CE742A toner yellow (307)"
      },
      {
        "id": "consumables-toners__hp-ce743a-toner-magenta-307",
        "name": "HP CE743A toner magenta (307)"
      },
      {
        "id": "consumables-toners__hp-page-wide-pro-973-913a-black",
        "name": "HP Page Wide PRO 973/913A black"
      },
      {
        "id": "consumables-toners__hp-page-wide-pro-973-913a-cyan",
        "name": "HP Page Wide PRO 973/913A cyan"
      },
      {
        "id": "consumables-toners__hp-page-wide-pro-973-913a-yellow",
        "name": "HP Page Wide PRO 973/913A yellow"
      },
      {
        "id": "consumables-toners__hp-page-wide-pro-973-913a-magenta",
        "name": "HP Page Wide PRO 973/913A magenta"
      },
      {
        "id": "consumables-toners__canon-c-exv42-black",
        "name": "Canon C-Exv42 black"
      },
      {
        "id": "consumables-toners__samsung-708l-toner",
        "name": "Samsung 708L toner"
      },
      {
        "id": "consumables-toners__printronix-ribbons-p8000-7000-255049-101",
        "name": "Printronix ribbons P8000/7000 255049-101"
      },
      {
        "id": "consumables-toners__printronix-ribbons-p8000-p7000-255049-102",
        "name": "Printronix ribbons P8000/P7000 255049-102"
      },
      {
        "id": "consumables-toners__xerox-c60-c70-toner-black-k1",
        "name": "XEROX C60-C70 toner black K1"
      },
      {
        "id": "consumables-toners__xerox-c60-c70-toner-black-k2",
        "name": "XEROX C60-C70 toner black K2"
      },
      {
        "id": "consumables-toners__xerox-c60-c70-toner-magenta",
        "name": "XEROX C60-C70 toner magenta"
      },
      {
        "id": "consumables-toners__xerox-c60-c70-toner-cyan",
        "name": "XEROX C60-C70 toner cyan"
      },
      {
        "id": "consumables-toners__xerox-c60-c70-toner-yellow",
        "name": "XEROX C60-C70 toner yellow"
      },
      {
        "id": "consumables-toners__xerox-c60-c70-drum-cartridge-black-r1",
        "name": "XEROX C60-C70 drum cartridge black (R1)"
      },
      {
        "id": "consumables-toners__xerox-c60-c70-drum-cartridge-color-r1",
        "name": "XEROX C60-C70 drum cartridge color (R1)"
      },
      {
        "id": "consumables-toners__xerox-c60-c70-drum-cartridges-color-r2",
        "name": "XEROX C60-C70 drum cartridges color (R2)"
      },
      {
        "id": "consumables-toners__xerox-c60-c70-drum-cartridge-color-r3",
        "name": "XEROX C60-C70 drum cartridge color (R3)"
      },
      {
        "id": "consumables-toners__xerox-c70-waste-toner-container",
        "name": "XEROX C70 waste toner container"
      },
      {
        "id": "consumables-toners__lucia-ink-pf1-707-bk-700ml-black",
        "name": "Lucia ink PF1-707 Bk 700ml (black)"
      },
      {
        "id": "consumables-toners__lucia-ink-pf1-707-mbk-700ml-black",
        "name": "Lucia ink PF1-707 MBK 700ml (black)"
      },
      {
        "id": "consumables-toners__lucia-ink-pf1-707-c-700ml-cyan",
        "name": "Lucia ink PF1-707 C 700ml (cyan)"
      },
      {
        "id": "consumables-toners__lucia-ink-pf1-707-m-700ml-magenta",
        "name": "Lucia ink PF1-707 M 700ml (magenta)"
      },
      {
        "id": "consumables-toners__lucia-ink-pf1-707-y-700ml-yellow",
        "name": "Lucia ink PF1-707 Y 700ml (yellow)"
      },
      {
        "id": "consumables-toners__hp-cf2120a-toner-black-212a",
        "name": "HP CF2120A toner black (212A)"
      },
      {
        "id": "consumables-toners__hp-cf2121a-toner-cyan-212a",
        "name": "HP CF2121A toner cyan (212A)"
      },
      {
        "id": "consumables-toners__hp-cf2122a-toner-yellow-212a",
        "name": "HP CF2122A toner yellow (212A)"
      },
      {
        "id": "consumables-toners__hp-cf2123a-toner-magenta-212a",
        "name": "HP CF2123A toner magenta (212A)"
      },
      {
        "id": "consumables-toners__ricoh-mc2000l-black-toner",
        "name": "RICOH MC2000L black toner"
      },
      {
        "id": "consumables-toners__ricoh-mc2000l-cyan-toner",
        "name": "RICOH MC2000L cyan toner"
      },
      {
        "id": "consumables-toners__ricoh-mc2000l-yellow-toner",
        "name": "RICOH MC2000L yellow toner"
      },
      {
        "id": "consumables-toners__ricoh-mc2000l-magenta-toner",
        "name": "RICOH MC2000L magenta toner"
      },
      {
        "id": "consumables-toners__ricoh-mpc-2503-black-toner",
        "name": "RICOH MPC 2503 black toner"
      },
      {
        "id": "consumables-toners__ricoh-mpc-2503-cyan-toner",
        "name": "RICOH MPC 2503 cyan toner"
      },
      {
        "id": "consumables-toners__ricoh-mpc-2503-yellow-toner",
        "name": "RICOH MPC 2503 yellow toner"
      },
      {
        "id": "consumables-toners__ricoh-mpc-2503-magenta-toner",
        "name": "RICOH MPC 2503 magenta toner"
      },
      {
        "id": "consumables-toners__hp-w2070a-117a-black-toner",
        "name": "HP W2070A 117A Black toner"
      },
      {
        "id": "consumables-toners__hp-w2070a-117a-cyan-toner",
        "name": "HP W2070A 117A cyan toner"
      },
      {
        "id": "consumables-toners__hp-w2070a-117a-yellow-toner",
        "name": "HP W2070A 117A yellow toner"
      },
      {
        "id": "consumables-toners__hp-w2070a-117a-magenta-toner",
        "name": "HP W2070A 117A magenta toner"
      },
      {
        "id": "consumables-toners__hp-w1104a-104a-toner",
        "name": "HP W1104A (104A) toner"
      },
      {
        "id": "consumables-toners__hp-cf289a-toner",
        "name": "HP CF289A toner"
      },
      {
        "id": "consumables-toners__toner-hp761",
        "name": "Toner HP761"
      },
      {
        "id": "consumables-toners__maintenance-cartridge-mc-09",
        "name": "Maintenance Cartridge MC 09"
      },
      {
        "id": "consumables-toners__maintenance-cartridge-hp82",
        "name": "Maintenance Cartridge HP82"
      },
      {
        "id": "consumables-toners__hpc-4810a",
        "name": "HPC 4810A"
      },
      {
        "id": "consumables-toners__hpt7100-maintenance-cartridge",
        "name": "HPT7100 Maintenance Cartridge"
      },
      {
        "id": "consumables-toners__hp-104a-toner",
        "name": "HP 104A Toner"
      },
      {
        "id": "consumables-toners__service-station-assembly-hp800",
        "name": "Service Station Assembly HP800"
      },
      {
        "id": "consumables-toners__7100-print-heads",
        "name": "7100 Print Heads"
      },
      {
        "id": "consumables-toners__hp4810a-printhead",
        "name": "HP4810A Printhead"
      },
      {
        "id": "consumables-toners__hp4811a-printhead",
        "name": "HP4811A Printhead"
      },
      {
        "id": "consumables-toners__hp4812a-printhead",
        "name": "HP4812A Printhead"
      },
      {
        "id": "consumables-toners__hp4813a-printhead",
        "name": "HP4813A Printhead"
      },
      {
        "id": "consumables-toners__hp-designjet-761",
        "name": "HP DESIGNJET 761"
      },
      {
        "id": "consumables-toners__hf9j51a-hp-765",
        "name": "HF9J51A-HP 765"
      },
      {
        "id": "consumables-toners__hf9j50a-hp-765",
        "name": "HF9J50A-HP 765"
      },
      {
        "id": "consumables-toners__ink-cartridge-gray-hp-765",
        "name": "INK CARTRIDGE GRAY HP 765"
      },
      {
        "id": "consumables-toners__ink-cartridge-cyan-hp-765",
        "name": "INK CARTRIDGE CYAN HP 765"
      },
      {
        "id": "consumables-toners__ink-cart-matte-black-hp-765",
        "name": "INK CART MATTE BLACK HP 765"
      },
      {
        "id": "consumables-toners__ink-cart-dark-grey-hp-765",
        "name": "INK CART DARK GREY HP 765"
      },
      {
        "id": "consumables-toners__hp761-dg",
        "name": "HP761 DG"
      },
      {
        "id": "consumables-toners__hp761-cyan-magenta",
        "name": "HP761 CYAN-MAGENTA"
      },
      {
        "id": "consumables-toners__hp761-dg-matte-black",
        "name": "HP761 DG MATTE BLACK"
      },
      {
        "id": "consumables-toners__hp761-yellow-printhead",
        "name": "HP761 YELLOW PRINTHEAD"
      },
      {
        "id": "consumables-toners__bond-roll-841mm-x-150-m-76mm-core",
        "name": "BOND ROLL 841MM X 150 M, 76MM CORE"
      },
      {
        "id": "consumables-toners__hcof28a-hp-2-pack",
        "name": "HCOF28A-HP 2 PACK"
      }
    ]
  },
  {
    "key": "consumables-media",
    "label": "ZOFF / Office Supplies \u2014 Storage Media",
    "gl": "6122100009",
    "detail": "External hard drives, USB flash and memory sticks",
    "items": [
      {
        "id": "consumables-media__external-hard-disk-drive",
        "name": "External Hard Disk Drive"
      },
      {
        "id": "consumables-media__usb-flash-memory",
        "name": "USB Flash Memory"
      },
      {
        "id": "consumables-media__memory-sticks",
        "name": "Memory Sticks"
      }
    ]
  },
  {
    "key": "spares-parts",
    "label": "Parts Technical Equipment",
    "gl": "2201900002",
    "detail": "Spares, boards, drives, RAM, printer parts, tools and networking kit",
    "items": [
      {
        "id": "spares-parts__desktop-core-i3-motherboard",
        "name": "Desktop Core i3 motherboard"
      },
      {
        "id": "spares-parts__laptop-lcd",
        "name": "Laptop LCD"
      },
      {
        "id": "spares-parts__portable-2tb-external-hdd",
        "name": "Portable 2TB External HDD"
      },
      {
        "id": "spares-parts__ssd-1tb-sata-internal",
        "name": "SSD 1TB SATA INTERNAL"
      },
      {
        "id": "spares-parts__ssd-500g-sata",
        "name": "SSD 500G SATA"
      },
      {
        "id": "spares-parts__external-hdd-flat-docking-station",
        "name": "External HDD Flat Docking Station"
      },
      {
        "id": "spares-parts__dual-bay-hdd-dock-sata",
        "name": "Dual Bay HDD Dock SATA"
      },
      {
        "id": "spares-parts__laptop-hdd-1tb-sata",
        "name": "Laptop HDD 1TB SATA"
      },
      {
        "id": "spares-parts__hdd-to-usb-2-0-adapter-converter-cable",
        "name": "HDD to USB 2.0 Adapter Converter Cable"
      },
      {
        "id": "spares-parts__external-hdd-adapter-kit-for-universal-2-5-3-5-inch-hdd",
        "name": "External HDD Adapter Kit for universal 2.5/3.5 inch HDD"
      },
      {
        "id": "spares-parts__intel-processor-core-i5",
        "name": "Intel Processor core i5"
      },
      {
        "id": "spares-parts__intel-processor-core-i7",
        "name": "Intel Processor core i7"
      },
      {
        "id": "spares-parts__core-i3-motherboards-laptops",
        "name": "Core i3 motherboards laptops"
      },
      {
        "id": "spares-parts__atx-power-supply-units",
        "name": "ATX power supply units"
      },
      {
        "id": "spares-parts__hot-air-station",
        "name": "Hot Air Station"
      },
      {
        "id": "spares-parts__ddr4-4-8-16gb-ram-for-laptop-desktops",
        "name": "DDR4 4, 8, 16GB RAM for laptop & desktops"
      },
      {
        "id": "spares-parts__ddr3-4-8-16gb-ram-for-laptop-desktops",
        "name": "DDR3 4, 8, 16GB RAM for laptop & desktops"
      },
      {
        "id": "spares-parts__cimos-battery",
        "name": "Cimos Battery"
      },
      {
        "id": "spares-parts__laptop-processor-cooling-fans",
        "name": "Laptop processor cooling fans"
      },
      {
        "id": "spares-parts__hp-laptop-batteries",
        "name": "HP laptop batteries"
      },
      {
        "id": "spares-parts__usb-external-modem-wireless",
        "name": "USB external modem wireless"
      },
      {
        "id": "spares-parts__hp-2055-maintenance-kit",
        "name": "HP 2055 Maintenance kit"
      },
      {
        "id": "spares-parts__hp-2035-maintenance-kit",
        "name": "HP 2035 Maintenance kit"
      },
      {
        "id": "spares-parts__hp-pro-402-maintenance-kit",
        "name": "HP Pro 402 Maintenance kit"
      },
      {
        "id": "spares-parts__hp-m607-maintenance-kit",
        "name": "HP M607 Maintenance kit"
      },
      {
        "id": "spares-parts__hp-pro-400-maintenance-kit",
        "name": "HP PRO 400 Maintenance Kit"
      },
      {
        "id": "spares-parts__hp-m806dn-maintenance-kit",
        "name": "HP M806DN Maintenance kit"
      },
      {
        "id": "spares-parts__hp-mfp-725-maintenance-kit",
        "name": "HP MFP 725 Maintenance kit"
      },
      {
        "id": "spares-parts__hp-pro-m426-fdw-maintenance-kit",
        "name": "HP PRO M426 FDW Maintenance Kit"
      },
      {
        "id": "spares-parts__hp-colour-laserjet-pro-mfp-m477-fdw-maintenance-kit",
        "name": "HP Colour Laserjet Pro MFP M477 fdw Maintenance kit"
      },
      {
        "id": "spares-parts__hp-colour-laserjet-pro-mfp-m277-dw-maintenance-kit",
        "name": "HP Colour Laserjet Pro MFP M277 dw Maintenance kit"
      },
      {
        "id": "spares-parts__hp-pro-m402-dn-fuser-rollers",
        "name": "HP Pro M402 dn fuser rollers"
      },
      {
        "id": "spares-parts__hp-2055-pick-up-rollers",
        "name": "HP 2055 pick-up rollers"
      },
      {
        "id": "spares-parts__hp-2035-pick-up-rollers",
        "name": "HP 2035 pick-up rollers"
      },
      {
        "id": "spares-parts__hp-fuser-film-m806dn",
        "name": "HP fuser film M806DN"
      },
      {
        "id": "spares-parts__hp-fuser-elements-m806dn",
        "name": "HP fuser elements M806DN"
      },
      {
        "id": "spares-parts__hp-pick-pack-roller-m806dn",
        "name": "HP pick pack roller M806DN"
      },
      {
        "id": "spares-parts__hp-fuser-unit-m806dn",
        "name": "HP fuser unit M806DN"
      },
      {
        "id": "spares-parts__hp-m725dn-pick-up-paper-roller",
        "name": "HP M725DN pick up paper roller"
      },
      {
        "id": "spares-parts__hp-m725dn-fuser-unit",
        "name": "HP M725DN fuser unit"
      },
      {
        "id": "spares-parts__test-meter-batteries-aaa-aa",
        "name": "Test meter batteries AAA & AA"
      },
      {
        "id": "spares-parts__13-amp-fuses",
        "name": "13 amp fuses"
      },
      {
        "id": "spares-parts__3-pin-square-plugs",
        "name": "3 pin square plugs"
      },
      {
        "id": "spares-parts__4-way-surge-protectors",
        "name": "4 way surge protectors"
      },
      {
        "id": "spares-parts__blower",
        "name": "Blower"
      },
      {
        "id": "spares-parts__mutton-cloth-rolls",
        "name": "Mutton cloth rolls"
      },
      {
        "id": "spares-parts__isopropyl-alcohol-20-x-20-ltrs",
        "name": "Isopropyl alcohol 20 x 20 ltrs"
      },
      {
        "id": "spares-parts__super-glue",
        "name": "Super glue"
      },
      {
        "id": "spares-parts__plastic-steel-300ml",
        "name": "Plastic steel (300ml)"
      },
      {
        "id": "spares-parts__digital-test-meter-fluke",
        "name": "Digital test meter (fluke)"
      },
      {
        "id": "spares-parts__networking-tool-box-with-full-kit",
        "name": "Networking Tool Box (with full kit)"
      },
      {
        "id": "spares-parts__soldering-wire-rollers",
        "name": "Soldering wire Rollers"
      },
      {
        "id": "spares-parts__media-converters",
        "name": "Media converters"
      },
      {
        "id": "spares-parts__hdmi-cables",
        "name": "HDMI Cables"
      },
      {
        "id": "spares-parts__dvi-cables",
        "name": "DVI Cables"
      },
      {
        "id": "spares-parts__vga-cables",
        "name": "VGA Cables"
      },
      {
        "id": "spares-parts__usb-cables",
        "name": "USB Cables"
      },
      {
        "id": "spares-parts__power-cables",
        "name": "Power Cables"
      },
      {
        "id": "spares-parts__slide-movers",
        "name": "Slide movers"
      },
      {
        "id": "spares-parts__projector-lamp",
        "name": "Projector lamp"
      },
      {
        "id": "spares-parts__power-supply-tester",
        "name": "Power Supply Tester"
      },
      {
        "id": "spares-parts__1-x-4-hdmi-splitter",
        "name": "1 X 4 HDMI Splitter"
      },
      {
        "id": "spares-parts__fibre-optic-test-kit",
        "name": "Fibre optic test kit"
      },
      {
        "id": "spares-parts__splicing-machine",
        "name": "Splicing machine"
      },
      {
        "id": "spares-parts__labelling-machine",
        "name": "Labelling Machine"
      },
      {
        "id": "spares-parts__labelling-cartridges",
        "name": "Labelling cartridges"
      }
    ]
  },
  {
    "key": "maintenance-equipment",
    "label": "Technical Equipment Maintenance",
    "gl": "220200002",
    "detail": "Equipment types maintained / workshop repair scope",
    "items": [
      {
        "id": "maintenance-equipment__heavy-duty-medium-and-small-printers",
        "name": "Heavy Duty, Medium and small printers"
      },
      {
        "id": "maintenance-equipment__photocopier-machines",
        "name": "Photocopier Machines"
      },
      {
        "id": "maintenance-equipment__heavy-duty-line-printers",
        "name": "Heavy duty line printers"
      },
      {
        "id": "maintenance-equipment__hot-air-station",
        "name": "Hot Air station"
      },
      {
        "id": "maintenance-equipment__plotter-printer",
        "name": "Plotter Printer"
      },
      {
        "id": "maintenance-equipment__xerox-printing-press-machine",
        "name": "Xerox Printing Press Machine"
      },
      {
        "id": "maintenance-equipment__laptops",
        "name": "Laptops"
      },
      {
        "id": "maintenance-equipment__tablets",
        "name": "Tablets"
      },
      {
        "id": "maintenance-equipment__reballing-machine",
        "name": "Reballing Machine"
      },
      {
        "id": "maintenance-equipment__ipads",
        "name": "Ipads"
      },
      {
        "id": "maintenance-equipment__it-dir-server-fire-alarm-system",
        "name": "IT Dir Server Fire Alarm System"
      },
      {
        "id": "maintenance-equipment__id-card-machine",
        "name": "ID Card Machine"
      }
    ]
  },
  {
    "key": "software-licences",
    "label": "Renewal of Computer Software Licences",
    "gl": "2200600003",
    "detail": "Software licences and renewals",
    "items": [
      {
        "id": "software-licences__devexpress-version-23-2-universal",
        "name": "DevExpress Version 23.2 Universal"
      },
      {
        "id": "software-licences__kaspersky-internet-security-antivirus-4-user",
        "name": "Kaspersky Internet Security Antivirus (4 User)"
      },
      {
        "id": "software-licences__kaspersky-endpoint-security-for-server-anti-virus",
        "name": "Kaspersky Endpoint Security for Server (Anti-virus)"
      },
      {
        "id": "software-licences__windows-10-64bit-perpetual-licence",
        "name": "Windows 10 64Bit Perpetual licence"
      },
      {
        "id": "software-licences__windows-11-64bit-perpetual-licence",
        "name": "Windows 11 64Bit Perpetual licence"
      },
      {
        "id": "software-licences__data-recovery-software",
        "name": "Data Recovery Software"
      },
      {
        "id": "software-licences__vmware-vxsi-and-fusion",
        "name": "VMWare, VXSi and Fusion"
      },
      {
        "id": "software-licences__laplink-pc-mover-ultimate-11",
        "name": "Laplink PC mover Ultimate 11"
      },
      {
        "id": "software-licences__stellar-data-recovery-software",
        "name": "Stellar Data Recovery Software"
      },
      {
        "id": "software-licences__microsoft-server-2012-2016-2019",
        "name": "Microsoft Server 2012, 2016, 2019"
      },
      {
        "id": "software-licences__microsoft-exchange-server-2019",
        "name": "Microsoft Exchange Server 2019"
      },
      {
        "id": "software-licences__forensics-software",
        "name": "Forensics software"
      },
      {
        "id": "software-licences__id-software",
        "name": "ID software"
      },
      {
        "id": "software-licences__network-monitoring-software",
        "name": "Network Monitoring software"
      },
      {
        "id": "software-licences__oracle-database-software",
        "name": "Oracle database software"
      },
      {
        "id": "software-licences__sql-server-enterprise-2019",
        "name": "SQL Server Enterprise 2019"
      },
      {
        "id": "software-licences__visual-studio-teams",
        "name": "Visual Studio Teams"
      },
      {
        "id": "software-licences__idea-blade-software-devforce-express-universal-2012-20-user",
        "name": "Idea Blade Software Devforce Express Universal 2012 (20 User)"
      },
      {
        "id": "software-licences__advanced-installer-professional",
        "name": "Advanced Installer (professional)"
      },
      {
        "id": "software-licences__teamviewer-corporate-30-users",
        "name": "TeamViewer Corporate 30 Users"
      },
      {
        "id": "software-licences__icdl-software-ver-13",
        "name": "ICDL software Ver 13"
      },
      {
        "id": "software-licences__final-cut-pro-for-mac-prd",
        "name": "Final Cut Pro for Mac (PRD)"
      },
      {
        "id": "software-licences__corel-draw-for-mac-prd",
        "name": "Corel Draw for Mac (PRD)"
      },
      {
        "id": "software-licences__adobe-suite-complete-prd",
        "name": "Adobe Suite Complete (PRD)"
      },
      {
        "id": "software-licences__power-director-video-editor-prd",
        "name": "Power Director Video Editor (PRD)"
      },
      {
        "id": "software-licences__video-convertor-total-prd",
        "name": "Video Convertor Total (PRD)"
      },
      {
        "id": "software-licences__microsoft-office-2016-2019",
        "name": "Microsoft Office 2016, 2019"
      },
      {
        "id": "software-licences__video-compressing-software-prd",
        "name": "Video Compressing Software (PRD)"
      },
      {
        "id": "software-licences__mpro-systems-development",
        "name": "MPRO Systems Development"
      },
      {
        "id": "software-licences__hrmis-system-development",
        "name": "HRMIS System Development"
      },
      {
        "id": "software-licences__encryption-software",
        "name": "Encryption Software"
      },
      {
        "id": "software-licences__ames-system-development",
        "name": "AMES System Development"
      },
      {
        "id": "software-licences__mysql-enterprise-edition",
        "name": "MySQL Enterprise Edition"
      },
      {
        "id": "software-licences__apple-mac-voucher-licence",
        "name": "Apple Mac Voucher Licence"
      },
      {
        "id": "software-licences__logistics-system-development",
        "name": "Logistics System Development"
      },
      {
        "id": "software-licences__corel-draw-for-windows-printing-press",
        "name": "Corel Draw for Windows (Printing Press)"
      },
      {
        "id": "software-licences__adobe-photoshop-illustrator-printing-press",
        "name": "Adobe Photoshop & Illustrator (Printing Press)"
      },
      {
        "id": "software-licences__indesign-printing-press",
        "name": "InDesign (Printing Press)"
      },
      {
        "id": "software-licences__arcgis-software",
        "name": "ArcGis Software"
      },
      {
        "id": "software-licences__pix-4d-mapper",
        "name": "PIX 4D Mapper"
      },
      {
        "id": "software-licences__cursor-ai",
        "name": "Cursor AI",
        "useNature": "ai-saas"
      },
      {
        "id": "software-licences__claude-ai",
        "name": "Claude AI",
        "useNature": "ai-saas"
      },
      {
        "id": "software-licences__chatgpt-openai",
        "name": "ChatGPT (OpenAI)",
        "useNature": "ai-saas"
      },
      {
        "id": "software-licences__canva-pro",
        "name": "Canva Pro",
        "useNature": "ai-saas"
      },
      {
        "id": "software-licences__google-copilot",
        "name": "Google Copilot / Gemini",
        "useNature": "ai-saas"
      },
      {
        "id": "software-licences__microsoft-copilot",
        "name": "Microsoft Copilot",
        "useNature": "ai-saas"
      },
      {
        "id": "software-licences__github-copilot",
        "name": "GitHub Copilot",
        "useNature": "web-dev"
      }
    ]
  },
  {
    "key": "ict-equipment",
    "label": "ICT Equipment \u2014 Acquisitions",
    "gl": "3112210001",
    "detail": "ICT equipment procured and issued to users",
    "items": [
      {
        "id": "ict-equipment__hp-omnibook",
        "name": "HP OmniBook"
      },
      {
        "id": "ict-equipment__hp-omnibook-ultra",
        "name": "HP OmniBook Ultra"
      },
      {
        "id": "ict-equipment__hp-omnibook-ultra-flip",
        "name": "HP OmniBook Ultra Flip"
      },
      {
        "id": "ict-equipment__hp-omnibook-x",
        "name": "HP OmniBook X"
      },
      {
        "id": "ict-equipment__hp-omnibook-x-flip-16",
        "name": "HP OmniBook X Flip 16 AI (Intel Core Ultra 9)"
      },
      {
        "id": "ict-equipment__hp-omen-16-am0000ne",
        "name": "HP OMEN 16 Gaming Laptop (16-am0000ne)"
      },
      {
        "id": "ict-equipment__hp-omnibook-7",
        "name": "HP OmniBook 7"
      },
      {
        "id": "ict-equipment__hp-omnibook-5",
        "name": "HP OmniBook 5"
      },
      {
        "id": "ict-equipment__hp-omnibook-3",
        "name": "HP OmniBook 3"
      },
      {
        "id": "ict-equipment__hp-elitebook",
        "name": "HP EliteBook"
      },
      {
        "id": "ict-equipment__hp-elitebook-8-g2i",
        "name": "HP EliteBook 8 G2i"
      },
      {
        "id": "ict-equipment__hp-elitebook-6-g2i",
        "name": "HP EliteBook 6 G2i"
      },
      {
        "id": "ict-equipment__hp-elitebook-860-g11",
        "name": "HP EliteBook 860 G11"
      },
      {
        "id": "ict-equipment__hp-elitebook-840-g11",
        "name": "HP EliteBook 840 G11"
      },
      {
        "id": "ict-equipment__hp-elitebook-830-g11",
        "name": "HP EliteBook 830 G11"
      },
      {
        "id": "ict-equipment__hp-elitebook-x360",
        "name": "HP EliteBook x360"
      },
      {
        "id": "ict-equipment__hp-probook",
        "name": "HP ProBook"
      },
      {
        "id": "ict-equipment__hp-probook-4-g2i",
        "name": "HP ProBook 4 G2i"
      },
      {
        "id": "ict-equipment__hp-probook-450-g10",
        "name": "HP ProBook 450 G10"
      },
      {
        "id": "ict-equipment__hp-probook-440-g11",
        "name": "HP ProBook 440 G11"
      },
      {
        "id": "ict-equipment__hp-zbook-firefly",
        "name": "HP ZBook Firefly"
      },
      {
        "id": "ict-equipment__hp-zbook-power",
        "name": "HP ZBook Power"
      },
      {
        "id": "ict-equipment__hp-zbook-fury",
        "name": "HP ZBook Fury"
      },
      {
        "id": "ict-equipment__dell-latitude-5550",
        "name": "Dell Latitude 5550"
      },
      {
        "id": "ict-equipment__dell-latitude-5540",
        "name": "Dell Latitude 5540"
      },
      {
        "id": "ict-equipment__dell-latitude-5450",
        "name": "Dell Latitude 5450"
      },
      {
        "id": "ict-equipment__dell-latitude-5440",
        "name": "Dell Latitude 5440"
      },
      {
        "id": "ict-equipment__dell-latitude-7450",
        "name": "Dell Latitude 7450"
      },
      {
        "id": "ict-equipment__dell-latitude-7440",
        "name": "Dell Latitude 7440"
      },
      {
        "id": "ict-equipment__dell-latitude-7350",
        "name": "Dell Latitude 7350"
      },
      {
        "id": "ict-equipment__dell-latitude-5350",
        "name": "Dell Latitude 5350"
      },
      {
        "id": "ict-equipment__dell-latitude-3340",
        "name": "Dell Latitude 3340"
      },
      {
        "id": "ict-equipment__dell-precision-5690",
        "name": "Dell Precision 5690"
      },
      {
        "id": "ict-equipment__dell-precision-3591",
        "name": "Dell Precision 3591"
      },
      {
        "id": "ict-equipment__dell-xps-14",
        "name": "Dell XPS 14"
      },
      {
        "id": "ict-equipment__dell-xps-16",
        "name": "Dell XPS 16"
      },
      {
        "id": "ict-equipment__dell-vostro-3530",
        "name": "Dell Vostro 3530"
      },
      {
        "id": "ict-equipment__dell-vostro-3520",
        "name": "Dell Vostro 3520"
      },
      {
        "id": "ict-equipment__lenovo-thinkpad-t14-gen-5",
        "name": "Lenovo ThinkPad T14 Gen 5"
      },
      {
        "id": "ict-equipment__lenovo-thinkpad-t16-gen-3",
        "name": "Lenovo ThinkPad T16 Gen 3"
      },
      {
        "id": "ict-equipment__lenovo-thinkpad-x1-carbon-gen-12",
        "name": "Lenovo ThinkPad X1 Carbon Gen 12"
      },
      {
        "id": "ict-equipment__lenovo-thinkpad-l14-gen-5",
        "name": "Lenovo ThinkPad L14 Gen 5"
      },
      {
        "id": "ict-equipment__lenovo-thinkpad-e14-gen-6",
        "name": "Lenovo ThinkPad E14 Gen 6"
      },
      {
        "id": "ict-equipment__lenovo-thinkpad-p16-gen-2",
        "name": "Lenovo ThinkPad P16 Gen 2"
      },
      {
        "id": "ict-equipment__lenovo-thinkpad-p14s-gen-5",
        "name": "Lenovo ThinkPad P14s Gen 5"
      },
      {
        "id": "ict-equipment__lenovo-legion-pro-7i",
        "name": "Lenovo Legion Pro 7i"
      },
      {
        "id": "ict-equipment__lenovo-yoga-slim-7",
        "name": "Lenovo Yoga Slim 7"
      },
      {
        "id": "ict-equipment__apple-macbook-pro-14",
        "name": "Apple MacBook Pro 14"
      },
      {
        "id": "ict-equipment__apple-macbook-pro-16",
        "name": "Apple MacBook Pro 16"
      },
      {
        "id": "ict-equipment__apple-macbook-air-13",
        "name": "Apple MacBook Air 13"
      },
      {
        "id": "ict-equipment__apple-macbook-air-15",
        "name": "Apple MacBook Air 15"
      },
      {
        "id": "ict-equipment__microsoft-surface-laptop-7",
        "name": "Microsoft Surface Laptop 7"
      },
      {
        "id": "ict-equipment__microsoft-surface-pro-11",
        "name": "Microsoft Surface Pro 11"
      },
      {
        "id": "ict-equipment__asus-expertbook-b9",
        "name": "ASUS ExpertBook B9"
      },
      {
        "id": "ict-equipment__asus-vivobook-pro-16",
        "name": "ASUS Vivobook Pro 16"
      },
      {
        "id": "ict-equipment__acer-travelmate-p6",
        "name": "Acer TravelMate P6"
      },
      {
        "id": "ict-equipment__hp-elitedesk-800-g9",
        "name": "HP EliteDesk 800 G9"
      },
      {
        "id": "ict-equipment__hp-elitedesk-805-g9",
        "name": "HP EliteDesk 805 G9"
      },
      {
        "id": "ict-equipment__hp-prodesk-400-g9",
        "name": "HP ProDesk 400 G9"
      },
      {
        "id": "ict-equipment__hp-prodesk-405-g8",
        "name": "HP ProDesk 405 G8"
      },
      {
        "id": "ict-equipment__hp-elite-mini-800-g9",
        "name": "HP Elite Mini 800 G9"
      },
      {
        "id": "ict-equipment__hp-z2-tower-g9",
        "name": "HP Z2 Tower G9"
      },
      {
        "id": "ict-equipment__hp-z2-mini-g9",
        "name": "HP Z2 Mini G9"
      },
      {
        "id": "ict-equipment__hp-omnistudio-x",
        "name": "HP OmniStudio X"
      },
      {
        "id": "ict-equipment__hp-all-in-one-27",
        "name": "HP All-in-One 27"
      },
      {
        "id": "ict-equipment__dell-optiplex-7020",
        "name": "Dell OptiPlex 7020"
      },
      {
        "id": "ict-equipment__dell-optiplex-7020-micro",
        "name": "Dell OptiPlex 7020 Micro"
      },
      {
        "id": "ict-equipment__dell-optiplex-7020-sff",
        "name": "Dell OptiPlex 7020 SFF"
      },
      {
        "id": "ict-equipment__dell-optiplex-5420",
        "name": "Dell OptiPlex 5420"
      },
      {
        "id": "ict-equipment__dell-precision-3680-tower",
        "name": "Dell Precision 3680 Tower"
      },
      {
        "id": "ict-equipment__dell-precision-3280-compact",
        "name": "Dell Precision 3280 Compact"
      },
      {
        "id": "ict-equipment__dell-inspiron-27-all-in-one",
        "name": "Dell Inspiron 27 All-in-One"
      },
      {
        "id": "ict-equipment__lenovo-thinkcentre-m90q-gen-4",
        "name": "Lenovo ThinkCentre M90q Gen 4"
      },
      {
        "id": "ict-equipment__lenovo-thinkcentre-m70q-gen-4",
        "name": "Lenovo ThinkCentre M70q Gen 4"
      },
      {
        "id": "ict-equipment__lenovo-thinkcentre-m90a-gen-5-aio",
        "name": "Lenovo ThinkCentre M90a Gen 5 AIO"
      },
      {
        "id": "ict-equipment__lenovo-thinkstation-p3-tower",
        "name": "Lenovo ThinkStation P3 Tower"
      },
      {
        "id": "ict-equipment__apple-imac-24",
        "name": "Apple iMac 24"
      },
      {
        "id": "ict-equipment__apple-mac-mini-m4",
        "name": "Apple Mac mini M4"
      },
      {
        "id": "ict-equipment__apple-mac-studio",
        "name": "Apple Mac Studio"
      },
      {
        "id": "ict-equipment__hp-laserjet-pro-4002dn",
        "name": "HP LaserJet Pro 4002dn"
      },
      {
        "id": "ict-equipment__hp-laserjet-pro-mfp-4102fdw",
        "name": "HP LaserJet Pro MFP 4102fdw"
      },
      {
        "id": "ict-equipment__hp-laserjet-enterprise-m507dn",
        "name": "HP LaserJet Enterprise M507dn"
      },
      {
        "id": "ict-equipment__hp-laserjet-enterprise-mfp-m528dn",
        "name": "HP LaserJet Enterprise MFP M528dn"
      },
      {
        "id": "ict-equipment__hp-color-laserjet-pro-mfp-4302fdw",
        "name": "HP Color LaserJet Pro MFP 4302fdw"
      },
      {
        "id": "ict-equipment__hp-color-laserjet-enterprise-m554dn",
        "name": "HP Color LaserJet Enterprise M554dn"
      },
      {
        "id": "ict-equipment__hp-color-laserjet-enterprise-mfp-m578dn",
        "name": "HP Color LaserJet Enterprise MFP M578dn"
      },
      {
        "id": "ict-equipment__hp-laserjet-enterprise-flow-mfp-m634z",
        "name": "HP LaserJet Enterprise Flow MFP M634z"
      },
      {
        "id": "ict-equipment__hp-pagewide-enterprise-color-mfp-586dn",
        "name": "HP PageWide Enterprise Color MFP 586dn"
      },
      {
        "id": "ict-equipment__hp-designjet-t650",
        "name": "HP DesignJet T650"
      },
      {
        "id": "ict-equipment__hp-designjet-t830",
        "name": "HP DesignJet T830"
      },
      {
        "id": "ict-equipment__canon-imagerunner-c3025i",
        "name": "Canon imageRUNNER C3025i"
      },
      {
        "id": "ict-equipment__canon-imagerunner-advance-dx-c3926i",
        "name": "Canon imageRUNNER ADVANCE DX C3926i"
      },
      {
        "id": "ict-equipment__canon-imagerunner-advance-dx-c5840i",
        "name": "Canon imageRUNNER ADVANCE DX C5840i"
      },
      {
        "id": "ict-equipment__canon-imagerunner-advance-dx-6980i",
        "name": "Canon imageRUNNER ADVANCE DX 6980i"
      },
      {
        "id": "ict-equipment__canon-imageclass-mf455dw",
        "name": "Canon imageCLASS MF455dw"
      },
      {
        "id": "ict-equipment__canon-pixma-g3470",
        "name": "Canon PIXMA G3470"
      },
      {
        "id": "ict-equipment__epson-ecotank-l3250",
        "name": "Epson EcoTank L3250"
      },
      {
        "id": "ict-equipment__epson-ecotank-l15150",
        "name": "Epson EcoTank L15150"
      },
      {
        "id": "ict-equipment__epson-workforce-pro-wf-c5890",
        "name": "Epson WorkForce Pro WF-C5890"
      },
      {
        "id": "ict-equipment__brother-mfc-l8390cdw",
        "name": "Brother MFC-L8390CDW"
      },
      {
        "id": "ict-equipment__brother-hl-l6415dw",
        "name": "Brother HL-L6415DW"
      },
      {
        "id": "ict-equipment__kyocera-taskalfa-2554ci",
        "name": "Kyocera TASKalfa 2554ci"
      },
      {
        "id": "ict-equipment__kyocera-ecosys-m5526cdw",
        "name": "Kyocera ECOSYS M5526cdw"
      },
      {
        "id": "ict-equipment__xerox-versalink-c405",
        "name": "Xerox VersaLink C405"
      },
      {
        "id": "ict-equipment__xerox-altalink-c8155",
        "name": "Xerox AltaLink C8155"
      },
      {
        "id": "ict-equipment__hpe-proliant-dl380-gen11",
        "name": "HPE ProLiant DL380 Gen11"
      },
      {
        "id": "ict-equipment__hpe-proliant-dl360-gen11",
        "name": "HPE ProLiant DL360 Gen11"
      },
      {
        "id": "ict-equipment__hpe-proliant-ml350-gen11",
        "name": "HPE ProLiant ML350 Gen11"
      },
      {
        "id": "ict-equipment__hpe-proliant-microserver-gen11",
        "name": "HPE ProLiant MicroServer Gen11"
      },
      {
        "id": "ict-equipment__dell-poweredge-r760",
        "name": "Dell PowerEdge R760"
      },
      {
        "id": "ict-equipment__dell-poweredge-r750",
        "name": "Dell PowerEdge R750"
      },
      {
        "id": "ict-equipment__dell-poweredge-r660",
        "name": "Dell PowerEdge R660"
      },
      {
        "id": "ict-equipment__dell-poweredge-t560",
        "name": "Dell PowerEdge T560"
      },
      {
        "id": "ict-equipment__dell-poweredge-xr4000",
        "name": "Dell PowerEdge XR4000"
      },
      {
        "id": "ict-equipment__lenovo-thinksystem-sr650-v3",
        "name": "Lenovo ThinkSystem SR650 V3"
      },
      {
        "id": "ict-equipment__lenovo-thinksystem-sr630-v3",
        "name": "Lenovo ThinkSystem SR630 V3"
      },
      {
        "id": "ict-equipment__lenovo-thinksystem-st650-v3",
        "name": "Lenovo ThinkSystem ST650 V3"
      },
      {
        "id": "ict-equipment__cisco-ucs-c240-m7",
        "name": "Cisco UCS C240 M7"
      },
      {
        "id": "ict-equipment__cisco-ucs-c220-m7",
        "name": "Cisco UCS C220 M7"
      },
      {
        "id": "ict-equipment__supermicro-superserver-1029u",
        "name": "Supermicro SuperServer 1029U"
      },
      {
        "id": "ict-equipment__cisco-isr-4331",
        "name": "Cisco ISR 4331"
      },
      {
        "id": "ict-equipment__cisco-isr-4431",
        "name": "Cisco ISR 4431"
      },
      {
        "id": "ict-equipment__cisco-catalyst-8200",
        "name": "Cisco Catalyst 8200"
      },
      {
        "id": "ict-equipment__cisco-catalyst-8300",
        "name": "Cisco Catalyst 8300"
      },
      {
        "id": "ict-equipment__cisco-asr-1001-x",
        "name": "Cisco ASR 1001-X"
      },
      {
        "id": "ict-equipment__cisco-meraki-mx67",
        "name": "Cisco Meraki MX67"
      },
      {
        "id": "ict-equipment__cisco-meraki-mx75",
        "name": "Cisco Meraki MX75"
      },
      {
        "id": "ict-equipment__cisco-meraki-mx85",
        "name": "Cisco Meraki MX85"
      },
      {
        "id": "ict-equipment__mikrotik-ccr2004",
        "name": "MikroTik CCR2004"
      },
      {
        "id": "ict-equipment__mikrotik-hex-s",
        "name": "MikroTik hEX S"
      },
      {
        "id": "ict-equipment__ubiquiti-edgerouter-4",
        "name": "Ubiquiti EdgeRouter 4"
      },
      {
        "id": "ict-equipment__ubiquiti-unifi-dream-machine-pro",
        "name": "Ubiquiti UniFi Dream Machine Pro"
      },
      {
        "id": "ict-equipment__fortinet-fortigate-60f",
        "name": "Fortinet FortiGate 60F"
      },
      {
        "id": "ict-equipment__fortinet-fortigate-100f",
        "name": "Fortinet FortiGate 100F"
      },
      {
        "id": "ict-equipment__fortinet-fortigate-200f",
        "name": "Fortinet FortiGate 200F"
      },
      {
        "id": "ict-equipment__tp-link-omada-er7206",
        "name": "TP-Link Omada ER7206"
      },
      {
        "id": "ict-equipment__cisco-catalyst-9105axi",
        "name": "Cisco Catalyst 9105AXI"
      },
      {
        "id": "ict-equipment__cisco-catalyst-9115axi",
        "name": "Cisco Catalyst 9115AXI"
      },
      {
        "id": "ict-equipment__cisco-catalyst-9120axi",
        "name": "Cisco Catalyst 9120AXI"
      },
      {
        "id": "ict-equipment__cisco-catalyst-9130axi",
        "name": "Cisco Catalyst 9130AXI"
      },
      {
        "id": "ict-equipment__cisco-meraki-mr36",
        "name": "Cisco Meraki MR36"
      },
      {
        "id": "ict-equipment__cisco-meraki-mr46",
        "name": "Cisco Meraki MR46"
      },
      {
        "id": "ict-equipment__cisco-meraki-mr56",
        "name": "Cisco Meraki MR56"
      },
      {
        "id": "ict-equipment__cisco-meraki-mr76-outdoor",
        "name": "Cisco Meraki MR76 Outdoor"
      },
      {
        "id": "ict-equipment__ubiquiti-unifi-u6-lite",
        "name": "Ubiquiti UniFi U6 Lite"
      },
      {
        "id": "ict-equipment__ubiquiti-unifi-u6-pro",
        "name": "Ubiquiti UniFi U6 Pro"
      },
      {
        "id": "ict-equipment__ubiquiti-unifi-u6-enterprise",
        "name": "Ubiquiti UniFi U6 Enterprise"
      },
      {
        "id": "ict-equipment__ubiquiti-unifi-u7-pro",
        "name": "Ubiquiti UniFi U7 Pro"
      },
      {
        "id": "ict-equipment__aruba-instant-on-ap22",
        "name": "Aruba Instant On AP22"
      },
      {
        "id": "ict-equipment__aruba-ap-535",
        "name": "Aruba AP-535"
      },
      {
        "id": "ict-equipment__aruba-ap-635",
        "name": "Aruba AP-635"
      },
      {
        "id": "ict-equipment__tp-link-omada-eap670",
        "name": "TP-Link Omada EAP670"
      },
      {
        "id": "ict-equipment__tp-link-omada-eap650",
        "name": "TP-Link Omada EAP650"
      },
      {
        "id": "ict-equipment__ruckus-r550",
        "name": "Ruckus R550"
      },
      {
        "id": "ict-equipment__ruckus-r650",
        "name": "Ruckus R650"
      },
      {
        "id": "ict-equipment__cisco-catalyst-9200l-24-port",
        "name": "Cisco Catalyst 9200L 24-Port"
      },
      {
        "id": "ict-equipment__cisco-catalyst-9200l-48-port",
        "name": "Cisco Catalyst 9200L 48-Port"
      },
      {
        "id": "ict-equipment__cisco-catalyst-9300-24-port",
        "name": "Cisco Catalyst 9300 24-Port"
      },
      {
        "id": "ict-equipment__cisco-catalyst-9300-48-port",
        "name": "Cisco Catalyst 9300 48-Port"
      },
      {
        "id": "ict-equipment__cisco-catalyst-1000-24-port",
        "name": "Cisco Catalyst 1000 24-Port"
      },
      {
        "id": "ict-equipment__cisco-catalyst-1000-48-port",
        "name": "Cisco Catalyst 1000 48-Port"
      },
      {
        "id": "ict-equipment__cisco-catalyst-2960x-24-port",
        "name": "Cisco Catalyst 2960X 24-Port"
      },
      {
        "id": "ict-equipment__cisco-catalyst-3850-24-port",
        "name": "Cisco Catalyst 3850 24-Port"
      },
      {
        "id": "ict-equipment__cisco-catalyst-3850-48-port-poe",
        "name": "Cisco Catalyst 3850 48-Port PoE"
      },
      {
        "id": "ict-equipment__cisco-cbs350-24-port-poe",
        "name": "Cisco CBS350 24-Port PoE"
      },
      {
        "id": "ict-equipment__cisco-cbs350-48-port-poe",
        "name": "Cisco CBS350 48-Port PoE"
      },
      {
        "id": "ict-equipment__cisco-meraki-ms120-24p",
        "name": "Cisco Meraki MS120-24P"
      },
      {
        "id": "ict-equipment__cisco-meraki-ms210-48fp",
        "name": "Cisco Meraki MS210-48FP"
      },
      {
        "id": "ict-equipment__cisco-meraki-ms225-24p",
        "name": "Cisco Meraki MS225-24P"
      },
      {
        "id": "ict-equipment__ubiquiti-unifi-switch-lite-16-poe",
        "name": "Ubiquiti UniFi Switch Lite 16 PoE"
      },
      {
        "id": "ict-equipment__ubiquiti-unifi-switch-pro-24-poe",
        "name": "Ubiquiti UniFi Switch Pro 24 PoE"
      },
      {
        "id": "ict-equipment__ubiquiti-unifi-switch-pro-48-poe",
        "name": "Ubiquiti UniFi Switch Pro 48 PoE"
      },
      {
        "id": "ict-equipment__aruba-instant-on-1930-24g-poe",
        "name": "Aruba Instant On 1930 24G PoE"
      },
      {
        "id": "ict-equipment__aruba-instant-on-1930-48g-poe",
        "name": "Aruba Instant On 1930 48G PoE"
      },
      {
        "id": "ict-equipment__aruba-2930f-24g-poe",
        "name": "Aruba 2930F 24G PoE"
      },
      {
        "id": "ict-equipment__tp-link-omada-sg3428xpp",
        "name": "TP-Link Omada SG3428XPP"
      },
      {
        "id": "ict-equipment__tp-link-jetstream-tl-sg2428p",
        "name": "TP-Link JetStream TL-SG2428P"
      },
      {
        "id": "ict-equipment__netgear-gs724tpv2",
        "name": "Netgear GS724TPv2"
      },
      {
        "id": "ict-equipment__netgear-gs752tpv2",
        "name": "Netgear GS752TPv2"
      },
      {
        "id": "ict-equipment__mikrotik-crs328-24p-4s",
        "name": "MikroTik CRS328-24P-4S+"
      },
      {
        "id": "ict-equipment__hp-desktop-computers-core-i5",
        "name": "HP Desktop Computers Core i5"
      },
      {
        "id": "ict-equipment__hp-dell-laptops-core-i7",
        "name": "HP/Dell Laptops Core i7"
      },
      {
        "id": "ict-equipment__all-in-one-computer-touch-screen-i5",
        "name": "All in One Computer touch screen i5"
      },
      {
        "id": "ict-equipment__rack-mountable-ups",
        "name": "Rack Mountable UPS"
      },
      {
        "id": "ict-equipment__ipad-tablet-pc",
        "name": "IPad/Tablet PC"
      },
      {
        "id": "ict-equipment__audio-midi-interface-for-streaming",
        "name": "Audio+Midi Interface for Streaming"
      },
      {
        "id": "ict-equipment__interactive-whiteboard-98-inch",
        "name": "Interactive whiteboard 98 inch"
      },
      {
        "id": "ict-equipment__infrared-touch-screen-55-inch",
        "name": "Infrared Touch Screen 55 inch"
      },
      {
        "id": "ict-equipment__200-inch-large-monitor-touch-smart-board",
        "name": "200 inch large Monitor Touch Smart Board"
      },
      {
        "id": "ict-equipment__video-conferencing-tele-presence-equipment",
        "name": "Video Conferencing Tele Presence Equipment"
      },
      {
        "id": "ict-equipment__medium-printers",
        "name": "Medium printers"
      },
      {
        "id": "ict-equipment__heavy-duty-printers",
        "name": "Heavy duty printers"
      },
      {
        "id": "ict-equipment__multi-media-pointers",
        "name": "Multi-media Pointers"
      },
      {
        "id": "ict-equipment__multi-media-projectors",
        "name": "Multi-media projectors"
      },
      {
        "id": "ict-equipment__5-6-way-surge-protectors",
        "name": "5/6 Way Surge Protectors"
      },
      {
        "id": "ict-equipment__small-office-4-in-1-printers",
        "name": "Small office 4 in 1 printers"
      },
      {
        "id": "ict-equipment__photocopier-heavy-duty",
        "name": "Photocopier (Heavy Duty)"
      },
      {
        "id": "ict-equipment__standalone-ups",
        "name": "Standalone UPS"
      },
      {
        "id": "ict-equipment__hp-server-generation-11",
        "name": "HP Server Generation 11"
      },
      {
        "id": "ict-equipment__dell-poweredge-r750-high-performance-servers",
        "name": "Dell PowerEdge R750 High-performance Servers"
      },
      {
        "id": "ict-equipment__lenovo-thinkstation-p620",
        "name": "Lenovo Thinkstation P620"
      },
      {
        "id": "ict-equipment__lenovo-thinkpad-p16-gen-2-intel-16-inch",
        "name": "Lenovo ThinkPad P16 Gen 2 intel 16 inch"
      },
      {
        "id": "ict-equipment__laptops-lenovo-legion-pro-7i-or-9i-16-inch-alienware-x14-r2",
        "name": "Laptops Lenovo Legion Pro 7i or 9i 16 inch / Alienware x14 R2"
      },
      {
        "id": "ict-equipment__usb-mouse",
        "name": "USB mouse"
      },
      {
        "id": "ict-equipment__usb-keyboards-for-laptop-desktop",
        "name": "USB keyboards (for laptop & desktop)"
      },
      {
        "id": "ict-equipment__cisco-asa-firewall-rack-mountable",
        "name": "CISCO ASA Firewall rack mountable"
      },
      {
        "id": "ict-equipment__cisco-router",
        "name": "Cisco Router"
      },
      {
        "id": "ict-equipment__12u-cabinets",
        "name": "12U Cabinets"
      },
      {
        "id": "ict-equipment__9u-6u-cabinets",
        "name": "9U/6U Cabinets"
      },
      {
        "id": "ict-equipment__cisco-24-port-switch",
        "name": "Cisco 24 Port Switch"
      },
      {
        "id": "ict-equipment__cisco-catalyst-3850",
        "name": "Cisco Catalyst 3850"
      },
      {
        "id": "ict-equipment__netgear-readynas-rn566-network-attached-storage-nas",
        "name": "Netgear ReadyNAS RN566 Network Attached Storage (NAS)"
      },
      {
        "id": "ict-equipment__outdoor-cisco-ap-access-point",
        "name": "Outdoor Cisco AP (Access Point)"
      },
      {
        "id": "ict-equipment__indoor-cisco-ap-access-point-ceiling-plant",
        "name": "Indoor Cisco AP (Access Point) Ceiling Plant"
      },
      {
        "id": "ict-equipment__cisco-16-ports-poe-switch",
        "name": "Cisco 16 Ports POE Switch"
      },
      {
        "id": "ict-equipment__cisco-8-ports-poe-switch",
        "name": "Cisco 8 Ports POE Switch"
      },
      {
        "id": "ict-equipment__cisco-switch-48-ports-gigabit-poe",
        "name": "Cisco Switch 48 Ports Gigabit POE"
      },
      {
        "id": "ict-equipment__gigabit-poe-splitter",
        "name": "Gigabit POE Splitter"
      },
      {
        "id": "ict-equipment__patch-panels",
        "name": "Patch Panels"
      },
      {
        "id": "ict-equipment__rj45-connectors-male",
        "name": "RJ45 connectors (male)"
      },
      {
        "id": "ict-equipment__rj45-connectors-female-crown-modules",
        "name": "RJ45 connectors (female) Crown modules"
      },
      {
        "id": "ict-equipment__rj45-boots",
        "name": "RJ45 boots"
      },
      {
        "id": "ict-equipment__face-plates",
        "name": "Face Plates"
      },
      {
        "id": "ict-equipment__wall-box",
        "name": "Wall box"
      },
      {
        "id": "ict-equipment__cat-5-outdoor-cable-500m-drum",
        "name": "Cat 5 outdoor cable 500m drum"
      },
      {
        "id": "ict-equipment__cat6-indoor-cable-500m-drum",
        "name": "Cat6 indoor cable 500m drum"
      },
      {
        "id": "ict-equipment__pvc-trunking-large",
        "name": "PVC Trunking large"
      },
      {
        "id": "ict-equipment__pvc-trunking-medium",
        "name": "PVC Trunking medium"
      },
      {
        "id": "ict-equipment__metal-trunking",
        "name": "Metal Trunking"
      },
      {
        "id": "ict-equipment__metal-trunking-flout",
        "name": "Metal Trunking Flout"
      },
      {
        "id": "ict-equipment__media-converter",
        "name": "Media Converter"
      },
      {
        "id": "ict-equipment__biometric-access-equipment",
        "name": "Biometric Access Equipment"
      },
      {
        "id": "ict-equipment__router",
        "name": "Router"
      },
      {
        "id": "ict-equipment__crone-modules",
        "name": "Crone Modules"
      },
      {
        "id": "ict-equipment__screws-and-fisher-plugs",
        "name": "Screws and fisher plugs"
      },
      {
        "id": "ict-equipment__fisher-plugs",
        "name": "Fisher plugs"
      },
      {
        "id": "ict-equipment__bosch-drilling-machine",
        "name": "Bosch Drilling Machine"
      },
      {
        "id": "ict-equipment__concrete-drill-bits-5mm-to-12mm",
        "name": "Concrete Drill Bits 5mm to 12mm"
      },
      {
        "id": "ict-equipment__steel-drill-bits-5mm-to-12mm",
        "name": "Steel Drill Bits 5mm to 12mm"
      },
      {
        "id": "ict-equipment__wood-drill-bits-5mm-to-12mm",
        "name": "Wood Drill Bits 5mm to 12mm"
      },
      {
        "id": "ict-equipment__cable-ties",
        "name": "Cable Ties"
      },
      {
        "id": "ict-equipment__wire-strippers",
        "name": "Wire Strippers"
      },
      {
        "id": "ict-equipment__cable-cutters",
        "name": "Cable Cutters"
      },
      {
        "id": "ict-equipment__pump-pliers",
        "name": "Pump Pliers"
      },
      {
        "id": "ict-equipment__side-cutting-pliers",
        "name": "Side Cutting Pliers"
      },
      {
        "id": "ict-equipment__long-nose-pliers",
        "name": "Long Nose Pliers"
      },
      {
        "id": "ict-equipment__skinning-knife",
        "name": "Skinning Knife"
      },
      {
        "id": "ict-equipment__crimping-tool",
        "name": "Crimping Tool"
      },
      {
        "id": "ict-equipment__punch-down-tools",
        "name": "Punch Down Tools"
      },
      {
        "id": "ict-equipment__network-cable-testers",
        "name": "Network Cable Testers"
      },
      {
        "id": "ict-equipment__cable-labelling-machine",
        "name": "Cable Labelling Machine"
      },
      {
        "id": "ict-equipment__fibre-optic-splicing-set",
        "name": "Fibre Optic Splicing set"
      },
      {
        "id": "ict-equipment__insertion-extraction-tools",
        "name": "Insertion/Extraction Tools"
      },
      {
        "id": "ict-equipment__cable-certifier",
        "name": "Cable Certifier"
      },
      {
        "id": "ict-equipment__fibre-optic-cable",
        "name": "Fibre Optic Cable"
      },
      {
        "id": "ict-equipment__network-cable-shears",
        "name": "Network Cable Shears"
      },
      {
        "id": "ict-equipment__fibre-optic-connectors",
        "name": "Fibre Optic Connectors"
      },
      {
        "id": "ict-equipment__riveting-gun",
        "name": "Riveting Gun"
      },
      {
        "id": "ict-equipment__rivets",
        "name": "Rivets"
      },
      {
        "id": "ict-equipment__straight-extending-ladder-outdoor",
        "name": "Straight/Extending Ladder Outdoor"
      },
      {
        "id": "ict-equipment__telescoping-ladder",
        "name": "Telescoping Ladder"
      },
      {
        "id": "ict-equipment__trestle-ladder",
        "name": "Trestle Ladder"
      },
      {
        "id": "ict-equipment__foldable-step-ladder-indoor",
        "name": "Foldable Step Ladder Indoor"
      },
      {
        "id": "ict-equipment__xerox-4100-colour-printing-press",
        "name": "Xerox 4100 Colour Printing Press"
      },
      {
        "id": "ict-equipment__ctp-printer-copy-to-plate",
        "name": "CTP Printer Copy to Plate"
      },
      {
        "id": "ict-equipment__hp-designjet-plotter-printer",
        "name": "HP Designjet Plotter Printer"
      },
      {
        "id": "ict-equipment__laser-engraver-and-cutter-machine",
        "name": "Laser Engraver and Cutter Machine"
      },
      {
        "id": "ict-equipment__toshiba-hy-duty-duplicator",
        "name": "Toshiba Hy Duty Duplicator"
      },
      {
        "id": "ict-equipment__combined-electric-binding-machine",
        "name": "Combined Electric Binding Machine"
      },
      {
        "id": "ict-equipment__electric-guillotine",
        "name": "Electric Guillotine"
      },
      {
        "id": "ict-equipment__laminating-machine",
        "name": "Laminating Machine"
      },
      {
        "id": "ict-equipment__binding-machine",
        "name": "Binding Machine"
      },
      {
        "id": "ict-equipment__printers",
        "name": "Printers"
      },
      {
        "id": "ict-equipment__computers",
        "name": "Computers"
      },
      {
        "id": "ict-equipment__power-point-multimedia",
        "name": "Power Point Multimedia"
      },
      {
        "id": "ict-equipment__rugged-laptops",
        "name": "Rugged Laptops"
      },
      {
        "id": "ict-equipment__macbook-pro-core-i7-laptops",
        "name": "Macbook Pro (core i7) laptops"
      },
      {
        "id": "ict-equipment__smart-phone-tablets",
        "name": "Smart Phone tablets"
      },
      {
        "id": "ict-equipment__plotter-printer",
        "name": "Plotter Printer"
      },
      {
        "id": "ict-equipment__laminating-machine-2",
        "name": "LAMINATING MACHINE"
      },
      {
        "id": "ict-equipment__guillotine-heavy-duty",
        "name": "GUILLOTINE (HEAVY DUTY)"
      },
      {
        "id": "ict-equipment__laserjet-mfpm577-printer",
        "name": "LASERJET MFPM577 PRINTER"
      },
      {
        "id": "ict-equipment__dgps-gnss-set",
        "name": "DGPS/GNSS Set"
      },
      {
        "id": "ict-equipment__t7100-print-heads",
        "name": "T7100 print heads"
      }
    ]
  }
];

function getStoresCatalogSections() {
    const base = STORES_CATALOG_SECTIONS || [];
    if (typeof mergeIctSparesAccessoriesCatalog === 'function') {
        return mergeIctSparesAccessoriesCatalog(base);
    }
    return base;
}

/** Nature-of-use groups for Softwares / software licence catalog items */
const SOFTWARE_USE_NATURES = [
    { key: 'web-dev', label: 'Web Development Software' },
    { key: 'database', label: 'Database Development / Design Software' },
    { key: 'ai-saas', label: 'AI & Online Productivity Subscriptions' },
    { key: 'os-server', label: 'Operating Systems & Server Platforms' },
    { key: 'security', label: 'Security, Antivirus & Encryption' },
    { key: 'office', label: 'Office & Productivity Suites' },
    { key: 'creative', label: 'Creative Design & Media Production' },
    { key: 'virtualization', label: 'Virtualization & Remote Access' },
    { key: 'network', label: 'Network Monitoring & Infrastructure' },
    { key: 'recovery', label: 'Data Recovery & Forensics' },
    { key: 'gis', label: 'GIS & Mapping Software' },
    { key: 'enterprise-dev', label: 'Enterprise / Business Systems Development' },
    { key: 'education', label: 'Training & Education Software' },
    { key: 'other', label: 'Other Software' }
];

function getSoftwareUseNatureLabel(key) {
    return SOFTWARE_USE_NATURES.find((n) => n.key === key)?.label || 'Other Software';
}

function isSoftwareCatalogCategory(categoryKey) {
    const key = String(categoryKey || '').trim();
    if (!key) return false;
    if (key === 'software-licences' || key === 'inv-softwares' || key === 'softwares') return true;
    if (key.startsWith('inv-softwares') || key.includes('software')) return true;
    const led = typeof getInventoryLedgerByKey === 'function' ? getInventoryLedgerByKey(key) : null;
    if (led && (led.parentKey === 'softwares' || led.key === 'inv-softwares' || led.cssKey === 'softwares')) return true;
    const section = getStoresCatalogSections().find((s) => s.key === key);
    return !!(section && (section.key === 'software-licences' || /software/i.test(section.label || '')));
}

/**
 * Classify a software catalog item by nature of use.
 * Explicit item.useNature wins; otherwise name heuristics.
 */
function classifySoftwareUseNature(nameOrItem, explicitNature) {
    const explicit = String(explicitNature || (nameOrItem && nameOrItem.useNature) || '').trim();
    if (explicit && SOFTWARE_USE_NATURES.some((n) => n.key === explicit)) return explicit;

    const t = String(typeof nameOrItem === 'string' ? nameOrItem : (nameOrItem?.name || ''))
        .toLowerCase();

    if (/\b(cursor|claude|chatgpt|openai|canva|copilot|gemini|midjourney|notion ai)\b/.test(t)) return 'ai-saas';
    if (/\b(oracle|mysql|sql server|sql\b|database|dbms|postgresql|mongo)\b/.test(t)) return 'database';
    if (/\b(visual studio|devexpress|idea blade|advanced installer|github|web.?dev|node|react|angular|\.net)\b/.test(t)) return 'web-dev';
    if (/\b(windows|microsoft server|exchange server|apple mac voucher|macos)\b/.test(t)) return 'os-server';
    if (/\b(kaspersky|antivirus|anti-virus|encryption|endpoint security)\b/.test(t)) return 'security';
    if (/\b(microsoft office|office 20|icdl)\b/.test(t)) return 'office';
    if (/\b(adobe|corel|final cut|power director|video|photoshop|illustrator|indesign|printing press)\b/.test(t)) return 'creative';
    if (/\b(vmware|teamviewer|laplink|fusion|vxsi)\b/.test(t)) return 'virtualization';
    if (/\b(network monitoring|cisco|wifi|firewall)\b/.test(t)) return 'network';
    if (/\b(data recovery|stellar|forensics|id software)\b/.test(t)) return 'recovery';
    if (/\b(arcgis|pix\s*4d|gis|mapper)\b/.test(t)) return 'gis';
    if (/\b(system development|hrmis|mpro|ames|logistics)\b/.test(t)) return 'enterprise-dev';
    if (/\b(icdl|training|education)\b/.test(t)) return 'education';
    return 'other';
}

function annotateCatalogItemUseNature(item) {
    if (!item) return item;
    const useNature = classifySoftwareUseNature(item, item.useNature);
    return {
        ...item,
        useNature,
        useNatureLabel: getSoftwareUseNatureLabel(useNature)
    };
}

function sortCatalogItemsAlphabetically(items) {
    return [...(items || [])].sort((a, b) =>
        String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' })
    );
}

const ICT_EQUIPMENT_SELECT_GROUPS = [
    { key: 'laptops', label: 'Laptops & Notebooks', re: /\b(laptop|notebook|macbook|omnibook|elitebook|probook|thinkpad|latitude|vostro|xps|zbook|surface\s*laptop|yoga|legion|travelmate|expertbook|vivobook|firefly)\b/i },
    { key: 'tablets', label: 'Tablets & 2-in-1', re: /\b(tablet|ipad|surface\s*pro|tab\s|galaxy\s*tab)\b/i },
    { key: 'desktops', label: 'Desktops, Workstations & AIO', re: /\b(desktop|optiplex|elitedesk|prodesk|thinkcentre|thinkstation|precision\s+\d{4}|z2\s|omnistudio|all-?in-?one|imac|mac\s*mini|mac\s*studio|workstation)\b/i },
    { key: 'printers', label: 'Printers & MFPs', re: /\b(printer|laserjet|pagewide|designjet|imagerunner|imageclass|ecotank|workforce|mfp|photocopier|taskalfa|ecosys|versalink|altalink|pixma|plotter)\b/i },
    { key: 'servers', label: 'Servers', re: /\b(server|proliant|poweredge|thinksystem|ucs\s*c|superserver|microserver)\b/i },
    { key: 'routers', label: 'Routers & Firewalls', re: /\b(router|isr\b|asr\b|fortigate|edgerouter|dream\s*machine|meraki\s*mx|asa\s*firewall|firewall)\b/i },
    { key: 'aps', label: 'Access Points', re: /\b(access\s*point|\bap\b|catalyst\s*91|meraki\s*mr|unifi\s*u6|unifi\s*u7|instant\s*on\s*ap|aruba\s*ap|eap\d|ruckus\s*r)\b/i },
    { key: 'switches', label: 'Switches', re: /\b(switch|catalyst\s*(1000|2960|3850|9200|9300)|cbs350|meraki\s*ms|unifi\s*switch|instant\s*on\s*1930|2930f|sg\d|jetstream|gs\d|crs\d)\b/i },
    { key: 'other', label: 'Other ICT Equipment', re: null }
];

function isIctEquipmentCatalogCategory(categoryKey) {
    const key = String(categoryKey || '').trim();
    if (!key) return false;
    if (key === 'ict-equipment' || key === 'inv-ict' || key === 'ict') return true;
    if (/ict.?equipment|inv-ict/i.test(key)) return true;
    const section = getStoresCatalogSections().find((s) => s.key === key);
    return !!(section && /ict/i.test(section.key || section.label || ''));
}

function classifyIctEquipmentSelectGroup(nameOrItem) {
    const t = String(typeof nameOrItem === 'string' ? nameOrItem : (nameOrItem?.name || ''));
    for (const g of ICT_EQUIPMENT_SELECT_GROUPS) {
        if (g.key === 'other') continue;
        if (g.re && g.re.test(t)) return g.key;
    }
    return 'other';
}

/**
 * Group software items by nature of use; ICT equipment by device type; else A–Z.
 */
function groupCatalogItemsForSelect(items, categoryKey) {
    const list = items || [];

    if (isIctEquipmentCatalogCategory(categoryKey)) {
        const buckets = new Map(ICT_EQUIPMENT_SELECT_GROUPS.map((g) => [g.key, []]));
        list.forEach((item) => {
            const key = classifyIctEquipmentSelectGroup(item);
            (buckets.get(key) || buckets.get('other')).push(item);
        });
        return ICT_EQUIPMENT_SELECT_GROUPS
            .map((g) => ({
                key: g.key,
                label: g.label,
                items: sortCatalogItemsAlphabetically(buckets.get(g.key) || [])
            }))
            .filter((g) => g.items.length > 0);
    }

    if (!isSoftwareCatalogCategory(categoryKey)) {
        return [{
            key: 'all',
            label: '',
            items: sortCatalogItemsAlphabetically(list)
        }];
    }

    const annotated = list.map(annotateCatalogItemUseNature);
    const buckets = new Map(SOFTWARE_USE_NATURES.map((n) => [n.key, []]));
    annotated.forEach((item) => {
        const key = buckets.has(item.useNature) ? item.useNature : 'other';
        buckets.get(key).push(item);
    });

    return SOFTWARE_USE_NATURES
        .map((n) => ({
            key: n.key,
            label: n.label,
            items: sortCatalogItemsAlphabetically(buckets.get(n.key) || [])
        }))
        .filter((g) => g.items.length > 0);
}

function catalogHtmlEscape(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Build <option> / <optgroup> HTML for a catalog item select.
 * Softwares: grouped by nature of use, A–Z within each group.
 * Other categories: flat A–Z list.
 */
function buildCatalogItemSelectOptionsHtml(items, selectedId, categoryKey) {
    const groups = groupCatalogItemsForSelect(items, categoryKey);
    const parts = ['<option value="">— Select catalog item —</option>'];

    groups.forEach((group) => {
        const options = group.items.map((item) => {
            const sel = item.id === selectedId ? ' selected' : '';
            const mark = item.custom ? ' ★' : '';
            return `<option value="${catalogHtmlEscape(item.id)}"${sel}>${catalogHtmlEscape(item.name)}${mark}</option>`;
        }).join('');

        if (group.label) {
            parts.push(`<optgroup label="${catalogHtmlEscape(group.label)}">${options}</optgroup>`);
        } else {
            parts.push(options);
        }
    });

    return parts.join('');
}

function buildSoftwareUseNatureOptionsHtml(selectedKey) {
    return SOFTWARE_USE_NATURES.map((n) => {
        const sel = n.key === selectedKey ? ' selected' : '';
        return `<option value="${catalogHtmlEscape(n.key)}"${sel}>${catalogHtmlEscape(n.label)}</option>`;
    }).join('');
}

function ensureCustomCatalogItems() {
    if (typeof appState === 'undefined' || !appState) return [];
    if (!Array.isArray(appState.customCatalogItems)) appState.customCatalogItems = [];
    return appState.customCatalogItems;
}

function slugifyCatalogItemId(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 56) || 'item';
}

function getCustomCatalogItemsForCategory(categoryKey) {
    const key = String(categoryKey || '').trim();
    if (!key) return [];
    return ensureCustomCatalogItems()
        .filter((item) => item.category === key || item.sourceCategory === key)
        .map((item) => ({
            ...item,
            category: item.category || key,
            gl: item.gl || '',
            sectionLabel: item.sectionLabel || 'Custom catalog',
            custom: true
        }));
}

/**
 * Persist a new catalog item under a category / inventory ledger.
 * Survives save/reload via appState.customCatalogItems.
 */
function addCustomCatalogItem({ name, category, gl, sourceCategory, useNature } = {}) {
    const trimmed = String(name || '').trim();
    if (!trimmed) {
        if (typeof showToast === 'function') showToast('Enter a catalog item name.', 'error');
        return null;
    }
    const cat = String(category || '').trim();
    if (!cat) {
        if (typeof showToast === 'function') showToast('Select a catalog category first.', 'error');
        return null;
    }

    const list = ensureCustomCatalogItems();
    const existingCustom = list.find((i) =>
        i.category === cat && String(i.name || '').toLowerCase() === trimmed.toLowerCase()
    );
    if (existingCustom) {
        if (typeof showToast === 'function') showToast(`Item already in catalog: ${existingCustom.name}`, 'info');
        return {
            ...existingCustom,
            category: cat,
            gl: existingCustom.gl || gl || '',
            custom: true
        };
    }

    const builtinExact = (typeof findCatalogItemsByName === 'function' ? findCatalogItemsByName(trimmed) : [])
        .find((m) => String(m.name || '').toLowerCase() === trimmed.toLowerCase());
    if (builtinExact) {
        if (typeof showToast === 'function') showToast(`Item already exists in master catalog: ${builtinExact.name}`, 'info');
        return builtinExact;
    }

    const led = typeof getInventoryLedgerByKey === 'function' ? getInventoryLedgerByKey(cat) : null;
    const section = getStoresCatalogSections().find((s) => s.key === cat);
    const resolvedGl = gl || led?.defaultGl || section?.gl || '';
    const id = `custom__${cat}__${slugifyCatalogItemId(trimmed)}`;
    const nature = isSoftwareCatalogCategory(cat)
        ? classifySoftwareUseNature(trimmed, useNature)
        : (useNature || '');

    const item = {
        id,
        name: trimmed,
        category: cat,
        sourceCategory: sourceCategory || section?.key || cat,
        gl: resolvedGl,
        sectionLabel: led?.fullLabel || led?.label || section?.label || cat,
        useNature: nature || undefined,
        custom: true,
        createdAt: new Date().toISOString()
    };
    list.push(item);
    if (typeof saveState === 'function') saveState();
    if (typeof showToast === 'function') showToast(`Catalog item added: ${trimmed}`, 'success');
    return item;
}

function getCatalogItemById(itemId) {
    if (!itemId) return null;
    for (const section of getStoresCatalogSections()) {
        const found = (section.items || []).find((item) => item.id === itemId);
        if (found) {
            return { ...found, category: section.key, gl: section.gl, sectionLabel: section.label };
        }
    }
    const custom = ensureCustomCatalogItems().find((item) => item.id === itemId);
    if (custom) {
        const led = typeof getInventoryLedgerByKey === 'function' ? getInventoryLedgerByKey(custom.category) : null;
        const section = getStoresCatalogSections().find((s) => s.key === custom.category || s.key === custom.sourceCategory);
        return {
            ...custom,
            category: custom.category,
            gl: custom.gl || led?.defaultGl || section?.gl || '',
            sectionLabel: custom.sectionLabel || led?.fullLabel || led?.label || section?.label || custom.category,
            custom: true
        };
    }
    return null;
}

function getCatalogItemsForCategory(categoryKey) {
    const key = String(categoryKey || '').trim();
    const section = getStoresCatalogSections().find((s) => s.key === key);
    let builtin = section
        ? (section.items || []).map((item) => ({
            ...item,
            category: section.key,
            gl: section.gl,
            sectionLabel: section.label
        }))
        : [];

    // Inventory ledger tabs (e.g. inv-laptops) — pull matching ICT Equipment models
    if (!builtin.length && /^inv-/i.test(key)) {
        const ict = getStoresCatalogSections().find((s) => s.key === 'ict-equipment');
        const led = typeof getInventoryLedgerByKey === 'function' ? getInventoryLedgerByKey(key) : null;
        const pool = (ict?.items || []).map((item) => ({
            ...item,
            category: key,
            gl: led?.defaultGl || ict?.gl || '',
            sectionLabel: led?.fullLabel || led?.label || ict?.label || key
        }));
        if (key === 'inv-laptops') {
            builtin = pool.filter((i) => /\b(laptop|notebook|macbook|omnibook|elitebook|probook|thinkpad|latitude|vostro|xps|zbook|surface\s*laptop|yoga|legion)\b/i.test(i.name));
        } else if (key === 'inv-desktops') {
            builtin = pool.filter((i) => /\b(desktop|optiplex|elitedesk|prodesk|thinkcentre|workstation|all-?in-?one|imac|mac\s*mini)\b/i.test(i.name));
        } else if (key === 'inv-printers') {
            builtin = pool.filter((i) => /\b(printer|laserjet|mfp|imagerunner|ecotank|designjet|photocopier)\b/i.test(i.name));
        } else if (key === 'inv-servers' || /server/i.test(key)) {
            builtin = pool.filter((i) => /\b(server|proliant|poweredge|thinksystem|ucs)\b/i.test(i.name));
        } else {
            builtin = pool;
        }
    }

    const custom = getCustomCatalogItemsForCategory(key);
    const seen = new Set(builtin.map((i) => i.id));
    custom.forEach((item) => {
        if (!seen.has(item.id)) builtin.push(item);
    });
    const merged = builtin;
    if (isSoftwareCatalogCategory(key)) {
        return sortCatalogItemsAlphabetically(merged.map(annotateCatalogItemUseNature));
    }
    return sortCatalogItemsAlphabetically(merged);
}

function getAllCatalogItems() {
    const builtin = getStoresCatalogSections().flatMap((section) =>
        (section.items || []).map((item) => ({
            ...item,
            category: section.key,
            gl: section.gl,
            sectionLabel: section.label
        }))
    );
    const seen = new Set(builtin.map((i) => i.id));
    ensureCustomCatalogItems().forEach((item) => {
        if (seen.has(item.id)) return;
        seen.add(item.id);
        builtin.push({
            ...item,
            category: item.category,
            gl: item.gl || '',
            sectionLabel: item.sectionLabel || 'Custom catalog',
            custom: true
        });
    });
    return builtin;
}

function findCatalogItemsByName(query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return [];
    return getAllCatalogItems().filter((item) => item.name.toLowerCase().includes(q));
}

/** Inventory tabs driven by the official IT Directorate catalog */
var VOUCHER_INVENTORY_CATEGORIES = getStoresCatalogSections().map((section) => {
    const shortMap = {
        'consumables-toners': 'Toners & Ink',
        'consumables-media': 'Storage Media',
        'spares-parts': 'Parts / Spares',
        'maintenance-equipment': 'Maint. Equipment',
        'software-licences': 'Software',
        'ict-equipment': 'ICT Equipment',
        'ict-accessories': 'ICT Accessories'
    };
    return {
        key: section.key,
        label: shortMap[section.key] || section.label,
        fullLabel: section.label,
        detail: section.detail,
        gl: section.gl
    };
});
