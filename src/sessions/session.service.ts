import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class SessionService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async saveSession(userId: number, refreshTokenHash: string): Promise<any> {
    const ttl = 60 * 60 * 24 * 7;
    await this.redis.set(
      `refresh_token:${userId}`,
      refreshTokenHash,
      'EX',
      ttl,
    );
  }

  async getSession(userId: number): Promise<string | null> {
    return await this.redis.get(`refresh_token:${userId}`);
  }

  async deleteSession(userId: number) {
    return await this.redis.del(`refresh_token:${userId}`);
  }
}
