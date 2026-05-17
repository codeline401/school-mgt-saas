import { Router } from "express";
import { authenticate, authorizeRoles } from "../middlewares/authMiddleware.js";
import { Role } from "../generated/prisma/enums.js";
import {
  getEmploiDuTemps,
  createCreneau,
  updateCreneau,
  deleteCreneau,
} from "../controllers/emploiDuTempsController.js";

const router = Router({ mergeParams: true });

router.get("/", authenticate, getEmploiDuTemps);
router.post("/",    authenticate, authorizeRoles(Role.USER, Role.ADMIN, Role.SUDO_ADMIN), createCreneau);
router.put("/:id",  authenticate, authorizeRoles(Role.USER, Role.ADMIN, Role.SUDO_ADMIN), updateCreneau);
router.delete("/:id", authenticate, authorizeRoles(Role.USER, Role.ADMIN, Role.SUDO_ADMIN), deleteCreneau);

export default router;