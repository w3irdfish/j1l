import { isAlphaNum, isNum, isWhitespace } from "@/utils";
import { Span } from "./types";

/**
 * A class representing a source code.
 */
export class SourceCode {
  /**
   * The current position of the head in the source code.
   */
  private head: number = 0;

  /**
   * Creates a new SourceCode instance.
   * @param code The source code string.
   */
  constructor(public readonly code: string) {}

  /**
   * The length of the source code.
   */
  get length(): number {
    return this.code.length;
  }

  /**
   * The current position of the head in the source code.
   */
  get position(): number {
    return this.head;
  }

  /**
   * Checks if the end of the source code has been reached.
   * @returns True if the end of the source code has been reached, false otherwise.
   */
  isEOF(): boolean {
    return this.head >= this.code.length;
  }

  /**
   * Peeks at the next character(s) in the source code without advancing the head.
   * @param delta The number of characters ahead of the current head to start peeking from.
   * @param count The number of characters to peek.
   * @returns The peeked character(s) or null if the end of the source code is reached.
   */
  peek(delta: number = 0, count: number = 1): string | null {
    return (
      this.code.substring(this.head + delta, this.head + delta + count) ?? null
    );
  }

  /**
   * Eats the next character(s) in the source code and advances the head.
   * @param count The number of characters to eat.
   * @returns The span of the eaten character(s).
   */
  eat(count: number = 1): Span {
    const start = this.head;
    const str = this.code.substring(start, start + count);

    this.head += count;

    // Throwing an error if we couldn't eat the expected number of characters.
    // In fact it indicates a bug in the tokenizer like not having a proper
    // EOF check before eating.
    if (str.length !== count) {
      throw new Error("Unexpected end of source code");
    }

    return {
      text: str,
      start,
      end: this.head,
    };
  }

  /**
   * Eats characters while the given condition is met.
   * @param condition The condition to be met for continuing the eating process.
   * @returns The span of the eaten characters or null if no characters were eaten.
   */
  eatWhile(condition: (char: string) => boolean): Span | null {
    let count = 0;
    while (true) {
      const char = this.peek(count);
      if (char === null || !condition(char)) {
        break;
      }
      count++;
    }

    if (count === 0) {
      return null;
    }

    return this.eat(count);
  }

  /**
   * Eats exactly the expected string from the source code.
   * @param expected The expected string to eat.
   * @returns The span of the eaten string.
   */
  eatExactly(expected: string): Span {
    const actual = this.peek(0, expected.length);

    // Throwing an error if we couldn't eat the expected number of characters.
    // In fact it indicates a bug in the tokenizer like not having a proper
    // EOF check before eating.
    if (actual !== expected) {
      throw new Error(`Expected '${expected}', but got '${actual ?? "EOF"}'`);
    }

    return this.eat(expected.length);
  }

  /**
   * Eats the expected string if it matches the next characters in the source code.
   * @param expected The expected string to eat.
   * @returns The span of the eaten string or null if the expected string does not match.
   */
  eatIf(expected: string): Span | null {
    const actual = this.peek(0, expected.length);
    if (actual !== expected) {
      return null;
    }

    return this.eat(expected.length);
  }

  /**
   * Eats whitespace characters from the source code.
   * @returns The span of the eaten whitespace characters or null if no whitespace was eaten.
   */
  eatWhitespace(): Span | null {
    return this.eatWhile(isWhitespace);
  }

  /**
   * Eats a word from the source code.
   * @returns The span of the eaten word or null if no word was eaten.
   */
  eatWord(): Span | null {
    return this.eatWhile((char) => isAlphaNum(char));
  }

  /**
   * Eats an identifier from the source code.
   * @returns The span of the eaten identifier or null if no identifier was eaten.
   */
  eatIdentifier(): Span | null {
    return this.eatWhile(
      (char) =>
        char === "_" ||
        char === "-" ||
        char === "." ||
        char === ":" ||
        isAlphaNum(char)
    );
  }

  /**
   * Eats a number literal from the source code.
   * @returns The span of the eaten number literal or null if no number literal was eaten.
   */
  eatNumber(): Span | null {
    return this.eatWhile((n) => isNum(n) || n === ".");
  }
}
