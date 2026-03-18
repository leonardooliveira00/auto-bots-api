import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { AppError } from "../errors/app-error";
import { HTTP_STATUS } from "../errors/http-status";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;

  if (!authHeader)
    throw new AppError("Token não fornecido", HTTP_STATUS.UNAUTHORIZED);

  const [, token] = authHeader.split(" ");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: number;
    };

    req.userId = decoded.userId;

    return next();
  } catch (rror) {
    throw new AppError("Token inválido.", HTTP_STATUS.UNAUTHORIZED);
  }
}
