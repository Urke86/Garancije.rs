import { lineMatches, normalizeForMatching } from '@/lib/ocr/text-normalization';
import type {
  OcrConfidence,
  OcrDetectableField,
  OcrReceiptItem,
  ParseReceiptOutput,
  ParsedField,
  ParsedReceiptFields,
} from '@/lib/ocr/types';

const SKIP_LINE =
  /^(PIB|MB|JMBG|PDV|ESIR|PFR|BF|RACUN|RACUN|KASIR|KASIRKA|VREME|DATUM|FISKAL|KOPIJA|KOPIA|GOTOVINA|KARTICA|VISA|MASTER|PROMET|ADRESA|TEL|TELEFON|WWW\.|HTTP|===|---|\*+|KASA|ARTIKAL|PRODAVAC)/;

const TOTAL_LINE =
  /^(UKUPNO|UKUPAN|UPLAT|ZA UPLAT|ZA UPLATU|ZA PLACAN|ZA PLATITI|GOTOVINA|KARTICA|SUMA|TOTAL|AMOUNT DUE|IZNOS|SVEGA|CEGA|ZA NAPLATU|NAPLATA)/;

const ITEM_NOISE =
  /^(PDV|POREZ|RABAT|POPUST|POVRAT|POVR\.|POVRACAJ|KUS|KOM|KOL\.|KOLICINA|CENA|IZNOS|A\s*-\s*\d+%|E\s*-\s*\d+%)/;

const AUTO_FILL_CONFIDENCE: Set<OcrConfidence> = new Set(['high', 'medium']);

function field(value: string, confidence: OcrConfidence | 'none'): ParsedField<string> {
  return { value, confidence };
}

function itemsField(
  value: OcrReceiptItem[],
  confidence: OcrConfidence | 'none',
): ParsedField<OcrReceiptItem[]> {
  return { value, confidence };
}

export function parseSerbianReceipt(rawText: string): ParseReceiptOutput {
  const normalized = rawText.replace(/\r\n/g, '\n').trim();
  const lines = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const fields: ParsedReceiptFields = {
    pib: extractPib(normalized),
    purchase_date: extractDate(normalized),
    total_amount: extractTotal(normalized, lines),
    currency: extractCurrency(normalized),
    receipt_number: extractReceiptNumber(normalized),
    store_name: extractStoreName(lines),
    items: extractItems(lines),
  };

  const result = {
    store_name: fields.store_name.value,
    purchase_date:
      fields.purchase_date.confidence !== 'none'
        ? fields.purchase_date.value
        : new Date().toISOString().split('T')[0],
    total_amount: fields.total_amount.value,
    currency: fields.currency.value || 'RSD',
    pib: fields.pib.value,
    receipt_number: fields.receipt_number.value,
    items: fields.items.value,
    raw_text: normalized,
  };

  const detectedFields = collectDetectedFields(fields);
  const partial =
    detectedFields.length > 0 &&
    detectedFields.length < 4 &&
    !detectedFields.includes('store_name');

  return { result, detectedFields, partial };
}

function collectDetectedFields(fields: ParsedReceiptFields): OcrDetectableField[] {
  const detected: OcrDetectableField[] = [];

  if (shouldAutoFill(fields.store_name)) detected.push('store_name');
  if (shouldAutoFill(fields.purchase_date)) detected.push('purchase_date');
  if (shouldAutoFill(fields.total_amount)) detected.push('total_amount');
  if (shouldAutoFill(fields.currency)) detected.push('currency');
  if (shouldAutoFill(fields.pib)) detected.push('pib');
  if (shouldAutoFill(fields.receipt_number)) detected.push('receipt_number');
  if (shouldAutoFill(fields.items) && fields.items.value.length > 0) {
    detected.push('product_name');
  }

  return detected;
}

function shouldAutoFill<T>(parsed: ParsedField<T>): boolean {
  return parsed.confidence !== 'none' && AUTO_FILL_CONFIDENCE.has(parsed.confidence);
}

function extractPib(text: string): ParsedField<string> {
  const labeled = text.match(/\bPIB[:\s]*(\d{9})\b/i);
  if (labeled?.[1]) return field(labeled[1], 'high');

  const header = text.slice(0, 600);
  const standalone = header.match(/\b(\d{9})\b/g);
  if (standalone?.length) return field(standalone[0], 'medium');

  return field('', 'none');
}

