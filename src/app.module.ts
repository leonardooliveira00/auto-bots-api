import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PrismaModule } from '../prisma.module';
import { AuthModule } from './auth/auth.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { CachingModule } from './common/cache/cache.module';
import { SessionModule } from './sessions/session.module';
import { ProductsModule } from './products/products.module';
import { StockModule } from './stock/stock.module';
import { CustomersModule } from './customers/customers.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { EmployeesModule } from './employees/employees.module';

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
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: Number(config.getOrThrow('THROTTLE_TTL')),
            limit: Number(config.getOrThrow('THROTTLE_LIMIT')),
          },
        ],
        storage: new ThrottlerStorageRedisService(
          config.getOrThrow('REDIS_URL'),
          { keyPrefix: 'throttler:' },
        ),
      }),
    }),

    ProductsModule,

    StockModule,

    CustomersModule,

    VehiclesModule,

    EmployeesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
