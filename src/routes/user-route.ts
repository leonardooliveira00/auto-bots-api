import { Router } from "express";

import { UserController } from "../controllers/user-controller";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

//router.get("/", asyncHandler(UserController.getUsers));
//router.get("/:id", asyncHandler(UserController.getUserById));
router.post("/register", asyncHandler(UserController.createUser));
// router.patch("/:id", asyncHandler(UserController.updateUser));
// router.delete("/:id", asyncHandler(UserController.deleteUser));

export default router;
