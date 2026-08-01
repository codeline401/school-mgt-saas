import { Router } from "express";
import {
  getEquipements,
  createEquipement,
  updateEquipement,
  deleteEquipement,
  createPret,
  getPrets,
  getEquipementsEnRetard,
  retournerEquipementPrete,
  getStatistiques,
} from "./equipement.controller.js";
import {
  authenticate,
  authorizeRoles,
} from "../../../middlewares/authMiddleware.js";
import { Role } from "../../../generated/prisma/enums.js";

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Gestion des équipements
router.get(
  "/",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN, Role.PROF),
  getEquipements,
);
router.post("/", authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN), createEquipement);
router.put(
  "/:id",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  updateEquipement,
);
router.delete(
  "/:id",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  deleteEquipement,
);

// Gestion des prêts
router.get(
  "/prets",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN, Role.PROF),
  getPrets,
);
router.post(
  "/prets",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN, Role.PROF),
  createPret,
);
router.post(
  "/prets/:id/retour",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN, Role.PROF),
  retournerEquipementPrete,
);

// Statistiques
router.get(
  "/statistiques",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  getStatistiques,
);

// Alertes de retard
router.get(
  "/retards",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  getEquipementsEnRetard,
);

export default router;
