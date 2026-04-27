import express from "express"; // Importation d'Express pour créer le serveur API
import cors from "cors"; // Importation de CORS pour gérer les requêtes cross-origin

import { getAllEleves, createEleve } from "./controllers/elevesController.js"; // Importation du contrôleur pour les élèves
import authRoutes from "./routes/authRoutes.js"; // Importation des routes d'authentification
import schoolRoutes from "./routes/schoolRoute.js"; // Importation des routes pour les écoles
import { authenticate } from "./middlewares/authMiddleware.js"; // Importation du middleware d'authentification

const app = express(); // Création de l'application Express
const PORT = process.env.PORT || 5000;
// Route pour récupérer tous les élèves

app.use(cors()); // Utilisation de CORS pour permettre les requêtes cross-origin
app.use(express.json()); // Middleware pour parser les requêtes JSON

app.use("/api/auth", authRoutes); // Utilisation des routes d'authentification pour les endpoints commençant par /api/auth
app.use("/api/schools", schoolRoutes); // Utilisation des routes pour les écoles pour les endpoints commençant par /api/schools

app.get("/api/eleves", authenticate, getAllEleves); // Route GET pour récupérer tous les élèves
app.post("/api/eleves", authenticate, createEleve); // Route POST pour créer un nouvel élève

// Lancement du serveur
app.listen(PORT, () => {
  console.log(`Serveur API démarré sur le port ${PORT}`);
});
