import { Router } from "express";
import {
  authenticate,
  authorizeRoles,
} from "../../../../middlewares/authMiddleware.js";
import { Role } from "../../../../generated/prisma/enums.js";
import {
  creerSuiviSante,
  listerSuiviSante,
  modifierSuiviSante,
  archiverSuiviSante,
} from "./sante.controller.js";

const router = Router();

router.use(authenticate, authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN));

router.get("/eleve/:eleveId", listerSuiviSante);
router.post("/", creerSuiviSante);
router.patch("/:suiviId", modifierSuiviSante);
router.delete("/:suiviId", archiverSuiviSante);

export default router;
