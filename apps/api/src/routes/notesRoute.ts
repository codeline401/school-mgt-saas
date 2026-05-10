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
  updateClasseNote,
} from "../controllers/noteController.js";

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

export default router;
