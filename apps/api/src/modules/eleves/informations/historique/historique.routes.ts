import { Router } from "express";
import {
  authenticate,
  authorizeRoles,
} from "../../../../middlewares/authMiddleware.js";
import { Role } from "../../../../generated/prisma/enums.js";
import { getEleveHistorique } from "./historique.controller.js";

const router = Router();

router.use(authenticate);

/**
 * GET /api/eleves/informations/historique/:studentId
 *
 * Récupère le parcours et l'historique complet disponible d'un élève.
 */
router.get(
  "/historique/:eleveId",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN, Role.PROF),
  getEleveHistorique,
);

export default router;
