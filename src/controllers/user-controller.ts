import { Request, Response } from "express";
import { UserService } from "../services/user-services";

import { createUserSchema } from "../validators/user-schema";

export const UserController = {
  /*
  async getUsers(req: Request, res: Response) {
    const users = await UserService.getAll();
    res.status(200).json(users);
  },

  async getUserById(req: Request, res: Response) {
    const id = Number(req.params.id);

    if (Number.isNaN(id))
      return res.status(400).json({ error: "ID de usuário inválido." });

    const user = await UserService.getById(id);
    res.status(200).json(user);
  },
*/
  async createUser(req: Request, res: Response) {
    const validateUser = createUserSchema.parse(req.body);

    const user = await UserService.createUser(validateUser);
    res.status(201).json(user);
  },

  /*
  async updateUser(req: Request, res: Response) {
    const id = Number(req.params.id);
    const data = req.body;

    const updatedUser = await UserService.update(id, data);
    res.status(200).json(updatedUser);
  },

  async deleteUser(req: Request, res: Response) {
    const id = Number(req.params.id);
    await UserService.delete(id);
    res.status(204).send();
  },
  */
};
