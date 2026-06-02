/**
 * @file bulletinTemplateRoute.ts
 * @description Routes pour la gestion du canevas de bulletin scolaire.
 *
 * GET /api/bulletin-template -> lecture (tous les rôles authetifiés de l'école)
 * PUT /api/bulletin-template -> création ou mise à jour (upsert) du canevas (ADMIN, SUDO_ADMIN, USER)
 */

import { Router } from "express";
import { authenticate, authorizeRoles } from "../middlewares/authMiddleware";
import { Role } from "../generated/prisma/enums";
import {
  getBulletinTemplate,
  upsertBulletinTemplate,
} from "../controllers/bulletinTemplateController";

const router = Router();

/**
 * GET /api/bulletin-template
 * Retourne le canevas de l'école de l'utilisateur connecté.
 * Accessible seulement aux ADMINS, SUDO_ADMIN et USER (tous les rôles authentifiés de l'école).
 */
router.get(
  "/",
  authenticate,
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN, Role.USER),
  getBulletinTemplate,
);

/**
 * PUT /api/bulletin-template
 * Crée ou met à jour le canevas de l'école de l'utilisateur connecté.
 * Réservé aux ADMIN et SUDO_ADMIN (les simples USER ne peuvent pas modifier un paramètre d'école).
 */
router.put(
  "/",
  authenticate,
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  upsertBulletinTemplate,
);

export default router;
