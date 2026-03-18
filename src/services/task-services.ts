import { prisma } from "../lib/prisma";

import { Prisma, Task } from "../generated/prisma/client";
import { AppError } from "../errors/app-error";
import { HTTP_STATUS } from "../errors/http-status";

const taskSelect = {
  id: true,
  title: true,
  description: true,
  completed: true,
} satisfies Prisma.TaskSelect;

export const TaskService = {
  async listAllTasks(userId: number) {
    return prisma.task.findMany({
      where: { userId },
      select: taskSelect,
    });
  },

  async listTaskById(userId: number, taskId: number) {
    const task = await prisma.task.findFirst({
      where: { userId, id: taskId },
      select: taskSelect,
    });

    if (!task)
      throw new AppError("Tarefa não encontrada.", HTTP_STATUS.NOT_FOUND);

    return task;
  },

  async create(userId: number, data: { title: string; description?: string }) {
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        userId,
      },
      select: taskSelect,
    });

    return task;
  },

  async update(
    userId: number,
    taskId: number,
    data: Partial<Omit<Task, "id">>,
  ) {
    const task = await prisma.task.findFirst({ where: { userId, id: taskId } });

    if (!task)
      throw new AppError("Tarefa não encontrada", HTTP_STATUS.NOT_FOUND);

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: data,
      select: taskSelect,
    });

    return updatedTask;
  },

  async delete(userId: number, taskId: number) {
    const task = await prisma.task.findFirst({ where: { userId, id: taskId } });

    if (!task)
      throw new AppError("Tarefa não encontrada", HTTP_STATUS.NOT_FOUND);

    const deletedTask = await prisma.task.delete({ where: { id: taskId } });

    return deletedTask;
  },
};
