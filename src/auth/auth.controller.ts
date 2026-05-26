import {
  Body,
  Controller,
  Get,
  Post,
  HttpCode,
  HttpStatus,
  Request,
  UseGuards,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';

import { AuthService } from './auth.service';

import { LoginDto } from './dto/login-dto';
import { UseAuth } from './auth.decorator';
import { ThrottlerGuard } from '@nestjs/throttler';
import { RefreshTokenGuard } from './refresh.token.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Post('login')
  async signIn(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );

    const { access_token, refresh_token } = await this.authService.login(user);

    response.cookie('access_token', access_token, {
      httpOnly: true,
      secure: true,
      signed: true,
      sameSite: 'strict',
      maxAge: 60 * 15 * 1000,
    });

    response.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: true,
      signed: true,
      sameSite: 'strict',
      path: '/auth/refresh',
      maxAge: 60 * 60 * 24 * 7 * 1000,
    });

    return { message: 'Login realizado com sucesso!', refresh_token };
  }

  @UseGuards(ThrottlerGuard, RefreshTokenGuard)
  @Post('refresh')
  async refresh(
    @Request() req,
    @Res({ passthrough: true }) response: Response,
  ) {
    const userId = req.user.sub;
    const oldRefreshToken = req.signedCookies['refresh_token'];

    const { access_token, refresh_token } =
      await this.authService.refreshTokens(userId, oldRefreshToken);

    response.cookie('access_token', access_token, {
      httpOnly: true,
      secure: true,
      signed: true,
      sameSite: 'strict',
      maxAge: 60 * 15 * 1000,
    });

    response.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: true,
      signed: true,
      sameSite: 'strict',
      path: '/auth/refresh',
      maxAge: 60 * 60 * 24 * 7 * 1000,
    });

    return { message: 'Cookies atualizados.' };
  }

  @UseAuth()
  @Post('logout')
  async logout(@Request() req, @Res({ passthrough: true }) response: Response) {
    await this.authService.logout(req.user.sub);

    response.clearCookie('access_token');
    response.clearCookie('refresh_token');

    return { message: 'Sessão encerrada.' };
  }

  @UseAuth()
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
