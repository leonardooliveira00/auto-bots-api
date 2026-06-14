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

  async findOne(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    return user;
  }

  async findWithProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      include: { employee: true },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado.');

    return user;
  }

  async updatePassword(userId: string, newPassword: string) {
    const user = await this.findOne(userId);

    const matchPassword = await argon2.verify(user.passwordHash, newPassword);

    if (matchPassword)
      throw new ConflictException(
        'A nova senha não pode ser igual a senha antiga.',
      );

    const newPasswordHash = await generatePasswordHash(newPassword);

    return await this.prisma.user.update({
      where: { userId },
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
      where: { employeeId: targetEmployeeId },
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
      where: { userId: employee.userId },
      data: { isActive },
    });

    if (!isActive) await this.sessionService.deleteSession(employee.userId);

    return updatedUser;
  }
}
