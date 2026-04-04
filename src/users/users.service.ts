import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../../prisma.service';

import { generatePasswordHash } from '../../utils/encryption/hash.password';
import { generateCpfHash } from '../../utils/encryption/hash.cpf';
import {
  cpfEncryption,
  cpfDecryption,
} from '../../utils/encryption/cpf.encryption';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const passwordHash = await generatePasswordHash(createUserDto.password);

    const cpfHash = generateCpfHash(createUserDto.cpf);
    const cpfEncrypted = cpfEncryption(createUserDto.cpf);

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

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
