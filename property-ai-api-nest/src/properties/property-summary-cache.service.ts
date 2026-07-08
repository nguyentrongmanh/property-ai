import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/redis/redis.constants';
import { AppConfig } from '../config/configuration';

const KEY_PREFIX = 'property:summary';

@Injectable()
export class PropertySummaryCacheService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  private key(propertyId: string): string {
    return `${KEY_PREFIX}:${propertyId}`;
  }

  async get(propertyId: string): Promise<string | null> {
    return this.redis.get(this.key(propertyId));
  }

  async set(propertyId: string, summary: string): Promise<void> {
    const ttlSeconds = this.config.get('propertySummaryCacheTtlSeconds', {
      infer: true,
    });
    await this.redis.set(this.key(propertyId), summary, 'EX', ttlSeconds);
  }

  async invalidate(propertyId: string): Promise<void> {
    await this.redis.del(this.key(propertyId));
  }
}