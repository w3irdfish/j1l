import { isAlphaNum, isNum, isWhitespace } from "@/utils";
import { createSpan, Span, Location, concatSpans } from "./types";

/**
 * A class representing a source code.
 */
export class SourceCode {
  /**
   * The current head position in the source code.
   */
  private head: Location = { offset: 0, line: 1, column: 1 };

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
  get position(): Readonly<Location> {
    return this.head;
  }

  /**
   * Checks if the end of the source code has been reached.
   * @returns True if the end of the source code has been reached, false otherwise.
   */
  isEOF(): boolean {
    return this.head.offset >= this.code.length;
  }

  /**
   * Peeks at the next character(s) in the source code without advancing the head.
   * @param delta The number of characters ahead of the current head to start peeking from.
   * @param count The number of characters to peek.
   * @returns The peeked character(s) or null if the end of the source code is reached.
   */
  peek(delta: number = 0, count = 1): string {
    return this.code.substring(
      this.head.offset + delta,
      this.head.offset + delta + count
    );
  }

  /**
   * Eats the next character(s) in the source code and advances the head.
   * @param count The number of characters to eat.
   * @returns The span of the eaten character(s).
   */
  eat(count: number = 1): Span {
    const start = { ...this.head };

    const str = this.code.substring(start.offset, start.offset + count);

    // Throwing an error if we couldn't eat the expected number of characters.
    // In fact, it indicates a bug in the tokenizer like not having a proper
    // EOF check before eating.
    if (str.length !== count) {
      throw new Error("Unexpected end of source code");
    }

    // Update offset, line, and column based on consumed characters
    for (let i = 0; i < str.length; i++) {
      this.head.offset++;
      if (str[i] === "\n") {
        this.head.line++;
        this.head.column = 1;
      } else {
        this.head.column++;
      }
    }

    return createSpan(str, start, this.head);
  }

  /**
   * Eats characters while the given condition is met.
   * @param condition The condition to be met for continuing the eating process.
   * @returns The span of the eaten characters or null if no characters were eaten.
   */
  eatWhile(condition: (char: string) => boolean): Span | null {
    return this.eatUntil((char) => !condition(char));
  }

  /**
   * Eats characters until the given condition is met.
   * @param condition The condition to be met for stopping the eating process.
   * @returns The span of the eaten characters or null if no characters were eaten.
   */
  eatUntil(condition: (char: string) => boolean): Span | null {
    let count = 0;
    while (true) {
      const char = this.peek(count);

      if (char === "\\") {
        count += 2;
        continue;
      }

      if (char === "" || condition(char)) {
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
   * Eats a number literal from the source code.
   * @returns The span of the eaten number literal or null if no number literal was eaten.
   */
  eatNumber(): Span | null {
    const negativeSign = this.eatIf("-");
    const integerPart = this.eatWhile(isNum);
    const decimalPoint = this.eatIf(".");
    const fractionalPart = this.eatWhile(isNum);

    if (!integerPart && !fractionalPart) {
      // No digits were found
      return null;
    }

    return concatSpans(negativeSign, integerPart, decimalPoint, fractionalPart);
  }

  /**
   * Eats a name (Prefix, TagName or AttributeName) from the source code.
   * @returns The span of the eaten name or null if no name was eaten.
   */
  eatName(): Span | null {
    return this.eatWhile(
      (char) => char === "_" || char === "-" || isAlphaNum(char)
    );
  }

  /**
   * Formats an error message with position information.
   * @param error The error message.
   * @returns The formatted error message.
   */
  formatError(error: string): string {
    return `${error} (${this.head.line}, ${this.head.column})`;
  }
}
