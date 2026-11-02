// Converts src/data/kb_index.csv (kb,topic,decks,url) into src/data/kb_index.json.
// Run after replacing the CSV: node scripts/kb-import.mjs
import { readFileSync, writeFileSync } from 'node:fs';

function parseCsv(text) {
  const rows = []; let row = []; let field = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim()));
}

const [header, ...body] = parseCsv(readFileSync('src/data/kb_index.csv', 'utf8'));
const idx = Object.fromEntries(header.map((h, i) => [h.trim(), i]));
const out = body.map((r) => ({
  kb: Number(r[idx.kb]),
  topic: r[idx.topic].trim(),
  decks: r[idx.decks].split(';').map((s) => s.trim()).filter(Boolean),
  url: r[idx.url].trim() || `https://knowledge.broadcom.com/external/article/${r[idx.kb]}`,
})).filter((x) => Number.isFinite(x.kb));
out.sort((a, b) => a.kb - b.kb);
writeFileSync('src/data/kb_index.json', JSON.stringify(out, null, 1));
console.log(`kb_index.json: ${out.length} KBs`);
