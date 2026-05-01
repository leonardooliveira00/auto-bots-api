import { Global, Module } from '@nestjs/common';
import { RedisModule } from '../common/redis/redis.module';
import { SessionService } from './session.service';

@Global()
@Module({
  imports: [RedisModule],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
