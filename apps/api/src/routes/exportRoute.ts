import { Router } from "express";
import { authenticate, authorizeRoles } from "../middlewares/authMiddleware.js";
import { exportController } from "../controllers/exportController.js";
import { Role } from "../generated/prisma/enums.js";

const router = Router();

// Protected endpoints
router.post(
  "/bulletin",
  authenticate,
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN, Role.PROF),
  exportController.generateBulletin,
);

router.post(
  "/releve",
  authenticate,
  authorizeRoles(
    Role.ADMIN,
    Role.SUDO_ADMIN,
    Role.PROF,
    Role.PARENT,
    Role.USER,
  ),
  exportController.generateReleve,
);

router.post(
  "/classement",
  authenticate,
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN, Role.PROF),
  exportController.generateClassement,
);

router.post(
  "/deliberation",
  authenticate,
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN, Role.USER),
  exportController.generateDeliberation,
);

export default router;
