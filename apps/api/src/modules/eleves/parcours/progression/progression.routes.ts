import { Router } from "express";
import {
  authenticate,
  authorizeRoles,
} from "../../../../middlewares/authMiddleware.js";
import { Role } from "../../../../generated/prisma/enums.js";
import { getProgressionEleve } from "./progression.controller.js";

const router = Router();

router.use(authenticate, authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN));

router.get("/:eleveId", getProgressionEleve);

export default router;
