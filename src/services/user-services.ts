import { prisma } from "../lib/prisma";

import { User } from "../generated/prisma/client";
import { AppError } from "../errors/app-error";
import { HTTP_STATUS } from "../errors/http-status";

import { hashPassword } from "../utils/hash-password";

export const UserService = {
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

  async create(data: { name: string; email: string; password: string }) {
    const standardizedEmail = data.email.toLowerCase().trim();

    const userAlreadyExists = await prisma.user.findUnique({
      where: { email: standardizedEmail },
    });

    if (userAlreadyExists)
      throw new AppError("Email já cadastrado.", HTTP_STATUS.CONFLICT);

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: standardizedEmail,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return user;
  },

  async update(id: number, data: Partial<Omit<User, "id">>) {
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
};
