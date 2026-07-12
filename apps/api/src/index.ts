import express, { NextFunction, Request, Response } from "express"; // Importation d'Express pour créer le serveur API
import cors from "cors"; // Importation de CORS pour gérer les requêtes cross-origin
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { prisma } from "./lib/prisma.js";

import {
  getAllEleves,
  createEleve,
  getAllProfesseurs,
  deleteEleve,
  importEleves,
} from "./controllers/elevesController.js"; // Importation du contrôleur pour les élèves

import { getAdminDevoirs } from "./modules/cahierDeTexte/devoirs/devoir.controller.js"; // Importation du contrôleur pour les devoirs

import authRoutes from "./routes/authRoutes.js"; // Importation des routes d'authentification
import schoolRoutes from "./routes/schoolRoute.js"; // Importation des routes pour les écoles
import classesRoutes from "./routes/classesRoute.js"; // Importation des routes pour les classes
import profilsRoutes from "./routes/profilsRoute.js"; // Importation des routes pour les profils
import notificationRoutes from "./routes/notificationRoute.js";
import { authenticate } from "./middlewares/authMiddleware.js"; // Importation du middleware d'authentification

import bulletinTemplateRoute from "./routes/bulletinTemplateRoute.js"; // Importation des routes pour le canevas de bulletin
import exportRoute from "./routes/exportRoute.js";
import periodeRoute from "./routes/periodeRoute.js";
import signatureRoute from "./routes/signatureRoute.js";
import inscriptionRoutes from "./modules/eleves/re.inscription/re.inscription.routes.js"; // Importation des routes pour l'inscription et la réinscription

import devoirsRoutes from "./modules/cahierDeTexte/devoirs/devoir.routes.js"; // Importation des routes pour les devoirs
import programmeRoutes from "./modules/cahierDeTexte/programme.realise/programme.routes.js"; // Importation des routes pour le programme réalisé

const app = express(); // Création de l'application Express
const PORT = process.env.PORT || 5000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors()); // Utilisation de CORS pour permettre les requêtes cross-origin
app.use(express.json()); // Middleware pour parser les requêtes JSON

app.use("/api/auth", authRoutes);
app.use("/api/schools", schoolRoutes);
app.use("/api/classes", classesRoutes);
app.use("/api/profils", profilsRoutes);
app.use("/api/devoirs-donnes", devoirsRoutes); // Ajout des routes pour les devoirs

app.use("/api/export", exportRoute);
app.use("/api/periodes", periodeRoute);
app.use("/api/signature", signatureRoute);
app.use("/api", inscriptionRoutes); // Ajout des routes pour l'inscription et la réinscription
app.use("/api/programme-realise", programmeRoutes); // Ajout des routes pour le programme réalisé

app.get("/api/eleves", authenticate, getAllEleves);
app.post("/api/eleves/import", authenticate, importEleves);
app.post("/api/eleves", authenticate, createEleve);
app.delete("/api/eleves/:id", authenticate, deleteEleve);
app.get("/api/professeurs", authenticate, getAllProfesseurs);

app.use("/api/notifications", notificationRoutes);
app.use("/api/bulletin-template", bulletinTemplateRoute);

// Route authentifiée pour servir les feuilles corrigées uploadées.
// Vérifie que l'utilisateur a accès à l'école de la note avant d'envoyer le fichier.
app.get(
  "/uploads/feuilles/:filename",
  authenticate,
  async (req: Request, res: Response) => {
    const raw = req.params["filename"];
    const filename: string = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");

    // Prévenir les path traversal attacks
    if (
      !filename ||
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\")
    ) {
      return res.status(400).json({ error: "Nom de fichier invalide." });
    }

    const note = await prisma.note.findFirst({
      where: { feuillePath: { endsWith: filename } },
      select: { schoolId: true },
    });

    if (!note) return res.status(404).json({ error: "Fichier non trouvé." });

    const user = req.user!;
    const hasAccess =
      user.role === "SUDO_ADMIN" || user.schoolId === note.schoolId;

    if (!hasAccess) return res.status(403).json({ error: "Accès refusé." });

    const filePath = path.join(
      __dirname,
      "..",
      "uploads",
      "feuilles",
      filename,
    );
    res.sendFile(filePath, (err) => {
      if (err)
        res.status(404).json({ error: "Fichier introuvable sur le disque." });
    });
  },
);

// Route authentifiée pour servir les documents uploadés
app.get(
  "/uploads/documents/:filename",
  authenticate,
  async (req: Request, res: Response) => {
    const raw = req.params["filename"];
    const filename: string = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");

    if (
      !filename ||
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\")
    ) {
      return res.status(400).json({ error: "Nom de fichier invalide." });
    }

    const document = await prisma.document.findFirst({
      where: { filePath: { endsWith: filename } },
      select: { schoolId: true, mimeType: true },
    });

    if (!document)
      return res.status(404).json({ error: "Fichier non trouvé." });

    const user = req.user!;
    if (user.role !== "SUDO_ADMIN" && user.schoolId !== document.schoolId) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    const filePath = path.join(
      __dirname,
      "..",
      "uploads",
      "documents",
      filename,
    );
    res.setHeader("Content-Type", document.mimeType);
    res.sendFile(filePath, (err) => {
      if (err)
        res.status(404).json({ error: "Fichier introuvable sur le disque." });
    });
  },
);

// Gestionnaire d'erreurs Multer — traduit les erreurs en JSON cohérent
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    return res.status(status).json({ error: err.message });
  }
  if (err instanceof Error) {
    // Erreur fileFilter (type non autorisé, etc.)
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: "Une erreur inattendue est survenue." });
});

// Lancement du serveur
app.listen(PORT, () => {
  console.log(`Serveur API démarré sur le port ${PORT}`);
});
