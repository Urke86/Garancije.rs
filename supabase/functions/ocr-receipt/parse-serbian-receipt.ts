export interface ParsedReceiptItem {
  name: string;
  price: number;
  category: string;
}

export interface ParsedReceipt {
  store_name: string;
  purchase_date: string;
  total_amount: string;
  pib: string;
  receipt_number: string;
  items: ParsedReceiptItem[];
  raw_text: string;
}

const SKIP_LINE =
  /^(PIB|MB|JMBG|PDV|ESIR|PFR|BF|RACUN|RAČUN|RACUN|KASIR|KASIRKA|VREME|DATUM|FISKAL|KOPija|Gotovina|Kartica|Visa|Master|Promet|PROMET|Adresa|Tel|Telefon|www\.|http|===|---|\*+)/i;

const TOTAL_LINE =
  /^(UKUPNO|UKUPAN|UPLAT|ZA\s+UPLAT|ZA\s+UPLATU|ZA\s+PLACAN|ZA\s+PLAĆAN|ZA\s+PLATITI|GOTOVINA|KARTICA|SUMA|TOTAL|AMOUNT\s+DUE|IZNOS)/i;

const ITEM_NOISE =
  /^(PDV|POREZ|RABAT|POPUST|POVRAT|POVR\.|POVRACAJ|KUS|KOM|KOL\.|KOLICINA|CENA|IZNOS|A\s*-\s*\d+%|E\s*-\s*\d+%)/i;

export function parseSerbianReceipt(rawText: string): ParsedReceipt {
  const normalized = rawText.replace(/\r\n/g, "\n").trim();
  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const pib = extractPib(normalized);
  const purchase_date = extractDate(normalized);
  const total_amount = extractTotal(normalized, lines);
  const receipt_number = extractReceiptNumber(normalized);
  const store_name = extractStoreName(lines);
  const items = extractItems(lines);

  return {
    store_name,
    purchase_date,
    total_amount,
    pib,
    receipt_number,
    items,
    raw_text: normalized,
  };
}

function extractPib(text: string): string {
  const labeled = text.match(/\bPIB[:\s]*(\d{9})\b/i);
  if (labeled?.[1]) return labeled[1];

  const header = text.slice(0, 600);
  const standalone = header.match(/\b(\d{9})\b/g);
  if (standalone?.length) {
    return standalone[0];
  }

  return "";
}

function extractDate(text: string): string {
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
      return `${year}-${pad2(month)}-${pad2(day)}`;
    }
  }

  return new Date().toISOString().split("T")[0];
}