function extractDate(text: string): ParsedField<string> {
  const patterns = [
    /\b(\d{1,2})[\.\/-](\d{1,2})[\.\/-](\d{4})(?:\.|\s|$)/,
    /\b(\d{4})[\.\/-](\d{1,2})[\.\/-](\d{1,2})\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;

    let year: number;
    let month: number;
    let day: number;

    if (match[1].length === 4) {
      year = Number(match[1]);
      month = Number(match[2]);
      day = Number(match[3]);
    } else {
      day = Number(match[1]);
      month = Number(match[2]);
      year = Number(match[3]);
    }

    if (isValidDate(year, month, day)) {
      return field(`${year}-${pad2(month)}-${pad2(day)}`, 'high');
    }
  }

  return field(new Date().toISOString().split('T')[0], 'none');
}

function extractReceiptNumber(text: string): ParsedField<string> {
  const patterns = [
    /(?:ESIR|PFR|BF|Broj\s*(?:fiskalnog\s*)?ra[čc]una|Ra[čc]un\s*(?:br\.?|#)?)[:\s#-]*([A-Z0-9][A-Z0-9\-\/]{4,})/i,
    /\b([A-Z0-9]{5,}-[A-Z0-9]{4,}-[A-Z0-9]{4,})\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return field(match[1].trim(), 'high');
  }

  const normalized = normalizeForMatching(text);
  const cyrillicMatch = normalized.match(/\b([A-Z0-9]{5,}-[A-Z0-9]{4,}-[A-Z0-9]{4,})\b/);
  if (cyrillicMatch?.[1]) return field(cyrillicMatch[1], 'medium');

  return field('', 'none');
}

function extractTotal(text: string, lines: string[]): ParsedField<string> {
  for (const line of lines) {
    if (!lineMatches(line, TOTAL_LINE)) continue;
    const amount = extractAmountFromLine(line);
    if (amount !== null) return field(formatAmount(amount), 'high');
  }

  const normalized = normalizeForMatching(text);
  const fallbackPatterns = [
    /UKUPNO[^\d]*(\d{1,3}(?:[\s\.]\d{3})*,\d{2}|\d+[,\.]\d{2})/,
    /UPLAT[^\d]*(\d{1,3}(?:[\s\.]\d{3})*,\d{2}|\d+[,\.]\d{2})/,
    /ZA UPLATU[^\d]*(\d{1,3}(?:[\s\.]\d{3})*,\d{2}|\d+[,\.]\d{2})/,
    /GOTOVINA[^\d]*(\d{1,3}(?:[\s\.]\d{3})*,\d{2}|\d+[,\.]\d{2})/,
    /TOTAL[^\d]*(\d{1,3}(?:[\s\.]\d{3})*,\d{2}|\d+[,\.]\d{2})/,
    /SVEGA[^\d]*(\d{1,3}(?:[\s\.]\d{3})*,\d{2}|\d+[,\.]\d{2})/,
    /IZNOS[^\d]*(\d{1,3}(?:[\s\.]\d{3})*,\d{2}|\d+[,\.]\d{2})/,
  ];

  for (const pattern of fallbackPatterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      const amount = parseAmount(match[1]);
      if (amount !== null) return field(formatAmount(amount), 'medium');
    }
  }

  return field('', 'none');
}

function extractCurrency(text: string): ParsedField<string> {
  const normalized = normalizeForMatching(text);
  if (/\bEUR\b|€/.test(text) || normalized.includes(' EUR')) return field('EUR', 'high');
  if (/\bUSD\b|\$/.test(text)) return field('USD', 'high');
  if (/\bRSD\b|\bDIN\b|\bDINARA\b|\bDIN\.|\bRS\b/.test(normalized)) {
    return field('RSD', 'high');
  }
  return field('RSD', 'medium');
}

function extractStoreName(lines: string[]): ParsedField<string> {
  const candidates = lines.slice(0, 8).filter((line) => {
    if (line.length < 3 || line.length > 80) return false;
    if (lineMatches(line, SKIP_LINE)) return false;
    if (/\bPIB\b/i.test(line)) return false;
    if (/^\d{1,2}[\.\/-]\d{1,2}[\.\/-]\d{4}/.test(line)) return false;
    if (/^\d[\d\s\-\/\.]+$/.test(line)) return false;
    if (/^[0-9]{5,}$/.test(line.replace(/\s/g, ''))) return false;
    if (/@|www\.|https?:/i.test(line)) return false;
    if (/^(ul\.|ulica|bulevar|bul\.|bb\b)/i.test(line)) return false;
    return true;
  });

  const name = candidates[0]?.replace(/\s{2,}/g, ' ').trim() ?? '';
  if (!name) return field('', 'none');
  return field(name, candidates.length === 1 ? 'medium' : 'high');
}

function extractItems(lines: string[]): ParsedField<OcrReceiptItem[]> {
  const totalIndex = lines.findIndex((line) => lineMatches(line, TOTAL_LINE));
  const end = totalIndex === -1 ? lines.length : totalIndex;
  const start = Math.min(5, Math.max(0, end - 40));
  const slice = lines.slice(start, end);

  const items: OcrReceiptItem[] = [];
  const seen = new Set<string>();

  for (const line of slice) {
    if (lineMatches(line, SKIP_LINE) || lineMatches(line, ITEM_NOISE) || lineMatches(line, TOTAL_LINE)) {
      continue;
    }

    const amount = extractAmountFromLine(line);
    if (amount === null || amount <= 0 || amount > 1_000_000) continue;

    let name = line
      .replace(/\d{1,3}(?:\.\d{3})*,\d{2}\s*$/, '')
      .replace(/\d+[,\.]\d{2}\s*$/, '')
      .replace(/\s+\d+\s*[xX×]\s*[\d,\.]+\s*$/, '')
      .replace(/\s+\d+\s*(?:KOM|KUS|KG|L|G|ML)\.?\s*$/i, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (name.length < 2 || name.length > 120) continue;
    if (/^(PIB|MB|PDV|ESIR|PFR)/i.test(name)) continue;

    const key = `${normalizeForMatching(name)}|${amount}`;
    if (seen.has(key)) continue;
    seen.add(key);

    items.push({
      name,
      price: amount,
      category: guessCategory(name),
    });
  }

  const parsed = items.slice(0, 20);
  if (parsed.length === 0) return itemsField([], 'none');
  return itemsField(parsed, parsed.length === 1 ? 'high' : 'medium');
}

function extractAmountFromLine(line: string): number | null {
  const matches = line.match(/(\d{1,3}(?:[\s\.]\d{3})*,\d{2}|\d+[,\.]\d{2})/g);
  if (!matches?.length) return null;
  return parseAmount(matches[matches.length - 1]);
}

function parseAmount(value: string): number | null {
  const cleaned = value.trim().replace(/\s/g, '');
  if (!cleaned) return null;

  let normalized = cleaned;
  if (/,/.test(cleaned) && /[\.\s]/.test(cleaned.replace(/,.*$/, ''))) {
    normalized = cleaned.replace(/[\s\.]/g, '').replace(',', '.');
  } else if (/,/.test(cleaned)) {
    normalized = cleaned.replace(',', '.');
  }

  const amount = Number.parseFloat(normalized);
  return Number.isFinite(amount) ? amount : null;
}

function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

function guessCategory(name: string): string {
  const lower = normalizeForMatching(name).toLowerCase();
  if (/TELEFON|LAPTOP|MONITOR|TABLET|KOMPJUTER|PC\b|SSD|HDD|MEMORIJ|KABLO|PUNJA/.test(lower)) {
    return 'electronics';
  }
  if (/MAJICA|PANTALON|PATIK|CIPELA|JAKNA|ODECA|OBUCA|DUKSER/.test(lower)) {
    return 'clothing';
  }
  if (/HLEB|MLEKO|SIR|JOGURT|MESO|PILET|VOCE|POVRCE|KAFA|COKOL|VODA|PIVO|SOK/.test(lower)) {
    return 'food';
  }
  if (/DETERD|SAPUN|SAMpon|PAPIR|UBRUS|KESE/.test(lower)) {
    return 'household';
  }
  return 'other';
}

function isValidDate(year: number, month: number, day: number): boolean {
  if (year < 2000 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function pad2(value: number): string {
  return value.toString().padStart(2, '0');
}
