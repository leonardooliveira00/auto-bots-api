import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { SessionService } from '../sessions/session.service';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private sessionService: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.signedCookies['access_token'];

    if (!token) throw new UnauthorizedException('Acesso negado.');

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });

      const isSessionActive = await this.sessionService.getSession(payload.sub);

      if (!isSessionActive)
        throw new UnauthorizedException('Sessão expirada ou encerrada.');

      request['user'] = payload;
    } catch (error) {
      if (error instanceof Error) {
        throw new UnauthorizedException('Token inválido ou sessão encerrada.');
      }
    }
    return true;
  }
}
