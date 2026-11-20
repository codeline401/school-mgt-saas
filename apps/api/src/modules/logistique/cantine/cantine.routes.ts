import { Router } from "express";
import {
  authenticate,
  authorizeRoles,
} from "../../../middlewares/authMiddleware.js";
import { Role } from "../../../generated/prisma/enums.js";
import {
  creerOffreCantine,
  listerOffresCantine,
  modifierOffreCantine,
  desactiverOffreCantine,
} from "./cantine.controller.js";

const router = Router();

router.use(authenticate, authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN));

router.get("/offres", listerOffresCantine);
router.post("/offres", creerOffreCantine);
router.patch("/offres/:offreId", modifierOffreCantine);
router.delete("/offres/:offreId", desactiverOffreCantine);

export default router;
