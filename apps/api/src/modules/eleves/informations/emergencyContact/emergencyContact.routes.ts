import { Router } from "express";
import {
  authenticate,
  authorizeRoles,
} from "../../../../middlewares/authMiddleware.js";
import { Role } from "../../../../generated/prisma/enums.js";
import {
  getStudentEmergencyContact,
  updateStudentEmergencyContact,
} from "./emergencyContact.controller.js";

const router = Router();

router.use(authenticate); // Apply authentication middleware to all routes in this router

/**
 * GET /api/eleves/informations/contact-urgence/:eleveId
 * Accessible par : ADMIN, SUDO_ADMIN
 */
router.get(
  "/contact-urgence/:eleveId",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  getStudentEmergencyContact,
);

/**
 * PUT /api/eleves/informations/contact-urgence/:eleveId
 * Accessible par : ADMIN, SUDO_ADMIN
 */
router.put(
  "/contact-urgence/:eleveId",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  updateStudentEmergencyContact,
);

/**
 * PATCH /api/eleves/informations/contact-urgence/:eleveId
 * Accessible par : ADMIN, SUDO_ADMIN
 */
router.patch(
  "/contact-urgence/:eleveId",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  updateStudentEmergencyContact,
);

export default router;
