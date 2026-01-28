/**
 * Checks if the given character is an alphabetic letter (A-Z, a-z).
 * @param char The character to check.
 * @returns True if the character is an alphabetic letter, false otherwise.
 */
export function isAlpha(char: string): boolean {
  ensureSingleChar(char);

  const code = char.charCodeAt(0);
  return (
    (code >= 65 && code <= 90) || // A-Z
    (code >= 97 && code <= 122) // a-z
  );
}

/**
 * Checks if the given character is a numeric digit (0-9).
 * @param char The character to check.
 * @returns True if the character is a numeric digit, false otherwise.
 */
export function isNum(char: string): boolean {
  ensureSingleChar(char);

  const code = char.charCodeAt(0);
  return code >= 48 && code <= 57; // 0-9
}

/**
 * Checks if the given character is alphanumeric (A-Z, a-z, 0-9).
 * @param char The character to check.
 * @returns True if the character is alphanumeric, false otherwise.
 */
export function isAlphaNum(char: string): boolean {
  return isAlpha(char) || isNum(char);
}

/**
 * Checks if the given character is a whitespace character (space, tab,
 * newline, carriage return).
 * @param char The character to check.
 * @returns True if the character is a whitespace character, false otherwise.
 */
export function isWhitespace(char: string): boolean {
  return char === " " || char === "\t" || char === "\n" || char === "\r";
}

/**
 * Checks if the given string represents a boolean value ("true" or "false").
 * @param str The string to check.
 * @returns True if the string represents a boolean value, false otherwise.
 */
export function isBoolean(str: string): boolean {
  return str === "true" || str === "false";
}

/**
 * Ensures that the input string is a single character.
 * @param char The string to check.
 * @throws Error if the input string is not a single character.
 */
function ensureSingleChar(char: string): void {
  if (char.length !== 1) {
    throw new Error("Function accepts a single character only");
  }
}
