import { Router } from "express";
import {
  getLocaux,
  createLocal,
  updateLocal,
  deleteLocal,
  createReservation,
  getReservations,
} from "./locaux.controller.js";
import {
  authenticate,
  authorizeRoles,
} from "../../../middlewares/authMiddleware.js";
import { Role } from "../../../generated/prisma/enums.js";

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Gestion des locaux (salles, bâtiments)
router.get(
  "/",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN, Role.PROF),
  getLocaux,
);
router.post("/", authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN), createLocal);
router.put("/:id", authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN), updateLocal);
router.delete("/:id", authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN), deleteLocal);

// Gestion des réservations
router.get(
  "/reservations",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN, Role.PROF),
  getReservations,
);
router.post(
  "/reservations",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN, Role.PROF),
  createReservation,
);

export default router;
