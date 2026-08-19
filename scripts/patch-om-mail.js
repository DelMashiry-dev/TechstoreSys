const fs = require('fs');
const p = 'c:/Users/TECHSTORES/Documents/TECHSTORESys/app/js/office-messages.js';
let s = fs.readFileSync(p, 'utf8');
if (s.includes('initMailLayout')) {
  console.log('already patched');
  process.exit(0);
}
const re = /function refreshOfficeMessagesUi\(\) \{[\s\S]*?\nfunction initOfficeMessages\(\) \{[\s\S]*?updateSaTabBadges\(0, 0\);\n\}/;
const replacement = `function refreshOfficeMessagesUi() {
    updateSaTabBadges(
        Number(document.getElementById('systemAlertsCount')?.textContent || 0),
        Number(document.getElementById('saTabAlertBadge')?.textContent || 0)
    );
    if (typeof saViewMode !== 'undefined' && saViewMode === 'mail') {
        if (typeof renderMailLayout === 'function') renderMailLayout();
        if (typeof updateCommandBoard === 'function') updateCommandBoard();
        return;
    }
    if (saActiveTab === 'messages') renderOfficeMessagesPane();
    if (saActiveTab === 'compose') renderOfficeComposePane();
    if (typeof updateCommandBoard === 'function') updateCommandBoard();
}

function initOfficeMessages() {
    wireOfficeMessagesUi();
    if (typeof initMailLayout === 'function') initMailLayout();
    setSaTab(saActiveTab || 'alerts');
    updateSaTabBadges(0, 0);
}`;
if (!re.test(s)) {
  console.error('regex fail');
  process.exit(1);
}
s = s.replace(re, replacement);
fs.writeFileSync(p, s);
console.log('patched ok');
