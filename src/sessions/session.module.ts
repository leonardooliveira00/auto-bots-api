import { Module } from '@nestjs/common';
import { RedisModule } from '@nestjs-modules/ioredis';
import { SessionService } from './session.service';

@Module({
  imports: [RedisModule],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
