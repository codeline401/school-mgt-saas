import { Router } from "express";
import {
  authenticate,
  authorizeRoles,
} from "../../../../middlewares/authMiddleware.js";
import { Role } from "../../../../generated/prisma/enums.js";
import {
  enregistrerPaiementEcolage,
  getEcolagesEleve,
} from "./paiement.controller.js";

const router = Router();

router.use(authenticate);

router.get(
  "/:eleveId",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN, Role.USER),
  getEcolagesEleve,
);

/**
 * POST /api/eleves/:eleveId/ecolages/paiement
 */
router.post(
  "/paiement/:eleveId",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN, Role.USER),
  enregistrerPaiementEcolage,
);

export default router;
