/**
 * Generiše icon.png, adaptive-icon.png i favicon.png iz zvaničnog logoa.
 * Pokreni: node scripts/generate-app-icons.mjs
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const source = path.join(root, 'assets/images/Logo Garancije-providan.png');
const outDir = path.join(root, 'assets/images');

const SIZE = 1024;
const LOGO_SCALE = 0.72;
const BG = { r: 247, g: 250, b: 252, alpha: 1 };

async function buildSquareIcon({ transparentBg }) {
  const logoSize = Math.round(SIZE * LOGO_SCALE);
  const logo = await sharp(source)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const background = transparentBg
    ? { r: 0, g: 0, b: 0, alpha: 0 }
    : BG;

  return sharp({
    create: {
      width: SIZE,
      height: SIZE,
      channels: 4,
      background,
    },
  })
    .composite([
      {
        input: logo,
        gravity: 'centre',
      },
    ])
    .png();
}

const icon = await buildSquareIcon({ transparentBg: false });
await icon.toFile(path.join(outDir, 'icon.png'));

const adaptive = await buildSquareIcon({ transparentBg: true });
await adaptive.toFile(path.join(outDir, 'adaptive-icon.png'));

await sharp(source)
  .resize(192, 192, { fit: 'contain', background: BG })
  .png()
  .toFile(path.join(outDir, 'favicon.png'));

await sharp(source)
  .resize(400, 400, { fit: 'contain', background: BG })
  .png()
  .toFile(path.join(outDir, 'splash-icon.png'));

console.log('Generated: icon.png, adaptive-icon.png, favicon.png, splash-icon.png');
