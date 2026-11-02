import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { mediaUrl } from '../data/site';

export interface FileInfo {
  url: string; name: string; ext: string; kind: string; lang?: string;
  bytes?: number; size?: string; sha256?: string; modified?: Date; text?: string;
}

const KINDS: Record<string, [string, string?]> = {
  ps1: ['PowerShell script', 'powershell'], psm1: ['PowerShell module', 'powershell'], psd1: ['PowerShell manifest', 'powershell'],
  py: ['Python script', 'python'], sh: ['Shell script', 'bash'], bash: ['Shell script', 'bash'],
  yaml: ['YAML', 'yaml'], yml: ['YAML', 'yaml'], json: ['JSON', 'json'], tf: ['Terraform', 'hcl'], sql: ['SQL', 'sql'],
  txt: ['Text', 'text'], md: ['Markdown', 'markdown'], csv: ['CSV', 'csv'],
  pdf: ['PDF'], zip: ['ZIP archive'], pak: ['Management pack'], ova: ['OVA appliance'],
  png: ['Image'], jpg: ['Image'], svg: ['SVG diagram'], drawio: ['draw.io diagram'], xlsx: ['Excel workbook'], pptx: ['Slides'],
};

export const human = (n: number) =>
  n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB` : `${(n / 1048576).toFixed(1)} MB`;

/**
 * Look up a downloadable file. `path` is either a site path ("/downloads/x.ps1", served from public/)
 * or a media path ("pdf/handout.pdf", served from the media origin and read from ./media at build time).
 * Size and SHA-256 are computed when the file is available at build time.
 */
export function fileInfo(path: string, withText = false): FileInfo {
  const isSite = path.startsWith('/');
  const local = isSite ? join(process.cwd(), 'public', path) : join(process.cwd(), 'media', path);
  const ext = extname(path).slice(1).toLowerCase();
  const [kind, lang] = KINDS[ext] ?? [ext.toUpperCase() || 'File'];
  const info: FileInfo = { url: isSite ? path : mediaUrl(path), name: basename(path), ext, kind, lang };
  if (existsSync(local)) {
    const buf = readFileSync(local);
    const st = statSync(local);
    info.bytes = st.size; info.size = human(st.size); info.modified = st.mtime;
    info.sha256 = createHash('sha256').update(buf).digest('hex');
    if (withText && lang && st.size < 200_000) info.text = buf.toString('utf8');
  } else if (isSite) {
    throw new Error(`Download not found: public${path}`);
  }
  return info;
}
