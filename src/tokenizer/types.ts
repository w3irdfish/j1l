/**
 * An error type representing string-based errors in the tokenizer.
 */
export type StringError = string;

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
  | "TagName"
  | "AttributeName"
  | "Text"
  | "Whitespace"
  | "NumberLiteral"
  | "BooleanLiteral"
  | "StringLiteral";

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
  readonly start: number;
  /**
   * The end index of the span in the source code.
   */
  readonly end: number;
};

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
export function createSpan(text: string, start: number, end: number): Span {
  return { text, start, end };
}

/**
 * Creates a token object.
 * @param kind The kind of the token.
 * @param text The span of the token in the source code.
 * @returns A token object.
 */
export function createToken(kind: TokenKind, text: Span) {
  return { kind, value: text };
}
