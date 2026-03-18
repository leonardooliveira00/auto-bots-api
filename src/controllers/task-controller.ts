import { Request, Response } from "express";

import { TaskService } from "../services/task-services";
import { createTaskSchema } from "../validations/task-schema";

export const TaskController = {
  async getTasks(req: Request, res: Response) {
    const userId = req.userId as number;
    const tasks = await TaskService.listAllTasks(userId!);
    res.json(tasks);
  },

  async getTaskById(req: Request, res: Response) {
    const userId = req.userId as number;
    const taskId = Number(req.params.id);

    if (Number.isNaN(taskId))
      return res.status(400).json({ error: "ID de tarefa inválido." });

    const task = await TaskService.listTaskById(userId, taskId);
    res.status(200).json(task);
  },

  async createTask(req: Request, res: Response) {
    const userId = req.userId as number;
    const validatedData = createTaskSchema.parse(req.body);

    const task = await TaskService.create(userId, validatedData);
    res.status(201).json(task);
  },

  async updateTask(req: Request, res: Response) {
    const userId = req.userId as number;
    const taskId = Number(req.params.id);
    const data = req.body;

    if (Number.isNaN(taskId))
      return res.status(400).json({ error: "ID de tarefa inválido." });

    const updatedTask = await TaskService.update(userId, taskId, data);
    res.status(200).json(updatedTask);
  },

  async deleteTask(req: Request, res: Response) {
    const userId = req.userId as number;
    const taskId = Number(req.params.id);

    if (Number.isNaN(taskId))
      return res.status(400).json({ error: "ID de tarefa inválido." });

    await TaskService.delete(userId, taskId);
    res.status(204).send();
  },
};
