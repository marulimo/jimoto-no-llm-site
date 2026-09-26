const HEADER = '| 日付 | タイトル | 作成者 | コンピュータ / マザーボード | GPU | ベンチ |';
const REPORT_ROOT = 'https://jimoto-no-llm.github.io/bench-of-us/reports/';

function cells(line) {
  if (!line.trimStart().startsWith('|')) return null;
  const parts = [];
  let current = '';
  for (let i = 0; i < line.length; i += 1) {
    if (line[i] === '\\' && line[i + 1] === '|') {
      current += '|';
      i += 1;
    } else if (line[i] === '|') {
      parts.push(current.trim());
      current = '';
    } else {
      current += line[i];
    }
  }
  parts.push(current.trim());
  if (parts[0] !== '' || parts.at(-1) !== '') return null;
  return parts.slice(1, -1);
}

export function parseBenchReadme(text) {
  if (typeof text !== 'string') return [];
  const lines = text.replace(/\r/g, '').split('\n');
  let inComment = false;
  let inFence = false;
  const index = lines.findIndex(line => {
    const fenceLine = !inComment && line.trimStart().startsWith('```');
    if (fenceLine) inFence = !inFence;
    if (fenceLine || inFence) return false;
    let inCommentOnLine = inComment;
    for (let i = 0; i < line.length; i += 1) {
      if (!inComment && line.startsWith('<!--', i)) { inComment = true; inCommentOnLine = true; i += 3; }
      else if (inComment && line.startsWith('-->', i)) { inComment = false; i += 2; }
    }
    return !inFence && !fenceLine && !inCommentOnLine && line.trim() === HEADER;
  });
  if (index < 0 || index + 1 >= lines.length) return [];
  const separator = lines[index + 1].trim();
  const separatorCells = cells(separator);
  if (!/^[|:\s-]+$/.test(separator) || separatorCells?.length !== 6 || !separatorCells.every(cell => /^:?-+:?$/.test(cell))) return [];
  const reports = [];
  for (const line of lines.slice(index + 2)) {
    if (!line.trimStart().startsWith('|')) break;
    const row = cells(line);
    if (row?.length !== 6) continue;
    const [date, titleCell, , , gpu, bench] = row;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !gpu || !bench) continue;
    const match = /^\[([^\]]+)\]\(report\/([A-Za-z0-9._-]+)\.md\)$/.exec(titleCell);
    if (!match || !match[1].trim() || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(match[2]) || match[2].includes('..')) continue;
    reports.push({ date, gpu: gpu.trim(), bench: bench.trim(), title: match[1].trim(), url: `${REPORT_ROOT}${encodeURIComponent(match[2])}/` });
    if (reports.length === 4) break;
  }
  return reports;
}
