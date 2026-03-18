import { prisma } from "../lib/prisma";

import { User } from "../generated/prisma/client";
import { AppError } from "../errors/app-error";
import { HTTP_STATUS } from "../errors/http-status";

import { CreateUserDto } from "../interfaces/CreateUserDto";

import { hashPassword } from "../utils/hash-password";
import { hmacCpf } from "../utils/encryption/hmac-encryption";
import { argon2Cpf } from "../utils/encryption/argon2-encryption";
import { encryptCpf } from "../utils/encryption/aes-encryption";

export const UserService = {
  /*
  async getAll() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
  },

  async getById(id: number) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user)
      throw new AppError("Usuário não encontrado.", HTTP_STATUS.NOT_FOUND);

    return user;
  },
*/
  async createUser(user: CreateUserDto) {
    const standardizedEmail = user.email.toLowerCase().trim();

    const passwordHash = await hashPassword(user.password);

    const cpfHmac = hmacCpf(user.cpf);
    const cpfArgon2 = await argon2Cpf(cpfHmac);
    const cpfEncrypted = encryptCpf(cpfHmac);

    const { address, cpf, password, ...userData } = user;

    return prisma.user.create({
      data: {
        ...userData,
        email: standardizedEmail,
        passwordHash,
        cpfHash: cpfArgon2,
        cpfEncrypted,
        address: {
          create: { ...address },
        },
      },
      select: {
        id: true,
        name: true,
        lastname: true,
        email: true,
        phoneNumber: true,
        createdAt: true,
        updatedAt: true,
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
  },
  /*
  async update(id: number, user: Partial<Omit<User, "id">>) {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user)
      throw new AppError("Usuário não encontrado.", HTTP_STATUS.NOT_FOUND);

    if (data.email) {
      data.email = data.email.toLowerCase().trim();
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: data,
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return updatedUser;
  },

  async delete(id: number) {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) throw new Error("Usuário não encontrado.");

    const deletedUser = await prisma.user.delete({ where: { id } });

    return deletedUser;
  },
  */
};
