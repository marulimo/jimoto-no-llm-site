import { INVITE_URL, BENCH_TIMEOUT_MS, BENCH_README_URL } from './config.js';
import { parseBenchReadme } from './bench.js';

document.documentElement.classList.add('js');

if (/^https:\/\/(?:discord\.gg\/|discord\.com\/invite\/)/.test(INVITE_URL)) {
  for (const block of document.querySelectorAll('.invite-block')) {
    const link = document.createElement('a');
    link.href = INVITE_URL;
    link.className = 'button button-primary invite-button';
    link.textContent = 'Discordに参加する';
    block.querySelector('button').replaceWith(link);
    block.querySelector('.invite-note').remove();
  }
}

const radios = [...document.querySelectorAll('input[name="vram"]')];
for (const radio of radios) {
  radio.addEventListener('change', () => {
    if (!radio.checked) return;
    document.querySelector('#route-placeholder').hidden = true;
    document.querySelector('#route-selection').hidden = false;
    document.querySelector('#selected-name').textContent = `選択中：${radio.value}`;
    document.querySelector('#selected-channel').textContent = `Discord内のチャンネル：${radio.dataset.channel}`;
  });
}

const loading = document.querySelector('#bench-loading');
const table = document.querySelector('#bench-table');
const tbody = document.querySelector('#bench-rows');
loading.hidden = false;
try {
  const response = await fetch(BENCH_README_URL, { signal: AbortSignal.timeout(BENCH_TIMEOUT_MS) });
  if (!response.ok) throw new Error('README unavailable');
  const reports = parseBenchReadme(await response.text());
  for (const report of reports) {
    const tr = document.createElement('tr');
    for (const [label, value] of [['日付', report.date], ['GPU', report.gpu], ['モデル・量子化', report.bench]]) {
      const td = document.createElement('td');
      td.dataset.label = label;
      td.textContent = value;
      tr.append(td);
    }
    const td = document.createElement('td');
    td.dataset.label = 'レポート';
    const link = document.createElement('a');
    link.href = report.url;
    link.textContent = report.title;
    td.append(link);
    tr.append(td);
    tbody.append(tr);
  }
  table.hidden = reports.length === 0;
} catch {
  table.hidden = true;
} finally {
  loading.hidden = true;
}
