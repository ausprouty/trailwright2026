export type NumberSystem = 'latn' | 'arab' | 'arabext' | 'deva' | 'taml' | 'ethi';

const DIGIT_MAPS: Record<NumberSystem, string[]> = {
  // Latin / Western digits
  latn: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],

  // Arabic-Indic digits
  arab: ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'],

  // Extended Arabic-Indic digits, used in Persian/Urdu contexts
  arabext: ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'],

  // Devanagari digits, used for Hindi and related languages
  deva: ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'],

  // Tamil digits
  taml: ['௦', '௧', '௨', '௩', '௪', '௫', '௬', '௭', '௮', '௯'],

  // Ethiopic numerals do not have a true zero digit in the traditional system.
  // We keep 0 as Latin zero and localize 1-9.
  ethi: ['0', '፩', '፪', '፫', '፬', '፭', '፮', '፯', '፰', '፱'],
};

function isSupportedNumberSystem(numberSystem: string): numberSystem is NumberSystem {
  return numberSystem in DIGIT_MAPS;
}

/**
 * Converts Latin digits 0-9 to the requested local number system.
 */
export function localizeDigits(
  value: string | number,
  numberSystem: string | null | undefined = 'latn',
): string {
  const text = String(value);

  if (!numberSystem || numberSystem === 'latn') {
    return text;
  }

  if (!isSupportedNumberSystem(numberSystem)) {
    return text;
  }

  const digitMap = DIGIT_MAPS[numberSystem];

  return text.replace(/\d/g, (digit) => digitMap[Number(digit)] ?? digit);
}

/**
 * Converts only numeric text inside <sup>...</sup> tags.
 *
 * This changes visible Bible verse numbers without changing references,
 * URLs, IDs, filenames, CSS values, or other digits elsewhere in the HTML.
 */
export function localizeSupVerseNumbers(
  html: string,
  numberSystem: string | null | undefined = 'latn',
): string {
  if (!html || !numberSystem || numberSystem === 'latn') {
    return html;
  }

  if (!isSupportedNumberSystem(numberSystem)) {
    return html;
  }

  return html.replace(
    /<sup([^>]*)>(\s*)(\d+)(\s*)<\/sup>/gi,
    (_match, attrs: string, before: string, number: string, after: string) => {
      return `<sup${attrs}>${before}${localizeDigits(number, numberSystem)}${after}</sup>`;
    },
  );
}

/**
 * Converts plain verse numbers at the start of Bible lines.
 *
 * Use this only for imported text that does not already use <sup>.
 */
export function localizeLeadingVerseNumbers(
  text: string,
  numberSystem: string | null | undefined = 'latn',
): string {
  if (!text || !numberSystem || numberSystem === 'latn') {
    return text;
  }

  if (!isSupportedNumberSystem(numberSystem)) {
    return text;
  }

  return text.replace(
    /(^|\n)(\s*)(\d{1,3})(?=\S)/g,
    (_match, lineStart: string, spacing: string, number: string) => {
      return `${lineStart}${spacing}${localizeDigits(number, numberSystem)}`;
    },
  );
}
