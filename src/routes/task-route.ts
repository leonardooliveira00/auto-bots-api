import { Router } from "express";

import { TaskController } from "../controllers/task-controller";
import { asyncHandler } from "../utils/async-handler";
import { authMiddleware } from "../middlewares/auth-middleware";

const router = Router();

router.get("/", authMiddleware, asyncHandler(TaskController.getTasks));
router.get("/:id", authMiddleware, asyncHandler(TaskController.getTaskById));
router.post("/", authMiddleware, asyncHandler(TaskController.createTask));
router.patch("/:id", authMiddleware, asyncHandler(TaskController.updateTask));
router.delete("/:id", authMiddleware, asyncHandler(TaskController.deleteTask));

export default router;
