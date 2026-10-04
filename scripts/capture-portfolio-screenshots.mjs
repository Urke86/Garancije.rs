/**
 * Captures portfolio screenshots of the app running in demo mode (mock data, no Supabase).
 *
 *   npm run portfolio:screenshots            -> English + Serbian
 *   npm run portfolio:screenshots -- --lang=en
 *
 * Starts `expo start --web` with EXPO_PUBLIC_DEMO_MODE=1 on DEMO_PORT (unless already running),
 * drives Edge/Chrome via puppeteer-core and writes PNGs to portfolio-screenshots/.
 */
import { spawn, execSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'portfolio-screenshots');
const PORT = Number(process.env.DEMO_PORT || 8082);
const BASE_URL = `http://localhost:${PORT}`;
const DEMO_USER_ID = '00000000-0000-4000-8000-0000000000de';

const VIEWPORT = { width: 412, height: 915, deviceScaleFactor: 3, isMobile: true, hasTouch: true };

const langArg = process.argv
  .slice(2)
  .map((a) => a.replace(/^--lang=/, ''))
  .find((a) => a === 'en' || a === 'sr');
const LANGS = langArg ? [langArg] : ['en', 'sr'];

const OCR_URL =
  '/receipt/edit?' +
  new URLSearchParams({
    local_image_uri: 'portfolio-demo/receipt-ocr-scan.png',
    ocr_key: 'pending-ocr:demo',
  }).toString();

/** `scroll`: pixels to scroll the main inner ScrollView before capturing. */
const SHOTS = [
  { file: '01-home-wallet.png', url: '/', waitFor: 'Sony' },
  { file: '02-scan-ocr.png', url: OCR_URL, waitFor: 'LG OLED', imageWait: true },
  { file: '03-receipt-details.png', url: '/receipt/item/demo-item-3-1', waitFor: 'Galaxy S24', imageWait: true },
  { file: '04-reminders.png', url: '/reminders', waitFor: 'Gorenje' },
  { file: '05-profile-or-timeline.png', url: '/timeline', waitFor: 'Lenovo' },
  { file: 'extra/profile.png', url: '/profile', waitFor: 'Marko' },
  { file: 'extra/receipt-overview.png', url: '/receipt/demo-receipt-3', waitFor: 'Tehnomanija', imageWait: true },
  { file: 'extra/receipt-details-scrolled.png', url: '/receipt/item/demo-item-3-1', waitFor: 'Galaxy S24', scroll: 520 },
  { file: 'extra/scan-ocr-scrolled.png', url: OCR_URL, waitFor: 'LG OLED', scroll: 560 },
];

function findBrowser() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].filter(Boolean);
  const found = candidates.find((p) => existsSync(p));
  if (!found) throw new Error('Chrome/Edge not found. Set PUPPETEER_EXECUTABLE_PATH.');
  return found;
}

async function isServerUp() {
  try {
    const res = await fetch(BASE_URL);
    return res.ok;
  } catch {
    return false;
  }
}

async function startDemoServer() {
  if (await isServerUp()) {
    console.log(`Using demo server already running on ${BASE_URL} (must be started with EXPO_PUBLIC_DEMO_MODE=1).`);
    return null;
  }
  console.log(`Starting demo web server on ${BASE_URL} ...`);
  const child = spawn(`npx expo start --web --port ${PORT} --clear`, {
    cwd: ROOT,
    shell: true,
    env: { ...process.env, EXPO_PUBLIC_DEMO_MODE: '1', CI: '1', BROWSER: 'none' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', () => undefined);
  child.stderr.on('data', () => undefined);

  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    if (await isServerUp()) return child;
    await new Promise((r) => setTimeout(r, 1500));
  }
  stopServer(child);
  throw new Error('Demo server did not start within 180s.');
}

function stopServer(child) {
  if (!child?.pid) return;
  try {
    if (process.platform === 'win32') execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' });
    else process.kill(-child.pid);
  } catch {
    /* already stopped */
  }
}

async function scrollMain(page, amount) {
  await page.evaluate((y) => {
    const scrollables = [...document.querySelectorAll('div')].filter((el) => {
      const style = getComputedStyle(el);
      return /(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 20;
    });
    const visible = scrollables.filter((el) => el.offsetParent !== null);
    const target = visible.sort((a, b) => b.clientHeight - a.clientHeight)[0];
    if (target) target.scrollTop = y;
  }, amount);
  await new Promise((r) => setTimeout(r, 500));
}

/** The tab bar scan button pulses forever; pin it to its resting scale so every capture is identical. */
async function freezeAnimations(page) {
  await page.evaluate(() => {
    for (const button of document.querySelectorAll('[aria-label="Add receipt"], [aria-label="Dodaj račun"]')) {
      button.firstElementChild?.setAttribute('data-portfolio-freeze', '');
    }
    if (!document.getElementById('portfolio-freeze')) {
      const style = document.createElement('style');
      style.id = 'portfolio-freeze';
      style.textContent = '[data-portfolio-freeze] { transform: none !important; }';
      document.head.appendChild(style);
    }
  });
}

async function waitForImages(page) {
  await page
    .waitForFunction(
      () => [...document.querySelectorAll('img')].some((img) => img.src.startsWith('data:image/svg') && img.complete),
      { timeout: 15_000 },
    )
    .catch(() => console.warn('  (receipt image not detected, capturing anyway)'));
}

async function capture(browser, lang) {
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  await page.evaluateOnNewDocument(
    (locale, userId) => {
      localStorage.setItem(`garancije-locale:${userId}`, locale);
      localStorage.setItem('garancije-locale:device', locale);
      localStorage.setItem('garancije-locale:guest', locale);
    },
    lang,
    DEMO_USER_ID,
  );

  const outDir = lang === 'en' ? OUT_DIR : path.join(OUT_DIR, lang);

  for (const shot of SHOTS) {
    const target = path.join(outDir, shot.file);
    mkdirSync(path.dirname(target), { recursive: true });
    await page.goto(BASE_URL + shot.url, { waitUntil: 'networkidle2', timeout: 120_000 });
    await page.waitForFunction(
      (text) =>
        document.body.innerText.includes(text) ||
        [...document.querySelectorAll('input, textarea')].some((el) => el.value.includes(text)),
      { timeout: 60_000 },
      shot.waitFor,
    );
    if (shot.imageWait || shot.scroll) await waitForImages(page);
    await page.evaluate(() => document.fonts?.ready);
    await new Promise((r) => setTimeout(r, 1200));
    if (shot.scroll) await scrollMain(page, shot.scroll);
    await freezeAnimations(page);
    await new Promise((r) => setTimeout(r, 300));
    await page.screenshot({ path: target });
    console.log(`  ✓ ${path.relative(ROOT, target)}`);
  }
  await page.close();
}

const server = await startDemoServer();
const browser = await puppeteer.launch({
  executablePath: findBrowser(),
  headless: true,
  args: ['--hide-scrollbars', '--force-color-profile=srgb'],
});

try {
  for (const lang of LANGS) {
    console.log(`Capturing [${lang}]`);
    await capture(browser, lang);
  }
} finally {
  await browser.close();
  stopServer(server);
}
console.log(`Done. Screenshots in ${path.relative(ROOT, OUT_DIR)}/`);
