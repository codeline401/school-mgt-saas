import { Router } from "express";
import {
  authenticate,
  authorizeRoles,
} from "../../../middlewares/authMiddleware.js";
import { Role } from "../../../generated/prisma/enums.js";
import { getAdminDevoirs } from "./devoir.controller.js";

const router = Router();

/**
 * GET /api/devoirs-donnes
 */
router.get(
  "/",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN, Role.PROF),
  getAdminDevoirs,
);

export default router;
