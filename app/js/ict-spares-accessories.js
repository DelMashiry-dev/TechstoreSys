/* ict-spares-accessories.js — stockable ICT spares & accessories (ABC class + min levels) */

const ICT_SPARES_ABC = {
    A: { label: 'A — Critical spares', defaultMin: 2 },
    B: { label: 'B — Frequently used accessories', defaultMin: 4 },
    C: { label: 'C — Installation & maintenance materials', defaultMin: 10 },
    D: { label: 'D — Specialist / low-turnover', defaultMin: 1 }
};

function ictSpareSlug(name) {
    return String(name || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 72) || 'item';
}

function ictSpareMin(abc, highDemand, explicit) {
    if (explicit != null) return explicit;
    if (highDemand) {
        if (abc === 'A') return 8;
        if (abc === 'B') return 12;
        if (abc === 'C') return 40;
        return 2;
    }
    return (ICT_SPARES_ABC[abc] || ICT_SPARES_ABC.B).defaultMin;
}

function ictSpareExpand(section, group, abc, base, sizes, extra = {}) {
    return sizes.map((sz) => ({
        section,
        group,
        abc,
        high: !!extra.high,
        min: extra.min,
        name: `${base} — ${sz}`
    }));
}

function buildIctSparesAccessoriesDefs() {
    const S = 'spares-parts';
    const A = 'ict-accessories';
    const M = 'consumables-media';
    const lines = [];
    const add = (section, group, abc, name, extra = {}) => {
        lines.push({ section, group, abc, name, high: !!extra.high, min: extra.min });
    };

    // 1. Computer internal spares (A)
    lines.push(
        ...ictSpareExpand(S, 'internal', 'A', 'DDR4 Desktop RAM', ['4GB', '8GB', '16GB', '32GB'], { high: true }),
        ...ictSpareExpand(S, 'internal', 'A', 'DDR4 Laptop RAM', ['4GB', '8GB', '16GB', '32GB'], { high: true }),
        ...ictSpareExpand(S, 'internal', 'A', 'DDR5 Desktop RAM', ['8GB', '16GB', '32GB'], { high: true }),
        ...ictSpareExpand(S, 'internal', 'A', 'DDR5 Laptop RAM', ['8GB', '16GB', '32GB'], { high: true }),
        ...ictSpareExpand(S, 'internal', 'A', '2.5" SATA SSD', ['256GB', '512GB', '1TB', '2TB'], { high: true }),
        ...ictSpareExpand(S, 'internal', 'A', 'NVMe M.2 SSD', ['256GB', '512GB', '1TB', '2TB'], { high: true }),
        ...ictSpareExpand(S, 'internal', 'A', 'SATA Hard Drive', ['500GB', '1TB', '2TB'])
    );
    add(S, 'internal', 'A', 'Laptop Hard Drive');
    add(S, 'internal', 'A', 'Desktop Power Supply Unit — 400W');
    add(S, 'internal', 'A', 'Desktop Power Supply Unit — 500W');
    add(S, 'internal', 'A', 'Desktop Power Supply Unit — 600W+');
    add(S, 'internal', 'A', 'Laptop Cooling Fan');
    add(S, 'internal', 'A', 'Desktop CPU Cooling Fan');
    add(S, 'internal', 'A', 'Case Fan');
    add(S, 'internal', 'A', 'CMOS Battery CR2032', { high: true, min: 20 });
    add(S, 'internal', 'B', 'SATA Data Cable', { high: true });
    add(S, 'internal', 'B', 'SATA Power Cable');
    add(S, 'internal', 'A', 'Internal Wi-Fi Card');
    add(S, 'internal', 'A', 'PCIe Network Card');
    add(S, 'internal', 'D', 'Sound Card');
    add(S, 'internal', 'D', 'Graphics Card');
    add(S, 'internal', 'A', 'Laptop Keyboard');
    add(S, 'internal', 'A', 'Laptop Screen — 14"');
    add(S, 'internal', 'A', 'Laptop Screen — 15.6"');
    add(S, 'internal', 'A', 'Laptop Screen — 16"');
    add(S, 'internal', 'A', 'Laptop Hinges');
    add(S, 'internal', 'A', 'Laptop DC Power Jack');
    add(S, 'internal', 'A', 'Laptop Battery — HP', { high: true });
    add(S, 'internal', 'A', 'Laptop Battery — Dell', { high: true });
    add(S, 'internal', 'A', 'Laptop Battery — Lenovo', { high: true });
    add(S, 'internal', 'A', 'Laptop Touchpad');
    add(S, 'internal', 'A', 'Laptop Speakers');
    add(S, 'internal', 'A', 'Desktop Motherboard');
    add(S, 'internal', 'A', 'Laptop Motherboard — common models');

    // 2. Power accessories
    add(A, 'power', 'A', 'Laptop Charger — HP', { high: true });
    add(A, 'power', 'A', 'Laptop Charger — Dell', { high: true });
    add(A, 'power', 'A', 'Laptop Charger — Lenovo', { high: true });
    add(A, 'power', 'A', 'Laptop Charger — Acer', { high: true });
    add(A, 'power', 'A', 'Laptop Charger — Asus', { high: true });
    add(A, 'power', 'A', 'USB-C Laptop Charger — 45W', { high: true });
    add(A, 'power', 'A', 'USB-C Laptop Charger — 65W', { high: true });
    add(A, 'power', 'A', 'USB-C Laptop Charger — 90W');
    add(A, 'power', 'A', 'USB-C Laptop Charger — 100W');
    add(A, 'power', 'A', 'Universal Laptop Charger');
    add(A, 'power', 'B', 'Desktop Power Cable', { high: true, min: 15 });
    add(A, 'power', 'B', 'Monitor Power Cable', { high: true });
    add(A, 'power', 'B', 'Figure-8 Power Cable');
    add(A, 'power', 'B', 'Cloverleaf / Mickey Mouse Power Cable');
    add(A, 'power', 'B', 'Extension Cable', { high: true, min: 10 });
    add(A, 'power', 'B', 'Multi-Plug Adaptor', { high: true });
    add(A, 'power', 'B', 'Surge Protector', { high: true, min: 8 });
    add(A, 'power', 'D', 'UPS Unit — 650VA');
    add(A, 'power', 'D', 'UPS Unit — 850VA');
    add(A, 'power', 'D', 'UPS Unit — 1000VA+');
    add(S, 'power', 'A', 'UPS Replacement Battery');
    add(A, 'power', 'B', 'Power Bank', { high: true, min: 6 });
    add(A, 'power', 'B', 'USB Charger');
    add(A, 'power', 'B', 'USB-C Fast Charger', { high: true });
    add(A, 'power', 'B', 'Charging Cable', { high: true });

    // 3. Keyboards and mice (B)
    add(A, 'input', 'B', 'USB Keyboard', { high: true, min: 10 });
    add(A, 'input', 'B', 'Wireless Keyboard');
    add(A, 'input', 'B', 'USB Mouse', { high: true, min: 15 });
    add(A, 'input', 'B', 'Wireless Mouse', { high: true });
    add(A, 'input', 'B', 'Keyboard and Mouse Combo', { high: true, min: 8 });
    add(A, 'input', 'B', 'Bluetooth Keyboard');
    add(A, 'input', 'B', 'Bluetooth Mouse');
    add(A, 'input', 'B', 'Mouse Pad');
    add(A, 'input', 'B', 'Ergonomic Mouse Pad');
    add(A, 'input', 'B', 'Numeric Keypad');

    // 4. Display accessories
    lines.push(...ictSpareExpand(A, 'display', 'B', 'HDMI Cable', ['1m', '2m', '3m', '5m', '10m'], { high: true }));
    add(A, 'display', 'B', 'VGA Cable', { high: true, min: 10 });
    add(A, 'display', 'B', 'DisplayPort Cable');
    add(A, 'display', 'B', 'Mini DisplayPort Cable');
    add(A, 'display', 'B', 'DVI Cable');
    add(A, 'display', 'B', 'USB-C to HDMI Adaptor', { high: true, min: 8 });
    add(A, 'display', 'B', 'HDMI to VGA Adaptor');
    add(A, 'display', 'B', 'VGA to HDMI Convertor');
    add(A, 'display', 'B', 'DisplayPort to HDMI Adaptor');
    add(A, 'display', 'B', 'HDMI Splitter');
    add(A, 'display', 'D', 'HDMI Switch');
    add(A, 'display', 'D', 'HDMI Extender');
    add(A, 'display', 'D', 'Monitor Stand');
    add(A, 'display', 'D', 'Monitor Wall Mount');
    add(A, 'display', 'D', 'Monitor Arm');

    // 5. USB accessories
    add(A, 'usb', 'B', 'USB-A to USB-B Printer Cable', { high: true, min: 10 });
    add(A, 'usb', 'B', 'USB-A to USB-C Cable', { high: true, min: 15 });
    add(A, 'usb', 'B', 'USB-C to USB-C Cable', { high: true, min: 15 });
    add(A, 'usb', 'B', 'USB Extension Cable');
    add(A, 'usb', 'B', 'USB Hub — 4 Port', { high: true, min: 6 });
    add(A, 'usb', 'B', 'USB Hub — 7 Port');
    add(A, 'usb', 'B', 'USB-C Hub');
    add(A, 'usb', 'D', 'USB-C Docking Station');
    add(A, 'usb', 'B', 'USB to SATA Adaptor');
    add(A, 'usb', 'B', 'USB to Ethernet Adaptor');
    add(A, 'usb', 'B', 'USB Wi-Fi Adaptor', { high: true, min: 8 });
    add(A, 'usb', 'B', 'USB Bluetooth Adaptor');
    add(A, 'usb', 'B', 'USB Sound Card');
    add(A, 'usb', 'B', 'USB Card Reader');

    // 6. Networking accessories
    add(A, 'net', 'B', 'Cat5e Network Cable', { high: true });
    add(A, 'net', 'B', 'Cat6 Network Cable', { high: true, min: 20 });
    lines.push(...ictSpareExpand(A, 'net', 'B', 'Pre-made Patch Cable', ['1m', '2m', '3m', '5m', '10m'], { high: true, min: 20 }));
    add(A, 'net', 'C', 'RJ45 Connector', { high: true, min: 100 });
    add(A, 'net', 'C', 'RJ45 Boot', { high: true, min: 50 });
    add(A, 'net', 'C', 'Network Faceplate');
    add(A, 'net', 'C', 'Network Wall Box');
    add(A, 'net', 'C', 'Cat6 Keystone Jack');
    add(A, 'net', 'D', 'Patch Panel — 12 Port');
    add(A, 'net', 'D', 'Patch Panel — 24 Port');
    add(A, 'net', 'D', 'Patch Panel — 48 Port');
    add(A, 'net', 'D', 'Network Switch — 5 Port');
    add(A, 'net', 'D', 'Network Switch — 8 Port');
    add(A, 'net', 'D', 'Network Switch — 16 Port');
    add(A, 'net', 'D', 'Network Switch — 24 Port');
    add(A, 'net', 'D', 'Network Switch — 48 Port');
    add(A, 'net', 'D', 'Gigabit Switch');
    add(A, 'net', 'D', 'PoE Switch');
    add(A, 'net', 'D', 'Wireless Router');
    add(A, 'net', 'D', 'Access Point');
    add(A, 'net', 'D', 'Wi-Fi Range Extender');
    add(A, 'net', 'D', 'Mesh Wi-Fi System');
    add(A, 'net', 'D', 'Fibre Patch Cord');
    add(A, 'net', 'D', 'Fibre Module / SFP');
    add(A, 'net', 'D', 'Media Convertor');

    // 7. Network installation tools (C)
    add(S, 'tools', 'C', 'RJ45 Crimping Tool');
    add(S, 'tools', 'C', 'Network Cable Tester');
    add(S, 'tools', 'C', 'Punch-Down Tool');
    add(S, 'tools', 'C', 'Cable Stripper');
    add(S, 'tools', 'C', 'Fibre Cleaning Kit');
    add(S, 'tools', 'C', 'Cable Ties', { high: true, min: 50 });
    add(S, 'tools', 'C', 'Velcro Cable Straps');
    add(S, 'tools', 'C', 'Cable Clips');
    add(S, 'tools', 'C', 'Cable Trunking');
    add(S, 'tools', 'C', 'Cable Labels');

    // 8. Data storage
    lines.push(...ictSpareExpand(M, 'storage', 'B', 'USB Flash Drive', ['16GB', '32GB', '64GB', '128GB', '256GB'], { high: true, min: 20 }));
    add(M, 'storage', 'B', 'External HDD — 1TB');
    add(M, 'storage', 'B', 'External HDD — 2TB');
    add(M, 'storage', 'B', 'External HDD — 4TB');
    add(M, 'storage', 'B', 'External SSD — 500GB');
    add(M, 'storage', 'B', 'External SSD — 1TB');
    add(M, 'storage', 'B', 'External SSD — 2TB');
    add(A, 'storage', 'B', 'SD Card');
    add(A, 'storage', 'B', 'MicroSD Card');
    add(A, 'storage', 'B', 'SD Card Adaptor');
    add(A, 'storage', 'B', 'External Hard Drive Enclosure');
    add(A, 'storage', 'B', 'M.2 SSD Enclosure');
    add(A, 'storage', 'B', 'SATA HDD/SSD Enclosure');

    // 9. Printer spares (A) — generic types; named HP kits already in catalog
    add(A, 'printer', 'B', 'USB Printer Cable', { high: true, min: 10 });
    add(A, 'printer', 'B', 'Printer Power Cable', { high: true });
    add(S, 'printer', 'A', 'Ink Cartridge (generic / other)');
    add(S, 'printer', 'A', 'Ink Bottle');
    add(S, 'printer', 'A', 'Toner Cartridge (generic / other)', { high: true });
    add(S, 'printer', 'A', 'Printer Drum');
    add(S, 'printer', 'A', 'Printer Maintenance Kit');
    add(S, 'printer', 'A', 'Pickup Roller');
    add(S, 'printer', 'A', 'Separation Pad');
    add(S, 'printer', 'A', 'Printer Head');
    add(S, 'printer', 'A', 'Waste Ink / Maintenance Box');
    add(S, 'printer', 'A', 'Ribbon Cartridge');
    add(A, 'printer', 'B', 'A4 Printing Paper');
    add(A, 'printer', 'B', 'Photo Paper');
    add(A, 'printer', 'B', 'Label Paper');
    add(A, 'printer', 'B', 'Continuous Paper');

    // 10. Laptop accessories
    add(A, 'laptop', 'B', 'Laptop Bag', { high: true, min: 6 });
    add(A, 'laptop', 'B', 'Laptop Backpack');
    add(A, 'laptop', 'B', 'Laptop Sleeve');
    add(A, 'laptop', 'B', 'Laptop Stand');
    add(A, 'laptop', 'B', 'Laptop Cooling Pad');
    add(A, 'laptop', 'B', 'Privacy Screen Filter');
    add(A, 'laptop', 'B', 'Screen Protector');
    add(A, 'laptop', 'B', 'Webcam Cover');
    add(A, 'laptop', 'D', 'Port Replicator');
    add(A, 'laptop', 'B', 'Laptop Security Lock');

    // 11. Mobile / tablet
    add(A, 'mobile', 'B', 'USB-C Charging Cable', { high: true });
    add(A, 'mobile', 'B', 'Micro-USB Cable');
    add(A, 'mobile', 'B', 'Lightning Cable');
    add(A, 'mobile', 'B', 'Multi-Port USB Charger');
    add(A, 'mobile', 'B', 'Car Charger');
    add(A, 'mobile', 'B', 'Phone Holder');
    add(A, 'mobile', 'B', 'Tablet Stand');
    add(A, 'mobile', 'B', 'OTG Adaptor');
    add(A, 'mobile', 'B', 'USB-C OTG Adaptor');
    add(A, 'mobile', 'B', 'Memory Card');

    // 12. Audio
    add(A, 'audio', 'B', 'Wired Headphones');
    add(A, 'audio', 'B', 'Wireless Headphones');
    add(A, 'audio', 'B', 'Earphones');
    add(A, 'audio', 'B', 'Bluetooth Earbuds');
    add(A, 'audio', 'B', 'Computer Speakers');
    add(A, 'audio', 'B', 'Bluetooth Speakers');
    add(A, 'audio', 'B', 'USB Headset', { high: true, min: 8 });
    add(A, 'audio', 'B', 'Headset with Microphone', { high: true, min: 8 });
    add(A, 'audio', 'B', 'Desktop Microphone');
    add(A, 'audio', 'B', 'USB Microphone');
    add(A, 'audio', 'B', '3.5mm Audio Cable');
    add(A, 'audio', 'B', 'Audio Splitter');
    add(A, 'audio', 'B', '3.5mm to USB-C Adaptor');

    // 13. Video conferencing
    add(A, 'vc', 'B', 'USB Webcam');
    add(A, 'vc', 'B', 'HD Webcam');
    add(A, 'vc', 'D', 'Conference Camera');
    add(A, 'vc', 'B', 'Speakerphone');
    add(A, 'vc', 'B', 'Tripod');
    add(A, 'vc', 'D', 'Ring Light');
    add(A, 'vc', 'D', 'HDMI Capture Device');

    // 14. Projector accessories
    add(A, 'proj', 'B', 'Projector HDMI Cable');
    add(A, 'proj', 'B', 'Wireless Presentation Device');
    add(A, 'proj', 'D', 'Projector Remote Control');
    add(A, 'proj', 'D', 'Projector Screen');
    add(A, 'proj', 'D', 'Projector Ceiling Mount');
    add(S, 'proj', 'D', 'Projector Lamp / Bulb');
    add(A, 'proj', 'B', 'Presentation Clicker / Laser Pointer');

    // 15. Server / data centre (D / A)
    add(S, 'server', 'A', 'Server RAM');
    add(S, 'server', 'A', 'Enterprise HDD');
    add(S, 'server', 'A', 'Enterprise SSD');
    add(S, 'server', 'A', 'Server Power Supply');
    add(S, 'server', 'A', 'Server Cooling Fan');
    add(S, 'server', 'D', 'RAID Controller');
    add(S, 'server', 'A', 'Network Interface Card');
    add(S, 'server', 'D', 'SFP/SFP+ Module');
    add(S, 'server', 'D', 'Fibre Patch Cable');
    add(S, 'server', 'D', 'Rack Power Distribution Unit');
    add(S, 'server', 'D', 'Server Rack Shelf');
    add(S, 'server', 'C', 'Rack Mounting Screws / Cage Nuts');
    add(S, 'server', 'D', 'Cable Management Panel');
    add(S, 'server', 'D', 'KVM Switch');

    // 16. Security / CCTV (D)
    add(S, 'cctv', 'D', 'CCTV Camera');
    add(S, 'cctv', 'D', 'IP Camera');
    add(S, 'cctv', 'D', 'DVR');
    add(S, 'cctv', 'D', 'NVR');
    add(S, 'cctv', 'D', 'CCTV Power Supply');
    add(S, 'cctv', 'D', 'CCTV Power Adaptor');
    add(S, 'cctv', 'C', 'BNC Connector');
    add(S, 'cctv', 'C', 'CCTV Balun');
    add(S, 'cctv', 'C', 'Coaxial Cable');
    add(S, 'cctv', 'B', 'PoE Injector');
    add(S, 'cctv', 'D', 'CCTV Hard Drive');
    add(S, 'cctv', 'D', 'Camera Junction Box');
    add(S, 'cctv', 'D', 'Camera Mounting Bracket');

    // 17. Cleaning & maintenance (C)
    add(S, 'maint', 'C', 'Compressed Air');
    add(S, 'maint', 'C', 'Screen Cleaning Solution');
    add(S, 'maint', 'C', 'Microfibre Cleaning Cloth');
    add(S, 'maint', 'C', 'Keyboard Cleaning Brush');
    add(S, 'maint', 'C', 'Electronic Contact Cleaner');
    add(S, 'maint', 'C', 'Thermal Paste');
    add(S, 'maint', 'C', 'Thermal Pad');
    add(S, 'maint', 'C', 'Precision Screwdriver Set');
    add(S, 'maint', 'C', 'Computer Repair Toolkit');
    add(S, 'maint', 'C', 'Anti-Static Wrist Strap');
    add(S, 'maint', 'C', 'Anti-Static Mat');

    // 18. Office ICT accessories
    add(A, 'office', 'B', 'Multi-Socket Extension Lead', { high: true, min: 10 });
    add(A, 'office', 'C', 'Cable Organiser');
    add(A, 'office', 'C', 'Cable Management Box');
    add(A, 'office', 'D', 'Document Scanner');
    add(A, 'office', 'D', 'Barcode Scanner');
    add(A, 'office', 'D', 'Label Printer');
    add(A, 'office', 'B', 'USB Numeric Keypad');
    add(A, 'office', 'B', 'Wireless Presenter');
    add(A, 'office', 'D', 'Smart Card Reader');
    add(A, 'office', 'D', 'External DVD Writer');

    return lines;
}

