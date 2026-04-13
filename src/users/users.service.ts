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
import {
  cpfEncryption,
  cpfDecryption,
} from '../../utils/encryption/cpf.encryption';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const passwordHash = await generatePasswordHash(createUserDto.password);

    const userArleadyExists = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: createUserDto.email }, { cpfHash: createUserDto.cpf }],
      },
    });

    const cpfHash = generateCpfHash(createUserDto.cpf);
    const cpfEncrypted = cpfEncryption(createUserDto.cpf);

    if (userArleadyExists)
      throw new ConflictException('Email ou CPF já cadastrados.');

    const { address, cpf, password, ...userData } = createUserDto;

    return this.prisma.user.create({
      data: {
        ...userData,
        passwordHash,
        cpfHash,
        cpfEncrypted,
        address: {
          create: { ...address },
        },
      },
      select: {
        user_id: true,
        name: true,
        lastname: true,
        email: true,
        phoneNumber: true,
        address: {
          select: {
            street: true,
            number: true,
            complement: true,
            postalCode: true,
            city: true,
            state: true,
          },
        },
      },
    });
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      select: {
        user_id: true,
        name: true,
        lastname: true,
        email: true,
        phoneNumber: true,
        cpfEncrypted: true,
        address: true,
      },
    });

    return users.map((user) => {
      const decryptedCpf = cpfDecryption(user.cpfEncrypted);
      const { cpfEncrypted, ...safeUser } = user;

      return {
        ...safeUser,
        cpf: decryptedCpf,
      };
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
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        user_id: true,
        email: true,
        passwordHash: true,
        name: true,
      },
    });
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
      select: {
        user_id: true,
        name: true,
        lastname: true,
        email: true,
        phoneNumber: true,
        address: {
          select: {
            street: true,
            number: true,
            complement: true,
            postalCode: true,
            state: true,
            city: true,
          },
        },
      },
    });

    return updatedUser;
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
