/**
 * Merges only the defined (non-undefined) keys of `attributes` onto `target`,
 * so a PATCH-style partial update never wipes out fields the caller omitted.
 */
export function applyDefined<T extends object>(
  target: T,
  attributes: Partial<T>,
): T {
  for (const [key, value] of Object.entries(attributes)) {
    if (value !== undefined) {
      (target as Record<string, unknown>)[key] = value;
    }
  }

  return target;
}
