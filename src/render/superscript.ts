/**
 * Superscript unicode conversion
 */

const SUPERSCRIPT_DIGITS = '⁰¹²³⁴⁵⁶⁷⁸⁹';

/**
 * Convert number to superscript
 * @param num - Number to convert
 * @returns Superscript string
 *
 * @example
 * toSuperscript(3)   // '³'
 * toSuperscript(12)  // '¹²'
 * toSuperscript(0)   // '⁰'
 */
export function toSuperscript(num: number): string {
  return Array.from(String(Math.abs(Math.floor(num))))
    .map(digit => SUPERSCRIPT_DIGITS[parseInt(digit, 10)])
    .join('');
}

/**
 * Return superscript if count > 1, otherwise empty string
 * @param count - Count value
 * @returns Superscript or empty string
 *
 * @example
 * formatCount(1)  // ''
 * formatCount(3)  // '³'
 * formatCount(15) // '¹⁵'
 */
export function formatCount(count: number): string {
  return count > 1 ? toSuperscript(count) : '';
}
