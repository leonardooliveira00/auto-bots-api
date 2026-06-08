import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma.service';

import { generatePasswordHash } from '../utils/encryption/hash.password';
import { SessionService } from '../sessions/session.service';

import argon2 from 'argon2';
import e from 'express';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private sessionService: SessionService,
  ) {}

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { employee: true },
    });

    if (!user) throw new NotFoundException('Credenciais não encontradas.');

    return user;
  }

  async findOne(user_id: string) {
    const user = await this.prisma.user.findUnique({
      where: { user_id },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    return user;
  }

  async findWithProfile(user_id: string) {
    const user = await this.prisma.user.findUnique({
      where: { user_id },
      include: { employee: true },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado.');

    return user;
  }

  async updatePassword(user_id: string, newPassword: string) {
    const user = await this.findOne(user_id);

    const matchPassword = await argon2.verify(user.passwordHash, newPassword);

    if (matchPassword)
      throw new ConflictException(
        'A nova senha não pode ser igual a senha antiga.',
      );

    const newPasswordHash = await generatePasswordHash(newPassword);

    return await this.prisma.user.update({
      where: { user_id },
      data: {
        passwordHash: newPasswordHash,
      },
    });
  }

  async toggleStatus(
    targetEmployeeId: string,
    currentUserId: string,
    isActive: boolean,
  ) {
    const employee = await this.prisma.employee.findUnique({
      where: { employee_id: targetEmployeeId },
      select: { userId: true },
    });

    if (!employee) {
      throw new NotFoundException('Funcionário não encontrado.');
    }

    if (!employee.userId) {
      throw new NotFoundException(
        'Este funcionário não possui um usuário de login cadastrado.',
      );
    }

    if (employee.userId === currentUserId) {
      throw new BadRequestException(
        `Operação inválida: Você não pode bloquear ou desativar sua própria credencial.`,
      );
    }

    const updatedUser = await this.prisma.user.update({
      where: { user_id: employee.userId },
      data: { isActive },
    });

    if (!isActive) await this.sessionService.deleteSession(employee.userId);

    return updatedUser;
  }
}
