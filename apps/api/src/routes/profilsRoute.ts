import { Router } from "express";
import { authenticate, authorizeRoles } from "../middlewares/authMiddleware.js";
import { Role } from "../generated/prisma/enums.js";
import {
  getElevesProfil,
  getParentProfil,
  getProfesseurProfil,
  getMyProfProfil,
  updateElevesProfil,
  updateParentProfil,
  updateProfesseurProfil,
  getProfEmploiDuTemps,
} from "../controllers/profilsController.js";

const router = Router(); // Création d'un routeur Express

// Toutes les routes profil nécessitent d'être authentifié
router.use(authenticate);

// --- FICHE ELEVE ---
// Lecture : ADMIN, SUDO_ADMIN, PROF
router.get(
  "/eleves/:id",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN, Role.PROF),
  getElevesProfil,
);
// Modification : ADMIN et SUDO_ADMIN only
router.put(
  "/eleves/:id",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  updateElevesProfil,
);

// FICHE PARENTS
router.get(
  "/parents/:id",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  getParentProfil,
);
router.put(
  "/parents/:id",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  updateParentProfil,
);

// FICHE PROFESSEURS
router.get(
  "/profs/:id",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN, Role.PROF),
  getProfesseurProfil,
);
router.put(
  "/profs/:id",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  updateProfesseurProfil,
);

// PROFIL DU PROF CONNECTÉ
router.get("/me", authorizeRoles(Role.PROF), getMyProfProfil);

// EMPLOI DU TEMPS D'UN PROFESSEUR
router.get(
  "/profs/:id/emploi-du-temps",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN, Role.PROF),
  getProfEmploiDuTemps,
);

export default router; // Export du routeur pour l'utiliser dans app.ts
