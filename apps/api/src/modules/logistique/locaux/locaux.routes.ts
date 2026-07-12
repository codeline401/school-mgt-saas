import { Router } from "express";
import {
  // Contrôleurs pour les bâtiments
  getBatiments,
  getBatimentById,
  createBatiment,
  updateBatiment,
  deleteBatiment,
  // Contrôleurs pour les salles
  getSalles,
  getSalleById,
  createSalle,
  updateSalle,
  deleteSalle,
  // Statistiques
  getStatistiques,
} from "./locaux.controller.js";
import {
  authenticate,
  authorizeRoles,
} from "../../../middlewares/authMiddleware.js";
import { Role } from "../../../generated/prisma/enums.js";

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// ==========================================
// ROUTES POUR LES BÂTIMENTS
// ==========================================

router.get(
  "/batiments",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN, Role.PROF),
  getBatiments,
);

router.get(
  "/batiments/:id",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN, Role.PROF),
  getBatimentById,
);

router.post(
  "/batiments",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  createBatiment,
);

router.put(
  "/batiments/:id",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  updateBatiment,
);

router.delete(
  "/batiments/:id",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  deleteBatiment,
);

// ==========================================
// ROUTES POUR LES SALLES
// ==========================================

router.get(
  "/salles",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN, Role.PROF),
  getSalles,
);

router.get(
  "/salles/:id",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN, Role.PROF),
  getSalleById,
);

router.post(
  "/salles",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  createSalle,
);

router.put(
  "/salles/:id",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  updateSalle,
);

router.delete(
  "/salles/:id",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  deleteSalle,
);

// ==========================================
// STATISTIQUES
// ==========================================

router.get(
  "/statistiques",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  getStatistiques,
);

export default router;
