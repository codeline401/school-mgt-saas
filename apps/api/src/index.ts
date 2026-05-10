import express from "express"; // Importation d'Express pour créer le serveur API
import cors from "cors"; // Importation de CORS pour gérer les requêtes cross-origin
import path from "path";
import { fileURLToPath } from "url";

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

app.use(cors()); // Utilisation de CORS pour permettre les requêtes cross-origin
app.use(express.json()); // Middleware pour parser les requêtes JSON

// Servir les fichiers uploadés (feuilles corrigées) en statique
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use("/api/auth", authRoutes); // Utilisation des routes d'authentification pour les endpoints commençant par /api/auth
app.use("/api/schools", schoolRoutes); // Utilisation des routes pour les écoles pour les endpoints commençant par /api/schools
app.use("/api/classes", classesRoutes); // Utilisation des routes pour les classes pour les endpoints commençant par /api/classes
app.use("/api/profils", profilsRoutes); // Utilisation des routes pour les profils pour les endpoints commençant par /api/profils

app.get("/api/eleves", authenticate, getAllEleves); // Route GET pour récupérer tous les élèves
app.post("/api/eleves", authenticate, createEleve); // Route POST pour créer un nouvel élève
app.delete("/api/eleves/:id", authenticate, deleteEleve); // Route DELETE pour supprimer un élève par ID
app.get("/api/professeurs", authenticate, getAllProfesseurs); // Route GET pour récupérer tous les professeurs

// Lancement du serveur
app.listen(PORT, () => {
  console.log(`Serveur API démarré sur le port ${PORT}`);
});
