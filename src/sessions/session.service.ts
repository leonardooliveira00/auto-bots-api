import { Inject, Injectable } from '@nestjs/common';
import { REDIS_CLIENT } from '../common/redis/redis.module';

@Injectable()
export class SessionService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: any) {}

  async saveSession(userId: number, refreshTokenHash: string): Promise<any> {
    const ttl = 60 * 60 * 24 * 7;
    await this.redis.set(`session:${userId}`, refreshTokenHash, {
      EX: ttl,
    });
  }

  async getSession(userId: number): Promise<string | null> {
    return await this.redis.get(`session:${userId}`);
  }

  async deleteSession(userId: number) {
    return await this.redis.del(`session:${userId}`);
  }
}
