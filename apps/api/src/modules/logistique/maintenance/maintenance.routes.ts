import { Router } from "express";
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  getInterventions,
  createIntervention,
  updateIntervention,
  deleteIntervention,
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

// ─── TICKETS ──────────────────────────────────────────────────
router.get(
  "/tickets",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN, Role.USER),
  getTickets,
);

router.get(
  "/tickets/:id",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN, Role.USER),
  getTicketById,
);

router.post(
  "/tickets",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN, Role.USER),
  createTicket,
);

router.patch(
  "/tickets/:id",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  updateTicket,
);

router.delete(
  "/tickets/:id",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  deleteTicket,
);

// ─── INTERVENTIONS ────────────────────────────────────────────
router.get(
  "/interventions",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  getInterventions,
);

router.post(
  "/interventions",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  createIntervention,
);

router.patch(
  "/interventions/:id",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  updateIntervention,
);

router.delete(
  "/interventions/:id",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  deleteIntervention,
);

// ─── STATISTIQUES ─────────────────────────────────────────────
router.get(
  "/statistiques",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  getStatistiques,
);

export default router;
