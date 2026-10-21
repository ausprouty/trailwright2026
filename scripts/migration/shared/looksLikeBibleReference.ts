/**
 * Recognizes Bible reference patterns in multiple languages.
 *
 * Supports:
 * - Unicode book names (English, Arabic, Chinese, Hindi, etc.)
 * - Accented characters
 * - Unicode decimal digits
 * - Numbered Bible books (1 Corinthians, 2 Timothy, etc.)
 * - Chapter-only references
 * - Individual verses
 * - Verse ranges
 * - Cross-chapter ranges
 * - Comma- and semicolon-separated references
 *
 * Examples:
 * Genesis 1
 * John 3:16
 * John 3:16-18, 20
 * Genesis 1:1–2:3
 * Romans 8:1-4, 6-8
 * 1 Corinthians 13:4-7
 * Éphésiens 2:8-10
 * يوحنا ٣:١٦
 * 约翰福音 3:16
 */
export function looksLikeBibleReference(text: string): boolean {
  const reference = text.trim().normalize('NFC');

  if (!reference || reference.length > 120) {
    return false;
  }

  // Unicode letters and combining marks.
  const word = String.raw`[\p{L}\p{M}]+`;

  // Book name, optionally beginning with 1, 2, or 3.
  const book = String.raw`(?:[1-3]\s*)?${word}(?:[\s.'’\-]+${word})*`;

  // Unicode decimal digits.
  const number = String.raw`\p{Nd}+`;

  // Chapter or chapter:verse.
  const location = String.raw`${number}(?::${number})?`;

  // Verse ranges, including cross-chapter ranges.
  const range = String.raw`${location}(?:\s*[-–—]\s*${location})?`;

  // Comma- and semicolon-separated references.
  const passage = String.raw`${range}(?:\s*[,;]\s*${range})*`;

  const pattern = new RegExp(
    String.raw`^${book}\s+${passage}$`,
    'u',
  );

  return pattern.test(reference);
}
