import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import multer from "multer";
import crypto from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url)); // Récupère le répertoire courant du fichier actuel
export const JUSTIFICATIFS_DIR = path.join(
  __dirname,
  "../../../../../uploads/justificatifs",
); // Répertoire où seront stockés les justificatifs d'absences
fs.mkdirSync(JUSTIFICATIFS_DIR, { recursive: true }); // Crée le répertoire s'il n'existe pas

const TYPES_AUTORISES = ["image/jpeg", "image/png", "application/pdf"]; // Types de fichiers autorisés pour les justificatifs d'absences

export const uploadJustificatif = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, JUSTIFICATIFS_DIR), // Répertoire de destination des fichiers
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLocaleLowerCase();
      cb(null, `justif-${Date.now()}-${crypto.randomUUID()}${ext}`); // Nom du fichier généré de manière unique
    },
  }),
  limits: {
    fileSize: 2 * 1024 * 1024, // Limite de taille des fichiers à 2 Mo
  },
  fileFilter: (_req, file, cb) => {
    if (TYPES_AUTORISES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Type de fichier non autorise. Les format acceptés sont : PDF, JPEG, PNG",
        ),
      );
    }
  },
});
