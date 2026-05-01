import { applyDecorators, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from './access.token.guard';
import { ThrottlerGuard } from '@nestjs/throttler';

export function UseAuth() {
  return applyDecorators(UseGuards(AccessTokenGuard, ThrottlerGuard));
}
