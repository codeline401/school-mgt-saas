import express from "express"; // Importation d'Express pour créer le serveur API
import cors from "cors"; // Importation de CORS pour gérer les requêtes cross-origin
import { getAllEleves, createEleve } from "./controllers/elevesController.js"; // Importation du contrôleur pour les élèves

const app = express(); // Création de l'application Express
const PORT = process.env.PORT || 5000;
// Route pour récupérer tous les élèves

app.use(cors()); // Utilisation de CORS pour permettre les requêtes cross-origin
app.use(express.json()); // Middleware pour parser les requêtes JSON

app.get("/api/eleves", getAllEleves); // Route GET pour récupérer tous les élèves
app.post("/api/eleves", createEleve); // Route POST pour créer un nouvel élève

// Lancement du serveur
app.listen(PORT, () => {
  console.log(`Serveur API démarré sur le port ${PORT}`);
});
