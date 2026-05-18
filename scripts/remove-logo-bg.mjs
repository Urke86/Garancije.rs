import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logoPath = path.join(__dirname, '../assets/images/Garancije.rs_-_Logo.png');

const THRESHOLD = 248;

function isNearWhite(r, g, b) {
  return r >= THRESHOLD && g >= THRESHOLD && b >= THRESHOLD;
}

const { data, info } = await sharp(logoPath)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
const visited = new Uint8Array(width * height);
const toClear = new Uint8Array(width * height);
const queue = [];

const seed = (x, y) => {
  const idx = y * width + x;
  if (visited[idx]) return;
  const i = idx * channels;
  if (!isNearWhite(data[i], data[i + 1], data[i + 2])) return;
  visited[idx] = 1;
  toClear[idx] = 1;
  queue.push(idx);
};

for (let x = 0; x < width; x++) {
  seed(x, 0);
  seed(x, height - 1);
}
for (let y = 0; y < height; y++) {
  seed(0, y);
  seed(width - 1, y);
}

while (queue.length > 0) {
  const idx = queue.pop();
  const x = idx % width;
  const y = (idx - x) / width;
  const neighbors = [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
  ];
  for (const [nx, ny] of neighbors) {
    if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
    const nIdx = ny * width + nx;
    if (visited[nIdx]) continue;
    const i = nIdx * channels;
    if (!isNearWhite(data[i], data[i + 1], data[i + 2])) continue;
    visited[nIdx] = 1;
    toClear[nIdx] = 1;
    queue.push(nIdx);
  }
}

for (let idx = 0; idx < toClear.length; idx++) {
  if (!toClear[idx]) continue;
  data[idx * channels + 3] = 0;
}

await sharp(data, { raw: { width, height, channels } }).png().toFile(logoPath);

console.log('Logo outer background removed:', logoPath);
