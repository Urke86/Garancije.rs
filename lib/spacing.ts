/** 8pt grid — jedinstveni razmaci kroz aplikaciju. */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const layout = {
  /** Horizontalni gutter ekrana */
  gutter: 20,
  /** Razmak ispod ScreenHeader */
  headerGap: 24,
  /** Između sekcija na ekranu */
  section: 24,
  /** Između kartica u listi / stacku */
  stack: 12,
  /** Unutrašnji padding kartice */
  inset: 16,
  /** Zaobljenje kartica */
  radius: 16,
  /** Donji padding scroll sadržaja (bez tab bara) */
  scrollBottom: 32,
} as const;
