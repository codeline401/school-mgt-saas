import { Router } from "express";
import {
  authenticate,
  authorizeRoles,
} from "../../../../middlewares/authMiddleware.js";
import { Role } from "../../../../generated/prisma/enums.js";
import {
  apercuRelance,
  creerRelance,
  listerRelances,
  annulerRelance,
} from "./relance.controller.js";

const router = Router();

router.use(authenticate, authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN)); // Applique l'authentification et l'autorisation pour les rôles ADMIN et SUDO_ADMIN à toutes les routes suivantes

router.post("/apercu", apercuRelance);
router.post("/", creerRelance);
router.get("/", listerRelances);
router.patch("/:relanceId/annuler", annulerRelance);

export default router;
