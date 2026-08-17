import { Router } from "express";
import {
  authenticate,
  authorizeRoles,
} from "../../../../middlewares/authMiddleware.js";
import { Role } from "../../../../generated/prisma/enums.js";
import {
  getAllResponsables,
  getResponsableById,
  createResponsable,
  updateResponsable,
  affilierElevesAuResponsable,
  retirerAffiliationEleve,
  deleteResponsable,
} from "./responsable.controller.js";

const router = Router();

router.use(authenticate);

/**
 * GET /api/eleves/informations/responsables
 * Accessible par: ADMIN, SUDO_ADMIN, PROF
 */
router.get(
  "/responsables",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  getAllResponsables,
);

/**
 * GET /api/eleves/informations/responsables/:id
 * Accessible par: ADMIN, SUDO_ADMIN, PROF
 */
router.get(
  "/responsables/:id",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  getResponsableById,
);

/**
 * POST /api/eleves/informations/responsables
 * Accessible par: ADMIN, SUDO_ADMIN
 */
router.post(
  "/responsables",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  createResponsable,
);

/**
 * PUT /api/eleves/informations/responsables/:id
 * Accessible par: ADMIN, SUDO_ADMIN
 */
router.put(
  "/responsables/:id",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  updateResponsable,
);

/**
 * POST /api/eleves/informations/responsables/:id/affilier
 * Accessible par: ADMIN, SUDO_ADMIN
 */
router.post(
  "/responsables/:id/affilier",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  affilierElevesAuResponsable,
);

/**
 * DELETE /api/eleves/informations/responsables/:id/eleves/:eleveId
 * Accessible par: ADMIN, SUDO_ADMIN
 */
router.delete(
  "/responsables/:id/eleves/:eleveId",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  retirerAffiliationEleve,
);

/**
 * DELETE /api/eleves/informations/responsables/:id
 * Accessible par: ADMIN, SUDO_ADMIN
 */
router.delete(
  "/responsables/:id",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  deleteResponsable,
);

export default router;
