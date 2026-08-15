import { Router } from "express";
import {
  authenticate,
  authorizeRoles,
} from "../../../../middlewares/authMiddleware.js";
import { Role } from "../../../../generated/prisma/enums.js";
import {
  getAllFicheEleves,
  getFicheEleve,
  createFicheEleve,
  updateFicheEleve,
  deleteFicheEleve,
  restoreFicheEleve,
} from "./fiche.controller.js";

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

/**
 * POST /api/eleves/fiche
 * Crée un nouvel élève
 * Accessible par: ADMIN, SUDO_ADMIN
 */
router.post(
  "/fiche",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  createFicheEleve,
);

/**
 * GET /api/eleves/fiche
 * Récupère la liste des élèves de l'école pour la recherche/selection.
 * Accessible par: ADMIN, SUDO_ADMIN, PROF
 */
router.get(
  "/fiche",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN, Role.PROF),
  getAllFicheEleves,
);

/**
 * GET /api/eleves/fiche/:id
 * Récupère la fiche complète d'un élève
 * Accessible par: ADMIN, SUDO_ADMIN, PROF
 */
router.get(
  "/fiche/:id",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN, Role.PROF),
  getFicheEleve,
);

/**
 * PUT /api/eleves/fiche/:id
 * Met à jour la fiche d'un élève
 * Accessible par: ADMIN, SUDO_ADMIN
 */
router.put(
  "/fiche/:id",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  updateFicheEleve,
);

/**
 * DELETE /api/eleves/fiche/:id
 * Suppression logique d'un élève (soft delete)
 * Accessible par: ADMIN, SUDO_ADMIN
 */
router.delete(
  "/fiche/:id",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  deleteFicheEleve,
);

/**
 * PATCH /api/eleves/fiche/:id/restore
 * Restaure un élève supprimé
 * Accessible par: ADMIN, SUDO_ADMIN
 */
router.patch(
  "/fiche/:id/restore",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  restoreFicheEleve,
);

export default router;
