import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async storeCache(key: string, value: any): Promise<any> {
    const ttl = 60 * 60 * 1000;
    await this.cacheManager.set(`cache:${key}`, value, ttl);
  }

  async getCache<T>(key: string): Promise<T | undefined> {
    return await this.cacheManager.get<T>(`cache:${key}`);
  }

  async clearCache(key: string): Promise<boolean> {
    return await this.cacheManager.del(`cache:${key}`);
  }
}
