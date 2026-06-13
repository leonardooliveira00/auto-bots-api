import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '../generated/prisma/client';
import { CustomSerializerInterceptor } from './common/interceptors/custom-serializer.interceptor';

async function bootstrap() {
  (Prisma.Decimal.prototype as any).toJSON = function () {
    return this.toNumber();
  };

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const jwtSecret = configService.getOrThrow('JWT_SECRET');

  const config = new DocumentBuilder()
    .setTitle('AutoBots API')
    .setDescription('API para sistema de oficina mecânica.')
    .setVersion('3.0')

    .addTag('App', 'Endpoints base do sistema')
    .addTag('Funcionários', 'Gerenciamento de funcionários e colaboradores')
    .addTag('Autenticação e Sessão', 'Endpoints de login, logout e tokens')
    .addTag('Credenciais de Usuários', 'Gerenciamento de senhas e acessos')
    .addTag('Produtos do Estoque', 'Catálogo de peças e produtos')
    .addTag('Movimentação e Inventário de Estoque', 'Fluxo de entrada e saída')
    .addTag('Clientes', 'Gerenciamento de clientes.')
    .addTag(
      'Veículos',
      'Gerenciamentos de veículos que pertencem a um cliente.',
    )

    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  app.use(helmet());

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.use(cookieParser(jwtSecret));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new CustomSerializerInterceptor(reflector));

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Aplicação rodando na porta ${port}`);
}
bootstrap();
