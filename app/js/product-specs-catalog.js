/* product-specs-catalog.js — curated ICT product specifications for Auto-fill */

const PRODUCT_SPECS_CATALOG = [
    {
        id: 'samsung-galaxy-tab-s9',
        brand: 'Samsung',
        model: 'Galaxy Tab S9',
        category: 'other',
        names: ['Samsung Galaxy Tab S9', 'Samsung Tab S9', 'Galaxy Tab S9'],
        aliases: ['tab s9', 'galaxy tab s9', 'samsung tablet s9'],
        specs: [
            ['Device Type', 'Android tablet', 'Mobile productivity and field briefings'],
            ['Processor', 'Snapdragon 8 Gen 2 for Galaxy', 'Flagship tablet performance'],
            ['RAM', '8 GB / 12 GB options', 'Multitasking for office apps'],
            ['Storage', '128 GB / 256 GB (microSD expandable)', 'Documents, maps, and media'],
            ['Display', '11\" Dynamic AMOLED 2X (2560x1600)', 'Clear outdoor/indoor readability'],
            ['Operating System', 'Android (One UI)', 'App ecosystem for field IT support'],
            ['Connectivity', 'Wi-Fi 6E, Bluetooth 5.3, USB-C; 5G on cellular SKUs', 'Network access in offices and field'],
            ['S Pen', 'Included (IP68)', 'Annotation and form completion'],
            ['Battery', '~8400 mAh typical', 'Full-day operational use'],
            ['Security', 'Knox security platform', 'Enterprise device protection'],
            ['Warranty', '1–2 years manufacturer warranty', 'Service continuity']
        ]
    },
    {
        id: 'samsung-galaxy-tab-s9-fe',
        brand: 'Samsung',
        model: 'Galaxy Tab S9 FE',
        category: 'other',
        names: ['Samsung Galaxy Tab S9 FE', 'Samsung Tab S9 FE', 'Galaxy Tab S9 FE'],
        aliases: ['tab s9 fe', 'samsung tab fe'],
        specs: [
            ['Device Type', 'Android tablet', 'Cost-effective tablet for units'],
            ['Processor', 'Exynos 1380', 'Office and training workloads'],
            ['RAM', '6 GB / 8 GB', 'Standard multitasking'],
            ['Storage', '128 GB (microSD expandable)', 'Documents and offline content'],
            ['Display', '10.9\" TFT LCD', 'Briefings and document review'],
            ['Operating System', 'Android (One UI)', 'IT-DIR compatible apps'],
            ['Connectivity', 'Wi-Fi 6, Bluetooth, USB-C', 'Office network use'],
            ['S Pen', 'Included', 'Annotation support'],
            ['Battery', '~8000 mAh typical', 'Day-long use'],
            ['Warranty', '1–2 years manufacturer warranty', 'Service cover']
        ]
    },
    {
        id: 'samsung-galaxy-tab-a9',
        brand: 'Samsung',
        model: 'Galaxy Tab A9 / A9+',
        category: 'other',
        names: ['Samsung Galaxy Tab A9', 'Samsung Tab A9', 'Galaxy Tab A9+', 'Samsung Tab 11'],
        aliases: ['tab a9', 'tab a9+', 'samsung tab 11', 'galaxy tab 11', 'tab 11'],
        specs: [
            ['Device Type', 'Android tablet', 'Entry/mid tablet for stores and training'],
            ['Processor', 'MediaTek Helio G99 (typical A9 series)', 'Everyday IT and admin tasks'],
            ['RAM', '4 GB / 8 GB options', 'Basic multitasking'],
            ['Storage', '64 GB / 128 GB (microSD expandable)', 'Forms, SOPs, and media'],
            ['Display', '8.7\" (A9) or 11\" (A9+) LCD', 'Readable for manuals and checklists'],
            ['Operating System', 'Android (One UI)', 'Compatible with approved apps'],
            ['Connectivity', 'Wi-Fi, Bluetooth, USB-C; LTE variants available', 'Office and limited field access'],
            ['Battery', 'Typical full-day light use', 'Operational mobility'],
            ['Warranty', '1 year manufacturer warranty (typical)', 'Minimum service expectation']
        ]
    },
    {
        id: 'samsung-galaxy-tab-s11',
        brand: 'Samsung',
        model: 'Galaxy Tab S11',
        category: 'other',
        names: ['Samsung Galaxy Tab S11', 'Samsung Tab S11', 'Galaxy Tab S11'],
        aliases: ['tab s11', 'galaxy tab s11', 'samsung s11 tablet'],
        specs: [
            ['Device Type', 'Android tablet', 'Premium tablet for command/admin use'],
            ['Processor', 'Latest Snapdragon / Galaxy chipset (confirm SKU)', 'High-performance productivity'],
            ['RAM', '8 GB+ (confirm configuration)', 'Heavy multitasking'],
            ['Storage', '128 GB+ expandable (confirm SKU)', 'Local document store'],
            ['Display', '~11\" AMOLED-class display (confirm SKU)', 'High clarity for briefings'],
            ['Operating System', 'Android (One UI)', 'Enterprise app support'],
            ['Connectivity', 'Wi-Fi 6/6E+, Bluetooth, USB-C; cellular optional', 'Flexible deployment'],
            ['Accessories', 'S Pen support (confirm bundle)', 'Annotation and signatures'],
            ['Security', 'Knox / enterprise MDM ready', 'ZNA device control'],
            ['Warranty', 'Manufacturer warranty as quoted', 'Confirm with supplier']
        ]
    },
    {
        id: 'apple-ipad-10',
        brand: 'Apple',
        model: 'iPad (10th generation)',
        category: 'other',
        names: ['Apple iPad 10', 'iPad 10th gen', 'iPad 10'],
        aliases: ['ipad 10', 'ipad tenth'],
        specs: [
            ['Device Type', 'iPad tablet', 'Secure mobile productivity'],
            ['Processor', 'Apple A14 Bionic', 'Smooth office and media apps'],
            ['Storage', '64 GB / 256 GB', 'Confirm required capacity'],
            ['Display', '10.9\" Liquid Retina', 'Document and presentation use'],
            ['Operating System', 'iPadOS', 'Apple ecosystem / MDM'],
            ['Connectivity', 'Wi-Fi 6, USB-C; cellular optional', 'Network access'],
            ['Apple Pencil', 'USB-C Pencil support', 'Annotation if required'],
            ['Warranty', '1 year Apple limited warranty (+ AppleCare if procured)', 'Service cover']
        ]
    },
    {
        id: 'hp-omnibook-x-flip-16',
        brand: 'HP',
        model: 'OmniBook X Flip 16 Next Gen AI PC',
        category: 'laptop',
        names: [
            'HP OmniBook X Flip 16 AI (Intel Core Ultra 9)',
            'HP OmniBook X Flip 16',
            'HP OmniBook X Flip Laptop AI Intel Core Ultra 9',
            'OmniBook X Flip 16'
        ],
        aliases: ['omnibook x flip', 'omnibook flip 16', 'ultra 9 288v', '288v'],
        specs: [
            ['Device Type', '16\" 2-in-1 AI laptop (flip / convertible)', 'Creative and technical use'],
            ['Processor', 'Intel Core Ultra 9 288V', 'Next-gen AI PC'],
            ['NPU / AI', '48 NPU TOPS', 'On-device AI performance'],
            ['RAM', '32 GB RAM', 'Heavy multitasking / creative apps'],
            ['Storage', '1 TB SSD', 'Local project store'],
            ['Display', '16\", 2K IPS touchscreen', 'Design, CAD-light, briefings'],
            ['Battery Life', 'Up to 18 hours 30 minutes (video playback)', 'Full-day mobility'],
            ['Form Factor', 'OmniBook X Flip — laptop and tablet modes', 'Field + desk use'],
            ['Operating System', 'Windows 11 (AI PC class)', 'Confirm Pro SKU for domain join'],
            ['Best for', 'Creative and technical use', 'From HP product graphic']
        ]
    },
    {
        id: 'hp-elitebook-840-g10',
        brand: 'HP',
        model: 'EliteBook 840 G10',
        category: 'laptop',
        names: ['HP EliteBook 840 G10', 'EliteBook 840 G10'],
        aliases: ['elitebook 840', 'hp 840 g10'],
        specs: [
            ['Processor', 'Intel Core i5/i7 (13th Gen) options', 'Enterprise productivity'],
            ['RAM', '16 GB DDR5 (expandable)', 'Multitasking'],
            ['Storage', '512 GB NVMe SSD typical', 'Fast boot and apps'],
            ['Display', '14\" FHD anti-glare', 'Office readability'],
            ['Graphics', 'Intel integrated graphics', 'Standard IT duties'],
            ['Operating System', 'Windows 11 Pro', 'Domain join / GPO'],
            ['Connectivity', 'USB-C/Thunderbolt, HDMI, Wi-Fi 6E, Bluetooth', 'Docking ready'],
            ['Security', 'TPM 2.0, fingerprint, HP Sure Start', 'ZNA security baseline'],
            ['Battery Life', 'Typically full workday', 'Mobility'],
            ['Warranty', '3 years onsite preferred', 'TCO / service continuity']
        ]
    },
    {
        id: 'panasonic-toughbook-55',
        brand: 'Panasonic',
        model: 'Toughbook 55',
        category: 'laptop',
        names: ['Panasonic Toughbook 55', 'Toughbook 55', 'TOUGHBOOK 55'],
        aliases: ['toughbook', 'tb55', 'panasonic toughbook'],
        specs: [
            ['Processor', 'Intel Core i5 / i7 up to 4.7 GHz (boost)', 'Rugged field productivity'],
            ['RAM', '16 GB DDR4 (expandable to 64 GB)', 'Multitasking'],
            ['Storage', '512 GB NVMe SSD (removable options)', 'Fast local storage'],
            ['Display', '14\" HD / FHD sunlight-viewable options', 'Outdoor readability'],
            ['Graphics', 'Intel integrated', 'Office / GIS light'],
            ['Operating System', 'Windows 11 Pro', 'Domain join'],
            ['Connectivity', 'USB-C, HDMI, optional RJ-45, Wi-Fi 6, Bluetooth, 4G/5G options', 'Field connectivity'],
            ['Rugged', 'MIL-STD-810H, IP53 (configuration dependent)', 'Drop / dust / water resistance'],
            ['Security', 'TPM 2.0, optional smart card', 'ZNA baseline'],
            ['Warranty', '3 years preferred', 'Field service continuity']
        ]
    },
    {
        id: 'panasonic-toughbook-40',
        brand: 'Panasonic',
        model: 'Toughbook 40',
        category: 'laptop',
        names: ['Panasonic Toughbook 40', 'Toughbook 40', 'TOUGHBOOK 40'],
        aliases: ['toughbook 40', 'tb40', 'fully rugged laptop'],
        specs: [
            ['Processor', 'Intel Core i5 / i7 up to 4.4 GHz (boost)', 'Fully rugged workloads'],
            ['RAM', '16–32 GB DDR4', 'Heavy multitasking'],
            ['Storage', '512 GB–1 TB NVMe SSD', 'Removable drive bay options'],
            ['Display', '14\" sunlight-viewable capacitive / resistive options', 'Glove / wet operation'],
            ['Operating System', 'Windows 11 Pro', 'Enterprise'],
            ['Connectivity', 'Modular bays, USB, HDMI, serial options, Wi-Fi 6, WWAN', 'Vehicle / field docks'],
            ['Rugged', 'MIL-STD-810H, IP66', 'Extreme environments'],
            ['Security', 'TPM 2.0', 'BitLocker ready'],
            ['Warranty', '3 years preferred', 'Mission continuity']
        ]
    },
    {
        id: 'panasonic-toughbook-33',
        brand: 'Panasonic',
        model: 'Toughbook 33',
        category: 'laptop',
        names: ['Panasonic Toughbook 33', 'Toughbook 33', 'TOUGHBOOK 33'],
        aliases: ['toughbook 33', 'tb33', '2-in-1 rugged'],
        specs: [
            ['Processor', 'Intel Core i5 / i7 up to 4.2 GHz (boost)', 'Detachable 2-in-1'],
            ['RAM', '16 GB LPDDR4x', 'Office multitasking'],
            ['Storage', '512 GB NVMe SSD', 'Fast boot'],
            ['Display', '12\" QHD touch, outdoor viewable', 'Tablet + laptop modes'],
            ['Operating System', 'Windows 11 Pro', 'Domain join'],
            ['Connectivity', 'USB-C, HDMI, Wi-Fi 6, Bluetooth, optional WWAN', 'Field mobility'],
            ['Rugged', 'MIL-STD-810H, IP65', 'Drop / water / dust'],
            ['Warranty', '3 years preferred', 'Support']
        ]
    },
    {
        id: 'panasonic-toughbook-g2',
        brand: 'Panasonic',
        model: 'Toughbook G2',
        category: 'tablet',
        names: ['Panasonic Toughbook G2', 'Toughbook G2', 'TOUGHBOOK G2'],
        aliases: ['toughbook g2', 'rugged tablet'],
        specs: [
            ['Processor', 'Intel Core i5 / i7 up to 4.4 GHz (boost)', 'Rugged tablet'],
            ['RAM', '16 GB', 'Multitasking'],
            ['Storage', '512 GB SSD', 'Local apps'],
            ['Display', '10.1\" outdoor viewable', 'Field forms'],
            ['Operating System', 'Windows 11 Pro', 'Enterprise'],
            ['Rugged', 'MIL-STD-810H, IP65', 'Outdoor use'],
            ['Warranty', '3 years preferred', 'Support']
        ]
    },
    {
        id: 'panasonic-toughbook-cf-31',
        brand: 'Panasonic',
        model: 'Toughbook CF-31',
        category: 'laptop',
        names: ['Panasonic Toughbook CF-31', 'Toughbook CF-31', 'TOUGHBOOK CF-31'],
        aliases: ['cf-31', 'toughbook 31', 'legacy rugged'],
        specs: [
            ['Processor', 'Intel Core i5 up to 3.6 GHz', 'Legacy rugged fleet'],
            ['RAM', '8–16 GB DDR3', 'Confirm configuration'],
            ['Storage', '256–512 GB SSD', 'Prefer SSD refresh'],
            ['Display', '13.1\" outdoor viewable', 'Field ops'],
            ['Operating System', 'Windows 10/11 Pro (as refurbished/quoted)', 'Confirm supportability'],
            ['Rugged', 'MIL-STD-810G, IP65', 'Fully rugged'],
            ['Warranty', 'As contracted', 'Support']
        ]
    },
    {
        id: 'hp-probook-450-g10',
        brand: 'HP',
        model: 'ProBook 450 G10',
        category: 'laptop',
        names: ['HP ProBook 450 G10', 'ProBook 450 G10'],
        aliases: ['probook 450', 'hp 450 g10'],
        specs: [
            ['Processor', 'Intel Core i5/i7 (13th Gen) options', 'General office workload'],
            ['RAM', '8–16 GB DDR4/DDR5', 'Confirm expandable config'],
            ['Storage', '256–512 GB NVMe SSD', 'Minimum 512 GB preferred'],
            ['Display', '15.6\" FHD', 'Standard workstation screen'],
            ['Operating System', 'Windows 11 Pro', 'Domain compliance'],
            ['Connectivity', 'USB-A/C, HDMI, RJ-45 (model dependent), Wi-Fi 6', 'Peripheral support'],
            ['Security', 'TPM 2.0', 'BitLocker ready'],
            ['Warranty', '1–3 years as quoted', 'Prefer 3-year cover']
        ]
    },
    {
        id: 'dell-latitude-5440',
        brand: 'Dell',
        model: 'Latitude 5440',
        category: 'laptop',
        names: ['Dell Latitude 5440', 'Latitude 5440'],
        aliases: ['latitude 5440', 'dell 5440'],
        specs: [
            ['Processor', 'Intel Core i5/i7 (13th Gen) options', 'Business productivity'],
            ['RAM', '16 GB DDR4/DDR5 typical', 'Multitasking'],
            ['Storage', '512 GB NVMe SSD', 'Performance storage'],
            ['Display', '14\" FHD', 'Office use'],
            ['Operating System', 'Windows 11 Pro', 'Domain join'],
            ['Connectivity', 'USB-C, HDMI, Wi-Fi 6E, optional WWAN', 'Flexible connectivity'],
            ['Security', 'TPM 2.0, optional fingerprint/smart card', 'Enterprise security'],
            ['Warranty', '3 years ProSupport preferred', 'Service continuity']
        ]
    },
    {
        id: 'dell-optiplex-7010',
        brand: 'Dell',
        model: 'OptiPlex 7010',
        category: 'desktop',
        names: ['Dell OptiPlex 7010', 'OptiPlex 7010'],
        aliases: ['optiplex 7010', 'dell desktop 7010'],
        specs: [
            ['Processor', 'Intel Core i5/i7 options', 'Office / admin systems'],
            ['RAM', '16 GB DDR4 (expandable)', 'Multitasking capacity'],
            ['Storage', '512 GB NVMe SSD', 'Fast local storage'],
            ['Form Factor', 'SFF / Micro / Tower (confirm)', 'Space constraints'],
            ['Operating System', 'Windows 11 Pro', 'Domain compliance'],
            ['Ports', 'USB 3.x, HDMI/DP, Ethernet', 'Peripheral connectivity'],
            ['Graphics', 'Integrated Intel graphics', 'Standard office use'],
            ['Warranty', '3 years parts and labour preferred', 'Lifecycle support']
        ]
    },
    {
        id: 'lenovo-thinkpad-t14',
        brand: 'Lenovo',
        model: 'ThinkPad T14',
        category: 'laptop',
        names: ['Lenovo ThinkPad T14', 'ThinkPad T14'],
        aliases: ['thinkpad t14', 'lenovo t14'],
        specs: [
            ['Processor', 'Intel Core / AMD Ryzen Pro options', 'Confirm generation on quote'],
            ['RAM', '16 GB (expandable on many SKUs)', 'Office multitasking'],
            ['Storage', '512 GB NVMe SSD', 'Performance storage'],
            ['Display', '14\" FHD / optional higher panels', 'Office readability'],
            ['Operating System', 'Windows 11 Pro', 'Domain join'],
            ['Connectivity', 'USB-C/Thunderbolt, HDMI, Wi-Fi 6, Ethernet (dock/adapter)', 'Docking ready'],
            ['Security', 'TPM 2.0, fingerprint, ThinkShield', 'Enterprise security'],
            ['Warranty', '3 years onsite preferred', 'Service continuity']
        ]
    },
    {
        id: 'canon-imagerunner-c3025i',
        brand: 'Canon',
        model: 'imageRUNNER C3025i',
        category: 'printer',
        names: [
            'Canon imageRUNNER C3025i',
            'Canon imageRUNNER ADVANCE C3025i',
            'imageRUNNER C3025i',
            'iR C3025i'
        ],
        aliases: ['c3025i', 'ir c3025i', 'imagerunner c3025'],
        specs: [
            ['Device Type', 'Colour A3 multifunctional (print / copy / scan; fax optional)', 'From Canon imageRUNNER C3025i datasheet'],
            ['Print Technology', 'Colour laser beam printing', 'V2 (Vivid & Vibrant) imaging'],
            ['Print Speed', '25 ppm A4 (BW/CL); 15 ppm A3', 'Workgroup colour MFP'],
            ['Print Resolution', '600 × 600 dpi; 1200 × 1200 dpi', 'Document quality'],
            ['PDL', 'UFR II, PCL 6 (standard); Genuine Adobe PS Level 3 optional', 'Fleet / SAP / mixed OS'],
            ['Duplex', 'Automatic (standard)', 'Paper economy'],
            ['Copy Speed', '25 ppm A4 (BW/CL); first copy ≈ 5.9s BW / 8.2s CL', 'Walk-up copying'],
            ['Send / Scan', 'E-mail, SMB, FTP; optional Super G3 FAX', 'Digital workflow'],
            ['Paper', 'Up to A3; optional Cassette Feeding Unit-AP1 2 × 550 sheets (52–220 gsm)', 'Office mixed media'],
            ['Consumables', 'C-EXV 54 toner BK/C/M/Y (BK 15,500; C/M/Y 8,500 @ 5%)', 'Match stores toner SKUs'],
            ['Power', '220–240 V; TEC 0.9 kWh; sleep ≈ 2 W; ENERGY STAR / Blue Angel', 'Energy-efficient plant'],
            ['Interface', '12.7 cm (5\") colour touch panel; mobile print (AirPrint, Mopria)', 'Easy walk-up use']
        ]
    },
    {
        id: 'hp-laserjet-pro-m404',
        brand: 'HP',
        model: 'LaserJet Pro M404',
        category: 'printer',
        names: ['HP LaserJet Pro M404', 'LaserJet M404dn', 'LaserJet M404n'],
        aliases: ['laserjet m404', 'hp m404'],
        specs: [
            ['Print Technology', 'Monochrome laser', 'High-volume office printing'],
            ['Print Speed', 'Up to ~38 ppm A4 (typical)', 'Unit throughput'],
            ['Resolution', 'Up to 1200 x 1200 dpi', 'Document quality'],
            ['Paper Handling', 'A4; duplex on dn models', 'Paper economy'],
            ['Connectivity', 'USB + Ethernet', 'Network sharing'],
            ['Duty Cycle', 'Suitable for workgroup volumes', 'Match unit demand'],
            ['Consumables', 'HP 58A/58X toner family (confirm)', 'Running cost planning'],
            ['Drivers / Compatibility', 'Windows 10/11', 'IT-DIR OS support'],
            ['Warranty', '1 year typical (+ care packs)', 'Service cover']
        ]
    },
    {
        id: 'canon-imageclass-mf445',
        brand: 'Canon',
        model: 'imageCLASS MF445dw',
        category: 'printer',
        names: ['Canon imageCLASS MF445dw', 'Canon MF445dw'],
        aliases: ['mf445', 'canon mf445', 'imageclass mf445'],
        specs: [
            ['Print Technology', 'Monochrome laser MFP', 'Print/scan/copy for offices'],
            ['Print Speed', '~38 ppm class', 'Workgroup throughput'],
            ['Resolution', '600 x 600 dpi (enhanced higher)', 'Business documents'],
            ['Paper Handling', 'A4 duplex automatic', 'Paper economy'],
            ['Connectivity', 'USB, Ethernet, Wi-Fi', 'Flexible sharing'],
            ['ADF', 'Duplex ADF', 'Multi-page scanning'],
            ['Drivers / Compatibility', 'Windows 10/11', 'Standard OS support'],
            ['Warranty', 'Manufacturer warranty as quoted', 'Confirm with supplier']
        ]
    },
    {
        id: 'cisco-catalyst-9200',
        brand: 'Cisco',
        model: 'Catalyst 9200',
        category: 'network',
        names: ['Cisco Catalyst 9200', 'Catalyst 9200 Switch'],
        aliases: ['c9200', 'catalyst 9200'],
        specs: [
            ['Device Type', 'Managed access switch', 'LAN access layer'],
            ['Ports / Throughput', '24/48-port SKUs; Gigabit / Multigig options', 'Match site design'],
            ['Management', 'CLI / DNA Center / web as licensed', 'Central administration'],
            ['PoE', 'PoE+ / UPOE models available', 'AP and phone power'],
            ['Standards', '1G/2.5G/10G uplinks depending on SKU', 'Interoperability'],
            ['Security Features', '802.1X, ACLs, TrustSec (license dependent)', 'Network defence'],
            ['Warranty', 'Cisco limited lifetime / as contracted', 'Support window']
        ]
    },
    {
        id: 'hpe-proliant-dl380',
        brand: 'HPE',
        model: 'ProLiant DL380 Gen11',
        category: 'server',
        names: [
            'HPE ProLiant DL380 Gen11',
            'HP ProLiant DL380 Gen11',
            'HPE ProLiant DL380',
            'HP ProLiant DL380',
            'DL380 Gen10/Gen11'
        ],
        aliases: ['dl380', 'proliant dl380', 'dl380 gen11'],
        specs: [
            ['Operating System', 'Windows Server 2019/2022 and licence key', 'AD, DNS, file/print, and app services'],
            ['Processor', '5th Gen Intel Xeon Scalable Processors', 'Virtualization and enterprise workloads'],
            ['Memory (RAM)', 'ECC DDR5 — per workload (platform supports high capacity)', 'Stable server memory'],
            ['Memory Channels', '16 DIMM channels per processor', 'Memory bandwidth for dual-socket configs'],
            ['Boot Storage', 'RAID M.2 boot options', 'Dedicated OS / hypervisor boot volume'],
            ['Internal Storage', 'Up to 20 EDSFF drive bays (config dependent)', 'Data and VM storage'],
            ['RAID / Storage Controller', 'HPE Smart Array / MR controller', 'Hardware RAID and array management'],
            ['Expansion Slots', 'PCIe Gen5 slots and risers', 'NIC, HBA, and GPU expansion'],
            ['Graphics / GPUs', 'Up to 8 single-wide GPUs (optional)', 'VDI / compute GPU workloads only'],
            ['Network', 'Flexible LOM; 1/10/25GbE options', 'Service availability'],
            ['Power Supply', 'Redundant hot-plug PSU', 'Uptime and failover'],
            ['Form Factor', '2U rack', 'Standard server room rack mount'],
            ['Remote Management', 'HPE iLO 6 (licensed)', 'Out-of-band administration'],
            ['Warranty', '1 year minimum; 3–5 years onsite preferred', 'Mission-critical cover']
        ]
    },
    {
        id: 'asus-vivobook-15',
        brand: 'ASUS',
        model: 'VivoBook 15',
        category: 'laptop',
        names: ['ASUS VivoBook 15', 'Asus Vivobook 15'],
        aliases: ['vivobook 15', 'asus vivobook'],
        specs: [
            ['Processor', 'Intel Core i5 / AMD Ryzen 5 options', 'General office use'],
            ['RAM', '8–16 GB DDR4', 'Confirm configuration'],
            ['Storage', '512 GB SSD (NVMe typical)', 'Fast local storage'],
            ['Display', '15.6\" FHD', 'Standard office screen'],
            ['Operating System', 'Windows 11 Pro / Home (confirm)', 'Prefer Pro for domain'],
            ['Storage Type', 'SSD / NVMe SSD', 'Prefer SSD over HDD'],
            ['Warranty', '1–2 years typical', 'Confirm supplier cover']
        ]
    },
    {
        id: 'acer-aspire-5',
        brand: 'Acer',
        model: 'Aspire 5',
        category: 'laptop',
        names: ['Acer Aspire 5', 'Aspire 5'],
        aliases: ['aspire 5', 'acer aspire'],
        specs: [
            ['Processor', 'Intel Core i5 / AMD Ryzen 5', 'Office productivity'],
            ['RAM', '8–16 GB', 'Multitasking'],
            ['Storage', '512 GB SSD', 'Boot and apps'],
            ['Display', '15.6\" FHD IPS typical', 'Office readability'],
            ['Operating System', 'Windows 11', 'Prefer Pro SKU'],
            ['Storage Type', 'SSD', 'Not HDD-primary'],
            ['Warranty', '1–2 years', 'Confirm quote']
        ]
    },
    {
        id: 'dell-precision-3680',
        brand: 'Dell',
        model: 'Precision 3680 Tower',
        category: 'desktop',
        names: ['Dell Precision 3680', 'Precision 3680'],
        aliases: ['precision 3680', 'dell workstation'],
        specs: [
            ['Processor', 'Intel Core i7 / Xeon options', 'CAD / heavier workloads'],
            ['RAM', '32 GB DDR5 typical', 'Workstation multitasking'],
            ['Storage', '512 GB–1 TB NVMe SSD', 'Project data'],
            ['Storage Type', 'NVMe SSD (+ optional HDD)', 'Performance first'],
            ['Graphics', 'Optional discrete NVIDIA', 'Technical drawing if required'],
            ['Operating System', 'Windows 11 Pro', 'Domain join'],
            ['Warranty', '3 years ProSupport preferred', 'Service continuity']
        ]
    },
    {
        id: 'hp-elite-desk-800',
        brand: 'HP',
        model: 'EliteDesk 800 G9',
        category: 'desktop',
        names: ['HP EliteDesk 800 G9', 'EliteDesk 800'],
        aliases: ['elitedesk 800', 'hp 800 g9'],
        specs: [
            ['Processor', 'Intel Core i5/i7 (12th/13th Gen)', 'Office / admin'],
            ['RAM', '16 GB DDR4/DDR5', 'Expandable'],
            ['Storage', '512 GB NVMe SSD', 'Fast storage'],
            ['Storage Type', 'NVMe SSD', 'Preferred'],
            ['Form Factor', 'SFF / Desktop', 'Office desks'],
            ['Operating System', 'Windows 11 Pro', 'Domain compliance'],
            ['Warranty', '3 years onsite preferred', 'TCO']
        ]
    },
    {
        id: 'lenovo-thinkcentre-m70q',
        brand: 'Lenovo',
        model: 'ThinkCentre M70q',
        category: 'desktop',
        names: ['Lenovo ThinkCentre M70q', 'ThinkCentre M70q'],
        aliases: ['m70q', 'thinkcentre m70q'],
        specs: [
            ['Processor', 'Intel Core i5 options', 'Office workloads'],
            ['RAM', '16 GB', 'Multitasking'],
            ['Storage', '512 GB SSD', 'Local apps'],
            ['Storage Type', 'SSD / NVMe', 'Performance'],
            ['Form Factor', 'Tiny / Mini PC', 'Space saving'],
            ['Operating System', 'Windows 11 Pro', 'Domain join'],
            ['Warranty', '3 years preferred', 'Service']
        ]
    },
    {
        id: 'hp-laserjet-m428',
        brand: 'HP',
        model: 'LaserJet Pro MFP M428fdw',
        category: 'printer',
        names: ['HP LaserJet Pro MFP M428', 'LaserJet M428fdw'],
        aliases: ['m428', 'hp m428', 'laserjet mfp m428'],
        specs: [
            ['Print Technology', 'Monochrome laser MFP', 'Print/scan/copy/fax'],
            ['Print Speed', '~38 ppm class', 'Workgroup'],
            ['Connectivity', 'Ethernet, USB, Wi-Fi', 'Network share'],
            ['Paper Handling', 'A4 duplex', 'Paper economy'],
            ['Duty Cycle', 'Workgroup monthly volumes', 'Match unit demand'],
            ['Warranty', '1 year + care packs', 'Service']
        ]
    },
    {
        id: 'epson-ecotank-l3250',
        brand: 'Epson',
        model: 'EcoTank L3250',
        category: 'printer',
        names: ['Epson EcoTank L3250', 'Epson L3250'],
        aliases: ['ecotank l3250', 'epson l3250'],
        specs: [
            ['Print Technology', 'Colour inkjet EcoTank', 'Low running cost colour'],
            ['Connectivity', 'USB, Wi-Fi', 'Small office'],
            ['Paper Handling', 'A4', 'General documents'],
            ['Consumables', 'Refillable ink tanks', 'TCO advantage'],
            ['Warranty', 'Manufacturer warranty as quoted', 'Confirm']
        ]
    },
    {
        id: 'dell-latitude-5540',
        brand: 'Dell',
        model: 'Latitude 5540',
        category: 'laptop',
        names: ['Dell Latitude 5540', 'Latitude 5540'],
        aliases: ['latitude 5540', 'dell 5540'],
        specs: [
            ['Processor', 'Intel Core i5/i7 (13th Gen) / Ultra 5/7 options', 'Business productivity'],
            ['RAM', '16 GB DDR4/DDR5', 'Multitasking'],
            ['Storage', '512 GB NVMe SSD', 'Fast storage'],
            ['Storage Type', 'NVMe SSD', 'Preferred'],
            ['Display', '15.6\" FHD', 'Office screen'],
            ['Operating System', 'Windows 11 Pro', 'Domain join'],
            ['Warranty', '3 years ProSupport preferred', 'Service']
        ]
    },
    {
        id: 'dell-latitude-7440',
        brand: 'Dell',
        model: 'Latitude 7440',
        category: 'laptop',
        names: ['Dell Latitude 7440', 'Latitude 7440'],
        aliases: ['latitude 7440'],
        specs: [
            ['Processor', 'Intel Core Ultra 5 / Ultra 7', 'Premium thin-and-light'],
            ['RAM', '16–32 GB LPDDR5', 'Heavy multitasking'],
            ['Storage', '512 GB–1 TB NVMe SSD', 'Performance'],
            ['Storage Type', 'NVMe SSD', 'Preferred'],
            ['Display', '14\" FHD / QHD options', 'Executive use'],
            ['Operating System', 'Windows 11 Pro', 'Domain join'],
            ['Warranty', '3 years preferred', 'Service']
        ]
    },
    {
        id: 'dell-vostro-3520',
        brand: 'Dell',
        model: 'Vostro 3520',
        category: 'laptop',
        names: ['Dell Vostro 3520', 'Vostro 3520'],
        aliases: ['vostro 3520'],
        specs: [
            ['Processor', 'Intel Core i3/i5 options', 'Entry/mid office'],
            ['RAM', '8–16 GB', 'Confirm config'],
            ['Storage', '256–512 GB SSD', 'Prefer 512 GB'],
            ['Storage Type', 'SSD', 'Preferred over HDD'],
            ['Display', '15.6\" FHD', 'Standard'],
            ['Operating System', 'Windows 11 Pro', 'Domain'],
            ['Warranty', '1–3 years', 'Confirm']
        ]
    },
    {
        id: 'hp-elitebook-860-g10',
        brand: 'HP',
        model: 'EliteBook 860 G10',
        category: 'laptop',
        names: ['HP EliteBook 860 G10', 'EliteBook 860 G10'],
        aliases: ['elitebook 860', 'hp 860 g10'],
        specs: [
            ['Processor', 'Intel Core i5/i7 (13th Gen)', 'Enterprise'],
            ['RAM', '16 GB DDR5', 'Multitasking'],
            ['Storage', '512 GB NVMe SSD', 'Fast'],
            ['Storage Type', 'NVMe SSD', 'Preferred'],
            ['Display', '16\" WUXGA', 'Productivity'],
            ['Operating System', 'Windows 11 Pro', 'Domain'],
            ['Warranty', '3 years onsite preferred', 'TCO']
        ]
    },
    {
        id: 'hp-probook-440-g10',
        brand: 'HP',
        model: 'ProBook 440 G10',
        category: 'laptop',
        names: ['HP ProBook 440 G10', 'ProBook 440 G10'],
        aliases: ['probook 440', 'hp 440 g10'],
        specs: [
            ['Processor', 'Intel Core i5 options', 'Office'],
            ['RAM', '8–16 GB', 'Prefer 16 GB'],
            ['Storage', '512 GB SSD', 'Apps and files'],
            ['Storage Type', 'SSD / NVMe', 'Preferred'],
            ['Display', '14\" FHD', 'Portable'],
            ['Operating System', 'Windows 11 Pro', 'Domain'],
            ['Warranty', '1–3 years', 'Confirm']
        ]
    },
    {
        id: 'lenovo-thinkpad-e14',
        brand: 'Lenovo',
        model: 'ThinkPad E14 Gen 5',
        category: 'laptop',
        names: ['Lenovo ThinkPad E14', 'ThinkPad E14 Gen 5'],
        aliases: ['thinkpad e14', 'e14 gen 5'],
        specs: [
            ['Processor', 'Intel Core i5 / AMD Ryzen 5', 'Office'],
            ['RAM', '16 GB', 'Multitasking'],
            ['Storage', '512 GB NVMe SSD', 'Performance'],
            ['Storage Type', 'NVMe SSD', 'Preferred'],
            ['Display', '14\" FHD', 'Office'],
            ['Operating System', 'Windows 11 Pro', 'Domain'],
            ['Warranty', '1–3 years', 'Prefer 3-year']
        ]
    },
    {
        id: 'lenovo-thinkpad-l15',
        brand: 'Lenovo',
        model: 'ThinkPad L15 Gen 4',
        category: 'laptop',
        names: ['Lenovo ThinkPad L15', 'ThinkPad L15 Gen 4'],
        aliases: ['thinkpad l15', 'l15 gen 4'],
        specs: [
            ['Processor', 'Intel Core i5/i7 / AMD Ryzen 5/7', 'Workgroup'],
            ['RAM', '16 GB', 'Multitasking'],
            ['Storage', '512 GB SSD', 'Local storage'],
            ['Storage Type', 'SSD', 'Preferred'],
            ['Display', '15.6\" FHD', 'Standard'],
            ['Operating System', 'Windows 11 Pro', 'Domain'],
            ['Warranty', '3 years preferred', 'Service']
        ]
    },
    {
        id: 'lenovo-ideapad-3',
        brand: 'Lenovo',
        model: 'IdeaPad 3 / 15',
        category: 'laptop',
        names: ['Lenovo IdeaPad 3', 'IdeaPad 15'],
        aliases: ['ideapad 3', 'ideapad 15'],
        specs: [
            ['Processor', 'Intel Core i3/i5 / AMD Ryzen 3/5', 'Entry office'],
            ['RAM', '8 GB (upgradeable on many SKUs)', 'Prefer 16 GB'],
            ['Storage', '256–512 GB SSD', 'Prefer 512 GB'],
            ['Storage Type', 'SSD', 'Avoid HDD-only'],
            ['Display', '15.6\" FHD', 'Standard'],
            ['Operating System', 'Windows 11', 'Prefer Pro'],
            ['Warranty', '1–2 years', 'Confirm']
        ]
    },
    {
        id: 'asus-expertbook-b5',
        brand: 'ASUS',
        model: 'ExpertBook B5',
        category: 'laptop',
        names: ['ASUS ExpertBook B5', 'ExpertBook B5'],
        aliases: ['expertbook b5', 'asus b5'],
        specs: [
            ['Processor', 'Intel Core i5/i7 / Ultra options', 'Business'],
            ['RAM', '16 GB', 'Multitasking'],
            ['Storage', '512 GB NVMe SSD', 'Fast'],
            ['Storage Type', 'NVMe SSD', 'Preferred'],
            ['Display', '14\" FHD', 'Portable'],
            ['Operating System', 'Windows 11 Pro', 'Domain'],
            ['Warranty', '2–3 years', 'Confirm']
        ]
    },
    {
        id: 'acer-travelmate-p2',
        brand: 'Acer',
        model: 'TravelMate P2',
        category: 'laptop',
        names: ['Acer TravelMate P2', 'TravelMate P214'],
        aliases: ['travelmate p2', 'travelmate p214'],
        specs: [
            ['Processor', 'Intel Core i5', 'Office'],
            ['RAM', '8–16 GB', 'Prefer 16 GB'],
            ['Storage', '512 GB SSD', 'Apps'],
            ['Storage Type', 'SSD', 'Preferred'],
            ['Display', '14\" FHD', 'Portable'],
            ['Operating System', 'Windows 11 Pro', 'Domain'],
            ['Warranty', '1–3 years', 'Confirm']
        ]
    },
    {
        id: 'apple-macbook-air-m2',
        brand: 'Apple',
        model: 'MacBook Air M2',
        category: 'laptop',
        names: ['Apple MacBook Air M2', 'MacBook Air M2'],
        aliases: ['macbook air m2', 'mba m2'],
        specs: [
            ['Processor', 'Apple M2', 'Efficient productivity'],
            ['RAM', '8–16 GB unified memory', 'Prefer 16 GB'],
            ['Storage', '256–512 GB SSD', 'Prefer 512 GB'],
            ['Storage Type', 'SSD', 'Built-in'],
            ['Display', '13.6\" Liquid Retina', 'Clarity'],
            ['Operating System', 'macOS', 'Apple ecosystem / MDM'],
            ['Warranty', '1 year (+ AppleCare)', 'Confirm']
        ]
    },
    {
        id: 'microsoft-surface-laptop-5',
        brand: 'Microsoft',
        model: 'Surface Laptop 5',
        category: 'laptop',
        names: ['Microsoft Surface Laptop 5', 'Surface Laptop 5'],
        aliases: ['surface laptop 5'],
        specs: [
            ['Processor', 'Intel Core i5/i7 (12th Gen)', 'Premium office'],
            ['RAM', '8–16 GB', 'Prefer 16 GB'],
            ['Storage', '256–512 GB SSD', 'Prefer 512 GB'],
            ['Storage Type', 'SSD', 'Preferred'],
            ['Display', '13.5\" / 15\" PixelSense', 'Touch'],
            ['Operating System', 'Windows 11 Pro', 'Domain'],
            ['Warranty', '1 year (+ Microsoft Complete)', 'Confirm']
        ]
    },
    {
        id: 'dell-optiplex-7020',
        brand: 'Dell',
        model: 'OptiPlex 7020',
        category: 'desktop',
        names: ['Dell OptiPlex 7020', 'OptiPlex 7020'],
        aliases: ['optiplex 7020'],
        specs: [
            ['Processor', 'Intel Core i5/i7 options', 'Office desktop'],
            ['RAM', '16 GB DDR5', 'Multitasking'],
            ['Storage', '512 GB NVMe SSD', 'Fast'],
            ['Storage Type', 'NVMe SSD (+ optional HDD)', 'Hybrid possible'],
            ['Form Factor', 'SFF / Tower', 'Confirm'],
            ['Operating System', 'Windows 11 Pro', 'Domain'],
            ['Warranty', '3 years preferred', 'Service']
        ]
    },
    {
        id: 'hp-prodesk-400-g9',
        brand: 'HP',
        model: 'ProDesk 400 G9',
        category: 'desktop',
        names: ['HP ProDesk 400 G9', 'ProDesk 400 G9'],
        aliases: ['prodesk 400', 'hp 400 g9'],
        specs: [
            ['Processor', 'Intel Core i5', 'Office'],
            ['RAM', '8–16 GB', 'Prefer 16 GB'],
            ['Storage', '512 GB SSD', 'Local'],
            ['Storage Type', 'SSD', 'Preferred'],
            ['Form Factor', 'SFF', 'Desk space'],
            ['Operating System', 'Windows 11 Pro', 'Domain'],
            ['Warranty', '3 years preferred', 'Service']
        ]
    },
    {
        id: 'lenovo-thinkcentre-m90t',
        brand: 'Lenovo',
        model: 'ThinkCentre M90t',
        category: 'desktop',
        names: ['Lenovo ThinkCentre M90t', 'ThinkCentre M90t'],
        aliases: ['m90t', 'thinkcentre m90t'],
        specs: [
            ['Processor', 'Intel Core i5/i7', 'Office / light CAD'],
            ['RAM', '16–32 GB', 'Expandable'],
            ['Storage', '512 GB–1 TB NVMe SSD', 'Performance'],
            ['Storage Type', 'NVMe SSD', 'Preferred'],
            ['Form Factor', 'Tower', 'Expansion'],
            ['Operating System', 'Windows 11 Pro', 'Domain'],
            ['Warranty', '3 years preferred', 'Service']
        ]
    },
    {
        id: 'asus-expertcenter-d5',
        brand: 'ASUS',
        model: 'ExpertCenter D5 Mini Tower',
        category: 'desktop',
        names: ['ASUS ExpertCenter D5', 'ExpertCenter D5'],
        aliases: ['expertcenter d5', 'asus d5'],
        specs: [
            ['Processor', 'Intel Core i5/i7', 'Office'],
            ['RAM', '16 GB', 'Multitasking'],
            ['Storage', '512 GB SSD', 'Local'],
            ['Storage Type', 'SSD', 'Preferred'],
            ['Form Factor', 'Mini Tower', 'Office'],
            ['Operating System', 'Windows 11 Pro', 'Domain'],
            ['Warranty', '2–3 years', 'Confirm']
        ]
    },
    {
        id: 'acer-veriton-x',
        brand: 'Acer',
        model: 'Veriton X Desktop',
        category: 'desktop',
        names: ['Acer Veriton X', 'Veriton X'],
        aliases: ['veriton x', 'acer veriton'],
        specs: [
            ['Processor', 'Intel Core i5', 'Office'],
            ['RAM', '8–16 GB', 'Prefer 16 GB'],
            ['Storage', '512 GB SSD', 'Local'],
            ['Storage Type', 'SSD', 'Preferred'],
            ['Form Factor', 'SFF', 'Compact'],
            ['Operating System', 'Windows 11 Pro', 'Domain'],
            ['Warranty', '1–3 years', 'Confirm']
        ]
    },
    {
        id: 'samsung-galaxy-tab-s9-plus',
        brand: 'Samsung',
        model: 'Galaxy Tab S9+',
        category: 'other',
        names: ['Samsung Galaxy Tab S9+', 'Galaxy Tab S9 Plus'],
        aliases: ['tab s9+', 'galaxy tab s9 plus'],
        specs: [
            ['Device Type', 'Android tablet', 'Larger briefing tablet'],
            ['Processor', 'Snapdragon 8 Gen 2 for Galaxy', 'Flagship'],
            ['RAM', '12 GB', 'Multitasking'],
            ['Storage', '256 GB (microSD expandable)', 'Documents'],
            ['Display', '12.4\" Dynamic AMOLED 2X', 'Briefings'],
            ['Operating System', 'Android (One UI)', 'MDM / Knox'],
            ['Warranty', '1–2 years', 'Confirm']
        ]
    },
    {
        id: 'apple-ipad-air-m2',
        brand: 'Apple',
        model: 'iPad Air M2',
        category: 'other',
        names: ['Apple iPad Air M2', 'iPad Air (M2)'],
        aliases: ['ipad air m2', 'ipad air 6'],
        specs: [
            ['Device Type', 'iPad tablet', 'Secure mobile'],
            ['Processor', 'Apple M2', 'Productivity'],
            ['RAM', '8 GB unified', 'Apps'],
            ['Storage', '128–256 GB+', 'Prefer 256 GB'],
            ['Display', '11\" Liquid Retina', 'Documents'],
            ['Operating System', 'iPadOS', 'MDM'],
            ['Warranty', '1 year (+ AppleCare)', 'Confirm']
        ]
    },
    {
        id: 'lenovo-tab-p11',
        brand: 'Lenovo',
        model: 'Tab P11 Pro',
        category: 'other',
        names: ['Lenovo Tab P11 Pro', 'Tab P11'],
        aliases: ['tab p11', 'lenovo p11'],
        specs: [
            ['Device Type', 'Android tablet', 'Training / field'],
            ['Processor', 'MediaTek / Snapdragon mid-class', 'Everyday'],
            ['RAM', '6–8 GB', 'Multitasking'],
            ['Storage', '128 GB expandable', 'Offline content'],
            ['Display', '11\" class', 'Manuals'],
            ['Operating System', 'Android', 'MDM'],
            ['Warranty', '1 year typical', 'Confirm']
        ]
    },
    {
        id: 'brother-hl-l6415',
        brand: 'Brother',
        model: 'HL-L6415DW',
        category: 'printer',
        names: ['Brother HL-L6415DW', 'Brother L6415'],
        aliases: ['hl-l6415', 'brother l6415'],
        specs: [
            ['Print Technology', 'Monochrome laser', 'Workgroup'],
            ['Print Speed', '50+ ppm class', 'High volume'],
            ['Connectivity', 'Ethernet, USB, Wi-Fi', 'Network'],
            ['Paper Handling', 'A4 duplex', 'Economy'],
            ['Duty Cycle', 'High monthly duty', 'Busy offices'],
            ['Warranty', 'Manufacturer warranty', 'Confirm']
        ]
    },
    {
        id: 'canon-imageclass-mf455',
        brand: 'Canon',
        model: 'imageCLASS MF455dw',
        category: 'printer',
        names: ['Canon imageCLASS MF455dw', 'Canon MF455dw'],
        aliases: ['mf455', 'canon mf455'],
        specs: [
            ['Print Technology', 'Monochrome laser MFP', 'Print/scan/copy'],
            ['Print Speed', '~40 ppm class', 'Workgroup'],
            ['Connectivity', 'Ethernet, USB, Wi-Fi', 'Network'],
            ['Paper Handling', 'A4 duplex + ADF', 'Multi-page'],
            ['Warranty', 'Manufacturer warranty', 'Confirm']
        ]
    },
    {
        id: 'hp-color-laserjet-m455',
        brand: 'HP',
        model: 'Color LaserJet Pro M455dn',
        category: 'printer',
        names: ['HP Color LaserJet Pro M455', 'LaserJet M455dn'],
        aliases: ['m455', 'color laserjet m455'],
        specs: [
            ['Print Technology', 'Colour laser', 'Colour docs'],
            ['Print Speed', '~27 ppm class', 'Office colour'],
            ['Connectivity', 'Ethernet, USB', 'Network'],
            ['Paper Handling', 'A4 duplex', 'Economy'],
            ['Consumables', 'HP toner cartridges (confirm)', 'Running cost'],
            ['Warranty', '1 year + care packs', 'Confirm']
        ]
    },
    {
        id: 'dell-poweredge-r750',
        brand: 'Dell',
        model: 'PowerEdge R750',
        category: 'server',
        names: ['Dell PowerEdge R750', 'PowerEdge R750', 'Dell R750'],
        aliases: ['r750', 'poweredge r750'],
        specs: [
            ['Operating System', 'Windows Server 2019/2022 and licence key', 'Enterprise services platform'],
            ['Processor', 'Intel Xeon Scalable (dual-socket capable)', 'Virtualization and databases'],
            ['Memory (RAM)', '64 GB+ ECC DDR4/DDR5 (expandable)', 'Server capacity and stability'],
            ['Memory Channels', '16 DIMM channels per processor', 'Dual-socket memory bandwidth'],
            ['Boot Storage', 'BOSS-S2 / NVMe M.2 boot RAID', 'OS boot separate from data'],
            ['Internal Storage', 'Up to 16 drives (2.5\" / 3.5\" options)', 'Enterprise SSD/HDD/NVMe'],
            ['RAID / Storage Controller', 'Dell PERC H755 / H965 (hardware RAID)', 'Redundancy and performance'],
            ['Expansion Slots', 'PCIe Gen4 slots and risers', 'NIC, HBA, GPU expansion'],
            ['Graphics / GPUs', 'Optional GPU(s) per workload', 'VDI / compute only if required'],
            ['Network', 'Dual 1GbE OCP; 10/25GbE optional', 'Network throughput'],
            ['Power Supply', 'Redundant hot-plug PSU (1400W+ class)', 'High availability'],
            ['Form Factor', '2U rack', 'Server room fit'],
            ['Remote Management', 'Dell iDRAC9 Enterprise', 'Remote administration'],
            ['Warranty', '3–5 years ProSupport onsite preferred', 'Critical infrastructure cover']
        ]
    },
    {
        id: 'cisco-catalyst-9300',
        brand: 'Cisco',
        model: 'Catalyst 9300',
        category: 'network',
        names: ['Cisco Catalyst 9300', 'Catalyst 9300 Switch'],
        aliases: ['c9300', 'catalyst 9300'],
        specs: [
            ['Device Type', 'Managed access/distribution switch', 'Campus LAN'],
            ['Ports / Throughput', '24/48-port; Multigig / 10G options', 'Site design'],
            ['Management', 'CLI / DNA Center', 'Central admin'],
            ['PoE', 'PoE+ / UPOE models', 'AP / phones'],
            ['Warranty', 'As contracted', 'Support']
        ]
    }
];

