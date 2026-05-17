import { Router } from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto"; // Pour générer des noms de fichiers uniques
import {
  createClasseDocument,
  deleteClasseDocument,
  getClasseDocuments,
} from "../controllers/documentController.js";

const UPLOAD_DIR = "uploads/documents";
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `doc-${Date.now()}-${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 Mo
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Type de fichier non autorisé. Formats acceptés : PDF, JPEG, PNG, Word, PowerPoint.",
        ),
      );
    }
  },
});

const router = Router({ mergeParams: true });

// Lecture : tout utilisateur authentifié de l'école (ELEVE, PARENT inclus)
router.get("/", authenticate, getClasseDocuments);

// Upload : PROF, ADMIN, USER, SUDO_ADMIN
router.post("/", authenticate, upload.single("fichier"), createClasseDocument);

// Suppression : l'auteur lui-même, ou ADMIN / SUDO_ADMIN (vérifié dans le contrôleur)
router.delete("/:documentId", authenticate, deleteClasseDocument);

export default router;
