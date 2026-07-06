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
  updateProfesseurPrincipal,
} from "../controllers/classesController.js";

import matieresRouter from "./matieresRoute.js"; // Importation du routeur pour les matières d'une classe
import notesRouter from "./notesRoute.js";
import documentsRouter from "./documentsRoute.js";
import emploiDuTempsRouter from "./emploiDuTempsRoute.js";
import appelRouter from "./appelRoute.js";
import cahierTexteRouter from "./cahierTexteRoute.js";
import suiviChapitreRouter from "../modules/cahierDeTexte/suivi.chapitre/suiviChapitre.routres.js";
import quizRouter from "./quizRoute.js";

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

/**Patch /api/classes/:id/prof-principal  -  Assigner un prof principal */
router.patch(
  "/:id/prof-principal",
  authenticate,
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  updateProfesseurPrincipal,
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
router.use("/:classeId/documents", documentsRouter);
router.use("/:classeId/emploi-du-temps", emploiDuTempsRouter); // Sous-route pour l'emploi du temps d'une classe spécifique
router.use("/:classeId/appels", appelRouter); // Sous-route pour les appels d'une classe spécifique
router.use("/:classeId/cahier-de-texte", cahierTexteRouter); // Sous-route pour le cahier de texte d'une classe spécifique
router.use("/:classeId/suivi-chapitre", suiviChapitreRouter); // Sous-route pour le suivi des chapitres d'une classe spécifique
router.use("/:classeId/quiz", quizRouter); // Sous-route pour les quiz d'une classe spécifique

export default router;
