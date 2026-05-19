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
/** iOS / generic icon — logo fills most of the square */
const ICON_LOGO_SCALE = 0.9;
/** Android adaptive foreground — mask clips ~18% edges; scale up so launcher squircle looks full */
const ADAPTIVE_LOGO_SCALE = 0.98;
const BG = { r: 247, g: 250, b: 252, alpha: 1 };

async function loadTrimmedLogoBuffer() {
  return sharp(source).trim().png().toBuffer();
}

async function buildSquareIcon({ transparentBg, logoScale }) {
  const trimmed = await loadTrimmedLogoBuffer();
  const logoSize = Math.round(SIZE * logoScale);
  const logo = await sharp(trimmed)
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

const trimmedLogo = await loadTrimmedLogoBuffer();

const icon = await buildSquareIcon({ transparentBg: false, logoScale: ICON_LOGO_SCALE });
await icon.toFile(path.join(outDir, 'icon.png'));

const adaptive = await buildSquareIcon({ transparentBg: true, logoScale: ADAPTIVE_LOGO_SCALE });
await adaptive.toFile(path.join(outDir, 'adaptive-icon.png'));

await sharp(trimmedLogo)
  .resize(192, 192, { fit: 'contain', background: BG })
  .png()
  .toFile(path.join(outDir, 'favicon.png'));

await sharp(trimmedLogo)
  .resize(400, 400, { fit: 'contain', background: BG })
  .png()
  .toFile(path.join(outDir, 'splash-icon.png'));

console.log('Generated: icon.png, adaptive-icon.png, favicon.png, splash-icon.png');
