import { Repository } from 'typeorm';

/**
 * Generates human-readable, prefixed string primary keys such as "P-001" or
 * "WO-1001": look up the highest existing ID with the given prefix and
 * increment it. Mirrors the original app's HasPrefixedId behavior -
 * best-effort, not race-safe under heavy concurrent writes.
 */
export async function nextPrefixedId(
  repository: Repository<{ id: string }>,
  prefix: string,
  startNumber = 1,
  padLength = 0,
): Promise<string> {
  const latest = await repository
    .createQueryBuilder('entity')
    .where('entity.id LIKE :prefix', { prefix: `${prefix}%` })
    .orderBy('LENGTH(entity.id)', 'DESC')
    .addOrderBy('entity.id', 'DESC')
    .limit(1)
    .getOne();

  const nextNumber = latest
    ? parseInt(latest.id.slice(prefix.length), 10) + 1
    : startNumber;

  return `${prefix}${String(nextNumber).padStart(padLength, '0')}`;
}
