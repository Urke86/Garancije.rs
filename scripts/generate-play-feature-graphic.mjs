/**
 * Play Store feature graphic 1024×500 — premium layout (mascot | typography).
 * Brend: lib/colors.ts, BrandWordmark, AuthShell tagline, AuthBenefits copy.
 * Pokreni: npm run generate:feature-graphic
 */
import sharp from 'sharp';
import opentype from 'opentype.js';
import { readFileSync } from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

function loadFont(filePath) {
  return opentype.parse(readFileSync(filePath));
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const source = path.join(root, 'assets/images/Logo Garancije-providan.png');
const out = path.join(root, 'assets/images/play-feature-graphic.png');

const fontsDir = path.join(
  root,
  'node_modules/@expo-google-fonts/plus-jakarta-sans'
);
const fontExtraBold = path.join(fontsDir, '800ExtraBold/PlusJakartaSans_800ExtraBold.ttf');
const fontRegular = path.join(fontsDir, '400Regular/PlusJakartaSans_400Regular.ttf');
const fontMedium = path.join(fontsDir, '500Medium/PlusJakartaSans_500Medium.ttf');

const W = 1024;
const H = 500;

/** @see lib/colors.ts */
const C = {
  primary: '#062B5F',
  background: '#F7FAFC',
  surface: '#FFFFFF',
  surfaceAlt: '#EDF2F7',
  textMuted: '#6B7A90',
  accent: '#00B8D9',
  accentGreen: '#7ED957',
  accentLight: 'rgba(0, 184, 217, 0.18)',
  accentGreenLight: 'rgba(126, 217, 87, 0.22)',
  wordmarkGradientStart: '#00C2CB',
  wordmarkGradientEnd: '#7ED957',
  border: '#E2E8F0',
};

const TAGLINE_LINES = ['Čuvamo vaš račun.', 'Čuvamo i garanciju.'];
const BENEFITS = [
  'Skeniraj fiskalni račun za sekundu',
  'Prati garanciju po proizvodu',
  'Podsetnik pre isteka roka',
];

const WORDMARK_SIZE = 58;
const TAGLINE_SIZE = 22;
const BENEFIT_SIZE = 17;
const WORDMARK_TRACKING = -1.3;
const TAGLINE_LINE_HEIGHT = 30;
const BENEFIT_ROW_H = 40;
const BENEFIT_GAP = 10;

/** Leva kolona: samo maskota. Desna: tipografija (bez preklapanja). */
const MASCOT_MAX_H = 288;
const MASCOT_COL_RIGHT = 418;
const CARD_X = 448;
const CARD_W = 532;
const CARD_H = 372;
const CARD_Y = Math.round((H - CARD_H) / 2);
const TEXT_X = CARD_X + 44;
const TEXT_PAD_TOP = 44;

function buildBackgroundSvg() {
  return Buffer.from(`
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="rgba(0, 194, 203, 0.12)"/>
          <stop offset="40%" stop-color="${C.background}"/>
          <stop offset="100%" stop-color="${C.surface}"/>
        </linearGradient>
        <radialGradient id="mascotGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${C.accent}" stop-opacity="0.2"/>
          <stop offset="70%" stop-color="${C.accentGreen}" stop-opacity="0.08"/>
          <stop offset="100%" stop-color="${C.surface}" stop-opacity="0"/>
        </radialGradient>
        <filter id="cardShadow" x="-8%" y="-8%" width="116%" height="120%">
          <feDropShadow dx="0" dy="10" stdDeviation="18" flood-color="${C.primary}" flood-opacity="0.1"/>
        </filter>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>
      <ellipse cx="900" cy="60" rx="140" ry="120" fill="${C.accent}" opacity="0.14"/>
      <ellipse cx="960" cy="420" rx="100" ry="90" fill="${C.accentGreen}" opacity="0.12"/>
      <ellipse cx="200" cy="${H / 2}" rx="175" ry="175" fill="url(#mascotGlow)"/>
      <rect
        x="${CARD_X}" y="${CARD_Y}" width="${CARD_W}" height="${CARD_H}" rx="28"
        fill="rgba(255,255,255,0.94)" stroke="${C.border}" stroke-width="1"
        filter="url(#cardShadow)"
      />
    </svg>
  `);
}

function trackedPath(font, text, x, baselineY, fontSize, tracking) {
  let cursorX = x;
  const parts = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const glyph = font.charToGlyph(ch);
    parts.push(glyph.getPath(cursorX, baselineY, fontSize).toPathData(2));
    cursorX += glyph.advanceWidth * (fontSize / font.unitsPerEm) + tracking;
  }
  return { d: parts.join(' '), width: cursorX - x - tracking };
}

