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
} from "./controllers/elevesController.js"; // Importation du contrôleur pour les élèves
import authRoutes from "./routes/authRoutes.js"; // Importation des routes d'authentification
import schoolRoutes from "./routes/schoolRoute.js"; // Importation des routes pour les écoles
import classesRoutes from "./routes/classesRoute.js"; // Importation des routes pour les classes
import profilsRoutes from "./routes/profilsRoute.js"; // Importation des routes pour les profils
import { authenticate } from "./middlewares/authMiddleware.js"; // Importation du middleware d'authentification

const app = express(); // Création de l'application Express
const PORT = process.env.PORT || 5000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors()); // Utilisation de CORS pour permettre les requêtes cross-origin
app.use(express.json()); // Middleware pour parser les requêtes JSON

app.use("/api/auth", authRoutes);
app.use("/api/schools", schoolRoutes);
app.use("/api/classes", classesRoutes);
app.use("/api/profils", profilsRoutes);

app.get("/api/eleves", authenticate, getAllEleves);
app.post("/api/eleves", authenticate, createEleve);
app.delete("/api/eleves/:id", authenticate, deleteEleve);
app.get("/api/professeurs", authenticate, getAllProfesseurs);

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
