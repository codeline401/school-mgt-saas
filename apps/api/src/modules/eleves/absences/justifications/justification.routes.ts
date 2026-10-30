import { Router } from "express";
import {
  authenticate,
  authorizeRoles,
} from "../../../../middlewares/authMiddleware.js";
import { Role } from "../../../../generated/prisma/browser.js";
import { uploadJustificatif } from "./justification.upload.js";
import {
  creerBillet,
  creerJustification,
  getAbsencesAJustifier,
  getBilletPdf,
  getFichierJustification,
  getPropositionsCreneau,
  listerJustifications,
} from "./justification.controller.js";

const router = Router();

router.use(authenticate, authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN));

/** /api/eleves/absences/justifications */
router.post("/", uploadJustificatif.single("fichier"), creerJustification);
router.get("/eleve/:eleveId", listerJustifications);
router.get("/eleve/:eleveId/absences", getAbsencesAJustifier);
router.get("/billets/:billetId/pdf", getBilletPdf);
router.get("/:justificationId/fichier", getFichierJustification);
router.get("/:justificationId/creneaux", getPropositionsCreneau);
router.post("/:justificationId/billets", creerBillet);

export default router;
