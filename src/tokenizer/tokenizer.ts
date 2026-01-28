import {
  createToken,
  createSpan,
  StringError,
  Token,
  SourceCode,
  concatSpans,
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
export function* scan(source: string): Scanner {
  const src = new SourceCode(source);

  while (!src.isEOF()) {
    yield* scanTrivia(src);

    const char = src.peek();
    if (char === "") {
      break;
    }

    if (char === "<") {
      yield* scanTag(src);
      continue;
    }

    yield left(src.formatError(`Unexpected character '${char}'`));
    return;
  }

  yield* scanTrivia(src);

  // Emit EOF token
  yield right(createToken("EOF", createSpan("", src.position)));

  return;
}

/**
 * Scans a tag from the source code.
 * @param src The source code to scan from.
 * @returns A generator yielding tokens or errors.
 */
function* scanTag(src: SourceCode): Scanner {
  yield right(createToken("LessThan", src.eatExactly("<")));

  const leadingSlash = src.eatIf("/");
  if (leadingSlash) {
    yield right(createToken("Slash", leadingSlash));
  }

  yield* scanTagName(src);

  if (!leadingSlash) {
    yield* scanAttributes(src);
  }

  const trailingSlash = src.eatIf("/");
  if (trailingSlash) {
    yield right(createToken("Slash", trailingSlash));
  }
  if (leadingSlash && trailingSlash) {
    yield left(src.formatError("A closing tag cannot be self-closing"));
  }

  const greaterThan = src.eatIf(">");
  if (!greaterThan) {
    yield left(src.formatError("Expected '>' at the end of the tag"));
    return;
  }
  yield right(createToken("GreaterThan", greaterThan));

  // If it's not a self-closing tag, scan children
  if (!leadingSlash && !trailingSlash) {
    yield* scanChildren(src);
  }
}

/**
 * Scans attributes from the source code.
 * @param src The source code to scan from.
 * @returns A generator yielding tokens or errors.
 */
function* scanAttributes(src: SourceCode): Scanner {
  while (!src.isEOF()) {
    yield* scanTrivia(src);

    const char = src.peek();
    if (char === ">" || char === "/") {
      return;
    }

    yield* scanAttributeName(src);
    yield* scanTrivia(src);

    const equalSign = src.eatIf("=");
    yield* scanTrivia(src);

    if (equalSign) {
      yield right(createToken("Equal", equalSign));
    } else {
      // If there is no equal sign, we consider it a boolean attribute
      // and continue scanning the next attribute.
      continue;
    }

    yield* scanExpression(src);
  }

  return;
}

/**
 * Scans child nodes from the source code.
 * @param src The source code to scan from.
 * @returns A generator yielding tokens or errors.
 */
function* scanChildren(src: SourceCode): Scanner {
  while (!src.isEOF()) {
    yield* scanTrivia(src);

    const char = src.peek();
    if (char === "") {
      return;
    }

    if (char === "<") {
      if (src.peek(1) === "/") {
        return;
      }

      yield* scanTag(src);
    }

    const text = src.eatWhile((char) => char !== "<");
    if (text) {
      yield right(createToken("Text", text));
    }
  }
}

/**
 * Scans an expression from the source code.
 * @param src The source code to scan from.
 * @returns A generator yielding tokens or errors.
 */
function* scanExpression(src: SourceCode): Scanner {
  if (src.isEOF()) {
    yield left(src.formatError("Expected an expression, but found EOF"));
    return;
  }

  const char = src.peek();

  if (isNum(char) || char === "-" || char === ".") {
    return yield* scanNumberLiteral(src);
  }

  if (char === '"') {
    return yield* scanStringLiteral(src);
  }

  return yield* scanKeyword(src);
}

/**
 * Scans a number literal from the source code.
 * @param src The source code to scan from.
 * @returns A generator yielding tokens or errors.
 */
function* scanNumberLiteral(src: SourceCode): Scanner {
  const numberLiteral = src.eatNumber();

  if (!numberLiteral) {
    yield left(src.formatError("Invalid number literal"));
    return;
  }

  yield right(createToken("NumberLiteral", numberLiteral));
}

/**
 * Scans a string value from the source code.
 * @param src The source code to scan from.
 * @returns A generator yielding tokens or errors.
 */
function* scanStringLiteral(src: SourceCode): Scanner {
  const leadingQuote = src.eatExactly('"');
  const str = src.eatUntil((char) => char === '"');
  const trailingQuote = src.eatIf('"');

  if (!trailingQuote) {
    yield left(
      src.formatError("Unterminated string literal, missing closing quote")
    );
  }

  yield right(
    createToken(
      "StringLiteral",
      createSpan(str?.text ?? "", leadingQuote.start, trailingQuote?.end)
    )
  );
}

/**
 * Scans a keyword or identifier from the source code.
 * @param src The source code to scan from.
 * @returns A generator yielding tokens or errors.
 */
function* scanKeyword(src: SourceCode): Scanner {
  const word = src.eatWord();
  if (!word) {
    yield left(src.formatError("Expected identifier"));
    return;
  }

  switch (word.text) {
    case "true":
    case "false":
      yield right(createToken("BooleanLiteral", word));
      break;
    default:
      yield left(src.formatError(`Unrecognized keyword '${word.text}'`));
  }
}

/**
 * Scans a tag name from the source code.
 * @param src The source code to scan from.
 * @returns A generator yielding tokens or errors.
 */
function* scanTagName(src: SourceCode): Scanner {
  // Possible tag name formats:
  // </>
  // <.property/>
  // <prefix:property />
  // <prefix:target.property />
  // <prefix:.property />
  const char = src.peek();
  if (char === "" || char === ">" || char === "/") {
    return;
  }

  yield* scanTrivia(src);

  // Shorthand access allows accessing properties from parent object without
  // repeating the parent name. e.g., <.name />
  const shorthandAccess = src.eatIf(".");
  if (shorthandAccess) {
    yield right(createToken("Dot", shorthandAccess));
  }

  const atSign = src.eatIf("@");
  if (atSign) {
    yield right(createToken("AtSign", atSign));
  }

  const nameOrPrefix = src.eatName();
  if (nameOrPrefix) {
    yield right(createToken("Name", nameOrPrefix));
  }

  // if there is a colon, the previous part should be considered a prefix and
  // cannot be started with a '.'. (e.g., <prefix:name />)
  const colon = src.eatIf(":");
  if (colon) {
    yield right(createToken("Colon", colon));
  } else {
    return; // No more parts to scan
  }

  const target = src.eatName();
  if (target) {
    yield right(createToken("Name", target));
  }

  const memberAccess = src.eatIf(".");
  if (memberAccess) {
    yield right(createToken("Dot", memberAccess));
  } else {
    return; // No more parts to scan
  }

  const property = src.eatName();
  if (!property) {
    yield left(src.formatError("Expected property name after '.'"));
    return;
  }
  yield right(createToken("Name", property));
}

/**
 * Scans an attribute name from the source code.
 * @param src The source code to scan from.
 * @returns A generator yielding tokens or errors.
 */
function* scanAttributeName(src: SourceCode): Scanner {
  const prefixOrName = src.eatName();
  if (!prefixOrName) {
    yield left(src.formatError("Expected attribute name"));
    return;
  }

  const colon = src.eatIf(":");
  if (colon) {
    yield right(createToken("Name", prefixOrName));
    yield right(createToken("Colon", colon));
  }

  const name = src.eatName();
  if (colon && !name) {
    yield left(src.formatError("Expected attribute name"));
    return;
  }

  if (name) {
    yield right(createToken("Name", name));
  }
}

/**
 * Scans trivia (whitespace and comments) from the source code.
 * @param src The source code to scan from.
 * @returns A generator yielding tokens or errors.
 */
function* scanTrivia(src: SourceCode): Scanner {
  while (!src.isEOF()) {
    const whitespace = src.eatWhitespace();
    if (whitespace) {
      yield right(createToken("Whitespace", whitespace));
      continue;
    }

    const hash = src.eatIf("#");
    if (hash) {
      const comment = src.eatWhile((char) => char !== "\n");
      yield right(createToken("Comment", concatSpans(hash, comment)));
      continue;
    }

    return;
  }
}