function measureTextWidth(font, text, fontSize, tracking = 0) {
  let w = 0;
  for (let i = 0; i < text.length; i++) {
    const g = font.charToGlyph(text[i]);
    w += g.advanceWidth * (fontSize / font.unitsPerEm) + tracking;
  }
  return w - tracking;
}

function buildTypographySvg({ textX, wordmarkBaseline, taglineBaseline }) {
  const fontExtra = loadFont(fontExtraBold);
  const fontReg = loadFont(fontRegular);
  const fontMed = loadFont(fontMedium);

  const gar = trackedPath(
    fontExtra,
    'Garancije',
    textX,
    wordmarkBaseline,
    WORDMARK_SIZE,
    WORDMARK_TRACKING
  );
  const rs = trackedPath(
    fontExtra,
    '.rs',
    textX + gar.width + 3,
    wordmarkBaseline,
    WORDMARK_SIZE,
    WORDMARK_TRACKING
  );

  const tagPaths = TAGLINE_LINES.map((line, i) =>
    trackedPath(
      fontReg,
      line,
      textX,
      taglineBaseline + i * TAGLINE_LINE_HEIGHT,
      TAGLINE_SIZE,
      0
    )
  );

  const pillInnerW = CARD_W - (textX - CARD_X) - 36;
  const benefitsStartY = taglineBaseline + TAGLINE_LINE_HEIGHT * 2 + 26;
  const benefitRows = BENEFITS.map((label, i) => {
    const rowY = benefitsStartY + i * (BENEFIT_ROW_H + BENEFIT_GAP);
    const pillX = textX;
    const pillW = pillInnerW;
    const dotCx = pillX + 20;
    const dotCy = rowY - 11;
    const textPath = trackedPath(fontMed, label, pillX + 36, rowY, BENEFIT_SIZE, 0);
    return `
      <rect x="${pillX}" y="${rowY - 28}" width="${pillW}" height="36" rx="12"
        fill="${C.surface}" stroke="${C.border}" stroke-width="1"/>
      <circle cx="${dotCx}" cy="${dotCy}" r="5" fill="${C.accent}"/>
      <path d="${textPath.d}" fill="${C.primary}" opacity="0.88"/>
    `;
  });

  return Buffer.from(`
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="tldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${C.wordmarkGradientStart}"/>
          <stop offset="100%" stop-color="${C.wordmarkGradientEnd}"/>
        </linearGradient>
        <filter id="wordmarkShadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="${C.primary}" flood-opacity="0.1"/>
        </filter>
        <clipPath id="typeClip">
          <rect x="${CARD_X + 1}" y="${CARD_Y + 1}" width="${CARD_W - 2}" height="${CARD_H - 2}" rx="27"/>
        </clipPath>
      </defs>
      <g clip-path="url(#typeClip)">
        <g filter="url(#wordmarkShadow)">
          <path d="${gar.d}" fill="${C.primary}"/>
          <path d="${rs.d}" fill="url(#tldGrad)"/>
        </g>
        ${tagPaths.map((t) => `<path d="${t.d}" fill="${C.textMuted}"/>`).join('\n')}
        ${benefitRows.join('\n')}
      </g>
    </svg>
  `);
}

function computeTextBaselines() {
  const wordmarkCap = Math.round(WORDMARK_SIZE * 0.82);
  const wordmarkBaseline = CARD_Y + TEXT_PAD_TOP + wordmarkCap;
  const taglineBaseline = wordmarkBaseline + 44;

  return { wordmarkBaseline, taglineBaseline };
}

async function main() {
  const trimmed = await sharp(source).trim({ threshold: 12 }).png().toBuffer();
  const logo = await sharp(trimmed)
    .resize({ height: MASCOT_MAX_H, fit: 'inside' })
    .png()
    .toBuffer();
  const { width: lw, height: lh } = await sharp(logo).metadata();

  const logoLeft = Math.max(48, Math.round((MASCOT_COL_RIGHT - lw) / 2));
  const logoTop = Math.round((H - lh) / 2);

  if (logoLeft + lw > MASCOT_COL_RIGHT - 24) {
    throw new Error('Maskota preširoka — smanji MASCOT_MAX_H.');
  }

  const { wordmarkBaseline, taglineBaseline } = computeTextBaselines();
  const textX = TEXT_X;

  const bg = buildBackgroundSvg();
  const typography = buildTypographySvg({ textX, wordmarkBaseline, taglineBaseline });

  await sharp(bg)
    .composite([
      { input: logo, left: logoLeft, top: logoTop },
      { input: typography, left: 0, top: 0 },
    ])
    .png()
    .toFile(out);

  console.log('Kreirano:', out);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
