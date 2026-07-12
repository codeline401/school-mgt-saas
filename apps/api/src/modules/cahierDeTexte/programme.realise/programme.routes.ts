import { Router } from "express";
import { getProgrammeRealise } from "./programme.controller.js";
import {
  authenticate,
  authorizeRoles,
} from "../../../middlewares/authMiddleware.js";
import { Role } from "../../../generated/prisma/enums.js";

const router = Router();

/**
 * GET /api/programme-realise
 * Filtres optionnels passés en Query Params : ?classeId=...&matiereId=...
 */
router.get(
  "/",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN, Role.PROF, Role.USER),
  getProgrammeRealise,
);

export default router;
