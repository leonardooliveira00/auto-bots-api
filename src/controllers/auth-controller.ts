import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { AppError } from "../errors/app-error";
import { HTTP_STATUS } from "../errors/http-status";

export const AuthController = {
  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    const standardizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: standardizedEmail },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
      },
    });

    if (!user)
      throw new AppError("Credenciais inválidas.", HTTP_STATUS.UNAUTHORIZED);

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch)
      throw new AppError(
        "Login ou senha incorretos.",
        HTTP_STATUS.UNAUTHORIZED,
      );

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" },
    );

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  },
};
