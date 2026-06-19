import fs from "fs";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { Router } from "express";
import { Role } from "../generated/prisma/enums.js";
import { authenticate, authorizeRoles } from "../middlewares/authMiddleware.js";
import {
  deleteSignature,
  getMySignature,
  getSignatureBase64,
  uploadSignature,
} from "../controllers/signatureController.js";
// MULTER config -------------------------------------

const UPLOAD_DIR = "uploads/signatures";
fs.mkdirSync(UPLOAD_DIR, { recursive: true }); // Crée le répertoire s'il n'existe pas

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const uid = crypto.randomUUID();
    cb(null, `sig-${Date.now()}-${uid}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Limite à 2MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true); // Accepte le fichier
    } else {
      cb(
        new Error(
          "Type de fichier non autorisé. Seules les images PNG et JPEG sont acceptées.",
        ),
      ); // Rejette le fichier
    }
  },
});

// ROUTES -------------------------------------

const router = Router();

const casSign = [Role.SUDO_ADMIN, Role.ADMIN, Role.PROF];

/**
 * GET /api/signature
 * Retourne la signature de l'user connecté.
 */
router.get("/", authenticate, authorizeRoles(...casSign), getMySignature);

/**
 * POST /api/signature/upload
 */
router.post(
  "/upload",
  authenticate,
  authorizeRoles(...casSign),
  upload.single("signature"),
  uploadSignature,
);

/**
 * DELETE /api/signature
 * Supprime la signature de l'user connecté.
 */
router.delete("/", authenticate, authorizeRoles(...casSign), deleteSignature);

/**
 * GET /api/signature/file/:userId
 * Retourne la signature d'un user en base64 (usage interne de bulletins)
 */
router.get(
  "/file/:userId",
  authenticate,
  authorizeRoles(...casSign),
  getSignatureBase64,
);

export default router;