/** Facets for intelligent Spec Evaluation search (min-spec guided). */
const SPEC_SEARCH_FACETS = {
    productTypes: [
        { value: 'laptop', label: 'Laptop' },
        { value: 'desktop', label: 'Desktop Computer' },
        { value: 'tablet', label: 'Tablet' },
        { value: 'printer', label: 'Printer' },
        { value: 'server', label: 'Server' },
        { value: 'network', label: 'Network Equipment' },
        { value: 'other', label: 'Other ICT Equipment' }
    ],
    brands: [
        'Any', 'Dell', 'HP', 'Lenovo', 'ASUS', 'Acer', 'Apple', 'Samsung', 'Panasonic',
        'Canon', 'Epson', 'Brother', 'Cisco', 'HPE', 'Microsoft'
    ],
    processorTypes: [
        { value: 'any', label: 'Any processor type', manufacturer: '' },
        /* —— Intel (x86-64) —— */
        { value: 'intel-core-ultra-s3-x9', label: 'Intel — Core Ultra Series 3 X9', manufacturer: 'Intel', re: /core\s*ultra\s*(series\s*)?3[^\n]*x9|\bultra\s*x9\b/i },
        { value: 'intel-core-ultra-s3-x7', label: 'Intel — Core Ultra Series 3 X7', manufacturer: 'Intel', re: /core\s*ultra\s*(series\s*)?3[^\n]*x7|\bultra\s*x7\b/i },
        { value: 'intel-core-ultra-s3-9', label: 'Intel — Core Ultra Series 3 9', manufacturer: 'Intel', re: /core\s*ultra\s*(series\s*)?3[^\n]*\b9\b(?!\s*x)/i },
        { value: 'intel-core-ultra-s3-7', label: 'Intel — Core Ultra Series 3 7', manufacturer: 'Intel', re: /core\s*ultra\s*(series\s*)?3[^\n]*\b7\b(?!\s*x)/i },
        { value: 'intel-core-ultra-s3-5', label: 'Intel — Core Ultra Series 3 5', manufacturer: 'Intel', re: /core\s*ultra\s*(series\s*)?3[^\n]*\b5\b(?!\s*x)/i },
        { value: 'intel-core-ultra-s2-9', label: 'Intel — Core Ultra Series 2 9', manufacturer: 'Intel', re: /core\s*ultra\s*(series\s*)?2[^\n]*\b9\b/i },
        { value: 'intel-core-ultra-s2-7', label: 'Intel — Core Ultra Series 2 7', manufacturer: 'Intel', re: /core\s*ultra\s*(series\s*)?2[^\n]*\b7\b/i },
        { value: 'intel-core-ultra-s2-5', label: 'Intel — Core Ultra Series 2 5', manufacturer: 'Intel', re: /core\s*ultra\s*(series\s*)?2[^\n]*\b5\b/i },
        { value: 'intel-core-ultra-s1-9', label: 'Intel — Core Ultra Series 1 9', manufacturer: 'Intel', re: /core\s*ultra\s*(series\s*)?1[^\n]*\b9\b|core\s*ultra\s*9(?!\s*(series|x))/i },
        { value: 'intel-core-ultra-s1-7', label: 'Intel — Core Ultra Series 1 7', manufacturer: 'Intel', re: /core\s*ultra\s*(series\s*)?1[^\n]*\b7\b|core\s*ultra\s*7(?!\s*(series|x))/i },
        { value: 'intel-core-ultra-s1-5', label: 'Intel — Core Ultra Series 1 5', manufacturer: 'Intel', re: /core\s*ultra\s*(series\s*)?1[^\n]*\b5\b|core\s*ultra\s*5(?!\s*(series|x))/i },
        { value: 'intel-core-s3-7', label: 'Intel — Core Series 3 7', manufacturer: 'Intel', re: /core\s*(series\s*)?3[^\n]*\b7\b(?!.*ultra)/i },
        { value: 'intel-core-s3-5', label: 'Intel — Core Series 3 5', manufacturer: 'Intel', re: /core\s*(series\s*)?3[^\n]*\b5\b(?!.*ultra)/i },
        { value: 'intel-core-s3-3', label: 'Intel — Core Series 3 3', manufacturer: 'Intel', re: /core\s*(series\s*)?3[^\n]*\b3\b(?!.*ultra)/i },
        { value: 'intel-core-i9', label: 'Intel — Core i9', manufacturer: 'Intel', re: /\b(core\s*)?i\s*9\b|\bi9-\d+/i },
        { value: 'intel-core-i7', label: 'Intel — Core i7', manufacturer: 'Intel', re: /\b(core\s*)?i\s*7\b|\bi7-\d+/i },
        { value: 'intel-core-i5', label: 'Intel — Core i5', manufacturer: 'Intel', re: /\b(core\s*)?i\s*5\b|\bi5-\d+/i },
        { value: 'intel-core-i3', label: 'Intel — Core i3', manufacturer: 'Intel', re: /\b(core\s*)?i\s*3\b|\bi3-\d+/i },
        { value: 'intel-n-series', label: 'Intel — Processor N-Series', manufacturer: 'Intel', re: /\bn\s*-?\s*\d{3,4}\b|processor\s*n[-\s]?series|\bintel\s*n\d+/i },
        { value: 'intel-xeon-600', label: 'Intel — Xeon 600', manufacturer: 'Intel', re: /\bxeon\s*600\b/i },
        { value: 'intel-xeon-6-plus', label: 'Intel — Xeon 6+', manufacturer: 'Intel', re: /\bxeon\s*6\s*\+|xeon\s*6\s*plus/i },
        { value: 'intel-xeon-6', label: 'Intel — Xeon 6', manufacturer: 'Intel', re: /\bxeon\s*6\b(?!\s*\+)/i },
        { value: 'intel-xeon', label: 'Intel — Xeon (other)', manufacturer: 'Intel', re: /\bxeon\b/i },
        /* —— AMD (x86-64) —— */
        { value: 'amd-ryzen-ai-9', label: 'AMD — Ryzen AI 9', manufacturer: 'AMD', re: /ryzen\s*ai\s*9/i },
        { value: 'amd-ryzen-ai-7', label: 'AMD — Ryzen AI 7', manufacturer: 'AMD', re: /ryzen\s*ai\s*7/i },
        { value: 'amd-ryzen-ai-5', label: 'AMD — Ryzen AI 5', manufacturer: 'AMD', re: /ryzen\s*ai\s*5/i },
        { value: 'amd-ryzen-9000-x3d', label: 'AMD — Ryzen 9000 X3D', manufacturer: 'AMD', re: /ryzen\s*9\s*000\s*x3d|ryzen\s*9000\s*x3d|\b\d{4}\s*x3d\b/i },
        { value: 'amd-ryzen-9000', label: 'AMD — Ryzen 9000', manufacturer: 'AMD', re: /ryzen\s*9000\b|ryzen\s*9\s*[0-9]{3}\b/i },
        { value: 'amd-ryzen-9', label: 'AMD — Ryzen 9', manufacturer: 'AMD', re: /ryzen\s*9(?!\s*000|\s*ai)/i },
        { value: 'amd-ryzen-7', label: 'AMD — Ryzen 7', manufacturer: 'AMD', re: /ryzen\s*7(?!\s*ai)/i },
        { value: 'amd-ryzen-5', label: 'AMD — Ryzen 5', manufacturer: 'AMD', re: /ryzen\s*5(?!\s*ai)/i },
        { value: 'amd-ryzen-3', label: 'AMD — Ryzen 3', manufacturer: 'AMD', re: /ryzen\s*3(?!\s*ai)/i },
        { value: 'amd-ryzen-pro', label: 'AMD — Ryzen PRO', manufacturer: 'AMD', re: /ryzen\s*pro/i },
        { value: 'amd-ryzen-z', label: 'AMD — Ryzen Z-Series', manufacturer: 'AMD', re: /ryzen\s*z[-\s]?\d|ryzen\s*z[-\s]?series/i },
        { value: 'amd-threadripper-pro', label: 'AMD — Threadripper PRO', manufacturer: 'AMD', re: /threadripper\s*pro/i },
        { value: 'amd-threadripper', label: 'AMD — Threadripper', manufacturer: 'AMD', re: /threadripper(?!\s*pro)/i },
        { value: 'amd-epyc-9006', label: 'AMD — EPYC 9006', manufacturer: 'AMD', re: /epyc\s*9006/i },
        { value: 'amd-epyc-9005', label: 'AMD — EPYC 9005', manufacturer: 'AMD', re: /epyc\s*9005/i },
        { value: 'amd-epyc', label: 'AMD — EPYC (other)', manufacturer: 'AMD', re: /\bepyc\b/i },
        /* —— Apple (ARM) —— */
        { value: 'apple-m-ultra', label: 'Apple — M-Series Ultra', manufacturer: 'Apple', re: /\bm[1-5]\s*ultra\b|m-series\s*ultra/i },
        { value: 'apple-m-max', label: 'Apple — M-Series Max', manufacturer: 'Apple', re: /\bm[1-5]\s*max\b|m-series\s*max/i },
        { value: 'apple-m-pro', label: 'Apple — M-Series Pro', manufacturer: 'Apple', re: /\bm[1-5]\s*pro\b|m-series\s*pro/i },
        { value: 'apple-m-standard', label: 'Apple — M-Series Standard', manufacturer: 'Apple', re: /\bm[1-5]\b(?!\s*(pro|max|ultra))|apple\s*silicon|m-series\s*standard/i },
        /* —— Qualcomm (ARM) —— */
        { value: 'qualcomm-x2-elite-extreme', label: 'Qualcomm — Snapdragon X2 Elite Extreme', manufacturer: 'Qualcomm', re: /snapdragon\s*x2\s*elite\s*extreme/i },
        { value: 'qualcomm-x2-elite', label: 'Qualcomm — Snapdragon X2 Elite', manufacturer: 'Qualcomm', re: /snapdragon\s*x2\s*elite(?!\s*extreme)/i },
        { value: 'qualcomm-x2-plus', label: 'Qualcomm — Snapdragon X2 Plus', manufacturer: 'Qualcomm', re: /snapdragon\s*x2\s*plus/i },
        { value: 'qualcomm-x-series', label: 'Qualcomm — Snapdragon X-Series', manufacturer: 'Qualcomm', re: /snapdragon\s*x(?!\s*2)|snapdragon\s*x[-\s]?series|snapdragon\s*x\s*elite/i },
        { value: 'qualcomm-snapdragon', label: 'Qualcomm — Snapdragon (other)', manufacturer: 'Qualcomm', re: /snapdragon/i },
        /* —— MediaTek (ARM) —— */
        { value: 'mediatek-kompanio-ultra', label: 'MediaTek — Kompanio Ultra', manufacturer: 'MediaTek', re: /kompanio\s*ultra/i },
        { value: 'mediatek-kompanio-800', label: 'MediaTek — Kompanio 800-Series', manufacturer: 'MediaTek', re: /kompanio\s*8\d{2}/i },
        { value: 'mediatek-kompanio-500', label: 'MediaTek — Kompanio 500-Series', manufacturer: 'MediaTek', re: /kompanio\s*5\d{2}/i },
        { value: 'mediatek-other', label: 'MediaTek — Other (Helio / Dimensity)', manufacturer: 'MediaTek', re: /mediatek|helio|dimensity|kompanio/i }
    ],
    /** Common ICT processor clock speeds (base / boost), 1.0–5.8 GHz */
    processorSpeeds: (() => {
        const opts = [{ value: 'any', label: 'Any processor speed' }];
        for (let ghz = 10; ghz <= 58; ghz += 1) {
            const v = (ghz / 10).toFixed(1);
            opts.push({ value: v, label: `${v} GHz` });
        }
        return opts;
    })(),
    ramOptions: [
        { value: 'any', label: 'Any RAM' },
        { value: '4', label: '4 GB' },
        { value: '6', label: '6 GB' },
        { value: '8', label: '8 GB' },
        { value: '12', label: '12 GB' },
        { value: '16', label: '16 GB' },
        { value: '24', label: '24 GB' },
        { value: '32', label: '32 GB' },
        { value: '48', label: '48 GB' },
        { value: '64', label: '64 GB' },
        { value: '96', label: '96 GB' },
        { value: '128', label: '128 GB' }
    ],
    storageOptions: [
        { value: 'any', label: 'Any storage size' },
        { value: '32', label: '32 GB' },
        { value: '64', label: '64 GB' },
        { value: '128', label: '128 GB' },
        { value: '256', label: '256 GB' },
        { value: '512', label: '512 GB' },
        { value: '1024', label: '1 TB' },
        { value: '2048', label: '2 TB' },
        { value: '4096', label: '4 TB' },
        { value: '8192', label: '8 TB' },
        { value: '16384', label: '16 TB' },
        { value: '20480', label: '20 TB' },
        { value: '24576', label: '24 TB' }
    ],
    /* Storage types — SSD groups aligned to CURRENT MARKET SSD STORAGE TYPES (Aug 2026) */
    storageTypes: [
        { value: 'any', label: 'Any storage type', group: '' },
        /* ——— SATA SSD (SATA III · 6 Gb/s) ——— */
        { value: 'ssd-25-sata', label: '2.5″ SATA SSD', group: 'SATA SSD', re: /2\.?5\s*[\"″]?\s*sata\s*ssd|2\.5.?inch\s*(sata\s*)?ssd|sata\s*2\.5/i },
        { value: 'ssd-m2-sata', label: 'M.2 SATA SSD', group: 'SATA SSD', re: /m\.?\s*2\s*sata|sata\s*m\.?\s*2/i },
        { value: 'ssd-msata', label: 'mSATA SSD', group: 'SATA SSD', re: /\bmsata\b/i },
        { value: 'ssd-sata', label: 'SATA SSD (general)', group: 'SATA SSD', re: /sata\s*ssd|ssd[^\n]{0,30}sata(?!\s*hdd)/i },
        /* ——— NVMe M.2 SSD (laptops / desktops / gaming) ——— */
        { value: 'nvme-m2-gen3', label: 'PCIe Gen 3 NVMe', group: 'NVMe M.2 SSD', re: /pcie\s*(gen\s*)?3[^\n]{0,24}nvme|nvme[^\n]{0,24}(pcie\s*)?(gen\s*)?3\b|m\.?\s*2\s*nvme[^\n]{0,40}gen\s*3/i },
        { value: 'nvme-m2-gen4', label: 'PCIe Gen 4 NVMe', group: 'NVMe M.2 SSD', re: /pcie\s*(gen\s*)?4[^\n]{0,24}nvme|nvme[^\n]{0,24}(pcie\s*)?(gen\s*)?4\b|m\.?\s*2\s*nvme[^\n]{0,40}gen\s*4/i },
        { value: 'nvme-m2-gen5', label: 'PCIe Gen 5 NVMe', group: 'NVMe M.2 SSD', re: /pcie\s*(gen\s*)?5[^\n]{0,24}nvme|nvme[^\n]{0,24}(pcie\s*)?(gen\s*)?5\b|m\.?\s*2\s*nvme[^\n]{0,40}gen\s*5/i },
        { value: 'nvme-m2-2230', label: 'M.2 2230', group: 'NVMe M.2 SSD', re: /m\.?\s*2\s*2230|\b2230\b[^\n]{0,20}(nvme|ssd|m\.?\s*2)/i },
        { value: 'nvme-m2-2242', label: 'M.2 2242', group: 'NVMe M.2 SSD', re: /m\.?\s*2\s*2242|\b2242\b[^\n]{0,20}(nvme|ssd|m\.?\s*2)/i },
        { value: 'nvme-m2-2260', label: 'M.2 2260', group: 'NVMe M.2 SSD', re: /m\.?\s*2\s*2260|\b2260\b[^\n]{0,20}(nvme|ssd|m\.?\s*2)/i },
        { value: 'nvme-m2-2280', label: 'M.2 2280', group: 'NVMe M.2 SSD', re: /m\.?\s*2\s*2280|\b2280\b[^\n]{0,20}(nvme|ssd|m\.?\s*2)/i },
        { value: 'nvme-m2-22110', label: 'M.2 22110', group: 'NVMe M.2 SSD', re: /m\.?\s*2\s*22110|\b22110\b[^\n]{0,20}(nvme|ssd|m\.?\s*2)/i },
        { value: 'nvme', label: 'M.2 NVMe SSD (general)', group: 'NVMe M.2 SSD', re: /\bnvme\b|m\.?\s*2\s*ssd|pcie\s*ssd/i },
        /* ——— Enterprise NVMe SSD (servers / AI / data centres) ——— */
        { value: 'ent-nvme-gen4', label: 'Enterprise NVMe — PCIe Gen 4', group: 'Enterprise NVMe SSD', re: /enterprise[^\n]{0,36}(pcie\s*)?(gen\s*)?4|pcie\s*(gen\s*)?4[^\n]{0,36}enterprise/i },
        { value: 'ent-nvme-gen5', label: 'Enterprise NVMe — PCIe Gen 5', group: 'Enterprise NVMe SSD', re: /enterprise[^\n]{0,36}(pcie\s*)?(gen\s*)?5|pcie\s*(gen\s*)?5[^\n]{0,36}enterprise/i },
        { value: 'ent-nvme-gen6', label: 'Enterprise NVMe — PCIe Gen 6', group: 'Enterprise NVMe SSD', re: /enterprise[^\n]{0,36}(pcie\s*)?(gen\s*)?6|pcie\s*(gen\s*)?6[^\n]{0,36}(nvme|ssd|enterprise)|gen\s*6\s*nvme/i },
        { value: 'nvme-u2', label: 'U.2 NVMe', group: 'Enterprise NVMe SSD', re: /\bu\.?\s*2\b[^\n]{0,24}nvme|nvme[^\n]{0,24}u\.?\s*2\b|\bu2\s*nvme\b/i },
        { value: 'nvme-u3', label: 'U.3 NVMe', group: 'Enterprise NVMe SSD', re: /\bu\.?\s*3\b[^\n]{0,24}nvme|nvme[^\n]{0,24}u\.?\s*3\b|\bu3\s*nvme\b/i },
        { value: 'nvme-aic', label: 'PCIe Add-in Card (AIC)', group: 'Enterprise NVMe SSD', re: /\baic\b[^\n]{0,24}(ssd|nvme)|add[-\s]?in\s*card\s*(ssd|nvme)|hhhl\s*(ssd|nvme)|pcie\s*aic/i },
        /* ——— EDSFF SSD (enterprise & data centre form factor) ——— */
        { value: 'edsff-e1s', label: 'E1.S (Short)', group: 'EDSFF SSD', re: /\be1\.?\s*s\b|edsff\s*e1\.?\s*s|e1s\b/i },
        { value: 'edsff-e1l', label: 'E1.L (Long)', group: 'EDSFF SSD', re: /\be1\.?\s*l\b|edsff\s*e1\.?\s*l|e1l\b/i },
        { value: 'edsff-e3s', label: 'E3.S (Short)', group: 'EDSFF SSD', re: /\be3\.?\s*s\b|edsff\s*e3\.?\s*s|e3s\b/i },
        { value: 'edsff-e3l', label: 'E3.L (Long)', group: 'EDSFF SSD', re: /\be3\.?\s*l\b|edsff\s*e3\.?\s*l|e3l\b/i },
        { value: 'edsff', label: 'EDSFF (general)', group: 'EDSFF SSD', re: /\bedsff\b|enterprise\s*&\s*data\s*center\s*ssd\s*form\s*factor/i },
        /* ——— Enterprise SATA / SAS SSD ——— */
        { value: 'ent-sata-ssd', label: '2.5″ SATA Enterprise SSD', group: 'Enterprise SATA / SAS SSD', re: /2\.?5\s*[\"″]?\s*sata\s*enterprise|enterprise\s*2\.?5[^\n]{0,20}sata\s*ssd|sata\s*enterprise\s*ssd|enterprise\s*sata\s*ssd/i },
        { value: 'ent-sas-ssd', label: 'SAS SSD', group: 'Enterprise SATA / SAS SSD', re: /\bsas\s*ssd\b|ssd[^\n]{0,20}\bsas\b/i },
        /* ——— External SSD ——— */
        { value: 'ext-sata-ssd', label: 'External SATA SSD', group: 'External SSD', re: /external\s*sata\s*ssd|portable\s*sata\s*ssd/i },
        { value: 'ext-nvme-ssd', label: 'External NVMe SSD', group: 'External SSD', re: /external\s*nvme|portable\s*nvme|usb\s*nvme/i },
        { value: 'ext-usb-ssd', label: 'USB SSD', group: 'External SSD', re: /\busb\s*ssd\b|portable\s*ssd(?!\s*hdd)/i },
        { value: 'ext-usb4-ssd', label: 'USB4 SSD', group: 'External SSD', re: /usb\s*4\s*ssd|usb4\s*ssd/i },
        { value: 'ext-thunderbolt-ssd', label: 'Thunderbolt SSD', group: 'External SSD', re: /thunderbolt\s*ssd|tb[345]\s*ssd/i },
        /* ——— NAND Flash Types (cell tech) ——— */
        { value: 'nand-slc', label: 'SLC (1 bit/cell)', group: 'NAND Flash Types', re: /\bslc\b|single[-\s]?level\s*cell/i },
        { value: 'nand-mlc', label: 'MLC (2 bits/cell)', group: 'NAND Flash Types', re: /\bmlc\b|multi[-\s]?level\s*cell/i },
        { value: 'nand-tlc', label: 'TLC (3 bits/cell)', group: 'NAND Flash Types', re: /\btlc\b|triple[-\s]?level\s*cell/i },
        { value: 'nand-qlc', label: 'QLC (4 bits/cell)', group: 'NAND Flash Types', re: /\bqlc\b|quad[-\s]?level\s*cell/i },
        { value: 'nand-plc', label: 'PLC (5 bits/cell)', group: 'NAND Flash Types', re: /\bplc\b|penta[-\s]?level\s*cell|5[-\s]?bit\s*cell/i },
        { value: 'nand-3d', label: '3D NAND', group: 'NAND Flash Types', re: /3d\s*nand|vertically\s*stacked\s*nand|v[-\s]?nand/i },
        /* ——— HDD ——— */
        { value: 'hdd-35-sata', label: '3.5″ SATA HDD', group: 'HDD', re: /3\.?5\s*[\"″]?\s*(sata\s*)?hdd|desktop\s*hdd|3\.5.?inch\s*hdd/i },
        { value: 'hdd-25-sata', label: '2.5″ SATA HDD', group: 'HDD', re: /2\.?5\s*[\"″]?\s*(sata\s*)?hdd|laptop\s*hdd|2\.5.?inch\s*hdd/i },
        { value: 'hdd-sas', label: 'SAS HDD', group: 'HDD', re: /\bsas\s*hdd\b|hdd[^\n]{0,20}\bsas\b/i },
        { value: 'hdd-nas', label: 'NAS HDD', group: 'HDD', re: /\bnas\s*hdd\b|hdd[^\n]{0,20}\bnas\b/i },
        { value: 'hdd-enterprise', label: 'Enterprise HDD', group: 'HDD', re: /enterprise\s*hdd|datacentre\s*hdd|data\s*center\s*hdd/i },
        { value: 'hdd-external', label: 'External / Portable HDD', group: 'HDD', re: /external\s*hdd|portable\s*hdd|usb\s*hdd/i },
        { value: 'hdd', label: 'HDD (other / general)', group: 'HDD', re: /\bhdd\b|hard\s*disk|spinning\s*disk|mechanical\s*drive/i },
        /* ——— Embedded / Removable / Archival / Network ——— */
        { value: 'emb-emmc', label: 'eMMC', group: 'Embedded', re: /\bemmc\b/i },
        { value: 'emb-ufs', label: 'UFS', group: 'Embedded', re: /\bufs\b/i },
        { value: 'rem-usb-flash', label: 'USB Flash Drive', group: 'Removable', re: /usb\s*flash|flash\s*drive|pen\s*drive|memory\s*stick/i },
        { value: 'rem-sd', label: 'SD / SDHC / SDXC', group: 'Removable', re: /\bsd\s*card\b|\bsdhc\b|\bsdxc\b(?!\s*micro)/i },
        { value: 'rem-microsd', label: 'microSD / microSDHC / microSDXC', group: 'Removable', re: /microsd|micro\s*sd/i },
        { value: 'arch-lto', label: 'LTO Magnetic Tape', group: 'Archival', re: /\blto\b|magnetic\s*tape|tape\s*drive/i },
        { value: 'arch-optical', label: 'CD / DVD / Blu-ray', group: 'Archival', re: /\bblu[-\s]?ray\b|\bdvd\b|\bcd[-\s]?r/i },
        { value: 'net-das', label: 'DAS (Direct Attached Storage)', group: 'Network / Cloud', re: /\bdas\b|direct\s*attached/i },
        { value: 'net-nas', label: 'NAS (Network Attached Storage)', group: 'Network / Cloud', re: /\bnas\b|network\s*attached\s*storage/i },
        { value: 'net-san', label: 'SAN (Storage Area Network)', group: 'Network / Cloud', re: /\bsan\b|storage\s*area\s*network/i },
        { value: 'cloud-object', label: 'Cloud Object Storage', group: 'Network / Cloud', re: /cloud\s*object|s3\s*storage|object\s*storage/i },
        { value: 'cloud-block', label: 'Cloud Block Storage', group: 'Network / Cloud', re: /cloud\s*block|block\s*storage|ebs\b/i },
        { value: 'cloud-file', label: 'Cloud File Storage', group: 'Network / Cloud', re: /cloud\s*file|file\s*storage|efs\b/i },
        { value: 'hybrid', label: 'SSD + HDD hybrid', group: 'Other', re: /hybrid|ssd\s*\+\s*hdd|hdd\s*\+\s*ssd|optane/i },
        { value: 'ssd', label: 'SSD (other / general)', group: 'Other', re: /\bssd\b|solid\s*state/i }
    ]
};

function normalizeProductQuery(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9+]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function scoreProductCatalogMatch(query, entry) {
    const q = normalizeProductQuery(query);
    if (!q) return 0;

    const candidates = [
        `${entry.brand} ${entry.model}`,
        entry.model,
        ...(entry.names || []),
        ...(entry.aliases || [])
    ];

    let best = 0;
    const qTokens = q.split(' ').filter(Boolean);

    for (const candidate of candidates) {
        const n = normalizeProductQuery(candidate);
        if (!n) continue;
        if (q === n) return 100;
        if (q.includes(n) || n.includes(q)) {
            best = Math.max(best, 88);
        }

        const nTokens = n.split(' ').filter(Boolean);
        if (!nTokens.length) continue;
        const overlap = nTokens.filter((t) => qTokens.includes(t)).length;
        const score = Math.round((100 * overlap) / nTokens.length);
        const distinctive = nTokens.filter((t) => /\d/.test(t) || t.length > 4);
        const distinctiveHit = distinctive.filter((t) => qTokens.includes(t)).length;
        const bonus = distinctive.length ? Math.round((12 * distinctiveHit) / distinctive.length) : 0;
        best = Math.max(best, Math.min(99, score + bonus));
    }

    return best;
}

function getCatalogSpecBlob(entry) {
    return (entry.specs || []).map((row) => `${row[0] || ''} ${row[1] || ''}`).join(' ');
}

function parseMaxRamGb(text) {
    const t = String(text || '');
    const matches = [...t.matchAll(/(\d+)\s*GB/gi)].map((m) => parseInt(m[1], 10));
    if (!matches.length) return 0;
    return Math.max(...matches);
}

function parseMaxStorageGb(text) {
    const t = String(text || '');
    let max = 0;
    [...t.matchAll(/(\d+(?:\.\d+)?)\s*TB/gi)].forEach((m) => {
        max = Math.max(max, Math.round(parseFloat(m[1]) * 1024));
    });
    [...t.matchAll(/(\d+)\s*GB/gi)].forEach((m) => {
        max = Math.max(max, parseInt(m[1], 10));
    });
    return max;
}

function detectStorageType(text) {
    const list = (typeof SPEC_SEARCH_FACETS !== 'undefined' && SPEC_SEARCH_FACETS.storageTypes) || [];
    for (const opt of list) {
        if (!opt || opt.value === 'any' || !(opt.re instanceof RegExp)) continue;
        if (opt.re.test(String(text || ''))) return opt.value;
    }
    return 'any';
}

function getStorageTypeOption(value) {
    const list = (typeof SPEC_SEARCH_FACETS !== 'undefined' && SPEC_SEARCH_FACETS.storageTypes) || [];
    return list.find((o) => o.value === value) || null;
}

function storageMatchesCriteria(storageText, storageTypeValue, detectedType) {
    if (!storageTypeValue || storageTypeValue === 'any') return true;
    if (detectedType && detectedType === storageTypeValue) return true;
    const opt = getStorageTypeOption(storageTypeValue);
    if (!opt) {
        // Legacy bundled values
        const t = String(storageText || '').toLowerCase();
        if (storageTypeValue === 'nvme') return /nvme/.test(t);
        if (storageTypeValue === 'ssd') return /\bssd\b|nvme|solid\s*state/.test(t);
        if (storageTypeValue === 'hdd') return /\bhdd\b|hard\s*disk/.test(t);
        if (storageTypeValue === 'hybrid') return /hybrid|ssd.*hdd|hdd.*ssd/.test(t);
        return false;
    }
    if (opt.re instanceof RegExp) return opt.re.test(String(storageText || ''));
    // Family match: selecting general NVMe also matches gen-specific detections
    const family = {
        nvme: /^nvme/,
        ssd: /^(ssd|nvme)/,
        hdd: /^hdd/,
        hybrid: /^hybrid/
    };
    const re = family[storageTypeValue];
    if (re && detectedType && re.test(detectedType)) return true;
    return false;
}

function getProcessorTypeOption(value) {
    const list = (typeof SPEC_SEARCH_FACETS !== 'undefined' && SPEC_SEARCH_FACETS.processorTypes) || [];
    return list.find((o) => o.value === value) || null;
}

function processorTextMatchesOption(text, option) {
    if (!option || option.value === 'any') return true;
    const t = String(text || '');
    if (!t.trim()) return false;
    if (option.re instanceof RegExp) return option.re.test(t);
    return false;
}

/** Most specific processor slug from catalog text (order in processorTypes matters). */
function detectProcessorType(text) {
    const list = (typeof SPEC_SEARCH_FACETS !== 'undefined' && SPEC_SEARCH_FACETS.processorTypes) || [];
    for (const opt of list) {
        if (!opt || opt.value === 'any' || !(opt.re instanceof RegExp)) continue;
        if (opt.re.test(String(text || ''))) return opt.value;
    }
    return 'any';
}

/** True if product CPU text satisfies the selected filter (exact slug or regex). */
function processorMatchesCriteria(processorText, processorTypeValue, detectedType) {
    if (!processorTypeValue || processorTypeValue === 'any') return true;
    if (detectedType && detectedType === processorTypeValue) return true;
    const opt = getProcessorTypeOption(processorTypeValue);
    if (!opt) {
        const legacy = {
            'intel-core': /intel|core\s*i[3579]|core\s*ultra|celeron|pentium/i,
            'intel-xeon': /xeon/i,
            'amd-ryzen': /ryzen/i,
            'amd-epyc': /epyc/i,
            apple: /apple\s*m\d|\bm[1-5]\b/i,
            snapdragon: /snapdragon/i,
            other: /exynos|mediatek|helio|dimensity|kompanio/i
        };
        const re = legacy[processorTypeValue];
        return re ? re.test(String(processorText || '')) : false;
    }
    return processorTextMatchesOption(processorText, opt);
}

function detectProcessorTier(text) {
    const t = String(text || '').toLowerCase();
    const tiers = [];
    if (/i9|ultra\s*9|ryzen\s*9|ultra\s*x9/.test(t)) tiers.push('i9');
    if (/i7|ultra\s*7|ryzen\s*7|ultra\s*x7/.test(t)) tiers.push('i7');
    if (/i5|ultra\s*5|ryzen\s*5/.test(t)) tiers.push('i5');
    if (/i3|ryzen\s*3/.test(t)) tiers.push('i3');
    if (!tiers.length && /xeon|epyc|snapdragon|m[1-5]|threadripper|kompanio/.test(t)) tiers.push('i7');
    return tiers.length ? tiers : ['any'];
}

/** Parse highest GHz clock from processor text (e.g. "2.4 GHz", "up to 4.70GHz"). */
function parseMaxProcessorGhz(text) {
    const t = String(text || '');
    const matches = [...t.matchAll(/(\d+(?:\.\d+)?)\s*GHz/gi)].map((m) => parseFloat(m[1]));
    if (!matches.length) return 0;
    return Math.max(...matches);
}

/**
 * Typical max boost-class speed when catalog lines omit explicit GHz.
 * Used so Processor speed filters still rank real products.
 */
function estimateProcessorSpeedGhz(processorText, tiers = []) {
    const parsed = parseMaxProcessorGhz(processorText);
    if (parsed > 0) return parsed;

    const t = String(processorText || '').toLowerCase();
    if (/m[234]|apple/.test(t)) return 3.5;
    if (/xeon|epyc/.test(t)) return 3.6;
    if (/snapdragon\s*8/.test(t)) return 3.2;
    if (/snapdragon|exynos|mediatek|helio|dimensity|a1[4-9]/.test(t)) return 2.8;

    const tierRank = { any: 0, i3: 1, i5: 2, i7: 3, i9: 4 };
    const best = Math.max(0, ...(tiers || []).map((x) => tierRank[x] || 0));
    if (best >= 4) return 5.0;
    if (best >= 3) return 4.7;
    if (best >= 2) return 4.4;
    if (best >= 1) return 4.0;
    return 2.4;
}

function mapCatalogCategory(category) {
    if (category === 'tablet') return 'other';
    return category || '';
}

function enrichCatalogProduct(entry) {
    const blob = getCatalogSpecBlob(entry);
    const processorText = (entry.specs || []).find((r) => /processor|cpu|chipset/i.test(r[0] || ''))?.[1] || blob;
    const ramText = (entry.specs || []).find((r) => /ram|memory/i.test(r[0] || ''))?.[1] || blob;
    const storageText = (entry.specs || []).find((r) => /storage|ssd|hdd/i.test(r[0] || ''))?.[1] || blob;
    const storageTypeRow = (entry.specs || []).find((r) => /storage type|hdd type/i.test(r[0] || ''))?.[1] || '';
    const tiers = detectProcessorTier(processorText);

    let category = entry.category || 'other';
    if (category === 'other' && /tablet|ipad|galaxy\s*tab/i.test(`${entry.model} ${blob}`)) {
        category = 'tablet';
    }

    return {
        ...entry,
        category,
        _attrs: {
            ramGb: parseMaxRamGb(ramText),
            storageGb: parseMaxStorageGb(storageText),
            storageType: detectStorageType(`${storageTypeRow} ${storageText}`),
            processorType: detectProcessorType(processorText),
            processorTiers: tiers,
            processorSpeedGhz: estimateProcessorSpeedGhz(processorText, tiers),
            processorLabel: String(processorText || '').trim(),
            ramLabel: String(ramText || '').trim(),
            storageLabel: String(storageText || '').trim()
        }
    };
}

function getEnrichedProductCatalog() {
    return (PRODUCT_SPECS_CATALOG || []).map(enrichCatalogProduct);
}

function findProductInCatalog(query, { minScore = 72 } = {}) {
    const ranked = PRODUCT_SPECS_CATALOG
        .map((entry) => ({ entry, score: scoreProductCatalogMatch(query, entry) }))
        .filter((row) => row.score >= minScore)
        .sort((a, b) => b.score - a.score);

    if (!ranked.length) return null;
    return {
        source: 'catalog',
        score: ranked[0].score,
        product: ranked[0].entry
    };
}

/**
 * Score one catalog product against min-spec criteria.
 * mode: 'strict' rejects hard misses; 'soft' keeps near-misses with lower scores.
 */
function scoreCatalogProductAgainstCriteria(entry, criteria = {}, mode = 'strict') {
    const productType = String(criteria.productType || '').trim();
    const brand = String(criteria.brand || '').trim();
    const processorType = String(criteria.processorType || 'any').trim();
    const minProcessorGhz = parseFloat(criteria.minProcessorGhz) || 0;
    const minRam = parseInt(criteria.minRamGb, 10) || 0;
    const minStorage = parseInt(criteria.minStorageGb, 10) || 0;
    const storageType = String(criteria.storageType || 'any').trim();
    const freeText = normalizeProductQuery(criteria.freeText || '');
    const soft = mode === 'strict' ? false : true;

    const attrs = entry._attrs || {};
    let score = 20;
    const reasons = [];

    // Keywords are a primary ranking signal (required by the UI for best matches)
    let keywordScore = 0;
    if (freeText) {
        keywordScore = scoreProductCatalogMatch(freeText, entry);
        const blobHit = normalizeProductQuery(getCatalogSpecBlob(entry)).includes(freeText)
            || freeText.split(' ').filter((t) => t.length > 2).some((t) =>
                normalizeProductQuery(`${entry.brand} ${entry.model} ${getCatalogSpecBlob(entry)}`).includes(t)
            );
        if (blobHit && keywordScore < 55) keywordScore = Math.max(keywordScore, 55);

        if (keywordScore < 28) {
            if (!soft) return null;
            score -= 20;
            reasons.push('Weak keyword match');
        } else {
            // Strong weight: keywords dominate ranking
            score += Math.round(keywordScore * 0.55);
            if (keywordScore >= 70) {
                score += 18;
                reasons.push('Strong keyword match');
            } else if (keywordScore >= 45) {
                score += 10;
                reasons.push('Keyword match');
            } else {
                reasons.push('Partial keyword match');
            }
        }
    }

    // Product type (keep hard even in soft mode — otherwise list is noisy)
    if (productType) {
        const cat = entry.category;
        if (productType === 'tablet') {
            const isTablet = cat === 'tablet' || (cat === 'other' && /tablet|ipad|tab/i.test(`${entry.model} ${getCatalogSpecBlob(entry)}`));
            if (!isTablet) return null;
            score += 16;
            reasons.push('Tablet');
        } else {
            const mappedWant = mapCatalogCategory(productType);
            const mappedHave = mapCatalogCategory(cat);
            // Product type stays hard — soft mode only relaxes brand/CPU/RAM/storage within type
            if (mappedHave !== mappedWant && cat !== productType) {
                return null;
            }
            score += 16;
            reasons.push(productType);
        }
    }

    if (brand && brand.toLowerCase() !== 'any') {
        if (String(entry.brand || '').toLowerCase() !== brand.toLowerCase()) {
            if (!soft) return null;
            score -= 18;
            reasons.push('Other brand');
        } else {
            score += 12;
            reasons.push(entry.brand);
        }
    }

    if (processorType && processorType !== 'any') {
        const cpuText = attrs.processorLabel || '';
        if (!processorMatchesCriteria(cpuText, processorType, attrs.processorType)) {
            if (!soft) return null;
            score -= 12;
        } else {
            score += 10;
            const opt = getProcessorTypeOption(processorType);
            reasons.push(opt?.label || 'Processor type');
        }
    }

    if (minProcessorGhz > 0) {
        const haveGhz = Number(attrs.processorSpeedGhz) || 0;
        if (haveGhz > 0 && haveGhz + 0.05 < minProcessorGhz) {
            if (!soft) return null;
            score -= 12;
            reasons.push(`CPU below ${minProcessorGhz} GHz`);
        } else if (haveGhz >= minProcessorGhz) {
            score += 12;
            reasons.push(`CPU ≥ ${minProcessorGhz} GHz`);
        } else {
            score += 2;
        }
    }

    if (minRam > 0) {
        if (attrs.ramGb > 0 && attrs.ramGb < minRam) {
            if (!soft) return null;
            score -= 10;
            reasons.push(`RAM below ${minRam} GB`);
        } else if (attrs.ramGb >= minRam) {
            score += 10;
            reasons.push(`RAM ${attrs.ramGb} GB`);
        } else {
            score += 2;
        }
    }

    if (minStorage > 0) {
        const have = Number(attrs.storageGb) || 0;
        if (have > 0 && have !== minStorage) {
            // Soft: allow one market step either side (e.g. 512 ↔ 256/1024)
            const steps = [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 20480, 24576];
            const wantIdx = steps.indexOf(minStorage);
            const haveIdx = steps.indexOf(have);
            const near = wantIdx >= 0 && haveIdx >= 0 && Math.abs(wantIdx - haveIdx) === 1;
            if (!soft || !near) {
                if (!soft) return null;
                score -= 10;
                reasons.push(`Storage ${have >= 1024 ? `${have / 1024} TB` : `${have} GB`} (wanted ${minStorage >= 1024 ? `${minStorage / 1024} TB` : `${minStorage} GB`})`);
            } else {
                score += 4;
                reasons.push('Near storage size');
            }
        } else if (have === minStorage) {
            score += 10;
            reasons.push(minStorage >= 1024 ? `Storage ${minStorage / 1024} TB` : `Storage ${minStorage} GB`);
        } else {
            score += 2;
        }
    }

    if (storageType && storageType !== 'any') {
        const storageText = `${attrs.storageLabel || ''} ${attrs.storageType || ''}`;
        const ok = storageMatchesCriteria(storageText, storageType, attrs.storageType);
        if (!ok && attrs.storageType !== 'any') {
            if (!soft) return null;
            score -= 8;
        } else if (ok) {
            score += 8;
            const opt = getStorageTypeOption(storageType);
            reasons.push(opt?.label || `Storage: ${storageType}`);
        }
    }

    return {
        product: entry,
        score: Math.max(1, Math.min(99, score)),
        matchPercent: Math.max(1, Math.min(99, score)),
        reasons,
        attrs,
        keywordScore,
        source: 'catalog'
    };
}

/**
 * Intelligent min-spec search — returns a ranked table of best options.
 * Guarantees at least `minResults` rows when the catalog has enough candidates
 * (uses strict match first, then soft near-miss fill).
 */
function searchCatalogByMinspec(criteria = {}, options = {}) {
    const minResults = Math.max(1, Number(options.minResults) || 5);
    const maxResults = Math.max(minResults, Number(options.maxResults) || 12);

    const catalog = getEnrichedProductCatalog();
    const strict = [];
    catalog.forEach((entry) => {
        const row = scoreCatalogProductAgainstCriteria(entry, criteria, 'strict');
        if (row) strict.push(row);
    });
    strict.sort((a, b) =>
        b.score - a.score ||
        (b.keywordScore || 0) - (a.keywordScore || 0) ||
        String(a.product.brand).localeCompare(String(b.product.brand))
    );

    if (strict.length >= minResults) {
        return strict.slice(0, maxResults).map((r, i) => ({ ...r, rank: i + 1 }));
    }

    // Soft fill: near-misses so the user still sees multiple comparable options
    const seen = new Set(strict.map((r) => r.product.id));
    const soft = [...strict];
    catalog.forEach((entry) => {
        if (seen.has(entry.id)) return;
        const row = scoreCatalogProductAgainstCriteria(entry, criteria, 'soft');
        if (!row) return;
        row.source = 'catalog-near';
        soft.push(row);
        seen.add(entry.id);
    });

    soft.sort((a, b) =>
        b.score - a.score ||
        (b.keywordScore || 0) - (a.keywordScore || 0) ||
        String(a.product.brand).localeCompare(String(b.product.brand))
    );

    // If still short, pad with top products of requested type (or overall)
    if (soft.length < minResults) {
        const filler = catalog
            .filter((e) => !seen.has(e.id))
            .filter((e) => {
                if (!criteria.productType) return true;
                if (criteria.productType === 'tablet') {
                    return e.category === 'tablet' || e.category === 'other';
                }
                return mapCatalogCategory(e.category) === mapCatalogCategory(criteria.productType) || e.category === criteria.productType;
            })
            .map((entry) => ({
                product: entry,
                score: 28,
                matchPercent: 28,
                reasons: ['Additional option in category'],
                attrs: entry._attrs || {},
                source: 'catalog-suggest'
            }));
        filler.forEach((row) => {
            if (soft.length >= minResults) return;
            soft.push(row);
        });
    }

    return soft.slice(0, Math.max(minResults, Math.min(maxResults, soft.length))).map((r, i) => ({
        ...r,
        rank: i + 1,
        matchPercent: Math.min(99, r.matchPercent || r.score)
    }));
}

function buildMinspecSearchQuery(criteria = {}) {
    const bits = [];
    if (criteria.freeText) bits.push(criteria.freeText);
    if (criteria.productType) bits.push(criteria.productType);
    if (criteria.brand && criteria.brand.toLowerCase() !== 'any') bits.push(criteria.brand);
    if (criteria.processorType && criteria.processorType !== 'any') {
        const opt = getProcessorTypeOption(criteria.processorType);
        bits.push(opt?.label || criteria.processorType);
    }
    if (criteria.minProcessorGhz && criteria.minProcessorGhz !== 'any') {
        bits.push(`${criteria.minProcessorGhz} GHz`);
    }
    if (criteria.minRamGb && criteria.minRamGb !== 'any') bits.push(`${criteria.minRamGb}GB RAM`);
    if (criteria.minStorageGb && criteria.minStorageGb !== 'any') {
        const gb = parseInt(criteria.minStorageGb, 10);
        bits.push(gb >= 1024 ? `${gb / 1024}TB storage` : `${gb}GB storage`);
    }
    if (criteria.storageType && criteria.storageType !== 'any') {
        const opt = getStorageTypeOption(criteria.storageType);
        bits.push(opt?.label || criteria.storageType);
    }
    bits.push('specifications');
    return bits.join(' ').trim();
}
