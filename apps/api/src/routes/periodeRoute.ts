import { Router } from "express";
import { authenticate, authorizeRoles } from "../middlewares/authMiddleware.js";
import { Role } from "../generated/prisma/enums.js";
import {
  getPeriodes,
  createPeriode,
  deletePeriode,
} from "../controllers/periodeController.js";

const router = Router();

/**
 * GET /api/periodes
 * Liste les périodes de l'école de l'utilisateur connecté.
 * SUDO_ADMIN peut filtrer via ?schoolId=
 * Accès : ADMIN, SUDO_ADMIN, USER, PROF
 */
router.get(
  "/",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN, Role.USER, Role.PROF),
  getPeriodes,
);

/**
 * POST /api/periodes
 * Crée une nouvelle période.
 * Accès : ADMIN, SUDO_ADMIN
 */
router.post(
  "/",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN),
  createPeriode,
);

/**
 * DELETE /api/periodes/:id
 * Supprime une période (impossible si des notes y sont rattachées).
 * Accès : ADMIN, SUDO_ADMIN
 */
router.delete(
  "/:id",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN),
  deletePeriode,
);

export default router;
