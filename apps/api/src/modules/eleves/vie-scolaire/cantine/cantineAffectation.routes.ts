import { Router } from "express";
import {
  authenticate,
  authorizeRoles,
} from "../../../../middlewares/authMiddleware.js";
import { Role } from "../../../../generated/prisma/enums.js";
import {
  listerAffectationCantineEleve,
  creerAffectationCantine,
  terminerAffectationCantine,
} from "./cantineAffectation.controller.js";
const router = Router();

router.use(authenticate, authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN));

router.get("/eleve/:eleveId", listerAffectationCantineEleve);
router.post("/", creerAffectationCantine);
router.patch("/:affectationId/terminer", terminerAffectationCantine);

export default router;
