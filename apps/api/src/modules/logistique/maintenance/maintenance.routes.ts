import { Router } from "express";
import {
  getTickets,
  createTicket,
  updateTicket,
  assignerTicket,
  cloturerTicket,
  ajouterIntervention,
  getStatistiques,
} from "./maintenance.controller.js";
import {
  authenticate,
  authorizeRoles,
} from "../../../middlewares/authMiddleware.js";
import { Role } from "../../../generated/prisma/enums.js";

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Gestion des tickets
router.get(
  "/",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN, Role.PROF),
  getTickets,
);
router.post(
  "/",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN, Role.PROF),
  createTicket,
);
router.put("/:id", authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN), updateTicket);

// Actions spécifiques sur les tickets
router.put(
  "/:id/assigner",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  assignerTicket,
);
router.put(
  "/:id/cloturer",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  cloturerTicket,
);
router.post(
  "/:id/interventions",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN, Role.PROF),
  ajouterIntervention,
);

// Statistiques
router.get(
  "/statistiques",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  getStatistiques,
);

export default router;
