import { Router } from "express";
import {
  authenticate,
  authorizeRoles,
} from "../../../../middlewares/authMiddleware.js";
import { Role } from "../../../../generated/prisma/enums.js";
import {
  apercuRegle,
  creerRegle,
  historiqueAlertes,
  listerRegles,
  modifierRegle,
  supprimerRegle,
} from "./regle.controller.js";

const router = Router();

router.use(authenticate, authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN));

/** /api/eleves/absences/alertes/regles */
router.get("/", listerRegles);
router.post("/", creerRegle);
router.get("/historique", historiqueAlertes);
router.put("/:regleId", modifierRegle);
router.delete("/:regleId", supprimerRegle);
router.get("/:regleId/apercu", apercuRegle);

export default router;
