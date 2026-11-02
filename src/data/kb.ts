import index from './kb_index.json';

export type Kb = { kb: number; topic: string; decks: string[]; url: string };
const map = new Map<number, Kb>((index as Kb[]).map((k) => [k.kb, k]));

export const KB_INDEX = index as Kb[];
export function kbInfo(id: number): Kb {
  return map.get(id) ?? { kb: id, topic: '', decks: [], url: `https://knowledge.broadcom.com/external/article/${id}` };
}
