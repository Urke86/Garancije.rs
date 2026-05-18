/** Zvanični Garancije.rs mascot — izvor za UI i app ikone (`scripts/generate-app-icons.mjs`) */
export const officialLogo = require('@/assets/images/Logo Garancije-providan.png');

/** Generisane app ikone (iOS / Android / web) — isti vizuelni identitet */
export const appIcon = require('@/assets/images/icon.png');

/** Ilustracija: izbledeli fiskalni račun — `assets/images/Izbledeo sam.png` */
export const fadedReceiptIllustration = require('@/assets/images/Izbledeo sam.png');

/** Wordmark tekst: koristi `<BrandWordmark />` iz `@/components/BrandWordmark` */

const LOGO_BASE_WIDTH = 120;
const LOGO_SCALE = 4;
const LOGO_ASPECT = 120 / 96;

export function getBrandLogoSize(screenWidth: number, isWideLayout: boolean) {
  const targetWidth = LOGO_BASE_WIDTH * LOGO_SCALE;
  const horizontalPad = 40;
  const wideCap = 400;
  const maxWidth = isWideLayout
    ? Math.min(targetWidth, wideCap)
    : Math.min(targetWidth, screenWidth - horizontalPad);

  const width = Math.round(maxWidth);
  const height = Math.round(width / LOGO_ASPECT);
  return { width, height };
}
