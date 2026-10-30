import { RequestHandler, Router } from "express";
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
import multer from "multer";

const router = Router();

router.use(authenticate, authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN));

/** /api/eleves/absences/justifications */
const recevoirFichier: RequestHandler = (req, res, next) =>
  uploadJustificatif.single("fichier")(req, res, (err: unknown) => {
    if (!err) return next();
    const message =
      err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE"
        ? "Fichier trop volumineux (2 Mo maximum)"
        : err instanceof Error
          ? err.message
          : "Fichier invalide";
    return res.status(400).json({ error: message });
  }); // Gestion des erreurs de téléchargement de fichier avec multer

router.post("/", recevoirFichier, creerJustification);
router.get("/eleve/:eleveId", listerJustifications);
router.get("/eleve/:eleveId/absences", getAbsencesAJustifier);
router.get("/billets/:billetId/pdf", getBilletPdf);
router.get("/:justificationId/fichier", getFichierJustification);
router.get("/:justificationId/creneaux", getPropositionsCreneau);
router.post("/:justificationId/billets", creerBillet);

export default router;
