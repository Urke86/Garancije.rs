/**
 * Renders a Serbian fiscal receipt as an SVG "photo" (paper on a dark surface),
 * so demo receipts have a realistic attached image that matches their data.
 */

export interface DemoReceiptImageInput {
  storeName: string;
  pib: string;
  receiptNumber: string;
  purchaseDate: string;
  items: { name: string; price: number }[];
}

const STORE_ADDRESSES: Record<string, string> = {
  Gigatron: 'Bulevar Mihajla Pupina 4, Beograd',
  'Sport Vision': 'Ušće Shopping Center, Beograd',
  Tehnomanija: 'Bulevar Oslobođenja 119, Novi Sad',
  'Forma Ideale': 'Autoput za Zagreb 22, Beograd',
  'Lidl Srbija': 'Bulevar Zorana Đinđića 150, Beograd',
  Emmezeta: 'Bulevar Peka Dapčevića 19, Beograd',
  WinWin: 'Kneza Miloša 86, Beograd',
};

const PAPER_WIDTH = 360;
const LINE = 19;
const CHARS = 38;

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function money(value: number): string {
  return value.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function justify(left: string, right: string): string {
  const space = Math.max(1, CHARS - left.length - right.length);
  return `${left}${' '.repeat(space)}${right}`;
}

function wrap(text: string, width = CHARS): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > width) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = (current + ' ' + word).trim();
    }
  }
  if (current) lines.push(current);
  return lines;
}

function qrModules(seed: string, size = 25): boolean[][] {
  let state = hash(seed) || 1;
  const next = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
  const grid = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => next() > 0.52),
  );
  const finder = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const edge = x === 0 || y === 0 || x === 6 || y === 6;
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        grid[oy + y][ox + x] = edge || core;
      }
    }
    for (let i = 0; i < 8; i++) {
      if (oy + 7 < size && ox + i < size) grid[oy + 7][ox + i] = false;
      if (ox + 7 < size && oy + i < size) grid[oy + i][ox + 7] = false;
    }
  };
  finder(0, 0);
  finder(size - 7, 0);
  finder(0, size - 7);
  return grid;
}

export function buildDemoReceiptSvg(input: DemoReceiptImageInput): string {
  const total = input.items.reduce((sum, i) => sum + i.price, 0);
  const tax = (total * 20) / 120;
  const h = hash(input.receiptNumber);
  const time = `${String(10 + (h % 9)).padStart(2, '0')}:${String(h % 60).padStart(2, '0')}:${String((h >> 6) % 60).padStart(2, '0')}`;
  const date = input.purchaseDate.split('-').reverse().join('.');
  const counter = `${1000 + (h % 8000)}/${2000 + ((h >> 4) % 7000)}ПП`;
  const address = STORE_ADDRESSES[input.storeName] ?? 'Beograd';

  type Row = { text: string; bold?: boolean; center?: boolean; size?: number };
  const rows: Row[] = [
    { text: input.storeName.toUpperCase(), bold: true, center: true, size: 19 },
    { text: address, center: true },
    { text: `PIB: ${input.pib}`, center: true },
    { text: 'Kasir: 07   ESIR broj: 284/1.0', center: true },
    { text: '=========== FISKALNI RAČUN ===========', center: true, bold: true },
    { text: justify('Artikli', 'Ukupno') },
  ];

  for (const item of input.items) {
    for (const line of wrap(`${item.name} (Ђ)`)) rows.push({ text: line });
    rows.push({ text: justify(`  1 x ${money(item.price)}`, money(item.price)) });
  }

  rows.push(
    { text: '-'.repeat(CHARS) },
    { text: justify('Ukupan iznos:', money(total)), bold: true },
    { text: justify('Platna kartica:', money(total)) },
    { text: '='.repeat(CHARS) },
    { text: justify('Oznaka  Ime  Stopa', 'Porez') },
    { text: justify('Ђ      O-PDV  20%', money(tax)) },
    { text: '-'.repeat(CHARS) },
    { text: justify('Ukupan iznos poreza:', money(tax)) },
    { text: '='.repeat(CHARS) },
    { text: justify('PFR vreme:', `${date}. ${time}`) },
    { text: 'PFR broj računa:' },
    { text: input.receiptNumber },
    { text: justify('Brojač računa:', counter) },
  );

  const padding = 26;
  const textTop = padding + 22;
  let y = textTop;
  const textEls: string[] = [];
  for (const row of rows) {
    const size = row.size ?? 13;
    y += row.size ? row.size + 6 : LINE;
    const x = row.center ? PAPER_WIDTH / 2 : padding;
    textEls.push(
      `<text x="${x}" y="${y}" font-size="${size}"${row.bold ? ' font-weight="700"' : ''}${
        row.center ? ' text-anchor="middle"' : ''
      } xml:space="preserve">${escapeXml(row.text)}</text>`,
    );
  }

  const qrSize = 25;
  const cell = 5;
  const qrTop = y + 22;
  const qrLeft = (PAPER_WIDTH - qrSize * cell) / 2;
  const modules = qrModules(input.receiptNumber, qrSize);
  const qrRects: string[] = [];
  modules.forEach((row, ry) =>
    row.forEach((on, rx) => {
      if (on) {
        qrRects.push(
          `<rect x="${qrLeft + rx * cell}" y="${qrTop + ry * cell}" width="${cell}" height="${cell}"/>`,
        );
      }
    }),
  );

  const footerY = qrTop + qrSize * cell + 30;
  const paperHeight = footerY + padding;

  const canvasW = PAPER_WIDTH + 140;
  const canvasH = paperHeight + 120;
  const tilt = ((h % 5) - 2) * 0.45;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasW}" height="${canvasH}" viewBox="0 0 ${canvasW} ${canvasH}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3a4656"/>
      <stop offset="1" stop-color="#1d2531"/>
    </linearGradient>
    <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fdfcf8"/>
      <stop offset="0.6" stop-color="#f7f5ee"/>
      <stop offset="1" stop-color="#efece2"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000" flood-opacity="0.45"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <g transform="translate(70 60) rotate(${tilt} ${PAPER_WIDTH / 2} ${paperHeight / 2})">
    <rect width="${PAPER_WIDTH}" height="${paperHeight}" fill="url(#paper)" filter="url(#shadow)"/>
    <g font-family="'Courier New', Courier, monospace" fill="#2a2a2a">
      ${textEls.join('\n      ')}
      <g fill="#1f1f1f">${qrRects.join('')}</g>
      <text x="${PAPER_WIDTH / 2}" y="${footerY}" font-size="12" text-anchor="middle" font-weight="700">======== KRAJ FISKALNOG RAČUNA ========</text>
    </g>
  </g>
</svg>`;
}

export function buildDemoReceiptDataUri(input: DemoReceiptImageInput): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildDemoReceiptSvg(input))}`;
}
