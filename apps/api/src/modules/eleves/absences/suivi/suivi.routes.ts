import { Router } from "express";
import {
  authenticate,
  authorizeRoles,
} from "../../../../middlewares/authMiddleware.js";
import { Role } from "../../../../generated/prisma/enums.js";
import { getSuiviEleve } from "./suivi.controller.js";

const router = Router();

router.use(authenticate);

/**
 * GET /api/eleves/absences/suivi/:eleveId?form&to&statut&page&limit
 */
router.get(
  "/:eleveId",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  getSuiviEleve,
);

export default router;
