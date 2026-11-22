import type { ParsedSyllabusDraftItem } from './syllabus-types';

const CSV_HEADER_WORDS = new Set(['topic', 'title', 'subject', 'unit', 'chapter', 'module', 'week', 'outcome']);

function splitCsvRow(line: string): string[] {
  const cells: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      cells.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  cells.push(cur.trim());
  return cells;
}

function cleanBulletPrefix(raw: string): string {
  return raw
    .replace(/^\s*#{1,6}\s+/, '')
    .replace(/^\s*(?:[-*•▪◦]+|\d+(?:\.\d+)*[.):]?|\([a-zA-Z0-9]+\)|[ivxlcdm]+\.)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectUnitHeading(cleaned: string): string | null {
  if (/^(unit|module|chapter|block|part|section|week)\s+[a-z0-9ivx]+\b[:\-\s]*/i.test(cleaned)) {
    return cleaned;
  }
  return null;
}

export function parseCsvSyllabus(rawCsv: string): ParsedSyllabusDraftItem[] {
  const lines = rawCsv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const rows = lines.map(splitCsvRow);
  let startIdx = 0;
  let topicCol = 0;
  let unitCol = -1;

  const firstCells = rows[0].map((c) => c.toLowerCase());
  const looksLikeHeader = firstCells.some((c) => CSV_HEADER_WORDS.has(c));
  if (looksLikeHeader) {
    startIdx = 1;
    const foundTopic = firstCells.findIndex((c) =>
      ['topic', 'title', 'learning outcome', 'outcome', 'objective', 'lecture'].some((k) => c.includes(k)),
    );
    const foundUnit = firstCells.findIndex((c) =>
      ['unit', 'chapter', 'module', 'week', 'block', 'section'].some((k) => c.includes(k)),
    );
    if (foundTopic >= 0) topicCol = foundTopic;
    else if (rows[0].length >= 2 && foundUnit === 0) topicCol = 1;
    if (foundUnit >= 0 && foundUnit !== topicCol) unitCol = foundUnit;
  } else if (rows[0].length >= 2) {
    unitCol = 0;
    topicCol = 1;
  }

  const out: ParsedSyllabusDraftItem[] = [];
  const seen = new Set<string>();
  for (let i = startIdx; i < rows.length; i++) {
    const cells = rows[i];
    const title = cleanBulletPrefix(cells[topicCol] ?? cells[0] ?? '');
    if (title.length < 2) continue;
    const unit = unitCol >= 0 && cells[unitCol] ? cells[unitCol].trim() : undefined;
    const dedupeKey = `${unit ?? ''}::${title.toLowerCase()}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    out.push({
      id: `draft-item-${out.length + 1}`,
      rawLine: lines[i],
      title,
      unit,
    });
    if (out.length >= 120) break;
  }
  return out;
}

export function parseSyllabusText(rawText: string, fileName?: string): ParsedSyllabusDraftItem[] {
  const trimmed = rawText.trim();
  if (!trimmed) return [];

  if (fileName?.toLowerCase().endsWith('.csv')) {
    return parseCsvSyllabus(trimmed);
  }

  const lines = trimmed.split(/\r?\n/);
  const out: ParsedSyllabusDraftItem[] = [];
  const seen = new Set<string>();
  let currentUnit: string | undefined;

  for (const rawLine of lines) {
    const stripped = rawLine.trim();
    if (!stripped) continue;

    // Markdown top-level heading becomes unit context unless it's the only content
    const isMdHeading = /^#{1,3}\s+/.test(stripped);
    const cleaned = cleanBulletPrefix(stripped);
    if (cleaned.length < 2) continue;

    const unitMatch = detectUnitHeading(cleaned);
    if (unitMatch && (cleaned.endsWith(':') || isMdHeading || cleaned.length <= 72)) {
      const colonIdx = cleaned.indexOf(':');
      const rhs = colonIdx >= 0 ? cleaned.slice(colonIdx + 1).trim() : '';
      if (rhs.includes(';')) {
        currentUnit = cleaned.slice(0, colonIdx).trim();
        for (const subItem of rhs.split(';').map((s) => s.trim()).filter((s) => s.length >= 2)) {
          const key = `${currentUnit}::${subItem.toLowerCase()}`;
          if (!seen.has(key)) {
            seen.add(key);
            out.push({
              id: `draft-item-${out.length + 1}`,
              rawLine: stripped,
              title: subItem,
              unit: currentUnit,
            });
          }
        }
      } else {
        currentUnit = cleaned.replace(/:$/, '').trim();
      }
      continue;
    }

    // If line has semicolon-separated sub-topics in a single unit block (e.g. "Unit 1: Topic A; Topic B")
    if (isMdHeading) {
      currentUnit = cleaned;
      continue;
    }

    const dedupeKey = `${currentUnit ?? ''}::${cleaned.toLowerCase()}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    out.push({
      id: `draft-item-${out.length + 1}`,
      rawLine: stripped,
      title: cleaned,
      unit: currentUnit,
    });
    if (out.length >= 120) break;
  }

  return out;
}
