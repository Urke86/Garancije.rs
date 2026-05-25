/**
 * Generiše app ikone optimizovane za Android adaptive safe zone.
 * Pokreni: npm run generate:icons
 *
 * Android adaptive (108dp canvas, 66dp safe circle):
 * - Foreground logo ~72% canvas (70–78% target) — ne seče se na squircle/circle maskama
 * - Trim uklanja prazan transparent prostor oko PNG-a
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const source = path.join(root, 'assets/images/Logo Garancije-providan.png');
const outDir = path.join(root, 'assets/images');

const SIZE = 1024;
/** Bela pozadina — launcher adaptive layer + store icon */
const BG = { r: 255, g: 255, b: 255, alpha: 1 };
const BRAND_DARK = { r: 6, g: 43, b: 95, alpha: 1 };

/** iOS / store icon — logo sa belom pozadinom */
const ICON_LOGO_SCALE = 0.84;
/** Android adaptive foreground — ~66% canvas (safe zone + beli margin) */
const ADAPTIVE_LOGO_SCALE = 0.66;
/** Splash — manji, više vazduha */
const SPLASH_LOGO_SCALE = 0.38;
/** Favicon */
const FAVICON_SIZE = 192;
/** Android status bar — bela silueta */
const NOTIFICATION_SIZE = 96;

async function loadTrimmedLogoBuffer() {
  return sharp(source).trim({ threshold: 12 }).png().toBuffer();
}

async function resizeLogo(trimmed, maxEdge) {
  return sharp(trimmed)
    .resize(maxEdge, maxEdge, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

async function buildSquareIcon({ transparentBg, logoScale, shadow = false }) {
  const trimmed = await loadTrimmedLogoBuffer();
  const logoEdge = Math.round(SIZE * logoScale);
  const logo = await resizeLogo(trimmed, logoEdge);

  const meta = await sharp(logo).metadata();
  const logoW = meta.width ?? logoEdge;
  const logoH = meta.height ?? logoEdge;
  const left = Math.round((SIZE - logoW) / 2);
  const top = Math.round((SIZE - logoH) / 2);

  const composites = [];

  composites.push({
    input: logo,
    left,
    top,
  });

  const background = transparentBg ? { r: 0, g: 0, b: 0, alpha: 0 } : BG;

  return sharp({
    create: {
      width: SIZE,
      height: SIZE,
      channels: 4,
      background,
    },
  })
    .composite(composites)
    .png();
}

async function buildMonochrome(trimmed) {
  const edge = Math.round(SIZE * ADAPTIVE_LOGO_SCALE);
  const logo = await resizeLogo(trimmed, edge);
  const meta = await sharp(logo).metadata();
  const logoW = meta.width ?? edge;
  const logoH = meta.height ?? edge;
  const left = Math.round((SIZE - logoW) / 2);
  const top = Math.round((SIZE - logoH) / 2);

  const alpha = await sharp(logo).ensureAlpha().extractChannel('alpha').toBuffer();

  const brandShape = await sharp({
    create: { width: logoW, height: logoH, channels: 3, background: '#062B5F' },
  })
    .joinChannel(alpha)
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: SIZE,
      height: SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: brandShape, left, top }])
    .png();
}

async function buildNotificationIcon(trimmed) {
  const logo = await resizeLogo(trimmed, Math.round(NOTIFICATION_SIZE * 0.82));
  const meta = await sharp(logo).metadata();
  const logoW = meta.width ?? NOTIFICATION_SIZE;
  const logoH = meta.height ?? NOTIFICATION_SIZE;
  const left = Math.round((NOTIFICATION_SIZE - logoW) / 2);
  const top = Math.round((NOTIFICATION_SIZE - logoH) / 2);

  const alpha = await sharp(logo).ensureAlpha().extractChannel('alpha').toBuffer();

  const whiteRgb = await sharp({
    create: { width: logoW, height: logoH, channels: 3, background: '#FFFFFF' },
  })
    .joinChannel(alpha)
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: NOTIFICATION_SIZE,
      height: NOTIFICATION_SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: whiteRgb, left, top }])
    .png();
}

const trimmed = await loadTrimmedLogoBuffer();

const icon = await buildSquareIcon({ transparentBg: false, logoScale: ICON_LOGO_SCALE });
await icon.toFile(path.join(outDir, 'icon.png'));

const adaptive = await buildSquareIcon({
  transparentBg: true,
  logoScale: ADAPTIVE_LOGO_SCALE,
  shadow: false,
});
await adaptive.toFile(path.join(outDir, 'adaptive-icon.png'));
await adaptive.toFile(path.join(outDir, 'foreground.png'));

await sharp({
  create: { width: SIZE, height: SIZE, channels: 3, background: '#FFFFFF' },
})
  .png()
  .toFile(path.join(outDir, 'adaptive-background.png'));

const mono = await buildMonochrome(trimmed);
await mono.toFile(path.join(outDir, 'monochrome.png'));

const notif = await buildNotificationIcon(trimmed);
await notif.toFile(path.join(outDir, 'notification-icon.png'));

await sharp(trimmed)
  .resize(FAVICON_SIZE, FAVICON_SIZE, { fit: 'contain', background: BG })
  .png()
  .toFile(path.join(outDir, 'favicon.png'));

const splash = await buildSquareIcon({
  transparentBg: false,
  logoScale: SPLASH_LOGO_SCALE,
  shadow: false,
});
await splash.toFile(path.join(outDir, 'splash-icon.png'));

console.log(
  [
    'Generated:',
    'icon.png',
    'adaptive-icon.png',
    'foreground.png',
    'monochrome.png',
    'notification-icon.png',
    'favicon.png',
    'splash-icon.png',
    'adaptive-background.png',
    `(adaptive scale ${ADAPTIVE_LOGO_SCALE * 100}% of ${SIZE}px canvas, white background)`,
  ].join('\n  '),
);
