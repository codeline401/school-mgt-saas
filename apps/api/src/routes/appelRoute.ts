import { Router } from "express";
import { authenticate, authorizeRoles } from "../middlewares/authMiddleware.js";
import { Role } from "../generated/prisma/enums.js";
import {
  getAppels,
  getAppel,
  createAppel,
  updatePresence,
} from "../controllers/appelController.js";

const router = Router({ mergeParams: true });

router.get("/", authenticate, getAppels);
router.get("/:appelId", authenticate, getAppel);

router.post(
  "/",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN, Role.PROF),
  createAppel,
);

router.patch(
  "/:appelId/presences/:eleveId",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN, Role.PROF),
  updatePresence,
);

export default router;
