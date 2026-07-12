import { Router } from "express";
import {
  getStocks,
  createArticle,
  updateArticle,
  deleteArticle,
  createMouvement,
  getAlertes,
  getMouvements,
} from "./stocks.controller.js";
import {
  authenticate,
  authorizeRoles,
} from "../../../middlewares/authMiddleware.js";
import { Role } from "../../../generated/prisma/enums.js";

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Gestion des articles en stock
router.get(
  "/",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN, Role.PROF),
  getStocks,
);
router.post("/", authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN), createArticle);
router.put("/:id", authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN), updateArticle);
router.delete(
  "/:id",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  deleteArticle,
);

// Gestion des mouvements de stock
router.post(
  "/mouvements",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  createMouvement,
);
router.get(
  "/mouvements",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN, Role.PROF),
  getMouvements,
);

// Alertes de stock
router.get("/alertes", authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN), getAlertes);

export default router;