function buildIctSparesCatalogItems() {
    const seen = new Set();
    return buildIctSparesAccessoriesDefs().map((row) => {
        const name = String(row.name || '').trim();
        const section = row.section;
        const id = `${section}__${ictSpareSlug(name)}`;
        if (seen.has(id)) return null;
        seen.add(id);
        const abc = row.abc || 'B';
        return {
            id,
            name,
            abcClass: abc,
            minStock: ictSpareMin(abc, row.high, row.min),
            highDemand: !!row.high,
            stockGroup: row.group || '',
            section
        };
    }).filter(Boolean);
}

function mergeIctSparesAccessoriesCatalog(sections) {
    const list = Array.isArray(sections) ? sections : [];
    if (list.__ictSparesMerged) return list;

    let acc = list.find((s) => s.key === 'ict-accessories');
    if (!acc) {
        acc = {
            key: 'ict-accessories',
            label: 'ZOFF / Office Supplies — ICT Accessories',
            gl: '6122100009',
            detail: 'Cables, mice, keyboards, chargers, storage media, networking kit and office ICT accessories (ABC class B/C)',
            items: []
        };
        list.push(acc);
    }

    const byKey = {};
    list.forEach((s) => { byKey[s.key] = s; });

    buildIctSparesCatalogItems().forEach((item) => {
        const section = byKey[item.section];
        if (!section || !Array.isArray(section.items)) return;
        const hit = section.items.find((i) =>
            i.id === item.id || String(i.name || '').toLowerCase() === item.name.toLowerCase()
        );
        if (hit) {
            if (hit.minStock == null) hit.minStock = item.minStock;
            if (!hit.abcClass) hit.abcClass = item.abcClass;
            if (item.highDemand) hit.highDemand = true;
            if (!hit.stockGroup) hit.stockGroup = item.stockGroup;
            return;
        }
        section.items.push({
            id: item.id,
            name: item.name,
            abcClass: item.abcClass,
            minStock: item.minStock,
            highDemand: item.highDemand || undefined,
            stockGroup: item.stockGroup || undefined
        });
    });

    // Enrich a few long-standing generic lines with class / min
    const enrich = [
        { id: 'spares-parts__hdmi-cables', abc: 'B', min: 15, high: true },
        { id: 'spares-parts__vga-cables', abc: 'B', min: 10, high: true },
        { id: 'spares-parts__usb-cables', abc: 'B', min: 15, high: true },
        { id: 'spares-parts__power-cables', abc: 'B', min: 15, high: true },
        { id: 'spares-parts__dvi-cables', abc: 'B', min: 4 },
        { id: 'spares-parts__cimos-battery', abc: 'A', min: 20, high: true },
        { id: 'spares-parts__ddr4-4-8-16gb-ram-for-laptop-desktops', abc: 'A', min: 8, high: true },
        { id: 'spares-parts__ssd-1tb-sata-internal', abc: 'A', min: 6, high: true },
        { id: 'spares-parts__ssd-500g-sata', abc: 'A', min: 6, high: true },
        { id: 'spares-parts__4-way-surge-protectors', abc: 'B', min: 8, high: true },
        { id: 'spares-parts__atx-power-supply-units', abc: 'A', min: 4 },
        { id: 'spares-parts__laptop-processor-cooling-fans', abc: 'A', min: 4 },
        { id: 'spares-parts__hp-laptop-batteries', abc: 'A', min: 4, high: true },
        { id: 'consumables-media__usb-flash-memory', abc: 'B', min: 20, high: true },
        { id: 'consumables-media__external-hard-disk-drive', abc: 'B', min: 4 }
    ];
    list.forEach((section) => {
        (section.items || []).forEach((item) => {
            const meta = enrich.find((e) => e.id === item.id);
            if (!meta) return;
            item.abcClass = item.abcClass || meta.abc;
            if (item.minStock == null) item.minStock = meta.min;
            if (meta.high) item.highDemand = true;
        });
    });

    list.__ictSparesMerged = true;
    return list;
}

window.ICT_SPARES_ABC = ICT_SPARES_ABC;
window.buildIctSparesCatalogItems = buildIctSparesCatalogItems;
window.mergeIctSparesAccessoriesCatalog = mergeIctSparesAccessoriesCatalog;
