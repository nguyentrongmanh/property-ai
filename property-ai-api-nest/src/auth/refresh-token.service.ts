import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import ms from 'ms';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/configuration';
import { REDIS_CLIENT } from '../common/redis/redis.constants';

/**
 * Tracks issued refresh tokens in Redis (keyed by user + token id) so they
 * can be individually revoked on logout/rotation and expire on their own.
 */
@Injectable()
export class RefreshTokenService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  private key(userId: string, tokenId: string): string {
    return `refresh:${userId}:${tokenId}`;
  }

  async store(userId: string, tokenId: string): Promise<void> {
    const ttlMs = ms(
      this.config.get('jwt.refreshExpiresIn', {
        infer: true,
      }),
    );
    await this.redis.set(this.key(userId, tokenId), '1', 'PX', ttlMs);
  }

  async isValid(userId: string, tokenId: string): Promise<boolean> {
    const exists = await this.redis.exists(this.key(userId, tokenId));
    return exists === 1;
  }

  async revoke(userId: string, tokenId: string): Promise<void> {
    await this.redis.del(this.key(userId, tokenId));
  }

  async revokeAllForUser(userId: string): Promise<void> {
    const keys = await this.redis.keys(`refresh:${userId}:*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
