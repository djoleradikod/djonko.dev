import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SITE } from '../data/site';

const font = (w: number) => readFileSync(join(process.cwd(), `node_modules/@fontsource/inter/files/inter-latin-${w}-normal.woff`));
let fonts: { name: string; data: Buffer; weight: 400 | 600 | 700; style: 'normal' }[] | undefined;

type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, ...children: (Node | string | false | undefined)[]): Node =>
  ({ type, props: { style: { display: 'flex', ...style }, children: children.filter(Boolean) } });

export interface Card { title: string; eyebrow?: string; versions?: string[] }

/** 1200x630 share card for LinkedIn, Slack, X and others. */
export async function renderCard({ title, eyebrow, versions = [] }: Card): Promise<Buffer> {
  fonts ??= [{ name: 'Inter', data: font(400), weight: 400, style: 'normal' }, { name: 'Inter', data: font(600), weight: 600, style: 'normal' }, { name: 'Inter', data: font(700), weight: 700, style: 'normal' }];
  const size = title.length > 90 ? 50 : title.length > 60 ? 58 : 68;
  const tree = h('div', { width: 1200, height: 630, flexDirection: 'column', justifyContent: 'space-between', padding: '64px 72px', background: '#0f1419', color: '#e6eaee', fontFamily: 'Inter', borderTop: '10px solid #3cc2b4' },
    h('div', { flexDirection: 'column', gap: 22 },
      eyebrow && h('div', { fontSize: 26, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: '#3cc2b4' }, eyebrow),
      h('div', { fontSize: size, fontWeight: 700, lineHeight: 1.12, letterSpacing: -1, maxWidth: 1040 }, title),
      versions.length > 0 && h('div', { gap: 12 }, ...versions.map((v) =>
        h('div', { fontSize: 24, fontWeight: 600, padding: '4px 16px', borderRadius: 999, border: `2px solid ${v.startsWith('5') ? '#b79cf0' : '#6fb8e8'}`, color: v.startsWith('5') ? '#b79cf0' : '#6fb8e8' }, `VCF ${v}`))),
    ),
    h('div', { justifyContent: 'space-between', alignItems: 'center', fontSize: 28, color: '#b4bec8' },
      h('div', { alignItems: 'center', gap: 18 },
        h('div', { width: 56, height: 56, borderRadius: 12, background: '#0f766e', color: '#fff', fontWeight: 700, fontSize: 24, alignItems: 'center', justifyContent: 'center' }, 'JD'),
        h('div', { fontWeight: 600, color: '#e6eaee' }, `${SITE.author} · ${SITE.role}`)),
      h('div', {}, SITE.domain)),
  );
  const svg = await satori(tree as any, { width: 1200, height: 630, fonts });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
}