function extractReceiptNumber(text: string): string {
  const patterns = [
    /(?:ESIR|PFR|BF|Broj\s*(?:fiskalnog\s*)?ra[čc]una|Ra[čc]un\s*(?:br\.?|#)?)[:\s#-]*([A-Z0-9][A-Z0-9\-\/]{4,})/i,
    /\b([A-Z0-9]{5,}-[A-Z0-9]{4,}-[A-Z0-9]{4,})\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }

  return "";
}

function extractTotal(text: string, lines: string[]): string {
  for (const line of lines) {
    if (!TOTAL_LINE.test(line)) continue;
    const amount = extractAmountFromLine(line);
    if (amount !== null) return formatAmount(amount);
  }

  const fallbackPatterns = [
    /UKUPNO[^\d]*(\d{1,3}(?:[\s\.]\d{3})*,\d{2}|\d+[,\.]\d{2})/i,
    /UPLAT[^\d]*(\d{1,3}(?:[\s\.]\d{3})*,\d{2}|\d+[,\.]\d{2})/i,
    /ZA\s+UPLATU[^\d]*(\d{1,3}(?:[\s\.]\d{3})*,\d{2}|\d+[,\.]\d{2})/i,
    /GOTOVINA[^\d]*(\d{1,3}(?:[\s\.]\d{3})*,\d{2}|\d+[,\.]\d{2})/i,
    /TOTAL[^\d]*(\d{1,3}(?:[\s\.]\d{3})*,\d{2}|\d+[,\.]\d{2})/i,
  ];

  for (const pattern of fallbackPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const amount = parseAmount(match[1]);
      if (amount !== null) return formatAmount(amount);
    }
  }

  return "";
}

function extractStoreName(lines: string[]): string {
  const candidates = lines.slice(0, 8).filter((line) => {
    if (line.length < 3 || line.length > 80) return false;
    if (SKIP_LINE.test(line)) return false;
    if (/\bPIB\b/i.test(line)) return false;
    if (/^\d{1,2}[\.\/-]\d{1,2}[\.\/-]\d{4}/.test(line)) return false;
    if (/^\d[\d\s\-\/\.]+$/.test(line)) return false;
    if (/^[0-9]{5,}$/.test(line.replace(/\s/g, ""))) return false;
    if (/@|www\.|https?:/i.test(line)) return false;
    if (/^(ul\.|ulica|bulevar|bul\.|bb\b)/i.test(line)) return false;
    return true;
  });

  return candidates[0]?.replace(/\s{2,}/g, " ").trim() ?? "";
}

function extractItems(lines: string[]): ParsedReceiptItem[] {
  const totalIndex = lines.findIndex((line) => TOTAL_LINE.test(line));
  const end = totalIndex === -1 ? lines.length : totalIndex;
  const start = Math.min(5, Math.max(0, end - 40));
  const slice = lines.slice(start, end);

  const items: ParsedReceiptItem[] = [];
  const seen = new Set<string>();

  for (const line of slice) {
    if (SKIP_LINE.test(line) || ITEM_NOISE.test(line) || TOTAL_LINE.test(line)) {
      continue;
    }

    const amount = extractAmountFromLine(line);
    if (amount === null || amount <= 0 || amount > 1_000_000) continue;

    let name = line
      .replace(/\d{1,3}(?:\.\d{3})*,\d{2}\s*$/, "")
      .replace(/\d+[,\.]\d{2}\s*$/, "")
      .replace(/\s+\d+\s*[xX×]\s*[\d,\.]+\s*$/, "")
      .replace(/\s+\d+\s*(?:KOM|KUS|KG|L|G|ML)\.?\s*$/i, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    if (name.length < 2 || name.length > 120) continue;
    if (/^(PIB|MB|PDV|ESIR|PFR)/i.test(name)) continue;

    const key = `${name.toLowerCase()}|${amount}`;
    if (seen.has(key)) continue;
    seen.add(key);

    items.push({
      name,
      price: amount,
      category: guessCategory(name),
    });
  }

  return items.slice(0, 20);
}

function extractAmountFromLine(line: string): number | null {
  const matches = line.match(
    /(\d{1,3}(?:[\s\.]\d{3})*,\d{2}|\d+[,\.]\d{2})/g,
  );
  if (!matches?.length) return null;
  return parseAmount(matches[matches.length - 1]);
}

function parseAmount(value: string): number | null {
  const cleaned = value.trim().replace(/\s/g, "");
  if (!cleaned) return null;

  let normalized = cleaned;
  if (/,/.test(cleaned) && /[\.\s]/.test(cleaned.replace(/,.*$/, ""))) {
    normalized = cleaned.replace(/[\s\.]/g, "").replace(",", ".");
  } else if (/,/.test(cleaned)) {
    normalized = cleaned.replace(",", ".");
  }

  const amount = Number.parseFloat(normalized);
  return Number.isFinite(amount) ? amount : null;
}

function normalizeForMatch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

function guessCategory(name: string): string {
  const lower = normalizeForMatch(name);
  if (/telefon|laptop|monitor|tablet|kompjuter|pc\b|ssd|hdd|memorij|kablo|punja/.test(lower)) {
    return "electronics";
  }
  if (/majica|pantalon|patik|cipela|jakna|odeća|obuć|obuca|dukser/.test(lower)) {
    return "clothing";
  }
  if (/hleb|mleko|sir|jogurt|meso|pilet|voce|voće|povrce|povrće|kafa|cokol|čokol|voda|pivo|sok/.test(lower)) {
    return "food";
  }
  if (/deterd|sapun|šampon|sampon|papir|ubrus|kese|kese/.test(lower)) {
    return "household";
  }
  return "other";
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
  return value.toString().padStart(2, "0");
}
