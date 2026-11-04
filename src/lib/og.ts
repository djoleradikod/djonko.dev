import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SITE } from '../data/site';

const font = (w: number) => readFileSync(join(process.cwd(), `node_modules/@fontsource/geist/files/geist-latin-${w}-normal.woff`));
let fonts: { name: string; data: Buffer; weight: 400 | 600 | 700; style: 'normal' }[] | undefined;

type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, ...children: (Node | string | false | undefined)[]): Node =>
  ({ type, props: { style: { display: 'flex', ...style }, children: children.filter(Boolean) } });

export interface Card { title: string; eyebrow?: string; versions?: string[] }

/** 1200x630 share card for LinkedIn, Slack, X and others. */
export async function renderCard({ title, eyebrow, versions = [] }: Card): Promise<Buffer> {
  fonts ??= [{ name: 'Geist', data: font(400), weight: 400, style: 'normal' }, { name: 'Geist', data: font(600), weight: 600, style: 'normal' }, { name: 'Geist', data: font(700), weight: 700, style: 'normal' }];
  const size = title.length > 90 ? 50 : title.length > 60 ? 58 : 68;
  const tree = h('div', { width: 1200, height: 630, flexDirection: 'column', justifyContent: 'space-between', padding: '64px 72px', background: '#0b0e13', color: '#e8ecf1', fontFamily: 'Geist', borderTop: '10px solid #8fa3ff' },
    h('div', { flexDirection: 'column', gap: 22 },
      eyebrow && h('div', { fontSize: 28, fontWeight: 600, color: '#a8b8ff' }, eyebrow),
      h('div', { fontSize: size, fontWeight: 600, lineHeight: 1.1, letterSpacing: -2, maxWidth: 1040 }, title),
      versions.length > 0 && h('div', { gap: 12 }, ...versions.map((v) =>
        h('div', { fontSize: 24, fontWeight: 600, padding: '4px 16px', borderRadius: 999, border: `2px solid ${v.startsWith('5') ? '#e3a95c' : '#8fa3ff'}`, color: v.startsWith('5') ? '#e3a95c' : '#a8b8ff' }, `VCF ${v}`))),
    ),
    h('div', { justifyContent: 'space-between', alignItems: 'center', fontSize: 28, color: '#b4bdc8' },
      h('div', { alignItems: 'center', gap: 18 },
        h('div', { width: 56, height: 56, borderRadius: 13, background: '#e8ecf1', color: '#0b0e13', fontWeight: 700, fontSize: 22, alignItems: 'center', justifyContent: 'center', borderRight: '10px solid #8fa3ff' }, 'JD'),
        h('div', { fontWeight: 600, color: '#e8ecf1' }, `${SITE.author} · ${SITE.role}`)),
      h('div', {}, SITE.domain)),
  );
  const svg = await satori(tree as any, { width: 1200, height: 630, fonts });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
}
