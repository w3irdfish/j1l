/**
 * Checks if an array is not empty.
 * @param arr The array to check.
 * @returns True if the array is not empty, false otherwise.
 */
export function isNotEmpty<T>(arr: T[]): arr is [T, ...T[]] {
  return arr.length > 0;
}
