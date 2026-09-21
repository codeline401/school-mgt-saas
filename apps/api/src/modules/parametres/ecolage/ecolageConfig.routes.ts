import { Router } from "express";
import {
  authenticate,
  authorizeRoles,
} from "../../../middlewares/authMiddleware.js";
import { Role } from "../../../generated/prisma/enums.js";
import {
  getEcolageConfig,
  upsertEcolageConfig,
  genererEcolagesClasse,
} from "./ecolageConfig.controller.js";

const router = Router();

router.use(authenticate);

// Réservé aux administrateurs : paramétrage financier sensible.
router.get(
  "/:classeId",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  getEcolageConfig,
);

router.put(
  "/:classeId",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  upsertEcolageConfig,
);

router.post(
  "/:classeId/generer",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  genererEcolagesClasse,
);

export default router;
