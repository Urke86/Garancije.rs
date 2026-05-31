const CYRILLIC_DIGRAPHS: ReadonlyArray<[string, string]> = [
  ['Љ', 'Lj'],
  ['љ', 'lj'],
  ['Њ', 'Nj'],
  ['њ', 'nj'],
  ['Џ', 'Dž'],
  ['џ', 'dž'],
  ['Ђ', 'Đ'],
  ['ђ', 'đ'],
  ['Ћ', 'Ć'],
  ['ћ', 'ć'],
];

const CYRILLIC_SINGLES: ReadonlyArray<[string, string]> = [
  ['А', 'A'],
  ['а', 'a'],
  ['Б', 'B'],
  ['б', 'b'],
  ['В', 'V'],
  ['в', 'v'],
  ['Г', 'G'],
  ['г', 'g'],
  ['Д', 'D'],
  ['д', 'd'],
  ['Е', 'E'],
  ['е', 'e'],
  ['Ж', 'Ž'],
  ['ж', 'ž'],
  ['З', 'Z'],
  ['з', 'z'],
  ['И', 'I'],
  ['и', 'i'],
  ['Ј', 'J'],
  ['ј', 'j'],
  ['К', 'K'],
  ['к', 'k'],
  ['Л', 'L'],
  ['л', 'l'],
  ['М', 'M'],
  ['м', 'm'],
  ['Н', 'N'],
  ['н', 'n'],
  ['О', 'O'],
  ['о', 'o'],
  ['П', 'P'],
  ['п', 'p'],
  ['Р', 'R'],
  ['р', 'r'],
  ['С', 'S'],
  ['с', 's'],
  ['Т', 'T'],
  ['т', 't'],
  ['У', 'U'],
  ['у', 'u'],
  ['Ф', 'F'],
  ['ф', 'f'],
  ['Х', 'H'],
  ['х', 'h'],
  ['Ц', 'C'],
  ['ц', 'c'],
  ['Ч', 'Č'],
  ['ч', 'č'],
  ['Ш', 'Š'],
  ['ш', 'š'],
];

/** Converts Serbian Cyrillic to Latin for keyword matching. Preserves original elsewhere. */
export function normalizeCyrillicToLatin(input: string): string {
  let text = input;
  for (const [from, to] of CYRILLIC_DIGRAPHS) {
    text = text.split(from).join(to);
  }
  for (const [from, to] of CYRILLIC_SINGLES) {
    text = text.split(from).join(to);
  }
  return text;
}

/** Accent-insensitive Latin text for regex matching. */
export function normalizeForMatching(input: string): string {
  return normalizeCyrillicToLatin(input)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'dj')
    .replace(/Đ/g, 'Dj')
    .toUpperCase();
}

export function lineMatches(line: string, pattern: RegExp): boolean {
  return pattern.test(normalizeForMatching(line));
}
