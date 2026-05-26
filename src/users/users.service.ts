import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../../prisma.service';

import { generatePasswordHash } from '../../utils/encryption/hash.password';
import { generateCpfHash } from '../../utils/encryption/hash.cpf';
import { cpfEncryption } from '../../utils/encryption/cpf.encryption';
import { User } from './entities/user.entity';
import { CacheService } from '../common/cache/cache.service';
import { instanceToPlain } from 'class-transformer';
import { SessionService } from '../sessions/session.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private sessionService: SessionService,
    private cacheService: CacheService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const passwordHash = await generatePasswordHash(createUserDto.password);
    const cpfHash = generateCpfHash(createUserDto.cpf);

    const userArleadyExists = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: createUserDto.email }, { cpfHash: cpfHash }],
      },
    });

    if (userArleadyExists)
      throw new ConflictException('Email ou CPF já cadastrados.');

    const cpfEncrypted = cpfEncryption(createUserDto.cpf);

    const { address, cpf, password, ...userData } = createUserDto;

    return await this.prisma.user.create({
      data: {
        ...userData,
        passwordHash,
        cpfHash,
        cpfEncrypted,
        address: {
          create: { ...address },
        },
      },
      include: { address: true },
    });
  }

  async findAll() {
    return await this.prisma.user.findMany({ include: { address: true } });
  }

  async findOne(id: string) {
    const cachedData = await this.cacheService.getCache<any>(`user:${id}`);
    if (cachedData) return cachedData;

    const user = await this.prisma.user.findUnique({
      where: { user_id: id },
      include: { address: true },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado.');

    await this.cacheService.storeCache(`user:${id}`, user);

    return user;
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { address: true },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado.');

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: id },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    const { address, ...userData } = updateUserDto;

    const updatedUser = await this.prisma.user.update({
      where: { user_id: id },
      data: {
        ...userData,
        ...(address && {
          address: {
            update: address,
          },
        }),
      },
      include: { address: true },
    });

    await this.cacheService.clearCache(`user:${id}`);

    return updatedUser;
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: id },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado.');

    await this.prisma.user.delete({
      where: { user_id: id },
    });

    await this.sessionService.deleteSession(id);
    await this.cacheService.clearCache(`user:${id}`);

    return { message: `Usuário ${user.name} removido com sucesso.` };
  }
}
