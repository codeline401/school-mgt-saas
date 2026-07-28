import { Router } from "express";
import {
  authenticate,
  authorizeRoles,
} from "../../../middlewares/authMiddleware.js";
import { Role } from "../../../generated/prisma/enums.js";
import {
  createArticle,
  createMouvement,
  deleteArticle,
  getArticleById,
  getArticles,
  getMouvementsByArticleId,
  getStatistiques,
  updateArticle,
} from "./stocks.controller.js";

/**
 * ROUTES POUR LA GESTION DES ARTICLES EN STOCK
 */
const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Articles
router.get(
  "/articles",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN, Role.USER),
  getArticles,
);

router.get(
  "/articles/:id",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN, Role.USER),
  getArticleById,
);

router.post(
  "/articles",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  createArticle,
);

router.patch(
  "/articles/:id",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  updateArticle,
);

router.delete(
  "/articles/:id",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  deleteArticle,
);

// Mouvements de stock
router.post(
  "/mouvements",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN, Role.USER),
  createMouvement,
);
router.get(
  "/articles/:id/mouvements",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN, Role.USER),
  getMouvementsByArticleId,
);

// Statistiques
router.get(
  "/statistiques",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN, Role.USER),
  getStatistiques,
);

export default router;
