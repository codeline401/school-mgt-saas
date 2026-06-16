import { Router } from "express";
import { authenticate, authorizeRoles } from "../middlewares/authMiddleware.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { Role } from "../generated/prisma/enums.js";
import {
  createClasseNote,
  deleteClasseNote,
  getClasseNotes,
  getMoyenneAutoClasse,
  updateClasseNote,
  getClassementClasse,
  getClassePeriodes,
} from "../controllers/noteController.js";
import {
  createDeliberationSession,
  getClasseDeliberation,
  updateDeliberationSession,
  upsertDeliberationDecisions,
  validateDeliberationSession,
} from "../controllers/deliberationController.js";
import {
  assignExamenSurveillants,
  createExamenIncident,
  createExamenPlanning,
  createExamenSalle,
  createExamenSession,
  getClasseExamens,
  getExamenSalles,
  getExamenSurveillants,
  updateExamenStatut,
  updateExamenSession,
} from "../controllers/examenController.js";

const UPLOAD_DIR = "uploads/feuilles";
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uid = crypto.randomUUID();
    cb(null, `feuille-${Date.now()}-${uid}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 Mo
  fileFilter: (_req, file, cb) => {
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Seuls les fichiers PDF, JPEG et PNG sont accpetés."));
    }
  },
});

const router = Router({ mergeParams: true }); // accès au: classeId de la route parente

/**
 * GET /api/classes/:classeId/notes
 * Accessible : SUDO_ADMIN, ADMIN, PROF
 */
router.get(
  "/",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN, Role.PROF),
  getClasseNotes,
);

/**
 * GET /api/classes/:classeId/notes/moyenne-auto?debut=&fin=
 * Calcule les moyennes CC + Examen par élève et par matière.
 * Accessible : SUDO_ADMIN, ADMIN, PROF
 */
router.get(
  "/moyenne-auto",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN, Role.PROF),
  getMoyenneAutoClasse,
);

router.get(
  "/periodes",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN, Role.USER, Role.PROF),
  getClassePeriodes,
);

/**
 * POST /api/classes/:classeId/notes/:noteId
 * Accessible : PROF créateur, ADMIN, SUDO_ADMIN
 */
router.post(
  "/",
  authenticate,
  authorizeRoles(Role.PROF, Role.SUDO_ADMIN),
  upload.single("feuille"), //
  createClasseNote,
);

/**
 * PUT /api/classes/:classeId/notes/:noteId
 * Accessible : PROF créateur, SUDO_ADMIN
 */
router.put(
  "/:noteId",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.PROF),
  upload.single("feuille"),
  updateClasseNote,
);

/**
 * DELETE /api/classes/:classeId/notes/:noteId
 * Accessible : PROF créateur, ADMIN, SUDO_ADMIN
 */
router.delete(
  "/:noteId",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN, Role.PROF),
  deleteClasseNote,
);

/**
 * GET /api/classes/:classeId/notes/classement?debut=&fin=&mode=general|matiere&matiereId=
 * Classement des éléèves par moyenne générale ou par matière.
 * Accessible : SUDO_ADMIN, ADMIN, PROF, USER
 */
router.get(
  "/classement",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN, Role.PROF, Role.USER),
  getClassementClasse,
);

/**
 * GET /api/classes/:classeId/notes/deliberations
 * Consultation : USER, PROF, SUDO_ADMIN, ADMIN
 */
router.get(
  "/deliberations",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN, Role.PROF, Role.USER),
  getClasseDeliberation,
);

/**
 * POST /api/classes/:classeId/notes/deliberations
 * Modification : USER, ADMIN, SUDO_ADMIN
 */
router.post(
  "/deliberations",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN, Role.USER),
  createDeliberationSession,
);

/**
 * PUT /api/classes/:classeId/notes/deliberations/:sessionId
 * Modification : USER, ADMIN, SUDO_ADMIN
 */
router.put(
  "/deliberations/:sessionId",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN, Role.USER),
  updateDeliberationSession,
);

/**
 * PUT /api/classes/:classeId/notes/deliberations/:sessionId/decisions
 * Modification : USER, ADMIN, SUDO_ADMIN
 */
router.put(
  "/deliberations/:sessionId/decisions",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN, Role.USER),
  upsertDeliberationDecisions,
);

/**
 * POST /api/classes/:classeId/notes/deliberations/:sessionId/validate
 * Validation finale : USER, ADMIN, SUDO_ADMIN
 */
router.post(
  "/deliberations/:sessionId/validate",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN, Role.USER),
  validateDeliberationSession,
);

/**
 * GET /api/classes/:classeId/notes/examens
 * Consultation : USER, PROF, ADMIN, SUDO_AMDIN
 */
router.get(
  "/examens",
  authenticate,
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN, Role.PROF, Role.USER),
  getClasseExamens,
);

/**
 * GET /api/classes/:classeId/notes/examens/salles
 * Consultation : USER, PROF, ADMIN, SUDO_ADMIN
 */
router.get(
  "/examens/salles",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN, Role.USER, Role.PROF),
  getExamenSalles,
);

/**
 * GET /api/classes/:classeId/notes/examens/surveillants
 * Consultation : USER, PROF, ADMIN, SUDO_ADMIN
 */
router.get(
  "/examens/surveillants",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN, Role.USER, Role.PROF),
  getExamenSurveillants,
);

/**
 * POST /api/classes/:classeId/notes/examens/salles
 * Edition : USER, ADMIN, SUDO_ADMIN
 */
router.post(
  "/examens/salles",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN, Role.USER),
  createExamenSalle,
);

/**
 * POST /api/classes/:classeId/notes/examens
 * Edition : USER, SUDO_ADMIN, AMDIN
 */
router.post(
  "/examens",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN, Role.USER),
  createExamenSession,
);

/**
 * POST /api/classes/:classeId/notes/examens/planning
 * Édition : USER, ADMIN, SUDO_ADMIN
 */
router.post(
  "/examens/planning",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN, Role.USER),
  createExamenPlanning,
);

/**
 * PUT /api/classes/:classeId/notes/examens/:sessionId
 * Édition: PROF, ADMIN, SUDO_ADMIN
 */
router.put(
  "/examens/:sessionId",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN, Role.PROF),
  updateExamenSession,
);

/**
 * PUT /api/classes/:classeId/notes/examens/:sessionId/statut
 * Édition: PROF, ADMIN, SUDO_ADMIN
 */
router.put(
  "/examens/:sessionId/statut",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN, Role.PROF),
  updateExamenStatut,
);

/**
 * POST /api/classes/:classeId/notes/examens/:sessionId/surveillants
 * Édition: PROF, ADMIN, SUDO_ADMIN
 */
router.post(
  "/examens/:sessionId/surveillants",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN, Role.PROF),
  assignExamenSurveillants,
);

/**
 * POST /api/classes/:classeId/notes/examens/:sessionId/incidents
 * Édition: PROF, ADMIN, SUDO_ADMIN
 */
router.post(
  "/examens/:sessionId/incidents",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN, Role.PROF),
  createExamenIncident,
);

export default router;
