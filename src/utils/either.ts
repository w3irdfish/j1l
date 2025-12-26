/**
 * Represents a value that can be one of two types: Left (usually representing an error)
 * or Right (usually representing a success).
 */
export interface Either<L, R> {
  readonly value: L | R;
}

/**
 * Represents the Left variant of the Either type.
 */
export class Left<L, R> implements Either<L, R> {
  /**
   * Creates a new Left instance.
   * @param value The value of the Left instance.
   */
  constructor(readonly value: L) {}
}

/**
 * Represents the Right variant of the Either type.
 */
export class Right<L, R> implements Either<L, R> {
  /**
   * Creates a new Right instance.
   * @param value The value of the Right instance.
   */
  constructor(readonly value: R) {}
}

/**
 * Creates a new Left instance.
 * @param value The value of the Left instance.
 * @returns A new Left instance.
 */
export function left<L, R>(value: L): Either<L, R> {
  return new Left<L, R>(value);
}

/**
 * Creates a new Right instance.
 * @param value The value of the Right instance.
 * @returns A new Right instance.
 */
export function right<L, R>(value: R): Either<L, R> {
  return new Right<L, R>(value);
}

/**
 * Type guard to check if an Either is a Left.
 * @param either The Either to check.
 * @returns True if the Either is a Left, false otherwise.
 */
export function isLeft<L, R>(either: Either<L, R>): either is Left<L, R> {
  return either instanceof Left;
}

/**
 * Type guard to check if an Either is a Right.
 * @param either The Either to check.
 * @returns True if the Either is a Right, false otherwise.
 */
export function isRight<L, R>(either: Either<L, R>): either is Right<L, R> {
  return either instanceof Right;
}

/**
 * Matches on an Either value and executes the corresponding callback.
 * @param either The Either value to match on.
 * @param onLeft The callback to execute if the Either is a Left.
 * @param onRight The callback to execute if the Either is a Right.
 */
export function match<L, R>(
  either: Either<L, R>,
  onLeft: (value: L) => void,
  onRight: (value: R) => void
): void {
  if (isLeft(either)) {
    onLeft(either.value);
  } else if (isRight(either)) {
    onRight(either.value);
  }
}

/**
 * Unwraps the Left value from an Either.
 * @param either The Either to unwrap.
 * @returns The Left value.
 * @throws If the Either is a Right.
 */
export function unwrapLeft<L, R>(either: Either<L, R>): L {
  if (isLeft(either)) {
    return either.value;
  }
  throw new Error("Tried to unwrap Left from a Right value.");
}

/**
 * Unwraps the Right value from an Either.
 * @param either The Either to unwrap.
 * @returns The Right value.
 * @throws If the Either is a Left.
 */
export function unwrapRight<L, R>(either: Either<L, R>): R {
  if (isRight(either)) {
    return either.value;
  }
  throw new Error("Tried to unwrap Right from a Left value.");
}

/**
 * Collects all Right values from an iterable of Either results.
 * @param results The iterable of Either results.
 * @returns An array of all Right values.
 * @throws If any of the Either results is a Left.
 */
export function unwrapAll<L, R>(results: Iterable<Either<L, R>>): R[] {
  const rights: R[] = [];
  for (const result of results) {
    if (isLeft(result)) {
      throw new Error(
        `Expected all results to be Right values. Found Left: ${JSON.stringify(unwrapLeft(result))}`
      );
    }
    rights.push(unwrapRight(result));
  }
  return rights;
}

/**
 * Yields the Either result, and if it's a Left, returns immediately.
 * @param result The Either result to yield or return from.
 * @returns A generator yielding the Either result.
 */
export function* yieldOrReturn<L, R>(
  result: Either<L, R>
): Generator<Either<L, R>> {
  yield result;
  if (isLeft(result)) return;
}
