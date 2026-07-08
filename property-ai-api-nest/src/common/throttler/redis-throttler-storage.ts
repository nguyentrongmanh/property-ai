import { Inject, Injectable } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.constants';

interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

/**
 * Backs @nestjs/throttler with Redis so rate limits are shared across
 * instances instead of living in each process's memory.
 */
@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const hitsKey = `throttle:${throttlerName}:${key}`;
    const blockKey = `throttle:${throttlerName}:${key}:blocked`;

    const blockedPttl = await this.redis.pttl(blockKey);
    if (blockedPttl > 0) {
      return {
        totalHits: limit + 1,
        timeToExpire: 0,
        isBlocked: true,
        timeToBlockExpire: Math.ceil(blockedPttl / 1000),
      };
    }

    const totalHits = await this.redis.incr(hitsKey);
    if (totalHits === 1) {
      await this.redis.pexpire(hitsKey, ttl);
    }
    const hitsPttl = await this.redis.pttl(hitsKey);
    const timeToExpire = Math.ceil(Math.max(hitsPttl, 0) / 1000);

    if (totalHits > limit && blockDuration > 0) {
      await this.redis.set(blockKey, '1', 'PX', blockDuration);
      return {
        totalHits,
        timeToExpire,
        isBlocked: true,
        timeToBlockExpire: Math.ceil(blockDuration / 1000),
      };
    }

    return {
      totalHits,
      timeToExpire,
      isBlocked: totalHits > limit,
      timeToBlockExpire: 0,
    };
  }
}
