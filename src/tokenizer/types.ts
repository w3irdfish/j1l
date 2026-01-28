import { isNotEmpty } from "@/utils";

/**
 * An error type representing string-based errors in the tokenizer.
 */
export type StringError = string;

/**
 * Location in the source code.
 */
export type Location = {
  /**
   * The offset index in the source code.
   */
  offset: number;
  /**
   * The line number in the source code.
   */
  line: number;
  /**
   * The column number in the source code.
   */
  column: number;
};

/**
 * A span represents a contiguous sequence of characters in the source code.
 */
export type Span = {
  /**
   * The actual text of the span.
   */
  readonly text: string;
  /**
   * The start index of the span in the source code.
   */
  readonly start: Readonly<Location>;
  /**
   * The end index of the span in the source code.
   */
  readonly end: Readonly<Location>;
};

/**
 * Token kinds.
 */
export type TokenKind =
  | "EOF"
  | "LessThan"
  | "GreaterThan"
  | "OpenBrace"
  | "CloseBrace"
  | "Slash"
  | "Equal"
  | "Quote"
  | "Hash"
  | "Colon"
  | "Dot"
  | "AtSign"
  | "Name"
  | "Text"
  | "NumberLiteral"
  | "BooleanLiteral"
  | "StringLiteral"
  | "Comment"
  | "Whitespace";

/**
 * A token represents a meaningful unit in the source code.
 */
export type Token = {
  /**
   * The kind of the token.
   */
  readonly kind: TokenKind;
  /**
   * The span of the token in the source code.
   */
  readonly value: Span;
};

/**
 * Creates a span object.
 * @param text The text of the span.
 * @param start The start index of the span in the source code.
 * @param end The end index of the span in the source code.
 * @returns A span object.
 */
export function createSpan(
  text: string,
  start: Location,
  end?: Location
): Span {
  return { text, start: { ...start }, end: { ...(end ?? start) } };
}

/**
 * Concatenates multiple spans into a single span.
 * @param spans The spans to concatenate.
 * @returns A span object representing the concatenated spans.
 */
export function concatSpans(...spans: (Span | null)[]): Span {
  const filteredSpans = spans.filter((s): s is Span => s !== null);
  if (!isNotEmpty(filteredSpans)) {
    throw new Error("At least one non-null span is required to concatenate.");
  }

  const text = filteredSpans.map((span) => span.text).join("");
  const first = filteredSpans[0];
  const last = filteredSpans[filteredSpans.length - 1] ?? first;

  return { text, start: first.start, end: last.end };
}

/**
 * Creates a token object.
 * @param kind The kind of the token.
 * @param text The span of the token in the source code.
 * @returns A token object.
 */
export function createToken(kind: TokenKind, text: Span): Token {
  return { kind, value: text };
}
