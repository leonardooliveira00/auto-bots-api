import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PrismaModule } from '../prisma.module';
import { AuthModule } from './auth/auth.module';
import { minutes, ThrottlerModule } from '@nestjs/throttler';
import { REDIS_CLIENT } from './common/redis/redis.module';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { CachingModule } from './common/cache/cache.module';
import { SessionModule } from './sessions/session.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    CachingModule,
    SessionModule,

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (redisClient: any) => ({
        throttlers: [
          {
            ttl: minutes(10),
            limit: 15,
          },
        ],
        storage: new ThrottlerStorageRedisService(redisClient),
      }),
      inject: [ConfigService, REDIS_CLIENT],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
