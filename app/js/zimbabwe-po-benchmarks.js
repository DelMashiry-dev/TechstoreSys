/* zimbabwe-po-benchmarks.js — Unit prices from real DP ICT purchase orders in the system (IT DIR) */

const ZIMBABWE_PO_BENCHMARKS = (typeof buildBenchmarksFromRealDpPos === 'function')
    ? buildBenchmarksFromRealDpPos()
    : [
        { id: 'hp-elitebook-830-g9', description: 'HP ELITEBOOK 830 G9 CORE I7 LAPTOP', currency: 'ZiG', unitPrice: 70000, poRef: 'DP 3478/2026', gl: '3112210001', realPo: true },
        { id: 'hp-proliant-dl380', description: 'HP PROLIANT DL 380 GEN SERVER', currency: 'USD', unitPrice: 8900, poRef: 'DP 1651/2026', gl: '3112210001', realPo: true },
        { id: 'hp-proliant-dl380-g11', description: 'HP PROLIANT DL 380 GEN 11 SERVER', currency: 'USD', unitPrice: 8900, poRef: 'DP 2048/2026', gl: '3112210001', realPo: true },
        { id: 'hp-laserjet-5800', description: 'HP COLOR LASERJET ENTERPRISE MFP 5800 PRINTER', currency: 'USD', unitPrice: 2850, poRef: 'DP 3199/2026', gl: '3112210001', realPo: true },
        { id: 'dell-g16-i9', description: 'DELL G16 7630 LAPTOP INTEL CORE i9 13th GEN', currency: 'USD', unitPrice: 2400, poRef: 'DP 1653/2026', gl: '3112210001', realPo: true },
        { id: 'hp-aio-desktop', description: 'HP AIO DESKTOP COMPUTERS', currency: 'USD', unitPrice: 850, poRef: 'DP 1653/2026', gl: '3112210001', realPo: true },
        { id: 'cisco-switch-24', description: '24 PORT CISCO SWITCH', currency: 'USD', unitPrice: 1250, poRef: 'DP 2048/2026', gl: '3112210001', realPo: true },
        { id: 'cat6-drum', description: 'CAT6 ETHERNET CABLE NETWORK DRUM (305M)', currency: 'USD', unitPrice: 80, poRef: 'DP 1653/2026', gl: '3112210001', realPo: true },
        { id: 'mobile-stand', description: 'SMART HEAVY DUTY MOBILE STAND FOR INTERACTIVE DISPLAY', currency: 'ZiG', unitPrice: 19100, poRef: 'DP 3385/2026', gl: '3112210001', realPo: true }
    ];

function searchPoBenchmarks(query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return ZIMBABWE_PO_BENCHMARKS.slice();
    return ZIMBABWE_PO_BENCHMARKS.filter((row) => {
        const blob = `${row.description} ${row.poRef}`.toLowerCase();
        return q.split(/\s+/).every((part) => part.length < 3 || blob.includes(part));
    });
}

window.ZIMBABWE_PO_BENCHMARKS = ZIMBABWE_PO_BENCHMARKS;
window.searchPoBenchmarks = searchPoBenchmarks;
