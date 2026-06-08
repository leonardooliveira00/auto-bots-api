import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Employee } from './entities/employee.entity';

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

  async create(createEmployeeDto: CreateEmployeeDto): Promise<any> {
    const passwordHash = await generatePasswordHash(createEmployeeDto.password);
    const cpfHash = generateHash(createEmployeeDto.cpf);

    const emailExists = await this.prisma.user.findUnique({
      where: { email: createEmployeeDto.email },
    });

    const cpfExists = await this.prisma.employee.findFirst({
      where: { cpfHash, deletedAt: null },
    });

    if (emailExists || cpfExists)
      throw new ConflictException(
        'Email ou CPF já cadastrados para um funcionário ativo.',
      );

    const cpfEncrypted = dataEncryption(createEmployeeDto.cpf);

    const { address, password, email, cpf, ...employeeData } =
      createEmployeeDto;

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

  async findOne(employee_id: string) {
    const cachedData = await this.cacheService.getCache<any>(
      `employee:${employee_id}`,
    );
    if (cachedData) return cachedData;

    const employee = await this.prisma.employee.findFirst({
      where: { employee_id },
      include: { address: true, user: true },
    });

    if (!employee) throw new NotFoundException('Usuário não encontrado.');

    await this.cacheService.storeCache(`employee:${employee_id}`, employee);

    return employee;
  }

  async update(employee_id: string, updateEmployeeDto: UpdateEmployeeDto) {
    await this.findOne(employee_id);

    const { address, ...employeeData } = updateEmployeeDto;

    const updatedEmployee = await this.prisma.employee.update({
      where: { employee_id },
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

    await this.cacheService.clearCache(`employee:${employee_id}`);

    return updatedEmployee;
  }

  async remove(employee_id: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { employee_id },
      include: { user: true, address: true },
    });

    if (!employee)
      throw new NotFoundException(
        'Funcionário não encontrado ou já desativado.',
      );

    const timestamp = Date.now();

    await this.prisma.employee.update({
      where: { employee_id },
      data: {
        deletedAt: new Date(),
        resignationDate: new Date(),
        firstName: `Funcionário`,
        lastName: `Anonimizado`,
        cpfHash: `deleted-${employee_id}-${timestamp}`,
        cpfEncrypted: `deleted-${employee_id}-${timestamp}`,
        salary: 0.0,
        phone: `00000000000`,

        ...(employee.address && {
          address: {
            update: {
              street: `deleted-${employee_id}-${timestamp}`,
              number: '0',
              complement: `deleted-${employee_id}-${timestamp}`,
              district: `deleted-${employee_id}-${timestamp}`,
              postalCode: '00000000',
            },
          },
        }),

        ...(employee.user && {
          user: {
            update: {
              email: `deleted-${employee_id}-${timestamp}@auto-bots.anonymous`,
              isActive: false,
              passwordHash: `revoked_or_anonymized_at_${timestamp}`,
            },
          },
        }),
      },
    });

    if (employee.userId) {
      await this.prisma.user.update({
        where: { user_id: employee.userId },
        data: {
          isActive: false,
        },
      });
      await this.sessionService.deleteSession(employee.userId);
    }

    await this.cacheService.clearCache(`employee:${employee_id}`);

    return {
      message: `Funcionário ${employee.firstName} ${employee.lastName} removido com sucesso.`,
    };
  }
}
