import { Router } from "express";
import {
  authenticate,
  authorizeRoles,
} from "../../../middlewares/authMiddleware.js";
import { Role } from "../../../generated/prisma/enums.js";
import {
  createChapitre,
  deleteChapitre,
  getChapitres,
  updateChapitre,
  updateStatutChapitre,
  updateStatutSousChapitre,
} from "./suiviChapitre.controller.js";

const router = Router({ mergeParams: true }); // accès au classeId: de la route parente

/**
 * GET /api/classes/classeId/suivi-chapitres?matiereId=
 * Consultation : SUDO_ADMIN, ADMIN, USER, PROF
 */
router.get(
  "/",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN, Role.USER, Role.PROF),
  getChapitres,
);

/**
 * POST /api/classes/classeId/suivi-chapitres
 * Edition : PROF, ADMIN, SUDO_ADMIN
 */
router.post(
  "/",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN, Role.PROF),
  createChapitre,
);

/**
 * PUT /api/classes/:classeId/suivi-chapitres/:id
 * Edition : PROF, ADMIN, SUDO_ADMIN
 */
router.put(
  "/:id",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN, Role.PROF),
  updateChapitre,
);

/**
 * PATCH /api/classes/:classeId/suivi-chapitres/:id/statut
 * Edition : PROF, ADMIN, SUDO_ADMIN
 */
router.patch(
  "/:id/statut",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN, Role.PROF),
  updateStatutChapitre,
);

/**
 * PATCH /api/classes/:classeId/suivi-chapitres/:chapitreId/sous-chapitre/:sousChapitreId/statut
 * Edition : PROF, ADMIN, SUDO_ADMIN
 */
router.patch(
  "/:chapitreId/sous-chapitres/:sousChapitreId/statut",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN, Role.PROF),
  updateStatutSousChapitre,
);

/**
 * DELETE /api/classes/:classeId/suivi-chapitres/:id
 * Edition : PROF, ADMIN, SUDO_ADMIN
 */
router.delete(
  "/:id",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN, Role.PROF),
  deleteChapitre,
);

export default router;
