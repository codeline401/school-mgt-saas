import { Router } from "express";
import { authenticate, authorizeRoles } from "../middlewares/authMiddleware";
import { Role } from "../generated/prisma/enums";
import { createSchool, getAllSchools } from "../controllers/schoolController";

const router = Router(); // Création d'un routeur Express

// GET /api/schools -- liste toutes les écoles (SUDO_ADMIN uniquement)
router.get("/", authenticate, authorizeRoles(Role.SUDO_ADMIN), getAllSchools);

// POST /api/schools -- créer une nouvelle école (ADMIN et SUDO_ADMIN)
router.post(
  "/",
  authenticate,
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  createSchool,
);

export default router; // Export du routeur pour l'utiliser dans app.ts
