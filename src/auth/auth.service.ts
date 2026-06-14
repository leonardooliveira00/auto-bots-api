import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';

import argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { SessionService } from '../sessions/session.service';
import {
  generateTokenHash,
  verifyTokenHash,
} from '../utils/encryption/hash.token';
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private sessionService: SessionService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (!user.isActive)
      throw new UnauthorizedException('Esta conta de usuário está desativada.');

    const matchPassword = await argon2.verify(user.passwordHash, password);

    if (!matchPassword)
      throw new UnauthorizedException('Email ou senha incorretos');

    return user;
  }

  async login(
    user: any,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const payload = {
      sub: user.userId,
      email: user.email,
      employeeId: user.employee?.employeeId || null,
      role: user.employee?.role || null,
      firstName: user.employee?.firstName || null,
      lastName: user.employee?.lastName || null,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });
    const refreshToken = await this.jwtService.signAsync(
      { sub: user.userId },
      { expiresIn: '7d' },
    );

    const refreshTokenHash = generateTokenHash(refreshToken);

    await this.sessionService.saveSession(user.userId, refreshTokenHash);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refreshTokens(userId: string, providedToken: string) {
    const storedToken = await this.sessionService.getSession(userId);

    if (!storedToken)
      throw new UnauthorizedException('Sessão expirada ou inexistente.');

    const tokenMatch = verifyTokenHash(providedToken, storedToken);

    if (!tokenMatch) {
      await this.sessionService.deleteSession(userId);
      throw new UnauthorizedException(
        'Token inválido. Sessão encerrada por segurança.',
      );
    }

    const user = await this.usersService.findWithProfile(userId);

    const newRefreshToken = await this.jwtService.signAsync(
      { sub: user.userId },
      { expiresIn: '7d' },
    );

    const newRefreshTokenHash = generateTokenHash(newRefreshToken);

    await this.sessionService.saveSession(user.userId, newRefreshTokenHash);

    const payload = {
      sub: user.userId,
      email: user.email,
      employeeId: user.employee?.employeeId || null,
      role: user.employee?.role || null,
      firstName: user.employee?.firstName || null,
      lastName: user.employee?.lastName || null,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
    };
  }

  async logout(userId: string) {
    await this.sessionService.deleteSession(userId);
  }
}
