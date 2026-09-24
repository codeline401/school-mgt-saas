import { Router } from "express";
import {
  authenticate,
  authorizeRoles,
} from "../../../../middlewares/authMiddleware.js";
import { Role } from "../../../../generated/prisma/enums.js";
import {
  getFactureDetail,
  getFactureImpression,
  getFacturesEleve,
} from "./facture.controller.js";

const router = Router();

router.use(authenticate);

/**
 * GET /api/eleves/:eleveId/factures
 */
router.get(
  "/:eleveId/factures",
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN),
  getFacturesEleve,
);

/**
 * GET /api/eleves/factures/:factureId
 */
router.get(
  "/factures/:factureId",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  getFactureDetail,
);

/**
 * GET /api/eleves/factures/:factureId/print?format=A5|THERMAL
 */
router.get(
  "/factures/:factureId/print",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  getFactureImpression,
);

export default router;
