import {
  createToken,
  createSpan,
  StringError,
  Token,
  SourceCode,
} from "@/tokenizer";
import { Either, isNum, left, right } from "@/utils";

/**
 * A generator that yields tokens or errors.
 */
export type Scanner = Generator<Either<StringError, Token>>;

/**
 * Tokenizes the given source code into a sequence of tokens.
 * @param source The source code to tokenize.
 * @returns A generator yielding tokens or errors.
 */
export function* scanSource(source: string): Scanner {
  const src = new SourceCode(source);

  while (!src.isEOF()) {
    const char = src.peek();

    const whitespace = src.eatWhitespace();
    if (whitespace) {
      yield right(createToken("Whitespace", whitespace));
      continue;
    }

    if (char === "<") {
      yield* scanTag(src);
      continue;
    }

    yield left(`Unexpected character '${char}' at position ${src.position}.`);
    return;
  }

  // Emit EOF token
  yield right(createToken("EOF", createSpan("", src.position, src.position)));
}

/**
 * Scans a tag from the source code.
 * @param source The source code to scan from.
 * @returns A generator yielding tokens or errors.
 */
function* scanTag(source: SourceCode): Scanner {
  yield right(createToken("LessThan", source.eatExactly("<")));

  const leadingSlash = source.eatIf("/");
  if (leadingSlash) {
    yield right(createToken("Slash", leadingSlash));
  }

  const identifier = source.eatIdentifier();
  if (identifier) {
    yield right(createToken("TagName", identifier));
  }

  yield* scanAttributes(source);

  const trailingSlash = source.eatIf("/");
  if (trailingSlash) {
    yield right(createToken("Slash", trailingSlash));
  }

  if (source.peek() !== ">") {
    yield left(`Missing closing '>' for tag.`);
    return;
  }
  yield right(createToken("GreaterThan", source.eatExactly(">")));

  // If it's not a self-closing tag, scan children
  if (!leadingSlash && !trailingSlash) {
    yield* scanChildren(source);
  }
}

/**
 * Scans attributes from the source code.
 * @param source The source code to scan from.
 * @returns A generator yielding tokens or errors.
 */
function* scanAttributes(
  source: SourceCode
): Generator<Either<StringError, Token>> {
  while (!source.isEOF()) {
    const whitespace = source.eatWhitespace();
    if (whitespace) {
      yield right(createToken("Whitespace", whitespace));
    }

    const char = source.peek();
    if (char === null || char === ">" || char === "/") {
      return;
    }

    const name = source.eatIdentifier();
    if (!name) {
      yield left(
        `Expected attribute name at position ${source.position}, found '${char}'.`
      );
      return;
    }
    yield right(createToken("AttributeName", name));

    const equalSign = source.eatIf("=");
    if (equalSign) {
      yield right(createToken("Equal", equalSign));
    }

    // If there is no equal sign, we consider it a boolean attribute
    // and continue scanning the next attribute.
    if (!equalSign) {
      continue;
    }

    yield* scanExpression(source);
  }
}

/**
 * Scans child nodes from the source code.
 * @param source The source code to scan from.
 * @returns A generator yielding tokens or errors.
 */
function* scanChildren(source: SourceCode): Scanner {
  const char = source.peek();
  if (char === null) {
    return;
  }

  if (char === "<") {
    yield* scanTag(source);
    return;
  }

  const text = source.eatWhile((char) => char !== "<");
  if (text) {
    yield right(createToken("Text", text));
  }
}

/**
 * Scans an expression from the source code.
 * @param source The source code to scan from.
 * @returns A generator yielding tokens or errors.
 */
function* scanExpression(source: SourceCode): Scanner {
  const char = source.peek();
  if (char === null) {
    return;
  }

  if (isNum(char)) {
    const numberLiteral = source.eatNumber();
    if (numberLiteral) {
      yield right(createToken("NumberLiteral", numberLiteral));
      return;
    }
  }

  if (char === '"') {
    yield* scanStringLiteral(source);
    return;
  }

  yield* scanKeyword(source);
}

/**
 * Scans a keyword or identifier from the source code.
 * @param source The source code to scan from.
 * @returns A generator yielding tokens or errors.
 */
function* scanKeyword(source: SourceCode): Scanner {
  const word = source.eatWord();
  if (!word) {
    yield left(
      `Expected identifier or keyword at position ${source.position}.`
    );
    return;
  }

  switch (word.text) {
    case "true":
    case "false":
      yield right(createToken("BooleanLiteral", word));
      break;
    default:
      yield left(
        `Unexpected identifier '${word.text}' at position ${word.start}.`
      );
  }
}

/**
 * Scans a string value from the source code.
 * @param source The source code to scan from.
 * @returns A generator yielding tokens or errors.
 */
function* scanStringLiteral(source: SourceCode): Scanner {
  yield right(createToken("Quote", source.eatExactly('"')));

  const value = source.eatWhile((char) => char !== '"');
  if (value) {
    yield right(createToken("StringLiteral", value));
  }

  const closingQuote = source.eatIf('"');
  if (!closingQuote) {
    yield left(
      `Expected closing '"' for attribute value at position ${source.position}.`
    );
    return;
  }
  yield right(createToken("Quote", closingQuote));
}
