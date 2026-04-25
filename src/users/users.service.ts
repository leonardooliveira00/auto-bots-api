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
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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

    const user = await this.prisma.user.create({
      data: {
        ...userData,
        passwordHash,
        cpfHash,
        cpfEncrypted,
        address: {
          create: { ...address },
        },
      },
    });

    return new UserEntity(user);
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      include: { address: true },
    });

    return users.map((user) => {
      return new UserEntity(user);
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: id },
      include: { address: true },
    });

    return new UserEntity(user as any);
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { address: true },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado.');

    return new UserEntity(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
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

    return new UserEntity(updatedUser);
  }

  async remove(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: id },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado.');

    await this.prisma.user.delete({
      where: { user_id: id },
    });

    return { message: 'Usuário removido com sucesso.' };
  }
}
