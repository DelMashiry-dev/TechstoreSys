const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'app', 'index.html');
const html = fs.readFileSync(file, 'utf8');
const start = html.indexOf('<ul class="sidebar-menu">');
if (start < 0) throw new Error('sidebar not found');
const openEnd = html.indexOf('>', start) + 1;

function findMatchingUlClose(s, from) {
    let depth = 0;
    let i = from;
    while (i < s.length) {
        if (s.startsWith('<ul', i)) {
            const close = s.indexOf('>', i);
            depth += 1;
            i = close + 1;
            continue;
        }
        if (s.startsWith('</ul>', i)) {
            depth -= 1;
            if (depth === 0) return i;
            i += 5;
            continue;
        }
        i += 1;
    }
    return -1;
}

const end = findMatchingUlClose(html, start);
if (end < 0) throw new Error('sidebar close not found');
const inner = html.slice(openEnd, end);

function splitTopLis(s) {
    const items = [];
    let i = 0;
    while (i < s.length) {
        while (i < s.length && /\s/.test(s[i])) i += 1;
        if (i >= s.length) break;
        if (!s.startsWith('<li', i)) {
            i += 1;
            continue;
        }
        let depth = 0;
        let j = i;
        while (j < s.length) {
            if (s.startsWith('<li', j) && (s[j + 3] === '>' || /\s/.test(s[j + 3]))) {
                const close = s.indexOf('>', j);
                const tag = s.slice(j, close + 1);
                if (!tag.startsWith('<li/') && !tag.includes('</')) depth += 1;
                j = close + 1;
                continue;
            }
            if (s.startsWith('</li>', j)) {
                depth -= 1;
                j += 5;
                if (depth === 0) {
                    items.push(s.slice(i, j));
                    i = j;
                    break;
                }
                continue;
            }
            j += 1;
        }
        if (depth !== 0) throw new Error('unbalanced li near ' + i);
    }
    return items;
}

function labelOf(li) {
    const m = li.match(/<span class="nav-label">([\s\S]*?)<\/span>/);
    if (!m) {
        const g = li.match(/<small>([\s\S]*?)<\/small>/);
        if (g) return g[1].replace(/&amp;/g, '&').replace(/<[^>]+>/g, '').trim();
        const strong = li.match(/<strong>([\s\S]*?)<\/strong>/);
        return strong ? strong[1].replace(/&amp;/g, '&').trim() : '';
    }
    return m[1].replace(/&amp;/g, '&').replace(/<[^>]+>/g, '').trim();
}

function sortSubmenu(li) {
    const subStart = li.indexOf('<ul class="submenu">');
    if (subStart < 0) return li;
    const subEnd = findMatchingUlClose(li, subStart);
    if (subEnd < 0) return li;
    const subInnerStart = li.indexOf('>', subStart) + 1;
    const subInner = li.slice(subInnerStart, subEnd);
    const kids = splitTopLis(subInner);
    kids.sort((a, b) => labelOf(a).localeCompare(labelOf(b), undefined, { sensitivity: 'base', numeric: true }));
    return (
        li.slice(0, subInnerStart) +
        '\n                        ' +
        kids.map((k) => k.trim()).join('\n                        ') +
        '\n                    ' +
        li.slice(subEnd)
    );
}

const items = splitTopLis(inner).map(sortSubmenu);
const dash = items.filter((li) => /data-target="dashboard"/.test(li));
const rest = items.filter((li) => !/data-target="dashboard"/.test(li));
rest.sort((a, b) => labelOf(a).localeCompare(labelOf(b), undefined, { sensitivity: 'base', numeric: true }));
const ordered = [...dash, ...rest];
const newInner = '\n' + ordered.map((li) => '                ' + li.trim()).join('\n') + '\n            ';
const out = html.slice(0, openEnd) + newInner + html.slice(end);
fs.writeFileSync(file, out);
console.log(ordered.map(labelOf).join('\n'));
