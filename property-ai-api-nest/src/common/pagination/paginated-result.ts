export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
}

export const DEFAULT_PER_PAGE = 15;

/**
 * Renders a paginated query result the same way across every list endpoint:
 * an explicit message instead of a bare empty array when nothing matched,
 * otherwise {data, meta} with Laravel-style pagination fields.
 */
export function paginatedResponse<T, R>(
  result: PaginatedResult<T>,
  serialize: (item: T) => R,
  emptyMessage: string,
): { message: string; data: [] } | { data: R[]; meta: Record<string, number> } {
  if (result.items.length === 0) {
    return { message: emptyMessage, data: [] };
  }

  return {
    data: result.items.map(serialize),
    meta: {
      current_page: result.page,
      per_page: result.perPage,
      total: result.total,
      last_page: Math.max(1, Math.ceil(result.total / result.perPage)),
    },
  };
}
