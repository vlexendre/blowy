/** Pagination par curseur opaque (base64url d'un tuple [clé, id]). */
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export function encodeCursor(parts: readonly (string | number)[]): string {
  return Buffer.from(JSON.stringify(parts)).toString('base64url');
}

export function decodeCursor(cursor: string | undefined | null): (string | number)[] | null {
  if (!cursor) return null;
  try {
    const v: unknown = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    return Array.isArray(v) && v.every((x) => typeof x === 'string' || typeof x === 'number') ? v : null;
  } catch {
    return null;
  }
}

export function pageFrom<T>(rows: T[], limit: number, cursorOf: (last: T) => (string | number)[]): Page<T> {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items.at(-1);
  return { items, nextCursor: hasMore && last ? encodeCursor(cursorOf(last)) : null };
}
