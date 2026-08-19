const fs = require('fs');
const p = 'c:/Users/TECHSTORES/Documents/TECHSTORESys/app/js/office-messages.js';
let s = fs.readFileSync(p, 'utf8');
s = s.replace(
  /typeof saViewMode !== 'undefined' && saViewMode === 'mail'/g,
  "window.saViewMode === 'mail'"
);
s = s.replace(/\bsaMailFolder = /g, 'window.saMailFolder = ');
fs.writeFileSync(p, s);
console.log('ok');
