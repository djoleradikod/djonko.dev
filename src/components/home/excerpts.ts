// Real rows from a note's own table, read from the note at build time, so the excerpts on the home page cannot drift
// from the note. The build fails if the table has gone or a cell holds markup this reader does not understand.

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** One table cell as safe HTML: the note's bold kept, its links and components reduced to their text. */
function cleanCell(cell: string, where: string): string {
  const text = cell.trim()
    .replace(/<KB id=\{(\d+)\}\s*\/>/g, 'KB $1')
    .replace(/<AsOf [^>]*\/>/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<a [^>]*>(.*?)<\/a>/g, '$1')
    .replace(/<b>(.*?)<\/b>/g, '**$1**')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (/[{}]|<\/?[A-Za-z]|\]\(/.test(text)) throw new Error(`An excerpt from ${where} holds markup the home page cannot show: ${text}`);
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
}

const cells = (line: string) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|');

/** The note's table whose header begins with these cells. */
export function noteTable(note: { id: string; body?: string }, startsWith: string[], minRows: number) {
  const lines = (note.body ?? '').split('\n');
  const at = lines.findIndex((l) => l.trim().startsWith('|') && startsWith.every((want, i) => cells(l)[i]?.trim() === want));
  if (at < 0) throw new Error(`The home page shows a table from ${note.id}, with a header starting "${startsWith.join(' | ')}", and it is not there.`);
  const body: string[] = [];
  for (let i = at + 2; i < lines.length && lines[i].trim().startsWith('|'); i++) body.push(lines[i]);
  if (body.length < minRows) throw new Error(`The table the home page shows from ${note.id} now has ${body.length} rows; it needs ${minRows}.`);
  return {
    head: cells(lines[at]).map((c) => c.trim()),
    rows: body.map((l) => cells(l).map((c) => cleanCell(c, note.id))),
  };
}
