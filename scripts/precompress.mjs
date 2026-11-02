// Writes .br and .gz next to every compressible file so Caddy can serve them with `precompressed br gzip`.
// Usage: node scripts/precompress.mjs dist
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { brotliCompressSync, gzipSync, constants } from 'node:zlib';

const root = process.argv[2] ?? 'dist';
const EXT = new Set(['.html', '.css', '.js', '.mjs', '.json', '.xml', '.svg', '.txt', '.webmanifest', '.pf_meta', '.ps1', '.py', '.sh', '.csv']);
let n = 0, before = 0, after = 0;
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    const st = statSync(p);
    if (st.isDirectory()) { walk(p); continue; }
    if (!EXT.has(extname(p)) || st.size < 1024) continue;
    const buf = readFileSync(p);
    const br = brotliCompressSync(buf, { params: { [constants.BROTLI_PARAM_QUALITY]: 11, [constants.BROTLI_PARAM_SIZE_HINT]: buf.length } });
    writeFileSync(`${p}.br`, br);
    writeFileSync(`${p}.gz`, gzipSync(buf, { level: 9 }));
    n++; before += buf.length; after += br.length;
  }
})(root);
console.log(`Pre-compressed ${n} files: ${(before / 1048576).toFixed(1)} MB -> ${(after / 1048576).toFixed(1)} MB with Brotli.`);
