import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

import { PrismaService } from '../../prisma.service';

import { generatePasswordHash } from '../utils/encryption/hash.password';
import { generateHash } from '../utils/encryption/hash';
import { dataEncryption } from '../utils/encryption/data.encryption';
import { CacheService } from '../common/cache/cache.service';
import { SessionService } from '../sessions/session.service';

@Injectable()
export class EmployeesService {
  constructor(
    private prisma: PrismaService,
    private sessionService: SessionService,
    private cacheService: CacheService,
  ) {}

  async create(dto: CreateEmployeeDto): Promise<any> {
    const passwordHash = await generatePasswordHash(dto.password);
    const cpfHash = generateHash(dto.cpf);

    const emailExists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    const cpfExists = await this.prisma.employee.findFirst({
      where: { cpfHash, deletedAt: null },
    });

    if (emailExists || cpfExists)
      throw new ConflictException(
        'Email ou CPF já cadastrados para um funcionário ativo.',
      );

    const cpfEncrypted = dataEncryption(dto.cpf);

    const { address, password, email, cpf, ...employeeData } = dto;

    return await this.prisma.employee.create({
      data: {
        ...employeeData,
        cpfHash,
        cpfEncrypted,
        address: {
          create: { ...address },
        },
        user: {
          create: {
            email,
            passwordHash,
          },
        },
      },
      include: { address: true, user: true },
    });
  }

  async findAll(status?: 'active' | 'inactive' | 'all'): Promise<any> {
    return await this.prisma.employee.findMany({
      where: {
        deletedAt:
          status === 'all'
            ? undefined
            : status === 'inactive'
              ? { not: null }
              : null,
      },
      include: { address: true, user: true },
    });
  }

  async findOne(employeeId: string) {
    const cachedData = await this.cacheService.getCache<any>(
      `employee:${employeeId}`,
    );
    if (cachedData) return cachedData;

    const employee = await this.prisma.employee.findFirst({
      where: { employeeId },
      include: { address: true, user: true },
    });

    if (!employee) throw new NotFoundException('Usuário não encontrado.');

    await this.cacheService.storeCache(`employee:${employeeId}`, employee);

    return employee;
  }

  async update(employeeId: string, dto: UpdateEmployeeDto) {
    await this.findOne(employeeId);

    const { address, ...employeeData } = dto;

    const updatedEmployee = await this.prisma.employee.update({
      where: { employeeId },
      data: {
        ...employeeData,
        ...(address && {
          address: {
            update: address,
          },
        }),
      },
      include: { address: true, user: true },
    });

    await this.cacheService.clearCache(`employee:${employeeId}`);

    return updatedEmployee;
  }

  async remove(employeeId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { employeeId },
      include: { user: true, address: true },
    });

    if (!employee)
      throw new NotFoundException(
        'Funcionário não encontrado ou já desativado.',
      );

    const timestamp = Date.now();

    await this.prisma.employee.update({
      where: { employeeId },
      data: {
        deletedAt: new Date(),
        resignationDate: new Date(),
        firstName: `Funcionário`,
        lastName: `Anonimizado`,
        cpfHash: `deleted-${employeeId}-${timestamp}`,
        cpfEncrypted: `deleted-${employeeId}-${timestamp}`,
        salary: 0.0,
        phone: `00000000000`,

        ...(employee.address && {
          address: {
            update: {
              street: `deleted-${employeeId}-${timestamp}`,
              number: '0',
              complement: `deleted-${employeeId}-${timestamp}`,
              district: `deleted-${employeeId}-${timestamp}`,
              postalCode: '00000000',
            },
          },
        }),

        ...(employee.user && {
          user: {
            update: {
              email: `deleted-${employeeId}-${timestamp}@auto-bots.anonymous`,
              isActive: false,
              passwordHash: `revoked_or_anonymized_at_${timestamp}`,
            },
          },
        }),
      },
    });

    if (employee.userId) {
      await this.prisma.user.update({
        where: { userId: employee.userId },
        data: {
          isActive: false,
        },
      });
      await this.sessionService.deleteSession(employee.userId);
    }

    await this.cacheService.clearCache(`employee:${employeeId}`);

    return {
      message: `Funcionário ${employee.firstName} ${employee.lastName} removido com sucesso.`,
    };
  }
}
