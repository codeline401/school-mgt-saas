import { Router } from "express";
import { getAlertes } from "./alerte.controller.js";
import {
  authenticate,
  authorizeRoles,
} from "../../../../middlewares/authMiddleware.js";
import { Role } from "../../../../generated/prisma/enums.js";

const router = Router();

router.use(authenticate, authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN));

/** /api/eleves/absences/alertes */
router.get("/", getAlertes);

export default router;
