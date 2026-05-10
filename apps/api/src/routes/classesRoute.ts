import { Router } from "express";
import { authenticate, authorizeRoles } from "../middlewares/authMiddleware.js";
import { Role } from "../generated/prisma/enums.js";
import {
  getAllClasses,
  createClasse,
  getClasseById,
  getClasseEleves,
  updateClasse,
  deleteClasse,
} from "../controllers/classesController.js";

import matieresRouter from "./matieresRoute.js"; // Importation du routeur pour les matières d'une classe
import notesRouter from "./notesRoute.js";

const router = Router();

// GET /api/classes — accessible à tous les utilisateurs authentifiés
// (ADMIN voit ses classes, SUDO_ADMIN peut filtrer via ?schoolId=)
router.get("/", authenticate, getAllClasses);

// POST /api/classes — créer une classe (ADMIN uniquement)
router.post(
  "/",
  authenticate,
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  createClasse,
);

/** Détail d'une classe avec professeurs et compteurs */
router.get("/:id", authenticate, getClasseById);

/** Elèves d'une classe */
router.get("/:id/eleves", authenticate, getClasseEleves);

/**Met à jour une classe (ADMIN et SUDO_ADMIN) */
router.put(
  "/:id",
  authenticate,
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  updateClasse,
);

/** Supprime une classe (ADMIN et SUDO_ADMIN) */
router.delete(
  "/:id",
  authenticate,
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  deleteClasse,
);

router.use("/:classeId/matieres", matieresRouter); // Sous-route pour les matières d'une classe spécifique
router.use("/:classeId/notes", notesRouter);

export default router;
