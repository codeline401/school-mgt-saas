import { Router } from "express";
import {
  handleInscription,
  handleReinscription,
} from "./re.inscription.controller.js";
import {
  authenticate,
  authorizeRoles,
} from "../../../middlewares/authMiddleware.js"; // Adapte le chemin vers tes middlewares
import { Role } from "../../../generated/prisma/enums.js"; // Adapte selon tes enums Prisma

const router = Router();

// Toutes les routes de ce module nécessitent d'être connecté
router.use(authenticate);

// Flux d'inscription classique (Nouvel élève de zéro)
router.post(
  "/inscription",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  handleInscription,
);

// Flux de réinscription (Élève existant qu'on change de classe ou qu'on accueille dans l'école)
router.post(
  "/reinscription",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  handleReinscription,
);

export default router;
