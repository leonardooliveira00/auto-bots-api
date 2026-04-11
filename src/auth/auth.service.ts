import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';

import argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(
    email: string,
    password: string,
  ): Promise<{ access_token: string }> {
    const user = await this.usersService.findByEmail(email);

    if (!user) throw new UnauthorizedException('Email ou senha incorretos.');

    const matchPassword = await argon2.verify(user.passwordHash, password);

    if (!matchPassword)
      throw new UnauthorizedException('Email ou senha incorretos');

    const payload = {
      sub: user.user_id,
      email: user.email,
      name: user.name,
    };

    return { access_token: await this.jwtService.signAsync(payload) };
  }
}
