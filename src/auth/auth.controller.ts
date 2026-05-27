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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiOkResponse,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';

import { LoginDto } from './dto/login-dto';
import { UseAuth } from './auth.decorator';
import { ThrottlerGuard } from '@nestjs/throttler';
import { RefreshTokenGuard } from './refresh.token.guard';

@ApiTags('Autenticação e Sessão')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Post('login')
  @ApiOperation({
    summary: 'Realiza a autenticação do usuário',
    description:
      'Valida as credenciais por e-mail e senha, aplica rate limit via ThrottlerGuard e emite cookies HTTPOnly criptografados (access_token e refresh_token) assinados para o gerenciamento seguro da sessão.',
  })
  @ApiOkResponse({
    description:
      'Autenticação bem-succeeded. Cookies injetados na resposta HTTP.',
  })
  @ApiResponse({
    status: 400,
    description: 'Payload inválido ou mal formatado.',
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas (E-mail ou senha incorretos).',
  })
  @ApiResponse({
    status: 429,
    description: 'Muitas tentativas de login bloqueadas por Rate Limit.',
  })
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
  @ApiOperation({
    summary: 'Renova o Access Token expirado',
    description:
      'Utiliza o Refresh Token contido no cookie assinado para revalidar a sessão do usuário no Redis e emitir um novo par de tokens sem exigir novas credenciais.',
  })
  @ApiOkResponse({
    description: 'Sessão revalidada e novos cookies injetados.',
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh Token ausente, inválido ou revogado no Redis.',
  })
  @ApiResponse({
    status: 429,
    description: 'Abuso na rota de renovação de sessão bloqueada.',
  })
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
  @ApiOperation({
    summary: 'Encerra a sessão atual',
    description:
      'Invalida os tokens ativos na camada de cache do Redis e limpa os cookies HTTPOnly da requisição do cliente.',
  })
  @ApiOkResponse({ description: 'Sessão revogada com sucesso em produção.' })
  @ApiResponse({
    status: 401,
    description: 'Requisição não autorizada (sem credenciais válidas).',
  })
  async logout(@Request() req, @Res({ passthrough: true }) response: Response) {
    await this.authService.logout(req.user.sub);

    response.clearCookie('access_token');
    response.clearCookie('refresh_token');

    return { message: 'Sessão encerrada.' };
  }

  @UseAuth()
  @Get('profile')
  @ApiOperation({
    summary: 'Obtém o perfil do usuário logado',
    description:
      'Decodifica os dados extraídos do AccessToken decodificado pelo guard de autenticação global.',
  })
  @ApiOkResponse({
    description: 'Dados cadastrais do token recuperados com sucesso.',
  })
  @ApiResponse({ status: 401, description: 'Token inválido ou expirado.' })
  getProfile(@Request() req) {
    return req.user;
  }
}
