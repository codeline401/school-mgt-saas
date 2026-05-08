import { Router } from "express";
import { authenticate, authorizeRoles } from "../middlewares/authMiddleware.js";
import {
  createClasseMatiere,
  deleteClasseMatiere,
  getClasseMatieres,
  updateClasseMatiere,
} from "../controllers/matieresController.js";
import { Role } from "../generated/prisma/enums.js";

const router = Router({ mergeParams: true }); // Permet d'accéder aux paramètres de la route parente (classeId)

router.get("/", authenticate, getClasseMatieres); // Route pour récupérer les matières d'une classe spécifique
router.post(
  "/",
  authenticate,
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  createClasseMatiere,
); // Route pour créer une nouvelle matière dans une classe spécifique, accessible uniquement aux ADMIN et SUDO_ADMIN
router.put(
  "/:id",
  authenticate,
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  updateClasseMatiere,
); // Route pour mettre à jour une matière spécifique, accessible uniquement aux ADMIN et SUDO_ADMIN
router.delete(
  "/:id",
  authenticate,
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  deleteClasseMatiere,
); // Route pour supprimer une matière spécifique, accessible uniquement aux ADMIN et SUDO_ADMIN

export default router; // Exportation du routeur pour l'utiliser dans le fichier principal de l'application
